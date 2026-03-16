from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from . import models, schemas
from typing import List

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# 데이터베이스 세션 연결 및 종료 관리
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 전체 주식 목록 조회
@app.get("/stocks", response_model=List[schemas.StockRead])
def read_stocks(db: Session = Depends(get_db)):
    stocks = db.query(models.Stock).all()
    return stocks

# 신규 주식 정보 저장
@app.post("/stocks")
def create_stock(stock: schemas.StockCreate, db: Session = Depends(get_db)):
    db_stock = models.Stock(
        symbol=stock.symbol,
        name=stock.name,
        price=stock.price
    )

    db.add(db_stock)

    db.commit()

    db.refresh(db_stock)

    return{"message": "저장 완료!", "data": db_stock}


# 서버 테스트
@app.get("/")
def read_root():
    return {"message": "Hello World!"}

# DB연결 테스트
@app.get("/db-test")
def test_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"message": "DB 연결 성공 및 데이블 생성"}
    except Exception as e:
        return {"message": f"DB 연결 실패: {str(e)}"}