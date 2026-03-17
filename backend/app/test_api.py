import yfinance as yf

def get_stock_price(symbol):
    print(f"[{symbol}] 시세 정보를 가져오는 중...")
    ticker = yf.Ticker(symbol)
    current_price = ticker.fast_info['last_price']
    return current_price

def get_exchange_rate():
    print("실시간 환율 정보를 가져오는 중...")
    ticker = yf.Ticker("USDKRW=X")
    current_rate = ticker.fast_info['last_price']
    return current_rate

if __name__ == "__main__":
    target_symbol = "TSLA"
    
    # 각각의 함수에서 값만 쏙쏙 뽑아옵니다.
    price_usd = get_stock_price(target_symbol)
    current_rate = get_exchange_rate()
    
    # 여기서 '계산'이라는 로직을 수행합니다.
    price_krw = price_usd * current_rate
    
    # 결과 출력 (가독성 있게!)
    print("\n" + "="*35)
    print(f"   [ {target_symbol} 실시간 분석 결과 ]")
    print("="*35)
    print(f" 현재 주가: ${price_usd:.2f}")
    print(f" 실시간 환율: {current_rate:.2f}원")
    print("-" * 35)
    print(f" 🔥 원화 환산: {price_krw:,.0f}원")
    print("="*35)