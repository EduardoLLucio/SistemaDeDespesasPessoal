from sqlalchemy.orm import Session #permite acessar e manipular o bd
from . import models, schemas # Importa os modelos (tabelas) e schemas (validação de dados)
from passlib.context import CryptContext #Biblioteca para hash de senhas
import uuid #Gera um token para ativação de conta
from typing import List
from sqlalchemy import cast, Date

#------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") #Configuração do hash de senha

#------------------------

def buscar_usuario_por_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


#------------------------

def criar_usuario(db: Session, usuario: schemas.User):
    token_ativacao = str(uuid.uuid4())  # Gera um  token
    senha_criptografada = pwd_context.hash(usuario.password) #Criptografa a senha
    novo_usuario = models.User(
        first_name=usuario.first_name,
        last_name=usuario.last_name,
        cellphone=usuario.cellphone,
        email=usuario.email,
        hashed_password=senha_criptografada,
        ativo=False,
        token_ativacao=token_ativacao  # salva o token
        
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

#------------------------

def verificar_senha(senha_digitada, senha_criptografada):
    return pwd_context.verify(senha_digitada, senha_criptografada)




#-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



def criar_lancamento(db: Session, lancamento: schemas.LancamentoCreate, user_id: int):
    novo_lancamento =models.Lancamento(
        user_id=user_id,
        transacao=lancamento.transacao,
        tipo=lancamento.tipo,
        valor=lancamento.valor,
        categoria=lancamento.categoria,
        data=lancamento.data,
        descricao=lancamento.descricao 
    )
    db.add(novo_lancamento)
    db.commit()
    db.refresh(novo_lancamento)
    return novo_lancamento

#------------------------


def listar_lancamentos(db: Session, user_id: int) -> List[models.Lancamento]:
    return db.query(models.Lancamento).filter(models.Lancamento.user_id == user_id).all()


#------------------------

def atualizar_lancamento(db: Session, lancamento_id: int, lancamento: schemas.LancamentoCreate, user_id: int):
    db_lancamento = db.query(models.Lancamento).filter(models.Lancamento.id == lancamento_id, models.Lancamento.user_id == user_id).first()

    if db_lancamento: 
        db_lancamento.tipo = lancamento.tipo
        db_lancamento.transacao = lancamento.transacao
        db_lancamento.valor = lancamento.valor
        db_lancamento.categoria = lancamento.categoria
        db_lancamento.data = lancamento.data
        db_lancamento.descricao = lancamento.descricao
        db.commit()
        db.refresh(db_lancamento)
    return db_lancamento


#------------------------


def deletar_lancamento(db: Session, lancamento_id: int, user_id: int):
    db_lancamento = db.query(models.Lancamento).filter(models.Lancamento.id == lancamento_id, models.Lancamento.user_id == user_id).first()
    if db_lancamento:
        db.delete(db_lancamento)
        db.commit()
    return db_lancamento


#------------------------


def calcular_saldo(db: Session, user_id: int) -> float:
    receitas = db.query(models.Lancamento).filter(models.Lancamento.user_id == user_id, models.Lancamento.tipo == 'receita').all()
    
    gastos = db.query(models.Lancamento).filter(models.Lancamento.user_id == user_id, models.Lancamento.tipo == "despesa").all()
    
    total_receitas = sum([float(r.valor) for r in receitas])
    
    total_gastos = sum([float(g.valor) for g in gastos])
    
    return total_receitas - total_gastos


def listar_lancamentos_por_data(db, user_id, data):
    return db.query(models.Lancamento).filter(
        models.Lancamento.user_id == user_id,
        cast(models.Lancamento.data, Date) == data
    ).all()
    
def listar_lancamentos_por_texto(db, user_id, texto):
    return db.query(models.Lancamento).filter(
        models.Lancamento.user_id == user_id,
        models.Lancamento.descricao.ilike(f"{texto}%") | models.Lancamento.categoria.ilike(f"{texto}%")
    ).all()
    
    

    
        
    

