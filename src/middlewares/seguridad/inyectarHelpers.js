const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");

const inyectarHelpers = (req, res, next) => {
  res.locals.helpersScripts = [
    "/public/js/seguridad/utils/notyf.js",
    "/public/js/seguridad/utils/httpClient.js",
  ];
  res.locals.helpersStyles = ["/public/css/seguridad/notyf.css"];
  res.locals.configSeguridad = {
    SEGURIDAD_URL_BACKEND: SEGURIDAD_CONFIG.URL_BASE_API_SEGURIDAD,
  };
  next();
};

module.exports = { inyectarHelpers };