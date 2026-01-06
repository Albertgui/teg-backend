import Router from 'express';
import { completePartida, createPartida, deletePartida, editPartida, getAllPartidas, getAllPartidasView, getPartidaByID } from '../controllers/partidas.controller.js';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { createPartidaSchema, editPartidaSchema, partidasIdSchema } from '../schemas/partidas.schema.js';
import { validarToken } from '../middlewares/login.middleware.js';

const router = Router();

// Obtener todas las partidas
router.get('/partidas', validarToken, getAllPartidas);

// Obtener vista de las partidas
router.get('/partidas/view', validarToken, getAllPartidasView)

// Obtener una partida por ID
router.get('/partidas/:id', validarToken, validateSchema(partidasIdSchema, 'params'), getPartidaByID);

// Crear una partida
router.post('/partidas', validarToken, validateSchema(createPartidaSchema), createPartida);

// Editar una partida
router.patch('/partidas/:id', validarToken, validateSchema(partidasIdSchema, 'params'), validateSchema(editPartidaSchema, 'body'), editPartida);

// Completar una partida
router.patch('/partidas/complete/:id', validarToken, validateSchema(partidasIdSchema, 'params'), completePartida);

// Eliminar una partida
router.delete('/partidas/:id', validarToken, validateSchema(partidasIdSchema, 'params'), deletePartida);

export default router;