import Router from 'express';
import { createResponsable, editResponsable, getAllResponsable, getResponsableByID } from '../controllers/responsable.controller.js';
import { createResponsableSchema, projectIdSchema } from '../schemas/responsables.schema.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { editProjectSchema } from '../schemas/proyectos.schema.js';

const router = Router();

// Obtener todos los responsables
router.get('/responsable', getAllResponsable);

// Obtener un responsable por ID
router.get('/responsable/:id', validateSchema(projectIdSchema, 'params'), getResponsableByID);

// Crear responsable 
router.post('/responsable', validateSchema(createResponsableSchema), createResponsable);

// Editar responsable
router.patch('/responsable/:id', validateSchema(editProjectSchema), editResponsable);

export default router;