from __future__ import annotations

import json
import os
from typing import Any

from web3 import Web3


rpc = os.getenv("POLYGON_RPC_URL")
private_key = os.getenv("WALLET_PRIVATE_KEY")
contract_address = os.getenv("CONTRACT_ADDRESS")

w3: Web3 | None = None
contract = None
account = None

with open("blockchain/PermitLedger.abi.json", encoding="utf-8") as f:
    abi = json.load(f)

if rpc:
    w3 = Web3(Web3.HTTPProvider(rpc))

try:
    if w3 is not None and private_key and contract_address:
        checksummed = Web3.to_checksum_address(contract_address)
        contract = w3.eth.contract(address=checksummed, abi=abi)
        account = w3.eth.account.from_key(private_key)
except Exception:
    # Keep backend bootable even if chain env vars are placeholders.
    contract = None
    account = None


def _require_chain_config() -> None:
    if w3 is None or contract is None or account is None:
        raise RuntimeError(
            "Blockchain not configured (check POLYGON_RPC_URL, WALLET_PRIVATE_KEY, CONTRACT_ADDRESS in .env)."
        )


async def write_permit_to_chain(permit: dict[str, Any]) -> str:
    _require_chain_config()
    tx = contract.functions.submitPermit(
        permit["permit_number"],
        permit["department_name"],
        permit["road_name"],
        permit["ward"],
        permit["work_type"],
        int(permit["start_date"].timestamp()),
        int(permit["end_date"].timestamp()),
    ).build_transaction(
        {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": 300000,
            "gasPrice": w3.eth.gas_price,
        }
    )

    signed = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()


async def get_permit_history_from_chain(permit_number: str) -> list[dict[str, Any]]:
    _require_chain_config()
    history = contract.functions.getPermitHistory(permit_number).call()
    return [
        {
            "permit_number": h[0],
            "department": h[1],
            "road_name": h[2],
            "ward": h[3],
            "work_type": h[4],
            "start_date": h[5],
            "end_date": h[6],
            "status": h[7],
            "timestamp": h[8],
            "submitted_by": h[9],
        }
        for h in history
    ]


async def verify_tx(tx_hash: str) -> dict[str, Any]:
    _require_chain_config()
    receipt = w3.eth.get_transaction_receipt(tx_hash)
    return {
        "transactionHash": receipt["transactionHash"].hex(),
        "blockNumber": int(receipt["blockNumber"]),
        "status": int(receipt.get("status", 0)),
        "from": receipt.get("from"),
        "to": receipt.get("to"),
    }

