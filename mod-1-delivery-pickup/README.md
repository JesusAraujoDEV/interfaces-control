# Módulo 1 — Delivery/Pickup (Vanilla JS)

## Estructura

- `index.html`: entrada del módulo (redirige a `pages/checkout/`).
- `pages/`: cada pantalla/ruta del módulo.
  - Cada página puede tener:
    - `index.html`: markup
    - `page.css`: estilos específicos de la página
    - `page.js`: lógica específica de la página (cargado como ES Module con `<script type="module">`)
- `src/`: código reutilizable (componentes, utilidades, servicios). Aún vacío/para crecimiento.
  - `src/components/`: componentes UI reutilizables
  - `src/ui/`: helpers de DOM/validaciones
  - `src/services/`: navegación, storage, fetching, etc.
  - `src/utils/`: helpers puros (format, url, etc.)
- `styles/`: estilos compartidos (si se necesitan)
- `assets/`: imágenes/íconos/fuentes del módulo

## Convenciones

- Carpetas en `kebab-case`.
- JS como `.js` usando ES Modules (`type="module"`).
- CSS solo en `page.css` (o `styles/` si es compartido).
