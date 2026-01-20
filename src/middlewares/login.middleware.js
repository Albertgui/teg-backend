import { SECRET_KEY } from '../config.js';
import jwt from 'jsonwebtoken';

export const validarToken = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            ok: false,
            message: 'Acceso denegado. No se proporcionó un token.'
        });
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuario = decoded;
        next();
    } catch (error) {
        console.error('Error al validar token:', error.message);
        return res.status(403).json({
            ok: false,
            message: 'Token inválido o expirado.'
        });
    }
};
