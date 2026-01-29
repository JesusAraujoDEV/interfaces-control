const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");
const { verifyToken } = require("../../utils/seguridad/jwt");

const URL_BASE_API_SEGURIDAD = SEGURIDAD_CONFIG.URL_BASE_API_SEGURIDAD;

const requireLocation = async (req, res, next) => {
    let requireLocation = false;
    const respLocation = await fetch(`${URL_BASE_API_SEGURIDAD}/api/seguridad/restaurants`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!respLocation.ok) {
        return next();
    }
    if (respLocation.status === 404) {
        requireLocation = false;
    } else if (respLocation.status === 200) {
        const dataLocation = await respLocation.json();
        requireLocation = dataLocation.required || false;
    }

    if (!requireLocation) {
        return next();
    }
    const location_token = req.cookies.location_token || 'sin-valor';
    const location_refresh_token = req.cookies.location_refresh_token || 'sin-valor';
    let viewRequireLocation = false;

    // Si ruta path termina con / lo eliminamos
  const rutaSolicitada = req.path.replace(/\/$/, "");

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
        case rutaSolicitada === "/mod-3-atencion-cliente/pages/login/scan.html":
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
            // Si el usuario ya tiene sesión de ATC y la ruta original era scan con un redirect interno,
            // usamos el redirect interno para volver directamente a la vista de pedidos.
            const accessTokenAtc = req.cookies.access_token_atc || null;
            let redirectTarget = req.originalUrl;
            try {
                const rutaOriginal = req.path.replace(/\/$/, "");
                if (accessTokenAtc && rutaOriginal === "/mod-3-atencion-cliente/pages/login/scan.html") {
                    const urlObj = new URL(req.originalUrl, "http://localhost");
                    const nestedRedirect = urlObj.searchParams.get("redirect");
                    if (nestedRedirect) {
                        redirectTarget = nestedRedirect;
                    }
                }
            } catch (e) {
                // Ignorar errores de parsing y usar originalUrl por defecto
            }
            return res.redirect(`/seguridad/ubicacion?redirect=${encodeURIComponent(redirectTarget)}`);
        }

    }

    next();
};

module.exports = { requireLocation };