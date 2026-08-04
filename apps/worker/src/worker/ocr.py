"""
OCR híbrido.

Arreglo 4: pase local primero (tesseract). Si la confianza media queda bajo el
piso o el texto sale casi vacío, recién ahí el modelo de visión. Para texto
denso sobre fondo plano —capturas de slides, documentos escaneados— el OCR
clásico es más barato y más fiel; el modelo se reserva para texto integrado en
diseño. El EAST muerto del script original apuntaba a este mismo camino.
"""
import asyncio
import base64
from pathlib import Path

import pytesseract
from openai import AsyncOpenAI
from PIL import Image

from .config import Config

PROMPT = "Extrae SOLO el texto visible, sin interpretar ni describir."


def _local(path: Path) -> tuple[str, float]:
    img = Image.open(path)
    data = pytesseract.image_to_data(img, lang="spa+eng", output_type=pytesseract.Output.DICT)
    words, confs = [], []
    for text, conf in zip(data["text"], data["conf"], strict=False):
        if text.strip() and str(conf).lstrip("-").isdigit() and int(conf) >= 0:
            words.append(text)
            confs.append(int(conf) / 100)
    return " ".join(words), (sum(confs) / len(confs) if confs else 0.0)


async def _vision(path: Path, client: AsyncOpenAI) -> str:
    b64 = base64.b64encode(path.read_bytes()).decode()
    res = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}]},
        ],
        timeout=90,
    )
    return (res.choices[0].message.content or "").strip()


async def ocr_image(path: Path, cfg: Config, client: AsyncOpenAI) -> list[dict]:
    loop = asyncio.get_running_loop()
    text, conf = await loop.run_in_executor(None, _local, path)

    if len(text.split()) >= 8 and conf >= cfg.ocr_confidence_floor:
        return [{"idx": 0, "t_start": None, "t_end": None, "text": text,
                 "method": "ocr_local", "confidence": round(conf, 3)}]

    text = await _vision(path, client)
    return [{"idx": 0, "t_start": None, "t_end": None, "text": text,
             "method": "ocr_llm", "confidence": None}]
