from pydantic import BaseModel

class StockCreate(BaseModel):
    symbol: str
    name: str
    price: float