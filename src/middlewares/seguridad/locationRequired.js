const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const { verifyToken } = require("../../utils/seguridad/jwt");

const URL_BASE_API_SEGURIDAD = SEGURIDAD_CONFIG.URL_BASE_API_SEGURIDAD;

const requireLocation = async (req, res, next) => {
    const location_token = req.cookies.location_token || 'sin-valor';
    const location_refresh_token = req.cookies.location_refresh_token || 'sin-valor';
    let viewRequireLocation = false;

    const rutaSolicitada = req.path;

    switch (true) {
        case rutaSolicitada === "/seguridad/vista/require-location":
            viewRequireLocation = true;
            break;
        case rutaSolicitada === "/mod-3-atencion-cliente/pages/pedidos/menu.html":
            viewRequireLocation = true;
            break;
        case rutaSolicitada === "/mod-3-atencion-cliente/pages/pedidos/cart.html":
            viewRequireLocation = true;
            break;
        case rutaSolicitada === "/mod-3-atencion-cliente/pages/pedidos/support.html":
            viewRequireLocation = true;
            break;
        default:
            viewRequireLocation = false;
    }

    if (viewRequireLocation) {
        const body = JSON.stringify({ locationToken: location_token, locationRefreshToken: location_refresh_token });
        const response = await fetch(`${URL_BASE_API_SEGURIDAD}/api/seguridad/auth/verifyLocationToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json" 
            },
            body: body
        });
        
        const data = await response.json();
        if (data.is_inside && !data.locationToken && !data.locationRefreshToken) {
            return next();
        }
        else if (data.is_inside && data.locationToken && data.locationRefreshToken) {
            res.cookie("location_token", data.locationToken, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 10 * 60 * 1000, //  establece a 10 minutos
            });
            res.cookie("location_refresh_token", data.locationRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 30 * 60 * 1000, // establece a 30 minutos
            });
            return next();
        } else {
            return res.redirect(`/seguridad/ubicacion?redirect=${encodeURIComponent(req.originalUrl)}`);
        }

    }

    next();
};

module.exports = { requireLocation };