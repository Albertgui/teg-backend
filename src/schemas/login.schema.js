import { z } from 'zod';

// Esquema ID
export const loginIdSchema = z.object({
    id: z.coerce.number({ invalid_type_error: "El ID debe ser un número" }).int().positive("ID no válido"),
});

// Esquema para crear o editar usuario
export const userSchema = z.object({
    username: z.string({ required_error: "El usuario es obligatorio"} ).min(3, { message: "El usuario debe tener al menos 3 caracteres" }).max(50, { message: "El usuario debe máximo 50 caracteres" }),
    pass: z.string({ required_error: "La contraseña es obligatoria"} ).min(3, { message: "La contraseña debe tener al menos 6 caracteres" }).max(50, { message: "La contraseña debe máximo 100 caracteres" })
});