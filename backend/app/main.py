from fastapi import FastAPI
from sqlalchemy import text
from .database import engine
from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World!"}

@app.get("/db-test")
def test_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"message": "DB 연결 성공 및 데이블 생성"}
    except Exception as e:
        return {"message": f"DB 연결 실패: {str(e)}"}