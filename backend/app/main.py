from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from . import models, schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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