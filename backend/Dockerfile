# 파이썬 3.11 버전 사용
FROM python:3.11-slim

# 작업 폴더 지정
WORKDIR /app

# 라이브러리 목록 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코드 전체 복사
COPY . .

# FastAPI 실행 포트 8000번 개방
EXPOSE 8000

# 서버 실행 명령어
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]