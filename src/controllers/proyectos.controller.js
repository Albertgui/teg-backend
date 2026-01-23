import { pool } from '../db.js';

// Query base reutilizable para incluir cálculos de rentabilidad
const PROJECT_QUERY_BASE = `
    SELECT *, 
    (monto_total_operacion - presupuesto_usado) AS ganancia_actual, 
    CASE 
        WHEN monto_total_operacion > 0 
        THEN ROUND(((monto_total_operacion - presupuesto_usado) / monto_total_operacion) * 100, 2) 
        ELSE 0 
    END AS porcentaje_margen 
    FROM proyectos
`;

// Obtener todos los proyectos
export const getAllProject = async (req, res) => {
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`${PROJECT_QUERY_BASE} WHERE id_user = $1 ORDER BY created_at DESC`, [id_user]);
        return res.status(200).json({ 
            message: rows.length > 0 ? "Datos encontrados" : "No hay proyectos registrados", 
            data: rows 
        });
    } catch (error) {
        console.error("Error al obtener todos los proyectos:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Obtener un proyecto por ID
export const getProjectById = async (req, res) => {
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const { rows } = await pool.query(`${PROJECT_QUERY_BASE} WHERE id = $1 AND id_user = $2`, [id, id_user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        return res.status(200).json({ message: "Éxito", data: rows[0] });
    } catch (error) {
        console.error("Error al obtener el proyecto:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Crear un proyecto
export const createProject = async (req, res) => {
    const { nombre, descripcion, ubicacion, monto_total_operacion, presupuesto_planificado, fecha_inicio, fecha_final_estimada } = req.body;
    const id_user = req.usuario.id;
    try {
        const insertQuery = `INSERT INTO proyectos (id_user, nombre, descripcion, ubicacion, monto_total_operacion, presupuesto_planificado, fecha_inicio, fecha_final_estimada) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
        const result = await pool.query(insertQuery, [id_user, nombre, descripcion, ubicacion, monto_total_operacion, presupuesto_planificado, fecha_inicio, fecha_final_estimada]);
        const { rows } = await pool.query(`${PROJECT_QUERY_BASE} WHERE id = $1`, [result.rows[0].id]);
        return res.status(201).json({ message: "Proyecto creado con éxito", data: rows[0] });
    } catch (error) {
        console.error("Error al crear el proyecto:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Editar un proyecto
export const editProject = async (req, res) => {
    const { nombre, descripcion, ubicacion, monto_total_operacion, presupuesto_planificado, estado, fecha_inicio, fecha_final_estimada } = req.body;
    const { id } = req.params;
    const id_user = req.usuario.id;
    try {
        const updateQuery = `UPDATE proyectos SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), ubicacion = COALESCE($3, ubicacion), monto_total_operacion = COALESCE($4, monto_total_operacion), presupuesto_planificado = COALESCE($5, presupuesto_planificado), estado = COALESCE($6, estado), fecha_inicio = COALESCE($7, fecha_inicio), fecha_final_estimada = COALESCE($8, fecha_final_estimada), updated_at = CURRENT_TIMESTAMP WHERE id = $9 AND id_user = $10 RETURNING id`;
        const result = await pool.query(updateQuery, [nombre, descripcion, ubicacion, monto_total_operacion, presupuesto_planificado, estado, fecha_inicio, fecha_final_estimada, id, id_user]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No se pudo editar el proyecto o no tienes permisos' });
        }
        const { rows } = await pool.query(`${PROJECT_QUERY_BASE} WHERE id = $1`, [id]);
        return res.status(200).json({ message: "Proyecto editado con éxito", data: rows[0] });
    } catch (error) {
        console.error("Error al editar el proyecto:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

// Eliminar un proyecto
export const deleteProject = async (req, res) => {
    const id_user = req.usuario.id;
    const { id } = req.params;
    try {
        const { rows } = await pool.query('DELETE FROM proyectos WHERE id = $1 AND id_user = $2 RETURNING *', [id, id_user]);
        if (rows.length === 0) {
            return res.status(403).json({ message: 'No tienes permisos o el proyecto no existe' });
        }
        return res.status(200).json({ message: "Proyecto eliminado con éxito" });
    } catch (error) {
        console.error("Error al eliminar el proyecto:", error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}