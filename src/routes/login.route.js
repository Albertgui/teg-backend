import Router from 'express';
import { validateSchema } from '../middlewares/validator.middleware.js';
import { loginIdSchema, loginUserSchema, userSchema } from '../schemas/login.schema.js';
import { createUser, editUser, loginUser } from '../controllers/login.controller.js';

const router = Router();

// Login
router.post('/login', validateSchema(loginIdSchema, 'params'), validateSchema(loginUserSchema), loginUser);

// Crear un usuario
router.post('/register', validateSchema(userSchema), createUser);

// Editar un usuario
router.patch('/edit-user', validateSchema(loginIdSchema, 'params'), validateSchema(userSchema, 'body'), editUser);

export default router;