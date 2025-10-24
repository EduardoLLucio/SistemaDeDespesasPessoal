from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Float
from.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import Numeric
import datetime


class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    cellphone = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    ativo = Column(Boolean, default=False)
    token_ativacao = Column(String, nullable=True)  # Guarda o token de ativação
    foto_perfil = Column(String, nullable=True)
    
    
    lancamentos = relationship("Lancamento", back_populates="usuario")
    
class Lancamento(Base):
    __tablename__ = 'lancamentos'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    transacao = Column(String, index=True)
    tipo = Column(String, index=True)  # 'receita' ou 'despesa'
    valor = Column(Numeric(10,2))
    categoria = Column(String, index=True)
    data = Column(DateTime, default = datetime.datetime.utcnow)
    descricao = Column(String, nullable=True)

    usuario = relationship("User", back_populates="lancamentos")
