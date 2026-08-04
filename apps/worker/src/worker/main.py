"""
Bucle del worker.

Arreglos 1 y 5 respecto del script original:
  1 · idempotencia: el trabajo ya viene de la cola con hash único. No hay
      reproceso ni append duplicado.
  5 · concurrencia real: las llamadas de red usan el SDK asíncrono y ffmpeg va
      a un executor. El semáforo existe y se aplica, en vez de ser una
      constante declarada que nadie usaba.
"""
import asyncio
import contextlib
import logging
from pathlib import Path

from openai import RateLimitError

from . import asr, config, emit, ocr
from .keys import KeyRotator
from .queue import Api

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("worker")

IMG = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
AV = {".mp4", ".mov", ".mkv", ".mp3", ".wav", ".m4a"}


async def process(job: dict, cfg: config.Config, api: Api, keys: KeyRotator) -> None:
    path = Path(cfg.media_root) / job["file_path"]
    if not path.exists():
        raise FileNotFoundError(f"No existe {path}")

    await api.update_job(job["id"], status="processing", progress=5)
    ext = path.suffix.lower()

    if ext in IMG:
        segments = await ocr.ocr_image(path, cfg, keys.client)
    elif ext in AV:
        segments = await asr.transcribe_media(path, cfg, keys.client)
    else:
        raise ValueError(f"Extensión no soportada: {ext}")

    await api.update_job(job["id"], progress=60)
    rows = await api.insert("ingest_segments", [{"job_id": job["id"], **s} for s in segments])

    # Los destinos distintos de 'cerebro' no pasan por la bandeja de validación.
    if job.get("purpose", "cerebro") == "cerebro":
        candidates: list[dict] = []
        for seg, row in zip(segments, rows, strict=False):
            for c in await emit.propose(seg, keys.client):
                candidates.append({
                    "workspace_id": job["workspace_id"],
                    "job_id": job["id"],
                    "segment_id": row["id"],
                    "kind": c.get("kind", "fact"),
                    "payload": c.get("payload", {}),
                    "rationale": c.get("rationale"),
                    "confidence": c.get("confidence"),
                })
        await api.insert("ingest_candidates", candidates)
        log.info("job %s: %d segmentos, %d candidatos", job["id"], len(segments), len(candidates))

    await api.update_job(job["id"], status="done", progress=100, error=None)


async def main() -> None:
    cfg = config.load()
    keys = KeyRotator(cfg.api_keys)
    api = Api(cfg)
    sem = asyncio.Semaphore(cfg.max_concurrency)   # arreglo 5
    log.info("worker %s escuchando", cfg.worker_id)

    with contextlib.suppress(KeyboardInterrupt):
        while True:
            # El equipo se apaga: hay que devolver a la cola lo que quedó reclamado.
            with contextlib.suppress(Exception):
                await api.requeue_stale()

            job = await api.claim()
            if not job:
                await asyncio.sleep(cfg.poll_seconds)
                continue

            async with sem:
                try:
                    await process(job, cfg, api, keys)
                except RateLimitError:
                    keys.rotate()   # arreglo 6: solo ante 429
                    await api.update_job(job["id"], status="pending", claimed_by=None)
                    await asyncio.sleep(15)
                except Exception as err:  # noqa: BLE001
                    log.exception("job %s falló", job["id"])
                    final = job["attempts"] >= job["max_attempts"]
                    await api.update_job(
                        job["id"],
                        status="failed" if final else "pending",
                        claimed_by=None,
                        error=str(err)[:500],
                    )
    await api.aclose()


if __name__ == "__main__":
    asyncio.run(main())
