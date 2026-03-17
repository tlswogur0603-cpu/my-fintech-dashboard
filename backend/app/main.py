from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from . import models, schemas
from typing import List
from fastapi import HTTPException
import yfinance as yf

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

def get_current_exchange_rate():
    ticker = yf.Ticker("USDKRW=X")
    return ticker.fast_info['last_price']

# [Create] 신규 주식 정보 저장
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

# [Read] 전체 주식 목록 조회
@app.get("/stocks", response_model=List[schemas.StockRead])
def read_stocks(db: Session = Depends(get_db)):
    stocks = db.query(models.Stock).all()
    return stocks

# [Update] 주식 정보 수정
@app.put("/stocks/{id}", response_model=schemas.StockRead)
def update_stock(id: int, stock: schemas.StockUpdate, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).filter(models.Stock.id == id).first()

    if not db_stock:
        raise HTTPException(status_code=404, detail="해당 ID의 주식 정보를 찾을수 없습니다.")
    
    update_data = stock.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_stock, key, value)

    db.commit()
    db.refresh(db_stock)
    
    return db_stock

# [Delete] 주식 정보 삭제
@app.delete("/stocks/{id}")
def delete_stock(id: int, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).filter(models.Stock.id == id).first()

    if not db_stock:
        raise HTTPException(status_code=404, detail="해당 ID의 주식 정보를 찾을수 없습니다.")
    
    db.delete(db_stock)
    db.commit()

    return {"message": f"ID {id}번 주식 정보가 삭제되었습니다."}

@app.get("/stocks/{stock_id}/profit")
def get_stock_profit(stock_id: int, db: Session = Depends(get_db)):
    stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="해당 주식을 찾을수 없습니다.")
    
    try:
        ticker = yf.Ticker(stock.symbol)
        current_price_usd = ticker.fast_info['last_price']
        exchange_rate = get_current_exchange_rate()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"시세 정보 조회 실패: {e}")
    
    profit_rate = ((current_price_usd - stock.price) / stock.price) * 100

    current_price_krw = current_price_usd * exchange_rate
    total_value_krw = current_price_krw * 1

    return {
        "symbol": stock.symbol,
        "buy_price_usd": f"${stock.price:.2f}",
        "current_price_usd": f"${current_price_usd:.2f}",
        "exchange_rate": f"{exchange_rate:.2f}원",
        "current_price_krw": f"{current_price_krw:,.0f}원",
        "profit_rate": f"{profit_rate:.2f}%",
        "total_value_krw": f"{total_value_krw:,.0f}원"
    }

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