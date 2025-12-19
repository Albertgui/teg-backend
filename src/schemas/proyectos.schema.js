import { z } from 'zod';

// Esquema ID
export const projectIdSchema = z.object({
    id: z.coerce.number({invalid_type_error: "El ID debe ser un número"}).int().positive("ID no válido"),
});

// Esquema crear
export const createProjectSchema = z.object({
    nombre: z.string({required_error: "El nombre es obligatorio"}).min(3, "El nombre debe tener al menos 3 caracteres").max(255),

    descripcion: z.string().max(255).optional().nullable(),

    ubicacion: z.string().max(255).optional().nullable(),

    presupuesto: z.coerce.number({invalid_type_error: "El presupuesto debe ser un número"}).positive("El presupuesto debe ser mayor a 0"),

    fecha_inicio: z.coerce.date({invalid_type_error: "Fecha de inicio inválida"}).optional(),

    fecha_final_estimada: z.coerce.date({invalid_type_error: "Fecha estimada inválida"}).optional()
});

// Esquema editar
export const editProjectSchema = z.object({
    nombre: z.string().min(3).max(255).optional(),

    descripcion: z.string().max(255).optional().nullable(),

    ubicacion: z.string().max(255).optional().nullable(),

    presupuesto: z.coerce.number().positive("El presupuesto debe ser mayor a 0").optional(),

    estado: z.enum(['ejecucion', 'paralizada', 'finalizada']).optional(),

    fecha_inicio: z.coerce.date().optional(),

    fecha_final_estimada: z.coerce.date().optional()
});

