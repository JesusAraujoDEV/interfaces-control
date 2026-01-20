require("dotenv/config");

const SEGURIDAD_CONFIG = {
  SALT_ROUNDS: Number(process.env.SEGURIDAD_SALT_ROUNDS) || 10,
  SECRET_JWT_KEY:
    process.env.SEGURIDAD_SECRET_JWT_KEY ||
    "default-secret-change-in-production",
  URL_BASE_API_SEGURIDAD:
    process.env.SEGURIDAD_URL_BACKEND ||
    "https://charlotte-seguridad.onrender.com",
};

module.exports = SEGURIDAD_CONFIG;