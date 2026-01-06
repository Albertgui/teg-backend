import Router from 'express'
import { createProject, deleteProject, editProject, getAllProject, getProjectById } from '../controllers/proyectos.controller.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createProjectSchema, editProjectSchema, projectIdSchema } from '../schemas/proyectos.schema.js';
import { validarToken } from '../middlewares/login.middleware.js';

const router = Router();

// Obtener todos los proyectos 
router.get('/proyectos', validarToken, getAllProject);

// Obtener un proyecto por ID
router.get('/proyectos/:id', validarToken, validateSchema(projectIdSchema, 'params'), getProjectById);

// Crear un proyecto
router.post('/proyectos', validarToken, validateSchema(createProjectSchema), createProject);

// Editar un proyecto
router.patch('/proyectos/:id', validarToken, validateSchema(projectIdSchema, 'params'), validateSchema(editProjectSchema, 'body'), editProject);

// Eliminar un proyecto 
router.delete('/proyectos/:id', validarToken, validateSchema(projectIdSchema, 'params'), deleteProject);

export default router;