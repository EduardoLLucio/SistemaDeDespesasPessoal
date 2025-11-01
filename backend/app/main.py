import logging
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from .import models, schemas, crud
from .database import SessionLocal, engine, Base
from pydantic import BaseModel
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import asyncio, os, uuid, redis, shutil
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
_frontend_env = os.environ.get("FRONTEND_URL", "http://localhost:3000")

CORS_ORIGINS = [u.strip() for u in _frontend_env.split(",") if u.strip()]
if not CORS_ORIGINS:
    CORS_ORIGINS = ["http://localhost:3000"]
    
FRONTEND_ORIGIN_FOR_LINKS = CORS_ORIGINS[0]

# logging básico
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("CORS_ORIGINS:", CORS_ORIGINS)

app = FastAPI()

# middleware de logging + tratamento de exceções para capturar crashes que geram 502
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming {request.method} {request.url} Origin={request.headers.get('origin')}")
    try:
        response = await call_next(request)
        logger.info(f"Response {response.status_code} for {request.method} {request.url}")
        return response
    except Exception as e:
        logger.exception("Unhandled exception during request")
        # Retorna 500 JSON para evitar 502 da camada de proxy e garantir headers CORS posteriores
        return JSONResponse(status_code=500, content={"detail": "internal server error"})

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS - em produção mantenha a lista de origins; para debug pode usar ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # ou ["*"] temporariamente para teste
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicialização resiliente do Redis usando variáveis de ambiente
_redis_host = os.getenv("REDIS_HOST", "localhost")
_redis_port = int(os.getenv("REDIS_PORT", 6379))
_redis_db = int(os.getenv("REDIS_DB", 0))
redis_cliente = None
try:
    redis_cliente = redis.Redis(host=_redis_host, port=_redis_port, db=_redis_db, decode_responses=True)
    redis_cliente.ping()
    logger.info("Redis conectado em %s:%s db=%s", _redis_host, _redis_port, _redis_db)
except Exception as e:
    redis_cliente = None
    logger.warning("Redis indisponível (continuando sem Redis): %s", e)

Base.metadata.create_all(bind=engine)

# Função para obter uma sessão do banco de dados em cada requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class EmailRequest(BaseModel):
    email: str

#--------------------------    

#Rota de cadastro dop user
@app.post("/cadastro", response_model=schemas.UserOut)
def cadastrar_usuario(usuario: schemas.User, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    #verificasção de email existente no bd
    usuario_existente = crud.buscar_usuario_por_email(db, usuario.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    #verifica se a senha coincide 
    if usuario.password != usuario.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")
    # Validação de senha: mínimo 8 caracteres e pelo menos uma maiúscula ou uma minúscula
    senha = usuario.password
    if len(senha)<8 or(senha.lower() == senha or senha.upper()==senha):
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 8 caracteres e conter pelo menos uma letra maiúscula e uma letra minúscula")
    usuario = crud.criar_usuario(db, usuario)
    link = f"{FRONTEND_ORIGIN_FOR_LINKS}/ativar-conta?token={usuario.token_ativacao}"
    corpo = f"Clique no link para ativar sua conta : <a href='{link}'>{link}</a>"
    background_tasks.add_task(enviar_email, usuario.email, "Ative sua conta", corpo)
    return usuario

#--------------------------

#rota login

SECRET_KEY = os.getenv("SECRET_KEY", "troque_em_producao")
ALGORITHM = 'HS256'

def criar_token(usuario_id):
    return jwt.encode({'user_id': usuario_id}, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/login")
def login(dados: schemas.UserLogin, db: Session = Depends(get_db)):
    email = dados.email
    limite = 5
    chave = f"tentativa_login:{email}"
    tentativas = 0
    if redis_cliente:
        try:
            tentativas = int(redis_cliente.get(chave) or 0)
        except Exception:
            tentativas = 0
    if tentativas >= limite:
        raise HTTPException(status_code=429, detail="Muitas tentativas de login. Tente novamente em alguns minutos.")
    usuario = crud.buscar_usuario_por_email(db, dados.email)
    if not usuario or not crud.verificar_senha(dados.password, usuario.hashed_password):
        if redis_cliente:
            try:
                redis_cliente.incr(chave)
                redis_cliente.expire(chave, 600) #10 minutos
            except Exception:
                logger.warning("Falha ao atualizar contador no Redis")
        raise HTTPException(status_code=400, detail="Email ou senha inválidos")
    if not usuario.ativo:
        raise HTTPException(status_code=400, detail="Conta não ativada, verifique seu e-mail")
    if redis_cliente:
        try:
            redis_cliente.delete(chave)
        except Exception:
            logger.warning("Falha ao deletar chave de tentativa no Redis")
    token = criar_token(usuario.id)
    return {"mensagem": "Login bem-sucedido", "user_id": usuario.id, "access_token": token}

#--------------------------

@app.get("/ativar-conta")
def ativar_conta(token: str, db: Session = Depends(get_db)):
    usuario = db.query(models.User).filter(models.User.token_ativacao == token).first()
    if not usuario:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    if usuario.ativo:
        return {"mensagem": "Conta já ativada"}
    usuario.ativo = True
    usuario.token_ativacao = None
    db.commit()
    return {"mensagem": "Conta ativada com sucesso"}

#--------------------------

@app.post("/esqueci-senha")
def esqueci_senha(request: EmailRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db) ):
    email = request.email
    usuario = crud.buscar_usuario_por_email(db, email)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    token_redefinicao = str(uuid.uuid4())
    usuario.token_ativacao = token_redefinicao
    db.commit()
    link = f"{FRONTEND_ORIGIN_FOR_LINKS}/reset-password?token={token_redefinicao}"
    corpo = f"Clique no link para redefinir sua senha: <a href='{link}'>{link}</a>"
    background_tasks.add_task(enviar_email, usuario.email, "Redefinição de senha", corpo)
    return {"mensagem": "Se o email existir, um link será enviado para redefinir a senha"}

class RedefinirSenha(BaseModel):
    token:str
    nova_senha:str
    confirmar_senha:str

#--------------------------  

@app.post("/redefinir-senha")
def redefinir_senha(dados: RedefinirSenha, db: Session = Depends(get_db)):
    usuario = db.query(models.User).filter(models.User.token_ativacao == dados.token).first()
    if not usuario:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    if dados.nova_senha != dados.confirmar_senha:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")
    if len(dados.nova_senha)<8 or (dados.nova_senha.lower() == dados.nova_senha or dados.nova_senha.upper() == dados.nova_senha):
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 8 caracteres e conter pelo menos uma letra maiúscula e uma letra minúscula")
    usuario.hashed_password = crud.pwd_context.hash(dados.nova_senha)
    usuario.token_ativacao = None
    db.commit()
    return {"mensagem": "Senha redefinida com sucesso"}

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True") == "True",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False")== "True"
)

#--------------------------

async def enviar_email(destinatario, assunto, corpo):
    message = MessageSchema(
        subject=assunto,
        recipients=[destinatario],
        body=corpo,
        subtype="html"
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        logger.exception("Erro ao enviar email: %s", e)

# --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Rota para criar um lançamento
@app.post("/lancamentos/", response_model=schemas.Lancamento)
def criar_lancamento(lancamento: schemas.LancamentoCreate, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user_id = get_current_user(token)
    return crud.criar_lancamento(db, lancamento, current_user_id)

# ------------------------------------

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('user_id')
        if user_id is None:
            raise HTTPException(status_code=401, detail='Token inválido')
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail='Token inválido')

@app.get("/lancamentos/", response_model=list[schemas.Lancamento])
def listar_lancamentos(data: str = None, texto: str = None, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user_id = get_current_user(token)
    if data:
        return crud.listar_lancamentos_por_data(db, current_user_id, data)
    if texto:
        return crud.listar_lancamentos_por_texto(db, current_user_id, texto) 
    return crud.listar_lancamentos(db, current_user_id)

# ------------------------------------

@app.put("/lancamento/{lancamento_id}", response_model=schemas.Lancamento)
def atualizar_lancamento(lancamento_id: int, lancamento: schemas.LancamentoCreate, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user_id = get_current_user(token)
    lancamento_atualizado= crud.atualizar_lancamento(db, lancamento_id, lancamento, current_user_id)
    if not lancamento_atualizado:
        raise HTTPException(status_code=404, detail="Lancamento não encontrado")
    return lancamento_atualizado

# ------------------------------------

@app.delete("/lancamento/{lancamento_id}", response_model=schemas.Lancamento)
def deletar_lancamento(lancamento_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user_id = get_current_user(token)
    lancamento_deletado= crud.deletar_lancamento(db, lancamento_id, current_user_id)
    if not lancamento_deletado:
        raise HTTPException(status_code=404, detail="Lancamento não encontrado")
    return lancamento_deletado

# ------------------------------------

@app.get("/saldo/", response_model=float)
def consultar_saldo(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user_id = get_current_user(token)
    return crud.calcular_saldo(db, current_user_id)

@app.post('/upload-foto')
def upload_foto(foto: UploadFile = File(...), db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    if foto.content_type not in ['image/jpeg', 'image/png']:
        raise HTTPException(status_code=400, detail="Formato de arquivo inválido. Apenas JPEG e PNG são permitidos.")
    current_user_id = get_current_user(token)
    pasta_fotos = os.path.join(os.path.dirname(__file__), 'static', 'fotos')
    os.makedirs(pasta_fotos, exist_ok=True)
    extensao = foto.filename.split('.')[-1]
    nome_arquivo = f'{current_user_id}_{uuid.uuid4().hex}.{extensao}'
    caminho_absoluto = os.path.join(pasta_fotos, nome_arquivo)
    with open(caminho_absoluto, 'wb') as buffer:
        shutil.copyfileobj(foto.file, buffer)
    usuario = db.query(models.User).filter(models.User.id == current_user_id).first()
    usuario.foto_perfil = f'/static/fotos/{nome_arquivo}'
    db.commit()
    return {'mensagem': 'Foto enviada com sucesso', 'caminho': f'/static/fotos/{nome_arquivo}'}

@app.get('/usuario/me')
def get_usuario(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user_id = get_current_user(token)
    usuario = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {'foto_perfil': usuario.foto_perfil}
# ...existing code...