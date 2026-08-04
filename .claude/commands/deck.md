Crea un deck nuevo.

Pregunta, de a una: tipo (pitch VC, auspicio, propuesta de piloto, dossier
académico, media kit), proyecto asociado, idioma, y si hay archivo de origen.

Luego:
1. Lee `.claude/skills/deck-authoring/SKILL.md`.
2. Si hay archivo, decide modo `fuente` o `esqueleto` y regístralo en `deck_sources`.
3. Corre `deck.estructura` para el esqueleto de láminas.
4. Corre `deck.slide` por lámina.
5. Corre guardrails sobre `deckText(deck)`.
6. Ofrece cuatro temas: fiel, dos variaciones y un contraste.
7. Al cerrar, ofrece subir al Cerebro los datos y frases del origen que no estén.
