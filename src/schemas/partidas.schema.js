import { z } from 'zod';

// Esquema ID 
export const partidasIdSchema = z.object({
    id: z.coerce.number().int().positive("ID no válido"),
});

// Base para evitar repetición
const basePartida = {
    nombre_partida: z.string().min(2, "El nombre es muy corto").max(100),
    descripcion: z.string().min(2, "La descripción es obligatoria").max(1000),
    responsable_id: z.coerce.number().int().positive().nullable().optional(),
    monto_total: z.coerce.number().nonnegative("El monto no puede ser negativo").optional().default(0),
    porcentaje_avance: z.coerce
        .number()
        .min(0, "El avance mínimo es 0")
        .max(100, "El avance máximo es 100")
        .optional()
        .default(0),
    fecha_inicio: z.coerce.date().optional(),
    fecha_final_estimada: z.coerce.date().optional(),
};

// Esquema para crear
export const createPartidaSchema = z.object({
    ...basePartida,
    proyecto_id: z.number({ required_error: "El ID del proyecto es obligatorio" }).int(),
}).refine((data) => {
    if (data.fecha_inicio && data.fecha_final_estimada) {
        return data.fecha_final_estimada >= data.fecha_inicio;
    }
    return true;
}, {
    message: "La fecha final estimada no puede ser anterior a la fecha de inicio",
    path: ["fecha_final_estimada"]
});

// Esquema para editar
export const editPartidaSchema = z.object({
    nombre_partida: z.string().min(2).max(100).optional(),
    responsable_id: z.coerce.number().int().positive().nullable().optional(),
    monto_total: z.coerce.number().nonnegative().optional(),
    porcentaje_avance: z.coerce.number().min(0).max(100).optional(),
    descripcion: z.string().min(2).max(1000).optional(),
    fecha_inicio: z.coerce.date().optional(),
    fecha_final_estimada: z.coerce.date().optional(),
    fecha_final_real: z.coerce.date().nullable().optional()
}).refine((data) => {
    if (data.fecha_inicio && data.fecha_final_estimada) {
        return data.fecha_final_estimada >= data.fecha_inicio;
    }
    return true;
}, {
    message: "La fecha final estimada no puede ser anterior a la fecha de inicio",
    path: ["fecha_final_estimada"]
});