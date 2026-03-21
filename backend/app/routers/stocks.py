from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import yfinance as yf
from .. import crud, schemas, models  
from ..database import get_db

# 주식 관련 API들의 공통 주소(/stocks)와 카테고리(tags) 설정
router = APIRouter(prefix="/stocks", tags=["stocks"])

# [내부 함수] 현재 달러/원 환율 정보를 실시간으로 가져옴
def get_current_exchange_rate():
    ticker = yf.Ticker("USDKRW=X")
    return ticker.fast_info['last_price']

@router.get("/price/{ticker}")
def get_realtime_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        current_price = stock.fast_info['last_price']
        currency = stock.info.get('currency', 'USD')

        price_krw = current_price

        if currency == 'USD':
            exchange_rate = get_current_exchange_rate()
            price_krw = current_price * exchange_rate

        return {
            "ticker": ticker,
            "current_price": round(current_price, 2),
            "price_krw": round(price_krw, 0),
            "currency": currency,
            "exchange_rate": round(exchange_rate, 2) if currency == 'USD' else None,
            "timestamp": stock.fast_info.get('last_price_timestamp', stock.fast_info.get('timestamp', 0))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"주가 조회 실패: {str(e)}")

# [내부 함수] 현재 달러/원 환율 정보를 실시간으로 가져옴
@router.post("")
def create_stock(stock: schemas.StockCreate, db: Session = Depends(get_db)):
    db_stock = crud.create_stock(db=db, stock=stock)
    return {"message": "저장 완료!", "data": db_stock}

# [GET] /stocks : DB에 저장된 모든 주식 리스트를 가져옴
@router.get("", response_model=List[schemas.StockRead]) 
def read_stocks(db: Session = Depends(get_db)):
    return crud.read_stocks(db=db)

# [PUT] /stocks/{stock_id} : 특정 ID의 주식 정보(수량, 가격 등)를 수정
@router.put("/{stock_id}", response_model=schemas.StockRead) 
def update_stock(stock_id: int, stock: schemas.StockUpdate, db: Session = Depends(get_db)):
    db_stock = crud.update_stock(db=db, stock_id=stock_id, stock=stock)
    if not db_stock:
        raise HTTPException(status_code=404, detail="해당 ID의 주식 정보를 찾을수 없습니다.")
    return db_stock

# [DELETE] /stocks/{stock_id} : 특정 ID의 주식 정보를 DB에서 삭제
@router.delete("/{stock_id}") 
def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    success = crud.delete_stock(db=db, stock_id=stock_id)
    db.close()
    if not success:
        raise HTTPException(status_code=404, detail="해당 ID의 주식 정보를 찾을수 없습니다.")
    return {"message": f"ID {stock_id}번 주식 정보가 삭제되었습니다."}

# [GET] /stocks/{stock_id}/profit : 특정 주식의 현재가, 환율을 반영한 수익률 계산
@router.get("/{stock_id}/profit") 
def get_stock_profit(stock_id: int, db: Session = Depends(get_db)):
    stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="해당 주식을 찾을수 없습니다.")
    
    try:
        ticker = yf.Ticker(stock.ticker)
        current_price_usd = ticker.fast_info['last_price']
        exchange_rate = get_current_exchange_rate()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"시세 정보 조회 실패: {e}")
    
    profit_rate = ((current_price_usd - stock.purchase_price) / stock.purchase_price) * 100
    current_price_krw = current_price_usd * exchange_rate
    total_value_krw = current_price_krw * stock.quantity

    return {
        "ticker": stock.ticker,
        "buy_price_usd": f"${stock.purchase_price:.2f}",
        "current_price_usd": f"${current_price_usd:.2f}",
        "exchange_rate": f"{exchange_rate:.2f}원",
        "current_price_krw": f"{current_price_krw:,.0f}원",
        "profit_rate": f"{profit_rate:.2f}%",
        "total_value_krw": f"{total_value_krw:,.0f}원"
    }

# [GET] /stocks/portfolio/allocation : 보유한 전체 주식의 비중(%) 및 총 자산 계산
@router.get("/portfolio/allocation") 
def get_portfolio_allocation(db: Session = Depends(get_db)):
    stocks = crud.read_stocks(db=db)
    if not stocks:
        return {"message": "등록된 주식이 없습니다.", "allocation": []}
    
    exchange_rate = get_current_exchange_rate()
    portfolio_data = []
    total_portfolio_value_krw = 0

    # 각 종목별 원화 가치 계산 및 합산
    for stock in stocks:
        ticker = yf.Ticker(stock.ticker)
        current_price_usd = ticker.fast_info['last_price']
        stock_total_value_krw = current_price_usd * stock.quantity * exchange_rate

        portfolio_data.append({
            "ticker": stock.ticker,
            "name": stock.name,
            "stock_value_krw": stock_total_value_krw
        })
        total_portfolio_value_krw += stock_total_value_krw

    # 전체 자산 대비 각 종목의 비중(%) 계산
    final_allocation = []
    for item in portfolio_data:
        weight = (item["stock_value_krw"] / total_portfolio_value_krw) * 100
        final_allocation.append({
            "ticker": item["ticker"],
            "name": item["name"],
            "value_krw": f"{item['stock_value_krw']:,.0f}원",
            "weight": f"{weight:.2f}%"
        })

    return {
        "total_asset_value_krw": f"{total_portfolio_value_krw:,.0f}원",
        "allocation": final_allocation
    }