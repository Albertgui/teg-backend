import { pool } from '../db.js';

// Obtener todos los proyectos
export const getAllProject = async(req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM proyectos ORDER BY created_at DESC');
        if (rows.length === 0) {
            return res.status(404).json({message: 'No hay registros'});
        }
        return res.status(200).json({ message: "Datos encontrados en éxito", data: rows});
    } catch (error) {
        console.error("Error al obtener todos los proyectos:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Obtener un proyecto
export const getProjectById = async(req, res) => {
    const params = req.params;
    const { id } = params;
    try {
        const { rows } = await pool.query('SELECT * FROM proyectos WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({message: 'No hay registros asociados a ese proyecto'});
        }
        return res.status(200).json({ message: "Datos encontrados en éxito", data: rows[0]});
    } catch (error) {
        console.error("Error al obtener el proyecto:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Crear un proyecto
export const createProject = async(req, res) => {
    const body = req.body;
    const { nombre, descripcion, ubicacion, presupuesto, fecha_inicio, fecha_final_estimada } = body;
    try {
        const { rows } = await pool.query('INSERT INTO proyectos (nombre, descripcion, ubicacion, presupuesto, fecha_inicio, fecha_final_estimada) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [ nombre, descripcion, ubicacion, presupuesto, fecha_inicio, fecha_final_estimada ]);
        if (rows.length === 0) {
            return res.status(404).json({message: 'No fue posible crear el proyecto'});
        }
        return res.status(200).json({ message: "Proyecto creado con éxito", data: rows[0]});
    } catch (error) {
        console.error("Error al crear el proyecto:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Editar un proyecto
export const editProject = async(req, res) => {
    const params = req.params;
    const body = req.body;
    const { nombre, descripcion, ubicacion, presupuesto, estado, fecha_inicio, fecha_final_estimada } = body;
    const { id } = params
    try {
        const { rows } = await pool.query('UPDATE proyectos SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), ubicacion = COALESCE($3, ubicacion), presupuesto = COALESCE($4, presupuesto), estado = COALESCE($5, estado), fecha_inicio = COALESCE($6, fecha_inicio), fecha_final_estimada = COALESCE($7, fecha_final_estimada) WHERE id = $8 RETURNING *', [ nombre, descripcion, ubicacion, presupuesto, estado, fecha_inicio, fecha_final_estimada, id ]);
        if (rows.length === 0) {
            return res.status(404).json({message: 'No fue posible editar el proyecto'});
        }
        return res.status(200).json({ message: "Proyecto editado con éxito", data: rows[0]});
    } catch (error) {
        console.error("Error al editar el proyecto:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}

// Eliminar un proyecto 
export const deleteProject = async(req, res) => {
    const params = req.params;
    const { id } = params;
    try {
        const { rows } = await pool.query('DELETE FROM proyectos WHERE id = $1 RETURNING *', [ id ]);
        if (rows.length === 0) {
            return res.status(404).json({message: 'El proyecto no se pudo eliminar'});
        }
        return res.status(200).json({ message: "Proyecto eliminado con éxito", data: rows[0]});
    } catch (error) {
        console.error("Error al editar el proyecto:", error);
        return res.status(500).json({message: 'Error interno del servidor'});
    }
}