Audita el módulo indicado en diez dimensiones y escribe el informe en
`docs/plans/AAAA-MM-DD-audit-<modulo>.md`.

Dimensiones: PDF y export, SEO e indexación, seguridad, rendimiento, responsive,
accesibilidad, movimiento, contenido y copy, código, tests.

Para cada hallazgo: severidad (P0 a P3), qué está mal, fix propuesto, y si es
seguro ejecutarlo de forma autónoma o requiere criterio del operador.

Ejecuta autónomamente solo los fixes seguros y de alta confianza. Marca el resto.
Verifica con `pnpm type && pnpm test && pnpm check` antes de cerrar.
