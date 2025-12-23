import { pool } from "../db.js";

// Obtener todos los responsables
export const getAllResponsable = async(req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM responsables ORDER BY created_at DESC');
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
    const params = req.params;
    const { id } = params
    try {
        const { rows } = await pool.query('SELECT * FROM responsables WHERE id = $1', [ id ]);
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
    const body = req.body;
    const { cedula, nombre_completo, especialidad, email, telefono } = body;
    try {
        const { rows } = await pool.query('INSERT INTO responsables (cedula, nombre_completo, especialidad, email, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING *', [ cedula, nombre_completo, especialidad, email, telefono ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No fue posible crear responsable' });
        }
        return res.status(200).json({ message: 'Responsable creado con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            const field = error.detail.includes('cedula') ? 'cédula' : 'email';
            return res.status(400).json({ message: `Error en dato duplicado: ${field}` });
        }
        console.error("Error al crear responsable:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Editar responsable
export const editResponsable = async(req, res) => {
    const params = req.params;
    const body = req.body;
    const { id } = params;
    const { cedula, nombre_completo, especialidad, email, telefono } = body;
    try {
        const { rows } = await pool.query('UPDATE responsables SET cedula = COALESCE($1, cedula), nombre_completo = COALESCE($2, nombre_completo), especialidad = COALESCE($3, especialidad), email = COALESCE($4, email), telefono = COALESCE($5, telefono) WHERE id = $6 RETURNING *', [ cedula, nombre_completo, especialidad, email, telefono, id ]);
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
    const params = req.params;
    const { id } = params;
    try {
        const { rows } = await pool.query('DELETE FROM responsable WHERE id = $1 RETURNING *', [ id ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No existe el responsable para eliminar' });
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
    const body = req.body;
    const { proyecto_id, responsable_id, rol } = body;
    try {
        const { rows } = await pool.query('INSERT INTO proyecto_responsables (proyecto_id, responsable_id, rol) VALUES ($1, $2, $3) RETURNING *', [ proyecto_id, responsable_id, rol ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No es posible asignar este responsable al proyecto' });
        }
        return res.status(200).json({ message: 'Responsable asignado al proyecto con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({
                message: 'Esta persona ya forma parte del equipo de este proyecto'
            });
        }
        if (error.code === '23503') {
            return res.status(404).json({
                message: 'No es posible encontrar al responsable o al proyecto'
            });
        }
        console.error("Error al asignar responsable:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Obtener todos los responsables de un proyecto
export const getResponsableByProject = async(req, res) => {
    const params = req.params;
    const { id } = params;
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