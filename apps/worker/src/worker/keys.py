"""
Rotación de claves.

Arreglo 6: rota SOLO ante 429, no en cada archivo. Rotar siempre no reparte
carga, la desordena. Y valida que haya al menos una clave, en vez de reventar
con división por cero como hacía el rotador original.
"""
from openai import AsyncOpenAI


class KeyRotator:
    def __init__(self, keys: list[str]) -> None:
        if not keys:
            raise ValueError("KeyRotator necesita al menos una clave")
        self._keys = keys
        self._i = 0

    @property
    def client(self) -> AsyncOpenAI:
        return AsyncOpenAI(api_key=self._keys[self._i])

    def rotate(self) -> AsyncOpenAI:
        self._i = (self._i + 1) % len(self._keys)
        return self.client
