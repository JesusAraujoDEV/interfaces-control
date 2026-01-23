# Documentación de Rutas y Archivos HTML

Este documento detalla la estructura de navegación del módulo de KPIs y cómo Express sirve cada archivo estático.

## 📂 Estructura de Archivos (Directorio)
Para que estas rutas funcionen correctamente, tu carpeta debe verse así:

```text
nombre-de-tu-proyecto/
├── routes/ (o donde esté tu archivo de rutas)
│   └── kpiRoutes.js
└── public/
    ├── dashboard.html
    ├── bussines-intelligence.html
    ├── eficiencia-operacional.html
    └── inventario.html

```

---

## 🗺️ Mapeo de Rutas (Endpoints)

A continuación se detalla qué URL debe ingresar el usuario y qué archivo devuelve el servidor:

| Ruta en el Navegador (URL) | Archivo Físico Servido | Descripción |
| --- | --- | --- |
| `/kpis/dashboard` | `public/dashboard.html` | Panel principal de indicadores clave. |
| `/kpis/bussines-intelligence` | `public/bussines-intelligence.html` | Reportes de Inteligencia de Negocios. |
| `/kpis/operational-efficent` | `public/eficiencia-operacional.html` | Métricas de eficiencia operativa. |
| `/kpis/inventory` | `public/inventario.html` | Gestión y control de inventarios. |

---

## ⚙️ Funcionamiento Técnico

### 1. Archivos Estáticos

El servidor utiliza el middleware:
`router.use(express.static(path.join(__dirname, 'public')));`

Esto permite que, si dentro de tus archivos HTML llamas a un CSS o JS (ej. `<link rel="stylesheet" href="/style.css">`), Express lo busque automáticamente dentro de la carpeta `/public`.

### 2. Resolución de Rutas con `path.join`

Se utiliza `__dirname` para obtener la ruta absoluta del directorio actual. Esto garantiza que el servidor encuentre los archivos sin importar desde qué carpeta se ejecute el proceso de Node.js.

---

## 💡 Notas Adicionales

* **Consola:** Al acceder a `/kpis/dashboard`, verás en la terminal la ruta absoluta del proyecto gracias al `console.log(__dirname)`.
* **Sugerencia:** Asegúrate de que los nombres de los archivos en la carpeta `public` coincidan exactamente (mayúsculas/minúsculas) con los nombres escritos en el código `res.sendFile`.

```

---

### Una pequeña observación de mejora
He notado que en tu ruta de eficiencia operativa, el nombre en la URL está en inglés (`operational-efficent`) pero el archivo está en español (`eficiencia-operacional.html`). Esto es totalmente válido, pero si prefieres mantener consistencia de idiomas, podrías renombrar el archivo o la ruta.

**¿Te gustaría que te ayude a crear un menú de navegación (Navbar) en HTML para moverte entre estas cuatro rutas fácilmente?**

```