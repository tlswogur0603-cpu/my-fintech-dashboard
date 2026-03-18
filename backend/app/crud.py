from sqlalchemy.orm import Session
from . import models, schemas

# [Create] 신규 주식 정보 저장
def create_stock(stock: schemas.StockCreate, db: Session):
    db_stock = models.Stock(
        ticker=stock.ticker,
        name=stock.name,
        purchase_price=stock.purchase_price,
        quantity=stock.quantity
    )

    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock

# [Read] 전체 주식 목록 조회
def read_stocks(db: Session):
    return db.query(models.Stock).all()

# [Update] 주식 정보 수정
def update_stock(stock_id: int, stock: schemas.StockUpdate, db: Session):
    db_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()

    if db_stock:
        update_data = stock.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_stock, key, value)
        db.commit()
        db.refresh(db_stock)
    
    return db_stock

# [Delete] 주식 정보 삭제
def delete_stock(stock_id: int, db: Session):
    db_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()

    if db_stock:
        db.delete(db_stock)
        db.commit()
        return True
    return False