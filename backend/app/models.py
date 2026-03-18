from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    name = Column(String)
    quantity = Column(Float, default=1.0)
    purchase_price = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())