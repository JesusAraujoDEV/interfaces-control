const { Router } = require("express");
const { verifyToken } = require("../../utils/seguridad/jwt");
const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");

const URL_BASE_API_SEGURIDAD = SEGURIDAD_CONFIG.URL_BASE_API_SEGURIDAD;

function createApiSeguridadRouter() {
  const router = Router();

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        res.cookie("access_token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "Strict",
          maxAge: 24 * 60 * 60 * 1000,
        });
        const dataUser = verifyToken(token);
        res.json({
          success: true,
          access_token: token,
          user: dataUser,
          message: "Login successful",
        });
      } else {
        const error = await response.json();
        res.status(401).json({
          success: false,
          message: error.message || "Credenciales inválidas",
        });
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.get("/roles", async (req, res) => {
    try {
      const { page = 1, limit = 12, search = "" } = req.query;
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;

      // Construir URL con parámetros de paginación
      const url = `${URL_BASE_API_SEGURIDAD}/api/seguridad/roles?page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(access_token && { Authorization: `Bearer ${access_token}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          roles: data.roles || data || [],
          pagination: data.pagination || {
            page: parseInt(page),
            limit: parseInt(limit),
            total: data.total || 0,
            totalPages: Math.ceil((data.total || 0) / parseInt(limit)),
          },
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al obtener los roles",
        });
      }
    } catch (error) {
      console.error("Error during roles fetch:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.post("/roles", async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/roles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
          body: JSON.stringify({ name, description, permissions }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          ...data,
          message: "Rol creado exitosamente",
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al crear el rol",
        });
      }
    } catch (error) {
      console.error("Error during role creation:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.get("/roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/roles/${id}?includeUsers=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          role: data,
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al obtener el rol",
        });
      }
    } catch (error) {
      console.error("Error during role fetch:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.put("/permissions/:id", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const { id } = req.params;
      const bodyData = req.body;

      console.log(`=> Intentando PATCH a API externa para ID: ${id}`);

      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/permissions/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
          body: JSON.stringify(bodyData),
        }
      );
      const contentType = response.headers.get("content-type");
      let data = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok) {
        return res.json({ success: true, message: "Actualizado con éxito" });
      } else {
        console.error("Error API Externa:", response.status, data);
        return res.status(response.status).json({
          success: false,
          message: data.message || "La API externa rechazó la actualización",
        });
      }
    } catch (error) {
      console.error("Error crítico en el Bridge:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error de conexión con la API de seguridad",
        });
      }
    }
  });

  router.delete("/roles/:id", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const { id } = req.params;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/roles/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        res.json({
          success: true,
          message: "Rol eliminado exitosamente",
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al eliminar el rol",
        });
      }
    } catch (error) {
      console.error("Error during role deletion:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.get("/enums/Permission/type", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/enums/Permission/type`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          types: data,
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al obtener los tipos de permiso",
        });
      }
    } catch (error) {
      console.error("Error during permission types fetch:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.get("/enums/Permission/resource", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/enums/Permission/resource`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          resources: data,
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al obtener los recursos de permiso",
        });
      }
    } catch (error) {
      console.error("Error during permission resources fetch:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.get("/enums/Permission/method", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/enums/Permission/method`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          methods: data,
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al obtener los métodos de permiso",
        });
      }
    } catch (error) {
      console.error("Error during permission methods fetch:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.get("/permissions", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/permissions`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          permissions: data,
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al obtener los permisos",
        });
      }
    } catch (error) {
      console.error("Error during permissions fetch:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.get("/permissions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/permissions/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          permission: data,
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al obtener el permiso",
        });
      }
    } catch (error) {
      console.error("Error during permission fetch:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.post("/permissions", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const { name, type, resource, method, roleId } = req.body;

      // Validación previa para evitar enviar basura a la API interna
      if (!roleId || isNaN(roleId)) {
        return res
          .status(400)
          .json({ success: false, message: "ID de rol inválido" });
      }

      const bodyParaAPI = {
        name: name.trim(),
        type: type,
        resource: resource,
        method: method,
        roleId: Number(roleId),
      };

      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
          body: JSON.stringify(bodyParaAPI),
        }
      );

      // IMPORTANTE: Solo leemos el json() UNA VEZ
      const data = await response.json();

      if (response.ok) {
        return res.json({
          success: true,
          permission: data,
        });
      } else {
        // Si la API interna devuelve errores de validación (Zod/Prisma), los extraemos
        const msgError = data.errors
          ? data.errors[0].message
          : data.message || "Error en la API";
        return res.status(response.status).json({
          success: false,
          message: msgError,
        });
      }
    } catch (error) {
      console.error("Error crítico en bridge:", error);
      // Evitamos que el cliente se quede colgado (ERR_CONNECTION_RESET)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error de conexión con el servicio de seguridad",
        });
      }
    }
  });

  // routes/seguridad/apiSeguridad.js

  router.put("/permissions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const bodyData = req.body;

      // 1. CAPTURAR EL TOKEN: Lo sacamos de los headers que envió tu EJS
      const authHeader = req.headers.authorization;

      console.log(`=> Reenviando PATCH a API externa para ID: ${id}`);

      if (!authHeader) {
        console.error(
          "❌ ERROR: El Bridge no recibió ningún token del Frontend"
        );
      }

      // 2. REENVIAR: Se lo pasamos explícitamente a la API externa
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/permissions/${id}`,
        {
          method: "PATCH", // Cambiado a PATCH según tu Postman
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader, // <--- AQUÍ ESTÁ LA CLAVE
          },
          body: JSON.stringify(bodyData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return res.json({ success: true, message: "Actualizado con éxito" });
      } else {
        // Si la API externa dice 403, devolvemos ese mismo error al front
        console.error(" Error de la API de Seguridad Real:", data);
        return res.status(response.status).json(data);
      }
    } catch (error) {
      console.error(" Error en el Bridge:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
    }
  });

  router.delete("/permissions/:id", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const { id } = req.params;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/permissions/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        res.json({
          success: true,
          message: "Permiso eliminado exitosamente",
        });
      } else {
        let errorMessage = "Error al eliminar el permiso";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), use default message
          console.error("Failed to parse error response as JSON:", parseError);
        }
        res.status(response.status).json({
          success: false,
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Error during permission deletion:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.put("/roles/:id", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const { id } = req.params;
      const bodyData = req.body;

      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/roles/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
          body: JSON.stringify(bodyData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          ...data,
          message: "Rol actualizado exitosamente",
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al actualizar el rol",
        });
      }
    } catch (error) {
      console.error("Error during role update:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  router.delete("/roles/:id", async (req, res) => {
    try {
      const access_token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.access_token;
      const { id } = req.params;
      const response = await fetch(
        `${URL_BASE_API_SEGURIDAD}/api/seguridad/roles/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(access_token && { Authorization: `Bearer ${access_token}` }),
          },
        }
      );

      if (response.ok) {
        res.json({
          success: true,
          message: "Rol eliminado exitosamente",
        });
      } else {
        const error = await response.json();
        res.status(response.status).json({
          success: false,
          message: error.message || "Error al eliminar el rol",
        });
      }
    } catch (error) {
      console.error("Error during role delete:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  });

  return router;
}

module.exports = createApiSeguridadRouter;
