from pydantic import BaseModel, EmailStr, condecimal
from typing import Optional     # Optional: permite campos opcionais
from datetime import datetime   # datetime: representa data e hora

class User(BaseModel):
    first_name: str
    last_name: str 
    cellphone: str
    email: EmailStr
    password: str
    confirm_password: str
    
class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str 
    cellphone: str
    email: EmailStr
    
class UserLogin(BaseModel):
    email: str
    password: str
    
    
class LancamentoBase(BaseModel):
    transacao: str
    tipo: str  # 'receita' ou 'despesa'
    valor: condecimal(max_digits=10, decimal_places=2) 
    categoria: str
    data: datetime
    descricao: Optional[str] = None
    
class LancamentoCreate(LancamentoBase):
    pass 

class Lancamento(LancamentoBase):
    id: int
    user_id: int

    
    class Config:
        orm_mode = True #Permite retornar objetos do SQLAlchemy diretamente
        
        
        