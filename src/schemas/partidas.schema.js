import { z } from 'zod';

// Esquema ID
export const partidasIdSchema = z.object({
    id: z.coerce.number({ invalid_type_error: "El ID debe ser un número" }).int().positive("ID no válido"),
});

// Esquema para crear partidas
export const createPartidaSchema = z.object({
    proyecto_id: z.number({ required_error: "El ID del proyecto es obligatorio" }).int(),

    responsable_id: z.number().int().nullable().optional(),

    nombre_partida: z.string().max(100).optional(),
    
    descripcion: z.string({ required_error: "La descripción es obligatoria" }).max(255),

    monto_total: z.number().nonnegative().optional().default(0),

    fecha_inicio: z.string().pipe(z.coerce.date()).optional(), 

    fecha_final_estimada: z.string().pipe(z.coerce.date()).optional()
    
}).refine((data) => {
    if (data.fecha_inicio && data.fecha_final_estimada) {
        return data.fecha_final_estimada >= data.fecha_inicio;
    }
    return true; 
}, {
    message: "La fecha final estimada no puede ser anterior a la fecha de inicio",
    path: ["fecha_final_estimada"]
});

// Esquema para editar partidas
export const editPartidaSchema = z.object({
    nombre_partida: z.string()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(100)
        .optional(),
    responsable_id: z.coerce.number()
        .min(1, { message: "Seleccione un responsable" })
        .optional(),
    monto_total: z.coerce.number()
        .min(1, { message: "El presupuesto debe ser mayor a 0" })
        .optional(),
    fecha_inicio: z.coerce.date({ 
        required_error: "La fecha es obligatoria",
        invalid_type_error: "Formato de fecha inválido" 
    }).optional(),
    fecha_final_estimada: z.coerce.date().optional(),
    descripcion: z.string()
        .min(2, { message: "La descripción debe tener al menos 2 caracteres" })
        .max(255)
        .optional()
});