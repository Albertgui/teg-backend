import { pool } from '../db.js';
import { sendPartidaNotification, sendProjectNotification } from '../services/telegram.js';

const PROJECT_ANALYTICS_QUERY = `SELECT *, (monto_total_operacion - presupuesto_usado) AS ganancia_actual, CASE WHEN monto_total_operacion > 0 THEN ROUND(((monto_total_operacion - presupuesto_usado) / monto_total_operacion) * 100, 2) ELSE 0 END AS porcentaje_margen FROM proyectos WHERE id = $1`;

export const getAllPartidas = async (req, res) => {
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`SELECT p.* FROM partidas p INNER JOIN proyectos pr ON p.proyecto_id = pr.id  WHERE pr.id_user = $1 ORDER BY p.created_at DESC`, [id_user]);
        return res.status(200).json({ 
            message: rows.length > 0 ? "Datos encontrados" : "No hay partidas registradas", 
            data: rows 
        });
    } catch (error) {
        console.error("Error en getAllPartidas:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getAllPartidasView = async (req, res) => {
    const { id } = req.params; 
    const id_user = req.usuario.id; 
    try {
        const query = `SELECT * FROM vista_partidas WHERE proyecto_id = $1 AND id_user = $2 ORDER BY estatus ASC, finaliza_en ASC`;
        const { rows } = await pool.query(query, [id, id_user]);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en la vista de partidas' });
    }
};

export const getPartidaByID = async (req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`SELECT * FROM partidas WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2)`, [id, id_user]);
        if (rows.length === 0) return res.status(404).json({ message: 'Partida no encontrada' });
        return res.status(200).json({ data: rows[0] });
    } catch (error) {
        return res.status(500).json({ message: 'Error interno' });
    }
};

export const createPartida = async (req, res) => {
    const { proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance, fecha_inicio, fecha_final_estimada } = req.body;
    const id_user = req.usuario.id;
    try {
        const projectCheck = await pool.query('SELECT nombre FROM proyectos WHERE id = $1 AND id_user = $2', [proyecto_id, id_user]);
        if (projectCheck.rows.length === 0) return res.status(403).json({ message: 'Proyecto no válido' });
        const nombreProyecto = projectCheck.rows[0].nombre;
        const { rows: partRows } = await pool.query(
            `INSERT INTO partidas (proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance, fecha_inicio, fecha_final_estimada) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, 
            [proyecto_id, responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance || 0, fecha_inicio, fecha_final_estimada]
        );
        const nuevaPartida = partRows[0];
        const { rows: projRows } = await pool.query(PROJECT_ANALYTICS_QUERY, [proyecto_id]);
        sendPartidaNotification(nombreProyecto, nuevaPartida, "CREACIÓN").catch(console.error);
        sendProjectNotification(projRows[0], "ACTUALIZACIÓN").catch(console.error);
        return res.status(201).json({ message: 'Partida creada', data: nuevaPartida });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al crear partida' });
    }
};

export const editPartida = async (req, res) => {
    const { id } = req.params;
    const { responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance, fecha_inicio, fecha_final_estimada, fecha_final_real } = req.body;
    const id_user = req.usuario.id;
    try {
        const updateQuery = `UPDATE partidas SET responsable_id = COALESCE($1, responsable_id), nombre_partida = COALESCE($2, nombre_partida), descripcion = COALESCE($3, descripcion), monto_total = COALESCE($4, monto_total), porcentaje_avance = COALESCE($5, porcentaje_avance), fecha_inicio = COALESCE($6, fecha_inicio), fecha_final_estimada = COALESCE($7, fecha_final_estimada), fecha_final_real = COALESCE($8, fecha_final_real), updated_at = CURRENT_TIMESTAMP WHERE id = $9 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $10) RETURNING *`;
        const { rows: partRows } = await pool.query(updateQuery, [responsable_id, nombre_partida, descripcion, monto_total, porcentaje_avance, fecha_inicio, fecha_final_estimada, fecha_final_real, id, id_user]);
        if (partRows.length === 0) return res.status(404).json({ message: 'No se pudo editar la partida' });
        const partidaEditada = partRows[0];
        const { rows: projRows } = await pool.query(PROJECT_ANALYTICS_QUERY, [partidaEditada.proyecto_id]);
        sendPartidaNotification(projRows[0].nombre, partidaEditada, "EDICIÓN").catch(console.error);;
        return res.status(200).json({ message: 'Partida actualizada', data: partidaEditada });
    } catch (error) {
        return res.status(500).json({ message: 'Error interno' });
    }
};

export const completePartida = async (req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows: partRows } = await pool.query(`UPDATE partidas SET fecha_final_real = CURRENT_DATE, porcentaje_avance = 100 WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2) RETURNING *`, [id, id_user]);
        if (partRows.length === 0) return res.status(404).json({ message: 'Partida no encontrada' });
        const partida = partRows[0];
        const { rows: projRows } = await pool.query(PROJECT_ANALYTICS_QUERY, [partida.proyecto_id]);
        sendPartidaNotification(projRows[0].nombre, partida, "FINALIZACIÓN").catch(console.error);
        return res.status(200).json({ message: 'Hito completado al 100%', data: partida });
    } catch (error) {
        return res.status(500).json({ message: 'Error al finalizar partida' });
    }
};

export const deletePartida = async (req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const partInfo = await pool.query('SELECT proyecto_id FROM partidas WHERE id = $1', [id]);
        if (partInfo.rows.length === 0) return res.status(404).json({ message: 'No existe la partida' });
        const p_id = partInfo.rows[0].proyecto_id;
        await pool.query(`DELETE FROM partidas WHERE id = $1 AND proyecto_id IN (SELECT id FROM proyectos WHERE id_user = $2) RETURNING *`, [id, id_user]);
        const { rows: projRows } = await pool.query(PROJECT_ANALYTICS_QUERY, [p_id]);
        if (projRows.length > 0) {
            sendProjectNotification(projRows[0]).catch(console.error);
        }
        return res.status(200).json({ message: 'Partida eliminada con éxito' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar' });
    }
};