import { z } from 'zod';

// Esquema ID
export const responsableIdSchema = z.object({
    id: z.coerce.number({ invalid_type_error: "El ID debe ser un número" })
        .int()
        .positive("ID no válido")
});

// Esquema para crear responsable
export const createResponsableSchema = z.object({
    nombre_completo: z.string({ required_error: "El nombre es obligatorio" })
        .trim()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(255),
    cedula: z.coerce.number({ 
        invalid_type_error: "La cédula debe ser un número", 
        required_error: "La cédula es obligatoria" 
    })
    .int("Debe ser un número entero")
    .min(1, "Cédula inválida")
    .max(99999999, "La cédula no puede exceder los 8 dígitos"),
    especialidad: z.string().trim().max(100).optional().nullable(),
    email: z.email({ required_error: "El email es obligatorio" })
        .trim()
        .max(100),
    telefono: z.string().trim().max(50).optional().nullable(),
});

export const editResponsableSchema = createResponsableSchema.partial();

export const assignResponsableSchema = z.object({
    proyecto_id: z.coerce.number().int().positive("ID de proyecto inválido"),
    responsable_id: z.coerce.number().int().positive("ID de responsable inválido"),
    rol: z.string({ required_error: "El rol es obligatorio" })
        .trim()
        .min(3, "El rol debe ser más descriptivo")
        .max(100)
});