from pydantic import BaseModel

class StockCreate(BaseModel):
    symbol: str
    name: str
    price: float

class StockRead(StockCreate):
    id: int

    class Config:
        from_attributes = True