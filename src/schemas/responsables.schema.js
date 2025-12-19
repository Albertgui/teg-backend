import { z } from 'zod';

// Esquema ID
export const responsableIdSchema = z.object({
    id: z.coerce.number({ invalid_type_error: "El ID debe ser un número" }).int().positive("ID no válido")
});

// Esquema para crear responsable
export const createResponsableSchema = z.object({
    nombre_completo: z.string({required_error: "El nombre es obligatorio"}).min(3, { message: "El nombre debe tener al menos 3 caracteres" }).max(255),

    cedula: z.coerce.number({ invalid_type_error: "La cédula debe ser un número", required_error: "La cédula es obligatoria" }).int({ message: "Debe ser un número entero" }).min(1, { message: "Cédula inválida" }).max(99999999, { message: "La cédula no puede exceder los 8 dígitos" }),

    especialidad: z.string().max(100).optional().nullable(),

    email: z.email({ message: "Formato de email inválido" }).max(100),

    telefono: z.string().max(50).optional().nullable(),
});

// Esquema para editar
export const editResponsableSchema = z.object({
    cedula: z.coerce.number().int().min(1).max(99999999).optional(),

    nombre_completo: z.string().min(3).max(255).optional(),

    especialidad: z.string().max(100).optional().nullable(),

    email: z.email({ message: "Email inválido" }).max(100).optional(),
    
    telefono: z.string().max(50).optional().nullable(),
});

// Esquema para asignar responsables
export const assignResponsableSchema = z.object({
    proyecto_id: z.coerce.number().int().positive({ message: "ID de proyecto inválido" }),

    responsable_id: z.coerce.number().int().positive({ message: "ID de responsable inválido" }),

    rol: z.string({ required_error: "El rol es obligatorio" }).min(3, { message: "El rol debe ser más descriptivo" }).max(100)
});