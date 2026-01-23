# Interfaces Control — UI Suite (Landing + Módulos)

Este repositorio es una **suite de interfaces web** para un sistema de *Control de Proyectos / Operación*.
Incluye una **landing pública** (home) y múltiples **módulos HTML/CSS/JS** (admin, seguridad, cocina, KPIs, atención al cliente, delivery/pickup), todo servido por un **servidor Express** y con soporte de deploy en **Vercel**.

La idea: una base simple, rápida de levantar, fácil de extender, y con rutas amigables para navegar entre vistas.

---

## Qué incluye

- **Landing (ruta raíz `/`)**
	- UI responsive + menú mobile.
	- Estilos propios en `landing/styles.css` y JS en `landing/script.js`.
	- Assets locales en `public/assets`.

- **Módulos por dominio (vistas estáticas)**
	- `mod-1-delivery-pickup/`: pedidos, checkout, tracking, dashboards, etc.
	- `mod-2-kpis/`: BI, dashboards, eficiencia operativa, inventario.
	- `mod-3-atencion-cliente/`: flujo de órdenes, help, login, reportes.
	- `mod-4-seguridad/`: roles, permisos, usuarios, ajustes.
	- `mod-5-cocina/`: KDS/Despacho, inventario, auditoría, personal.

- **Shared UI**
	- `shared/`: componentes y páginas reutilizables.

- **Servidor y deploy**
	- Local con `server.js` (Express).
	- Vercel con funciones serverless en `api/` + configuración en `vercel.json`.

---

## Rutas importantes

Estas rutas están pensadas para que el proyecto tenga un *home* claro y navegación directa.

- `/` → Landing (desde `landing/index.html`)
- `/menú` → Redirect a `/menu` (alias con acento)
- `/menu` → Vista de menú (en `shared/pages/menu`)

> Nota: el resto de vistas se sirven como HTML estático dentro de las carpetas `mod-*` y `shared/`.

---

## Tecnologías

- **Frontend:** HTML + CSS + JavaScript (vanilla)
- **Servidor:** Node.js + Express
- **Estilos:** Tailwind (build a `public/styles/tailwind.css`) + CSS propio por módulo cuando aplica
- **Deploy:** Vercel (serverless)

---

## Estructura del proyecto (resumen)

```
.
├─ landing/                 # Landing pública (home)
├─ mod-1-delivery-pickup/   # Módulo delivery/pickup
├─ mod-2-kpis/              # KPIs / BI
├─ mod-3-atencion-cliente/  # Atención al cliente
├─ mod-4-seguridad/         # Seguridad (roles, permisos, usuarios)
├─ mod-5-cocina/            # Cocina (KDS, despacho, auditoría)
├─ shared/                  # Componentes y páginas compartidas
├─ public/                  # Archivos públicos (assets, css compilado)
├─ api/                     # Entry serverless para Vercel
├─ server.js                # Servidor Express local
└─ vercel.json              # Config de Vercel
```

---

## Cómo correrlo en local

Requisitos:

- Node.js (recomendado: LTS)

Instalación:

```bash
npm install
```

Modo desarrollo (reconstruye Tailwind y levanta servidor con nodemon):

```bash
npm run dev
```

Modo producción local:

```bash
npm run build
npm start
```

---

## Build de estilos (Tailwind)

El build genera:

- `public/styles/tailwind.css`

Comando:

```bash
npm run build
```

---

## Deploy en Vercel

El proyecto está preparado para Vercel con:

- `api/index.js` como handler serverless.
- `vercel.json` para rutas y para incluir archivos estáticos necesarios (por ejemplo `landing/**`).

En Vercel normalmente basta con:

- Build Command: `npm run vercel-build`
- Output: (no aplica como SPA; se resuelve por serverless)

---

## Convenciones rápidas

- **Assets** públicos van en `public/` y se referencian como rutas absolutas: `/assets/...`
- **Landing** usa rutas absolutas para CSS/JS: `/landing/styles.css`, `/landing/script.js`
- Si agregas una vista nueva, intenta mantener:
	- HTML limpio (secciones claras)
	- CSS por módulo o por página
	- JS encapsulado (evitar variables globales innecesarias)

---

## Próximos upgrades (ideas)

- Unificar tokens de color/typography entre módulos.
- Añadir un "router" simple de vistas y un mapa de navegación.
- Automatizar preview/links internos desde una página índice.

---

## Licencia

Uso interno / según políticas del proyecto.
