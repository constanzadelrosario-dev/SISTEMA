"""Cliente mínimo contra PostgREST y RPC de la cola."""
from typing import Any

import httpx

from .config import Config


class Api:
    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg
        self._c = httpx.AsyncClient(
            base_url=f"{cfg.supabase_url}/rest/v1",
            headers={
                "apikey": cfg.service_key,
                "Authorization": f"Bearer {cfg.service_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            timeout=60,
        )

    async def aclose(self) -> None:
        await self._c.aclose()

    async def claim(self) -> dict[str, Any] | None:
        r = await self._c.post("/rpc/claim_ingest_job", json={"worker_id": self.cfg.worker_id})
        r.raise_for_status()
        rows = r.json()
        return rows[0] if rows else None

    async def requeue_stale(self) -> int:
        r = await self._c.post("/rpc/requeue_stale_jobs", json={"max_minutes": 45})
        r.raise_for_status()
        return r.json()

    async def update_job(self, job_id: str, **fields: Any) -> None:
        r = await self._c.patch(f"/ingest_jobs?id=eq.{job_id}", json=fields)
        r.raise_for_status()

    async def insert(self, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not rows:
            return []
        r = await self._c.post(f"/{table}", json=rows)
        r.raise_for_status()
        return r.json()
