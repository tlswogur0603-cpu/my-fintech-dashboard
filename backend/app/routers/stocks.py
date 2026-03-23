from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import yfinance as yf
from datetime import datetime
import time # [보완] 현재 시간 대비 예외 처리를 위해 추가
from .. import crud, schemas, models 
from ..database import get_db

router = APIRouter(prefix="/stocks", tags=["stocks"])

# --- [내부 유틸리티 함수] ---

def get_current_exchange_rate():
    """실시간 환율 정보(USD/KRW) 가져오기"""
    try:
        ticker = yf.Ticker("USDKRW=X")
        # fast_info 접근 방식이 실패할 경우를 대비한 안전장치
        price = ticker.fast_info.get('last_price')
        return price if price else 1400.0
    except:
        return 1400.0

def get_stock_news_data(ticker: str):
    """
    yfinance를 사용해 특정 티커의 최신 뉴스 5개를 가져오고 정제함.
    날짜 필드(provider_publish_time 등)의 가변성을 고려하여 보완됨.
    """
    try:
        stock = yf.Ticker(ticker)
        raw_news = list(stock.news)[:5] # type: ignore
        
        refined_news = []
        for item in raw_news:
            # [보완] 날짜 필드 범용성 확보 (여러 키값을 시도)
            # yfinance 버전에 따라 'providerPublishTime' 또는 'provider_publish_time'일 수 있음
            raw_ts = item.get('providerPublishTime') or item.get('provider_publish_time') or item.get('publishingDate')
            
            if raw_ts:
                # Unix Timestamp를 ISO 형식으로 변환
                pub_time = datetime.fromtimestamp(raw_ts).isoformat()
            else:
                # 날짜 정보가 아예 없을 경우 현재 시간으로 대체 (1970년 방지)
                pub_time = datetime.now().isoformat()
            
            # 썸네일 URL 추출 안전하게 처리
            thumbnail = None
            if item.get('thumbnail') and item['thumbnail'].get('resolutions'):
                thumbnail = item['thumbnail']['resolutions'][0].get('url')

            refined_news.append({
                "title": item.get("title"),
                "link": item.get("link"),
                "publisher": item.get("publisher"),
                "published_at": pub_time,
                "thumbnail_url": thumbnail
            })
        return refined_news
    except Exception as e:
        print(f"뉴스 데이터 추출 실패 ({ticker}): {e}")
        return []

# --- [API 엔드포인트] ---

@router.get("/price/{ticker}")
def get_realtime_price(ticker: str):
    """실시간 주가 조회 엔드포인트"""
    try:
        stock = yf.Ticker(ticker)
        current_price = stock.fast_info['last_price']
        currency = stock.info.get('currency', 'USD')
        
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

@router.get("/{ticker}/news")
def get_ticker_news(ticker: str):
    """[NEW] 특정 종목 뉴스 5개 반환 (AI 요약의 기초 데이터)"""
    news = get_stock_news_data(ticker.upper())
    if not news:
        return {"ticker": ticker.upper(), "news": [], "message": "최근 뉴스가 없습니다."}
    return {"ticker": ticker.upper(), "news": news}

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

@router.get("/portfolio/allocation") 
def get_portfolio_allocation(db: Session = Depends(get_db)):
    stocks = crud.read_stocks(db=db)
    if not stocks:
        return {"total_portfolio_value_krw": 0, "allocation": []}
    
    portfolio_temp = []
    total_portfolio_value_krw = 0

    for stock in stocks:
        try:
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