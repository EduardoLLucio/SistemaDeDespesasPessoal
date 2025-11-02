import os
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não definida. Defina a variável de ambiente DATABASE_URL.")

# ...existing code...
# Normaliza URIs "postgres://" -> "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DB_SCHEMA = os.getenv("DB_SCHEMA") 

try:
    engine = create_engine(DATABASE_URL, future=True)
except Exception as e:
    # não expõe credenciais, apenas mensagem útil
    raise RuntimeError("DATABASE_URL inválida ou mal formada. Verifique a variável de ambiente no painel do Render.") from e

if DB_SCHEMA:
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))

metadata = MetaData(schema=DB_SCHEMA) if DB_SCHEMA else MetaData()
Base = declarative_base(metadata=metadata)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)