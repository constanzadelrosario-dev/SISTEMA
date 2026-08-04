"""
Transcripción de video y audio.

Arreglos aplicados respecto del script original:
  2 · los fragmentos se escriben en un directorio temporal que se destruye al
      terminar. Antes quedaban junto al original y, como terminan en .mp4,
      entraban en el listado de la corrida siguiente y se transcribían otra vez.
  3 · la extensión de audio sale de splitext, no de replace(".mp4", ".wav"),
      que no hacía nada con .mov ni .mkv y producía un archivo que Whisper
      rechaza.
  7 · los cortes llevan solapamiento: ffmpeg -c copy corta en keyframes, así
      que los límites no son exactos y pueden partir una palabra.
"""
import asyncio
import subprocess
import tempfile
from pathlib import Path

from openai import AsyncOpenAI

from .config import Config


def _run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True)


def split_media(src: Path, workdir: Path, cfg: Config) -> list[tuple[Path, float]]:
    """Devuelve (fragmento, t_inicio). Con solapamiento entre cortes."""
    dur = _duration(src)
    if dur <= cfg.chunk_seconds:
        return [(src, 0.0)]

    out: list[tuple[Path, float]] = []
    step = cfg.chunk_seconds - cfg.overlap_seconds
    t = 0.0
    idx = 0
    while t < dur:
        dst = workdir / f"part_{idx:03d}.wav"
        _run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(t), "-t", str(cfg.chunk_seconds), "-i", str(src),
            "-vn", "-ac", "1", "-ar", "16000", str(dst),
        ])
        out.append((dst, t))
        t += step
        idx += 1
    return out


def _duration(src: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(src)],
        check=True, capture_output=True, text=True,
    )
    return float(r.stdout.strip() or 0)


def extract_audio(src: Path, workdir: Path) -> Path:
    dst = workdir / (src.stem + ".wav")   # arreglo 3
    _run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
          "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", str(dst)])
    return dst


async def transcribe(path: Path, client: AsyncOpenAI) -> str:
    def _call() -> str:
        import openai
        with path.open("rb") as f:
            sync = openai.OpenAI(api_key=client.api_key)
            return sync.audio.transcriptions.create(model="whisper-1", file=f).text
    return await asyncio.get_running_loop().run_in_executor(None, _call)


def dedupe_overlap(a: str, b: str, max_words: int = 24) -> str:
    """Une dos fragmentos solapados quitando la costura repetida."""
    aw, bw = a.split(), b.split()
    for n in range(min(max_words, len(aw), len(bw)), 3, -1):
        if [w.lower() for w in aw[-n:]] == [w.lower() for w in bw[:n]]:
            return " ".join(aw + bw[n:])
    return " ".join(aw + bw)


async def transcribe_media(src: Path, cfg: Config, client: AsyncOpenAI) -> list[dict]:
    segments: list[dict] = []
    with tempfile.TemporaryDirectory() as tmp:   # arreglo 2
        workdir = Path(tmp)
        audio = extract_audio(src, workdir) if src.suffix.lower() in {".mp4", ".mov", ".mkv"} else src
        parts = split_media(audio, workdir, cfg)
        for idx, (part, t0) in enumerate(parts):
            text = await transcribe(part, client)
            if segments and idx > 0:
                merged = dedupe_overlap(segments[-1]["text"], text)   # arreglo 7
                segments[-1]["text"] = merged
                segments[-1]["t_end"] = t0 + cfg.chunk_seconds
                continue
            segments.append({
                "idx": idx, "t_start": t0, "t_end": t0 + cfg.chunk_seconds,
                "text": text, "method": "asr_whisper", "confidence": None,
            })
    return segments
