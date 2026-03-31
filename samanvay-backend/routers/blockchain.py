from __future__ import annotations

from fastapi import APIRouter

from blockchain.ledger import get_permit_history_from_chain, verify_tx

router = APIRouter()


@router.get("/permit/{permit_id}")
async def permit_chain_record(permit_id: str):
    # Frontend is expected to know permit_number; here we proxy by permit_number == permit_id for simplicity.
    history = await get_permit_history_from_chain(permit_id)
    return {"permit_number": permit_id, "history": history}


@router.get("/verify/{tx_hash}")
async def verify_transaction(tx_hash: str):
    result = await verify_tx(tx_hash)
    return result


@router.get("/audit-trail/{permit_number}")
async def audit_trail(permit_number: str):
    history = await get_permit_history_from_chain(permit_number)
    return {"permit_number": permit_number, "history": history}

