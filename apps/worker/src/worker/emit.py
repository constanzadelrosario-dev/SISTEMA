"""
Convierte segmentos en candidatos para el Cerebro.

La salida del worker no es un .txt. Es estructura: un candidato por hallazgo,
con su origen exacto y su confianza. Todo nace en amarillo: la máquina propone,
la persona valida. Esa regla es lo que mantiene al Cerebro como fuente de verdad.
"""
import json

from openai import AsyncOpenAI

SYSTEM = """Lees un fragmento transcrito o extraído de material de una profesional.
Propón candidatos para su base de conocimiento. Devuelve SOLO JSON:
{"candidatos":[{"kind":"fact|voice|citation|gap","payload":{...},"rationale":"1 frase","confidence":0.0}]}

Reglas:
- kind "voice": frase textual en primera persona, declarativa, que ella podría
  querer citar después. payload: {"text": "...", "speaker": "principal"}
- kind "fact": dato verificable. payload: {"key":"area.subclave","value":"...","status":"amarillo"}
- kind "citation": frase de un tercero identificado. Máximo 15 palabras.
  payload: {"text":"...","attribution":"nombre"}
- kind "gap": algo que se menciona sin precisar y convendría confirmar.
  payload: {"field":"area.subclave"}
- No inventes nada que no esté en el texto. Si el fragmento no da para nada,
  devuelve la lista vacía.
- Máximo 6 candidatos por fragmento."""


async def propose(segment: dict, client: AsyncOpenAI) -> list[dict]:
    if len(segment["text"].split()) < 12:
        return []
    res = await client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": SYSTEM},
                  {"role": "user", "content": segment["text"][:6000]}],
        timeout=90,
    )
    try:
        data = json.loads(res.choices[0].message.content or "{}")
    except json.JSONDecodeError:
        return []
    return data.get("candidatos", [])[:6]
