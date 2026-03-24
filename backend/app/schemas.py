from pydantic import BaseModel
from typing import Optional, List
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


class NewsItem(BaseModel):
    title: Optional[str] = None
    link: Optional[str] = None
    publisher: Optional[str] = None
    published_at: Optional[str] = None
    thumbnail_url: Optional[str] = None


class NewsResponse(BaseModel):
    ticker: str
    news: List[NewsItem]
    ai_summary: Optional[str] = None
    message: Optional[str] = None

    class Config:
        from_attributes = True