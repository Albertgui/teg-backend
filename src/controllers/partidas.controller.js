import { pool } from '../db.js';

// Obtener todas las partidas
export const getAllPartidas = async(req, res) => {
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('SELECT p.* FROM partidas p INNER JOIN proyectos pr ON p.proyecto_id = pr.id WHERE pr.id_user = $1 ORDER BY p.created_at', [ id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No hay partidas registradas' });
        }
        return res.status(200).json({ message: rows.length > 0 ? "Datos encontrados" : "No hay partidas", data: rows });
    } catch (error) {
        console.error("Error al obtener todas las partidas:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Obtener vista de las partidas
export const getAllPartidasView = async(req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('SELECT v.* FROM vista_partidas v INNER JOIN proyectos pr ON v.proyecto_id = pr.id WHERE proyecto_id = $1 AND pr.id_user = $2 ORDER BY v.estatus ASC, v.asignado_el DESC', [ id, id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No hay partidas registradas' });
        }
        return res.status(200).json({ message: 'Datos encontrados con éxito', data: rows });
    } catch (error) {
        console.error("Error al obtener todas las partidas:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Obtener partida por ID
export const getPartidaByID = async(req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try { 
        const { rows } = await pool.query('SELECT * FROM partidas WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2)', [ id, id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No existe esa partida registrada' });
        }
        return res.status(200).json({ message: 'Datos encontrados con éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al obtener la partida:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Crear una partida
export const createPartida = async(req, res) => {
    const { proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, fecha_inicio, fecha_final_estimada } = req.body;
    const id_user = req.usuario.id;
    try {
        const projectCheck = await pool.query('SELECT id FROM proyectos WHERE id = $1 AND id_user = $2', [proyecto_id, id_user]);
        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ message: 'No tienes permiso para añadir partidas a este proyecto' });
        }
        const { rows } = await pool.query('INSERT INTO partidas (proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, fecha_inicio, fecha_final_estimada) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [ proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, fecha_inicio, fecha_final_estimada ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No es posible crear la partida' });
        }
        return res.status(201).json({ message: 'Partida creada con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'Error de asignación: El responsable no pertenece a este proyecto o no existe'
            });
        }
        console.error("Error al crear la partida:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Editar una partida
export const editPartida = async(req, res) => {
    const { id } = req.params;
    const { proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, fecha_inicio, fecha_final_estimada } = req.body;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('UPDATE partidas SET proyecto_id = COALESCE($1, proyecto_id), responsable_id = COALESCE($2, responsable_id), nombre_partida = COALESCE($3, nombre_partida), descripcion = COALESCE($4, descripcion), monto_total = COALESCE($5, monto_total), fecha_inicio = COALESCE($6, fecha_inicio), fecha_final_estimada = COALESCE($7, fecha_final_estimada) WHERE id = $8 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $9) RETURNING *', [ proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, fecha_inicio, fecha_final_estimada, id, id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No es posible editar la partida' });
        }
        return res.status(200).json({ message: 'Partida editada con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'Error de integridad: El proyecto o responsable no son válidos.'
            });
        }
        console.error("Error al editar la partida:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Completar una partida
export const completePartida = async(req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('UPDATE partidas SET fecha_final_real = CURRENT_DATE WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2) RETURNING *', [ id, id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No es posible editar la partida' });
        }
        return res.status(200).json({ message: 'Partida editada con éxito', data: rows[0] });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'Error de integridad: El proyecto o responsable no son válidos.'
            });
        }
        console.error("Error al editar la partida:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Eliminar partida
export const deletePartida = async(req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query('DELETE FROM partidas WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2) RETURNING *', [ id, id_user ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró la partida a eliminar' });
        }
        return res.status(200).json({ message: 'Partida eliminada con éxito', data: rows[0] })
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar: Esta partida ya tiene otros registros asociados.'
            });
        }
        console.error("Error al eliminar la partida:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}
