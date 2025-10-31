import os
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não definida. Defina a variável de ambiente DATABASE_URL.")

DB_SCHEMA = os.getenv("DB_SCHEMA") 

engine = create_engine(DATABASE_URL, future=True)

if DB_SCHEMA:
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))

metadata = MetaData(schema=DB_SCHEMA) if DB_SCHEMA else MetaData()
Base = declarative_base(metadata=metadata)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
