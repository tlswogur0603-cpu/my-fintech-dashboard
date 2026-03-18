# backend/app/main.py
from fastapi import FastAPI
from sqlalchemy import text
from .database import engine, Base, get_db
from .routers import stocks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="핀테크 대시보드")

app.include_router(stocks.router)

# 테스트 서버
@app.get("/")
def read_root():
    return {"message": "Hello World! 구조 분리 리팩토링 완료!"}

# DB 연결 테스트
@app.get("/db-test")
def test_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"message": "DB 연결 성공 및 테이블 생성 확인 완료!"}
    except Exception as e:
        return {"message": f"DB 연결 실패: {str(e)}"}