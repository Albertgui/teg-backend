import { pool } from "../db.js";

// Obtener todos los responsables
export const getAllResponsable = async(req, res) => {
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('SELECT * FROM responsables WHERE id_user = $1 ORDER BY created_at DESC', [ id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No hay responsables registrados' });
        }
        return res.status(200).json({ message: 'Datos encontrados con éxito', data: rows });
    } catch (error) {
        console.error("Error al obtener todos los responsables:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Obtener un responsable por su ID
export const getResponsableByID = async(req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('SELECT * FROM responsables id = $1 AND id_user = $2', [ id, id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No hay responsables registrados con ese id' });
        }
        return res.status(200).json({ message: 'Datos encontrados con éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al obtener responsable:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Crear responsable
export const createResponsable = async(req, res) => {
    const { cedula, nombre_completo, especialidad, email, telefono } = req.body;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('INSERT INTO responsables (cedula, nombre_completo, especialidad, email, telefono, id_user) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [ cedula, nombre_completo, especialidad, email, telefono, id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No fue posible crear responsable' });
        }
        return res.status(201).json({ message: 'Responsable creado con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            const field = error.detail.includes('cedula') ? 'cédula' : 'email';
            return res.status(400).json({ message: `Error en dato duplicado: ${field}` });
        }
        if (error.code === '23514') {
            return res.status(400).json({ 
                message: 'La cédula debe ser un número válido entre 1 y 99.999.999' 
            });
        }
        console.error("Error al crear responsable:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Editar responsable
export const editResponsable = async(req, res) => {
    const { id } = req.params;
    const { cedula, nombre_completo, especialidad, email, telefono } = req.body;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('UPDATE responsables SET cedula = COALESCE($1, cedula), nombre_completo = COALESCE($2, nombre_completo), especialidad = COALESCE($3, especialidad), email = COALESCE($4, email), telefono = COALESCE($5, telefono) WHERE id = $6 AND id_user = $7 RETURNING *', [ cedula, nombre_completo, especialidad, email, telefono, id, id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No existe el responsable para editar' });
        }
        return res.status(200).json({ message: 'Responsable editado con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            const field = error.detail.includes('cedula') ? 'cédula' : 'email';
            return res.status(400).json({
                success: false,
                message: `El valor ${field} ya está registrado en otro responsable.`
            });
        }
        console.error("Error al editar responsable:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Eliminar responsable
export const deleteResponsable = async(req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('DELETE FROM responsables WHERE id = $1 AND id_user = $2 RETURNING *', [ id, id_user ]);
        if (rows.length === 0) {
            return res.status(403).json({ message: 'No tienes permisos o el responsable no existe' });
        }
        return res.status(200).json({ message: 'Responsable eliminado con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ 
                message: 'No se puede eliminar: el responsable tiene registros vinculados.' 
            });
        }
        console.error("Error al eliminar responsable:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Asingnar un responsable a un proyecto
export const assignRespToProject = async (req, res) => {
    const { proyecto_id, responsable_id, rol } = req.body;
    const id_user = req.usuario.id;
    try {
        const checkOwnership = await pool.query(
            'SELECT id FROM proyectos WHERE id = $1 AND id_user = $2', 
            [proyecto_id, id_user]
        );
        if (checkOwnership.rows.length === 0) {
            return res.status(403).json({ message: 'No puedes asignar personal a un proyecto que no te pertenece' });
        }
        const { rows } = await pool.query(
            'INSERT INTO proyecto_responsables (proyecto_id, responsable_id, rol) VALUES ($1, $2, $3) RETURNING *', 
            [proyecto_id, responsable_id, rol]
        );
        return res.status(200).json({ message: 'Asignado con éxito', data: rows[0] });
    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Obtener todos los responsables de un proyecto
export const getResponsableByProject = async(req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM vista_proyecto_staff WHERE proyecto_id = $1 ORDER BY nombre_completo ASC', [ id ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró personal para este proyecto' });
        }
        return res.status(200).json({ message: 'Responsables encontrados con éxito', data: rows });
    } catch (error) {
        console.error('Error al obtener el staff del proyecto:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}