from pydantic import BaseModel
from typing import Optional

class StockCreate(BaseModel):
    symbol: str
    name: str
    price: float

class StockRead(StockCreate):
    id: int

    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    price: Optional[float] = None