import { pool } from '../db.js';

// Obtener todas las partidas
export const getAllPartidas = async (req, res) => {
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`SELECT p.* FROM partidas p INNER JOIN proyectos pr ON p.proyecto_id = pr.id WHERE pr.id_user = $1 ORDER BY p.created_at DESC`, [id_user]);
        return res.status(200).json({ 
            message: rows.length > 0 ? "Datos encontrados" : "No hay partidas registradas", 
            data: rows 
        });
    } catch (error) {
        console.error("Error al obtener todas las partidas:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Obtener vista detallada de partidas por Proyecto
export const getAllPartidasView = async (req, res) => {
    const { id } = req.params; 
    const id_user = req.usuario.id; 
    try {
        const query = `
            SELECT v.* FROM vista_partidas v INNER JOIN proyectos pr ON v.proyecto_id = pr.id WHERE v.proyecto_id = $1 AND pr.id_user = $2 ORDER BY v.estatus ASC, v.finaliza_en ASC`;
        const { rows } = await pool.query(query, [id, id_user]);
        if (rows.length === 0) {
            return res.status(200).json({ 
                message: 'No hay partidas registradas o no tienes acceso a este proyecto', 
                data: [] 
            });
        }
        return res.status(200).json({ 
            message: 'Partidas obtenidas con éxito', 
            data: rows 
        });
    } catch (error) {
        console.error("Error en getAllPartidasView:", error);
        return res.status(500).json({ 
            message: 'Error interno del servidor al procesar la vista de partidas' 
        });
    }
}

// Obtener partida por ID único
export const getPartidaByID = async (req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`SELECT * FROM partidas WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2)`, [id, id_user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Partida no encontrada o no tienes permisos' });
        }
        return res.status(200).json({ message: 'Datos encontrados con éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al obtener la partida:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Crear una partida 
export const createPartida = async (req, res) => {
    const { proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance, fecha_inicio, fecha_final_estimada } = req.body;
    const id_user = req.usuario.id;

    try {
        const projectCheck = await pool.query('SELECT id FROM proyectos WHERE id = $1 AND id_user = $2', [proyecto_id, id_user]);
        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ message: 'El proyecto no existe o no tienes permisos' });
        }
        if (responsable_id) {
            const respCheck = await pool.query('SELECT id FROM responsables WHERE id = $1 AND id_user = $2', [responsable_id, id_user]);
            if (respCheck.rows.length === 0) {
                return res.status(403).json({ message: 'El responsable asignado no es válido para tu cuenta' });
            }
        }
        const { rows } = await pool.query(`INSERT INTO partidas (proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance, fecha_inicio, fecha_final_estimada) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance || 0, fecha_inicio, fecha_final_estimada]);
        return res.status(201).json({ message: 'Partida creada con éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al crear la partida:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Editar una partida
export const editPartida = async (req, res) => {
    const { id } = req.params;
    const { responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance, fecha_inicio, fecha_final_estimada, fecha_final_real } = req.body;
    const id_user = req.usuario.id;
    try {
        if (responsable_id) {
            const respCheck = await pool.query('SELECT id FROM responsables WHERE id = $1 AND id_user = $2', [responsable_id, id_user]);
            if (respCheck.rows.length === 0) {
                return res.status(403).json({ message: 'El responsable asignado no es válido' });
            }
        }
        const query = `UPDATE partidas SET responsable_id = COALESCE($1, responsable_id), nombre_partida = COALESCE($2, nombre_partida), descripcion = COALESCE($3, descripcion), monto_total = COALESCE($4, monto_total), porcentaje_avance = COALESCE($5, porcentaje_avance), fecha_inicio = COALESCE($6, fecha_inicio), fecha_final_estimada = COALESCE($7, fecha_final_estimada), fecha_final_real = COALESCE($8, fecha_final_real) WHERE id = $9 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $10) RETURNING *`;
        const { rows } = await pool.query(query, [responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance, fecha_inicio, fecha_final_estimada, fecha_final_real, id, id_user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se pudo editar: Partida no encontrada o sin permisos' });
        }
        return res.status(200).json({ message: 'Partida actualizada con éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al editar la partida:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Marcar partida como completada 
export const completePartida = async (req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`UPDATE partidas SET fecha_final_real = CURRENT_DATE, porcentaje_avance = 100 WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2) RETURNING *`, [id, id_user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró la partida' });
        }
        return res.status(200).json({ message: 'Partida finalizada al 100%', data: rows[0] });
    } catch (error) {
        console.error("Error al completar la partida:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Eliminar partida
export const deletePartida = async (req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`DELETE FROM partidas WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2) RETURNING *`, [id, id_user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró la partida a eliminar' });
        }
        return res.status(200).json({ message: 'Partida eliminada con éxito' });
    } catch (error) {
        console.error("Error al eliminar la partida:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}