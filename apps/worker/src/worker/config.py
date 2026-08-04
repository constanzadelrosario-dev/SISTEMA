"""Configuración. Valida al arrancar en vez de reventar a mitad de un trabajo."""
import os
import sys
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Config:
    supabase_url: str
    service_key: str
    workspace_id: str
    worker_id: str
    media_root: str
    poll_seconds: int
    api_keys: list[str] = field(default_factory=list)

    # Corte de segmentación de video, con solapamiento para no partir palabras.
    chunk_seconds: int = 120
    overlap_seconds: int = 2
    # Bajo esta confianza media, el OCR local cede al modelo de visión.
    ocr_confidence_floor: float = 0.72
    max_concurrency: int = 2


def load() -> Config:
    missing = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "WORKSPACE_ID")
               if not os.getenv(k)]
    if missing:
        sys.exit(f"Faltan variables de entorno: {', '.join(missing)}")

    keys = [os.getenv(k) for k in ("OPENAI_API_KEY", "OPENAI_API_KEY_2", "OPENAI_API_KEY_3")]
    keys = [k for k in keys if k]
    if not keys:
        sys.exit("No hay ninguna OPENAI_API_KEY definida.")

    return Config(
        supabase_url=os.environ["SUPABASE_URL"].rstrip("/"),
        service_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        workspace_id=os.environ["WORKSPACE_ID"],
        worker_id=os.getenv("WORKER_ID", "local-1"),
        media_root=os.getenv("MEDIA_ROOT", "/media"),
        poll_seconds=int(os.getenv("POLL_SECONDS", "10")),
        api_keys=keys,
    )
