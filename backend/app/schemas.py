from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StockCreate(BaseModel):
    ticker: str
    name: str
    purchase_price: float
    quantity: float = 1.0

class StockRead(StockCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    ticker: Optional[str] = None
    name: Optional[str] = None
    purchase_price: Optional[float] = None
    quantity: Optional[float] = None