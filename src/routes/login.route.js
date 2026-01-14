import Router from 'express';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { loginIdSchema, userSchema } from '../schemas/login.schema.js';
import { createUser, editUser, loginUser } from '../controllers/login.controller.js';
import { validarToken } from '../middlewares/login.middleware.js';

const router = Router();

// Login
router.post('/login', validateSchema(userSchema), loginUser);

// Crear un usuario
router.post('/register', validateSchema(userSchema), createUser);

// Editar un usuario
router.patch('/edit-user/:id', validarToken, validateSchema(loginIdSchema, 'params'), validateSchema(userSchema, 'body'), editUser);

export default router;