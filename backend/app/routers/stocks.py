from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import yfinance as yf
from .. import crud, schemas, models  
from ..database import get_db

router = APIRouter(prefix="/stocks", tags=["stocks"])

# [내부 함수] 환율 정보 가져오기
def get_current_exchange_rate():
    try:
        ticker = yf.Ticker("USDKRW=X")
        return ticker.fast_info['last_price']
    except:
        return 1400.0  # 에러 시 기본값

@router.get("/price/{ticker}")
def get_realtime_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        current_price = stock.fast_info['last_price']
        currency = stock.info.get('currency', 'USD')
        
        # 환율 적용 로직
        exchange_rate = 1.0
        price_krw = current_price
        
        if currency == 'USD':
            exchange_rate = get_current_exchange_rate()
            price_krw = current_price * exchange_rate

        return {
            "ticker": ticker,
            "current_price": round(current_price, 2),
            "price_krw": round(price_krw, 0),
            "currency": currency,
            "exchange_rate": round(exchange_rate, 2) if currency == 'USD' else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"주가 조회 실패: {str(e)}")

@router.post("")
def create_stock(stock: schemas.StockCreate, db: Session = Depends(get_db)):
    db_stock = crud.create_stock(db=db, stock=stock)
    return {"message": "저장 완료!", "data": db_stock}

@router.get("", response_model=List[schemas.StockRead]) 
def read_stocks(db: Session = Depends(get_db)):
    return crud.read_stocks(db=db)

@router.delete("/{stock_id}") 
def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    success = crud.delete_stock(db=db, stock_id=stock_id)
    if not success:
        raise HTTPException(status_code=404, detail="해당 ID의 주식을 찾을 수 없습니다.")
    return {"message": f"ID {stock_id}번 삭제 완료"}

# [핵심 수술 부위] 포트폴리오 자산 계산 로직
@router.get("/portfolio/allocation") 
def get_portfolio_allocation(db: Session = Depends(get_db)):
    stocks = crud.read_stocks(db=db)
    if not stocks:
        return {"total_portfolio_value_krw": 0, "allocation": []}
    
    exchange_rate = get_current_exchange_rate()
    portfolio_temp = []
    total_portfolio_value_krw = 0

    for stock in stocks:
        try:
            # ✅ 수정 포인트: 
            # 프론트에서 이미 '원화 매수가'를 저장했으므로, 
            # 실시간 가격이 아닌 '저장된 가격' 기준으로 먼저 합계를 검증해봅니다.
            # (나중에 실시간 반영하려면 여기서 yfinance를 다시 써야 함)
            
            # 현재는 재혁님이 입력한 '구매 가격' 기준으로 총 자산을 계산합니다.
            stock_total_value_krw = stock.purchase_price * stock.quantity
            
            portfolio_temp.append({
                "ticker": stock.ticker,
                "name": stock.name,
                "stock_value_krw": stock_total_value_krw
            })
            total_portfolio_value_krw += stock_total_value_krw
        except Exception as e:
            print(f"계산 에러 ({stock.ticker}): {e}")
            continue

    final_allocation = []
    if total_portfolio_value_krw > 0:
        for item in portfolio_temp:
            weight = (item["stock_value_krw"] / total_portfolio_value_krw) * 100
            final_allocation.append({
                "ticker": item["ticker"],
                "name": item["name"],
                "value_krw": f"{item['stock_value_krw']:,.0f}원",
                "weight": f"{weight:.2f}%"
            })

    return {
        "total_portfolio_value_krw": total_portfolio_value_krw,
        "allocation": final_allocation
    }