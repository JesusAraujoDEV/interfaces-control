const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const jwt = require("jsonwebtoken");

const SECRET_JWT = SEGURIDAD_CONFIG.SECRET_JWT_KEY;

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_JWT);
    return decoded;
  } catch (error) {
    console.error(error);
    throw new Error("Token inválido o expirado");
  }
}

module.exports = { verifyToken };