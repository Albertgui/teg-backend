import Router from 'express';
import { assignRespToProject, createResponsable, deleteResponsable, editResponsable, getAllResponsable, getResponsableByID, getResponsableByProject } from '../controllers/responsable.controller.js';
import { assignResponsableSchema, createResponsableSchema, responsableIdSchema } from '../schemas/responsables.schema.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { editProjectSchema } from '../schemas/proyectos.schema.js';

const router = Router();

// Obtener todos los responsables
router.get('/responsable', getAllResponsable);

// Obtener un responsable por ID
router.get('/responsable/:id', validateSchema(responsableIdSchema, 'params'), getResponsableByID);

// Obtener todos los responsables de un proyecto
router.get('/responsable/proyecto/:id', validateSchema(responsableIdSchema, 'params'), getResponsableByProject);

// Crear responsable 
router.post('/responsable', validateSchema(createResponsableSchema), createResponsable);

// Asignar responsable a un proyecto
router.post('/responsable/asignar-proyecto', validateSchema(assignResponsableSchema, 'body'), assignRespToProject);

// Editar responsable
router.patch('/responsable/:id', validateSchema(responsableIdSchema, 'params'), validateSchema(editProjectSchema, 'body'), editResponsable);

// Eliminar responsable
router.delete('/responsable/:id', validateSchema(responsableIdSchema, 'params'), deleteResponsable);

export default router;