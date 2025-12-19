import Router from 'express';
import { createPartida, deletePartida, editPartida, getAllPartidas, getPartidaByID } from '../controllers/partidas.controller.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createPartidaSchema, editPartidaSchema, partidasIdSchema } from '../schemas/partidas.schema.js';

const router = Router();

// Obtener todas las partidas
router.get('/partidas', getAllPartidas);

// Obtener una partida por ID
router.get('/partidas/:id', validateSchema(partidasIdSchema, 'params'), getPartidaByID);

// Crear una partida
router.post('/partidas', validateSchema(createPartidaSchema), createPartida);

// Editar una partida
router.patch('/partidas/:id', validateSchema(partidasIdSchema, 'params'), validateSchema(editPartidaSchema, 'body'), editPartida);

// Eliminar una partida
router.delete('/partidas/:id', validateSchema(partidasIdSchema, 'params'), deletePartida);

export default router;