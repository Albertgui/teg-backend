import { pool } from "../db.js";

// Obtener todos los responsables del usuario logueado
export const getAllResponsable = async(req, res) => {
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('SELECT * FROM responsables WHERE id_user = $1 ORDER BY nombre_completo ASC', [id_user]);
        return res.status(200).json({ 
            message: rows.length > 0 ? 'Datos encontrados' : 'No tienes responsables registrados', 
            data: rows 
        });
    } catch (error) {
        console.error("Error al obtener responsables:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Obtener un responsable por ID
export const getResponsableByID = async(req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('SELECT * FROM responsables WHERE id = $1 AND id_user = $2', [id, id_user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Responsable no encontrado o no pertenece a tu cuenta' });
        }
        return res.status(200).json({ message: 'Éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al obtener responsable:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Crear responsable vinculado al usuario
export const createResponsable = async(req, res) => {
    const { cedula, nombre_completo, especialidad, email, telefono } = req.body;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('INSERT INTO responsables (cedula, nombre_completo, especialidad, email, telefono, id_user) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [cedula, nombre_completo, especialidad, email, telefono, id_user]);
        return res.status(201).json({ message: 'Responsable creado con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            const field = error.detail.includes('cedula') ? 'cédula' : 'email';
            return res.status(400).json({ message: `El valor de ${field} ya está registrado.` });
        }
        console.error("Error al crear responsable:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Editar responsable
export const editResponsable = async(req, res) => {
    const { id } = req.params;
    const { cedula, nombre_completo, especialidad, email, telefono } = req.body;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`UPDATE responsables SET cedula = COALESCE($1, cedula), nombre_completo = COALESCE($2, nombre_completo), especialidad = COALESCE($3, especialidad), email = COALESCE($4, email), telefono = COALESCE($5, telefono), updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND id_user = $7 RETURNING *`, [cedula, nombre_completo, especialidad, email, telefono, id, id_user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Responsable no encontrado' });
        }
        return res.status(200).json({ message: 'Actualizado con éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al editar responsable:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Eliminar responsable
export const deleteResponsable = async(req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('DELETE FROM responsables WHERE id = $1 AND id_user = $2 RETURNING *', [id, id_user]);
        if (rows.length === 0) {
            return res.status(403).json({ message: 'No tienes permisos o el registro no existe' });
        }
        return res.status(200).json({ message: 'Responsable eliminado con éxito' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ 
                message: 'No se puede eliminar: Este responsable tiene partidas o proyectos asignados actualmente.' 
            });
        }
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Obtener staff de un proyecto
export const getResponsableByProject = async(req, res) => {
    const { id } = req.params; 
    const id_user = req.usuario.id;
    try {
        const query = `SELECT DISTINCT r.* FROM responsables r INNER JOIN partidas p ON r.id = p.responsable_id INNER JOIN proyectos pr ON p.proyecto_id = pr.id WHERE pr.id = $1 AND pr.id_user = $2 ORDER BY r.nombre_completo ASC`;
        const { rows } = await pool.query(query, [id, id_user]);
        return res.status(200).json({ 
            message: rows.length > 0 ? 'Staff encontrado' : 'No hay personal asignado a las partidas de este proyecto', 
            data: rows 
        });
    } catch (error) {
        console.error('Error al obtener el staff del proyecto:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}