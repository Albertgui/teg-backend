import { z } from 'zod';

// 1. Esquema ID
export const responsableIdSchema = z.object({
    id: z.coerce.number({ invalid_type_error: "El ID debe ser un número" })
        .int()
        .positive("ID no válido")
});

// 2. Esquema para crear responsable
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
    .max(99999999, "La cédula no puede exceder los 8 dígitos (Formato V-XXXXXXXX)"),
    especialidad: z.string().trim().max(100).optional().nullable(),
    email: z.email({ message: "El email es obligatorio" })
        .trim()
        .toLowerCase() 
        .max(100),
    telefono: z.string().trim().max(50).optional().nullable(),
});

export const editResponsableSchema = createResponsableSchema.partial();