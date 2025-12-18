import Router from 'express'
import { createProject, deleteProject, editProject, getAllProject, getProjectById } from '../controllers/proyectos.controller.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createProjectSchema, editProjectSchema, projectIdSchema } from '../schemas/proyectos.schema.js';

const router = Router();

// Obtener todos los proyectos 
router.get('/proyectos', getAllProject);

// Obtener un proyecto por ID
router.get('/proyectos/:id', validateSchema(projectIdSchema, 'params'), getProjectById);

// Crear un proyecto
router.post('/proyectos', validateSchema(createProjectSchema), createProject);

// Editar un proyecto
router.patch('/proyectos/:id', validateSchema(projectIdSchema, 'params'), validateSchema(editProjectSchema, 'body'), editProject);

// Eliminar un proyecto 
router.delete('/proyectos/:id', validateSchema(projectIdSchema, 'params'), deleteProject);

export default router;