const { Router } = require("express");
const { inyectarHelpers } = require("../../middlewares/seguridad/inyectarHelpers");
const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");

const apiUrl = SEGURIDAD_CONFIG.URL_BASE_API_SEGURIDAD;

const createSeguridadRouter = () => {
  const router = Router();
  router.use(inyectarHelpers);

  router.get("/login", async (req, res) => {
    res.render("seguridad/login");
  });

  router.get("/usuarios", async (req, res) => {
    try {
      const access_token = req.cookies.access_token || null;
      const resp = await fetch(`${apiUrl}/api/seguridad/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(access_token && { Authorization: `Bearer ${access_token}` }),
        },
      });

      if (!resp.ok) {
        console.error("Error fetching users:", resp.statusText);
        return res.render("seguridad/usuarios", {
          usuarios: [],
          messagesError: ["Error al obtener los usuarios: " + resp.statusText],
        });
      }
      const data = await resp.json();
      const usuarios = data || [];
      res.render("seguridad/usuarios", { usuarios });
    } catch (error) {
      console.error("A ocurrido un error en /usuarios: ", error);
      res.render("seguridad/usuarios", {
        usuarios: [],
        messagesError: [`A ocurrido un error: ${error.message}`],
      });
    }
  });

  router.get("/usuarios/crear", async (req, res) => {
    res.render("seguridad/crearUsuario");
  });

  router.get("/usuarios/editar/:id", async (req, res) => {
    const { id } = req.params;
    res.render("seguridad/editarUsuario", { userId: id });
  });

  router.get("/roles", async (req, res) => {
    res.render("seguridad/roles");
  });

  router.get("/roles/crear", async (req, res) => {
    res.render("seguridad/crearRol");
  });

  router.get("/roles/editar/:id", async (req, res) => {
    const { id } = req.params;
    res.render("seguridad/editarRol", { roleId: id });
  });

  router.get("/permisos", async (req, res) => {
    res.render("seguridad/permisos");
  });

  router.get("/permisos/:id", async (req, res) => {
    const { id } = req.params;
    res.render("seguridad/verPermiso", { roleId: id });
  });

  router.get("/restaurante/coordenadas", async (req, res) => {
    res.render("seguridad/restauranteCoordenadas");
  });

  router.get("/ubicacion", async (req, res) => {
    res.render("seguridad/ubicacion");
  });

  router.get("/perfil/editar", async (req, res) => {
    res.render("seguridad/editarPerfil");
  });

  router.get("/perfil/cambioPassword", async (req, res) => {
    res.render("seguridad/cambioContraseña");
  });

  return router;
};
module.exports = createSeguridadRouter;