from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 1. 이거 추가
from sqlalchemy import text
from .database import engine, Base, get_db
from .routers import stocks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="핀테크 대시보드")

# 2. CORS 설정 추가 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 곳에서 접속 허용 (연습용)
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST 등 모든 방식 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

app.include_router(stocks.router)

@app.get("/")
def read_root():
    return {"message": "Hello World! 구조 분리 리팩토링 완료!"}

@app.get("/db-test")
def test_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"message": "DB 연결 성공 및 테이블 생성 확인 완료!"}
    except Exception as e:
        return {"message": f"DB 연결 실패: {str(e)}"}