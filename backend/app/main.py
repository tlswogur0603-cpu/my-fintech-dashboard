from fastapi import FastAPI
from sqlalchemy import create_engine, text

app = FastAPI()

DATABASE_URL = "postgresql://user:password@db:5432/stockdb"

@app.get("/")
def read_root():
    return {"message": "Hello World!"}

@app.get("/db-test")
def test_db():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"message": "DB 연결 성공!"}
    except Exception as e:
        return {"message": f"DB 연결 실패: {str(e)}"}