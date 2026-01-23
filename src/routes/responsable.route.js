import Router from 'express';
import { createResponsable, deleteResponsable, editResponsable, getAllResponsable, getResponsableByID, getResponsableByProject } from '../controllers/responsable.controller.js';
import { createResponsableSchema, editResponsableSchema, responsableIdSchema } from '../schemas/responsables.schema.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { validarToken } from '../middlewares/login.middleware.js';
import { projectIdSchema } from '../schemas/proyectos.schema.js';

const router = Router();

// Obtener todos los responsables
router.get('/responsable', validarToken, getAllResponsable);

// Obtener un responsable por ID
router.get('/responsable/:id', validarToken, validateSchema(responsableIdSchema, 'params'), getResponsableByID);

// Obtener todos los responsables de un proyecto específico
router.get('/responsable/proyecto/:id', validarToken, validateSchema(projectIdSchema, 'params'), getResponsableByProject);

// Crear responsable 
router.post('/responsable', validarToken, validateSchema(createResponsableSchema), createResponsable);

// Editar responsable
router.patch('/responsable/:id', validarToken, validateSchema(responsableIdSchema, 'params'), validateSchema(editResponsableSchema, 'body'), editResponsable);

// Eliminar responsable
router.delete('/responsable/:id', validarToken, validateSchema(responsableIdSchema, 'params'), deleteResponsable);

export default router;