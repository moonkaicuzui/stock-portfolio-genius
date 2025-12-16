"""
Portfolio API Routes
Handles portfolio CRUD operations and transaction management
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from sqlalchemy.orm import Session
from decimal import Decimal

from models.database import get_db, Holding, Transaction

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


# ============ Schemas ============

class HoldingCreate(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    quantity: int = Field(..., gt=0)
    avg_cost: float = Field(..., gt=0)
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    sector: Optional[str] = None
    notes: Optional[str] = None


class HoldingUpdate(BaseModel):
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    sector: Optional[str] = None
    notes: Optional[str] = None


class HoldingResponse(BaseModel):
    id: int
    ticker: str
    quantity: int
    avg_cost: float
    target_price: Optional[float]
    stop_loss: Optional[float]
    sector: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    type: str = Field(..., pattern="^(buy|sell)$")
    ticker: str = Field(..., min_length=1, max_length=10)
    quantity: int = Field(..., gt=0)
    price: float = Field(..., gt=0)
    date: date
    fees: Optional[float] = Field(default=0, ge=0)
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    type: str
    ticker: str
    quantity: int
    price: float
    total_amount: float
    fees: float
    date: date
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioSummary(BaseModel):
    total_value: float
    total_cost: float
    total_gain: float
    total_gain_percent: float
    holdings_count: int
    holdings: List[HoldingResponse]


# ============ Holdings Endpoints ============

@router.get("/holdings", response_model=List[HoldingResponse])
async def get_holdings(db: Session = Depends(get_db)):
    """Get all holdings"""
    holdings = db.query(Holding).filter(Holding.quantity > 0).all()
    return holdings


@router.get("/holdings/{ticker}", response_model=HoldingResponse)
async def get_holding(ticker: str, db: Session = Depends(get_db)):
    """Get specific holding by ticker"""
    holding = db.query(Holding).filter(Holding.ticker == ticker.upper()).first()
    if not holding:
        raise HTTPException(status_code=404, detail=f"Holding for {ticker} not found")
    return holding


@router.put("/holdings/{ticker}", response_model=HoldingResponse)
async def update_holding(
    ticker: str, update: HoldingUpdate, db: Session = Depends(get_db)
):
    """Update holding metadata (target price, stop loss, etc.)"""
    holding = db.query(Holding).filter(Holding.ticker == ticker.upper()).first()
    if not holding:
        raise HTTPException(status_code=404, detail=f"Holding for {ticker} not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(holding, key, value)

    holding.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/holdings/{ticker}")
async def delete_holding(ticker: str, db: Session = Depends(get_db)):
    """Delete a holding (and all its transactions)"""
    holding = db.query(Holding).filter(Holding.ticker == ticker.upper()).first()
    if not holding:
        raise HTTPException(status_code=404, detail=f"Holding for {ticker} not found")

    # Delete associated transactions
    db.query(Transaction).filter(Transaction.ticker == ticker.upper()).delete()
    db.delete(holding)
    db.commit()

    return {"message": f"Holding {ticker} and all transactions deleted"}


# ============ Transaction Endpoints ============

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    ticker: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Get transaction history with optional filters"""
    query = db.query(Transaction)

    if ticker:
        query = query.filter(Transaction.ticker == ticker.upper())
    if type:
        query = query.filter(Transaction.type == type)

    transactions = (
        query.order_by(Transaction.date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return transactions


@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate, db: Session = Depends(get_db)
):
    """
    Record a new transaction (buy or sell)
    This will automatically update the holding's quantity and average cost
    """
    ticker = transaction.ticker.upper()
    total_amount = transaction.quantity * transaction.price

    # Get or create holding
    holding = db.query(Holding).filter(Holding.ticker == ticker).first()

    if transaction.type == "buy":
        if holding:
            # Update existing holding with weighted average cost
            new_quantity = holding.quantity + transaction.quantity
            new_total_cost = (holding.quantity * holding.avg_cost) + total_amount
            holding.avg_cost = new_total_cost / new_quantity
            holding.quantity = new_quantity
        else:
            # Create new holding
            holding = Holding(
                ticker=ticker,
                quantity=transaction.quantity,
                avg_cost=transaction.price,
                sector=transaction.notes,  # Could auto-detect sector later
            )
            db.add(holding)
    else:  # sell
        if not holding or holding.quantity < transaction.quantity:
            available = holding.quantity if holding else 0
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient shares. Available: {available}, Requested: {transaction.quantity}",
            )
        holding.quantity -= transaction.quantity

    holding.updated_at = datetime.utcnow()

    # Create transaction record
    new_transaction = Transaction(
        type=transaction.type,
        ticker=ticker,
        quantity=transaction.quantity,
        price=transaction.price,
        total_amount=total_amount,
        fees=transaction.fees or 0,
        date=transaction.date,
        notes=transaction.notes,
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Delete a transaction and reverse its effect on holdings
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Reverse the transaction effect on holding
    holding = db.query(Holding).filter(Holding.ticker == transaction.ticker).first()

    if holding:
        if transaction.type == "buy":
            # Reverse buy: reduce quantity (may need to recalculate avg cost)
            if holding.quantity >= transaction.quantity:
                # Simple approach: just reduce quantity
                holding.quantity -= transaction.quantity
            else:
                holding.quantity = 0
        else:  # sell
            # Reverse sell: add back the shares
            holding.quantity += transaction.quantity

        holding.updated_at = datetime.utcnow()

    db.delete(transaction)
    db.commit()

    return {"message": "Transaction deleted and holding updated"}


# ============ Summary Endpoints ============

@router.get("/summary")
async def get_portfolio_summary(db: Session = Depends(get_db)):
    """Get portfolio summary with calculated values"""
    holdings = db.query(Holding).filter(Holding.quantity > 0).all()

    total_cost = sum(h.quantity * h.avg_cost for h in holdings)
    # Note: total_value would need current prices from market data
    # For now, return cost-based values

    return {
        "total_cost": total_cost,
        "holdings_count": len(holdings),
        "holdings": [
            {
                "id": h.id,
                "ticker": h.ticker,
                "quantity": h.quantity,
                "avg_cost": h.avg_cost,
                "cost_basis": h.quantity * h.avg_cost,
                "sector": h.sector,
            }
            for h in holdings
        ],
    }


@router.get("/performance")
async def get_portfolio_performance(
    period: str = "1M", db: Session = Depends(get_db)
):
    """Get portfolio performance over time (placeholder)"""
    # This would calculate daily portfolio values over the period
    # For now, return a placeholder
    return {
        "period": period,
        "message": "Performance calculation requires market data integration",
        "data": [],
    }
