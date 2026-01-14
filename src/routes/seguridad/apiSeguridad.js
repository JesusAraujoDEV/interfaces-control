const { Router } = require("express");
const { verifyToken } = require('../../utils/seguridad/jwt');
const SEGURIDAD_CONFIG = require('../../config/seguridad/seguridad')

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
          headers: { "Content-Type": "application/json" },
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

  return router;
}

module.exports = createApiSeguridadRouter;