const { Router } = require('express');
require('dotenv').config();

const BASE_URL = process.env.ATC_URL;

function authClienteRouter() {
    const router = Router();
    const url = '/api/v1/atencion-cliente';

    router.post('/login', async (req, res) => {
        try {
            // 1. Recibimos los datos que vienen de scan.html
            const { table_id, customer_name, customer_dni } = req.body;

            // 2. Hacemos la petición a RENDER (Server to Server)
            const response = await fetch(`${BASE_URL}${url}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table_id, customer_name, customer_dni })
            });

            const data = await response.json();

            if (response.ok) {
                // 3. Si Render dice OK, tomamos el token y creamos la cookie
                const token = data.session_token; // Ojo: confirma si tu back devuelve 'session_token' o 'access_token'

                res.cookie("access_token_atc", token, {
                    httpOnly: true, // JavaScript no la puede leer (Seguridad)
                    secure: true, // Solo HTTPS en producción
                    sameSite: "Strict",
                    maxAge: 24 * 60 * 60 * 1000, // 1 día
                });

                // 4. Respondemos al Frontend (SIN devolver el token visible)
                res.json({
                    success: true,
                    client: data.client, // Devolvemos info del usuario si hace falta
                    session_token: data.session_token,
                    message: "Cliente registrado correctamente"
                });

            } else {
                // Si Render dio error (ej: mesa ocupada)
                res.status(response.status).json({
                    success: false,
                    message: data.detail || data.message || "Error al ingresar"
                });
            }

        } catch (error) {
            console.error("Error en proxy login cliente:", error);
            res.status(500).json({ success: false, message: "Error interno del servidor Vercel" });
        }
    });

    router.post('/logout', (req, res) => {
        res.clearCookie('access_token_atc');
        res.json({ success: true, message: "Sesión cerrada" });
    });

    return router;
}

module.exports = authClienteRouter;