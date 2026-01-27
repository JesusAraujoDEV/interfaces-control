# 🍽️ Charlotte - Módulo de Atención al Cliente (Mod 3)

Este módulo gestiona la interacción digital entre los comensales y el restaurante. Permite a los clientes escanear un código QR para realizar pedidos y solicitar asistencia, mientras provee a los Gerentes y Maitres herramientas para administrar el inventario de mesas y monitorear el servicio en tiempo real.

---

## 🚀 Despliegue (Deploy)

El proyecto se encuentra desplegado y accesible en Vercel.

**URL Base:** `https://interfaces-control.vercel.app`

---

## 🔑 Credenciales de Acceso

Para acceder a las vistas administrativas (`/admin`), utilice los siguientes usuarios de prueba:

| Rol | Email | Contraseña | Nivel de Acceso |
| :--- | :--- | :--- | :--- |
| **Gerente ATC** | `santiago.p@charlotte.com` | `SuperSeguraPassword` | Gestión completa de mesas y reportes. |
| **Maitre** | `usuario.p1@charlotte.com` | `SuperSeguraPassword` | Supervisión de sala y estados de mesa. |
| **Super Admin** | `admin@charlotte.com` | `admin` | Acceso total al sistema. |

---

## 🗺️ Mapa de Rutas y Vistas

### 📱 Vistas del Cliente (Comensal)
Estas vistas son accesibles públicamente (simulando el escaneo de un QR) y no requieren login de empleado.

1.  **Escaneo de QR (Entrada):**
    * Simula el escaneo del código físico en la mesa. Inicia la sesión del cliente vinculada a una mesa específica.
    * 🔗 [Probar Escaneo (UUID Demo)](https://interfaces-control.vercel.app/mod-3-atencion-cliente/pages/login/scan.html?qr_uuid=ce738bca-ceb4-41dc-88a9-a33053bfc4e8)

2.  **Menú Digital:**
    * Catálogo de productos disponibles para ordenar.
    * 🔗 [Ver Menú](https://interfaces-control.vercel.app/mod-3-atencion-cliente/pages/pedidos/menu.html)

3.  **Carrito de Compras:**
    * Resumen del pedido actual antes de confirmar.
    * 🔗 [Ver Carrito](https://interfaces-control.vercel.app/mod-3-atencion-cliente/pages/pedidos/cart.html)

4.  **Soporte y Asistencia:**
    * Interfaz para solicitar ayuda (mesero, cuenta, incidentes) directamente desde el móvil.
    * 🔗 [Solicitar Soporte](https://interfaces-control.vercel.app/mod-3-atencion-cliente/pages/pedidos/support.html)

---

### 💻 Vistas Administrativas (Gerencia y Sala)
Estas vistas requieren autenticación previa con las credenciales listadas arriba.

1.  **Panel de Control de Mesas:**
    * Dashboard principal para Gerentes y Maitres. Permite ver el estado de las mesas (Libre, Ocupada), gestionar sesiones activas, atender solicitudes de soporte y editar el inventario.
    * 🔗 [Ir al Panel de Mesas](https://interfaces-control.vercel.app/mod-3-atencion-cliente/pages/admin/tables.html)

---

## 🛠️ Características Principales

* **Autenticación y Roles:** Sistema de login seguro con diferenciación entre Gerencia y Staff operativo.
* **QR Dinámicos:** Validación de sesiones mediante UUIDs únicos por mesa.
* **Gestión de Inventario de Mesas:** CRUD completo (Crear, Leer, Actualizar, Borrar) mesas.
* **Solicitudes en Tiempo Real:** Los clientes pueden pedir asistencia y el panel administrativo recibe las notificaciones.
* **Mobile First:** Las vistas de cliente están optimizadas para dispositivos móviles.