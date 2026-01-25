import { z } from 'zod';

// Esquema ID
export const projectIdSchema = z.object({
    id: z.coerce.number({
        invalid_type_error: "El ID debe ser un número"
    }).int().positive("ID no válido"),
});

// Esquema crear proyecto
export const createProjectSchema = z.object({
    nombre: z.string({ required_error: "El nombre es obligatorio" })
        .trim()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(255),
    descripcion: z.string().trim().max(1000).optional().nullable(), 
    ubicacion: z.string().trim().max(255).optional().nullable(),
    presupuesto_planificado: z.coerce.number({
        invalid_type_error: "El presupuesto debe ser un número"
    }).nonnegative("El presupuesto no puede ser negativo"),
    margen_objetivo: z.coerce.number({
        invalid_type_error: "El margen debe ser un número"
    }).min(0, "El margen no puede ser negativo")
      .max(99, "El margen debe ser menor al 100%"), 
    fecha_inicio: z.coerce.date({
        invalid_type_error: "Formato de fecha de inicio inválido"
    }).optional(),
    fecha_final_estimada: z.coerce.date({
        invalid_type_error: "Formato de fecha estimada inválido"
    }).optional()
})
.refine((data) => {
    if (data.fecha_inicio && data.fecha_final_estimada) {
        return data.fecha_final_estimada >= data.fecha_inicio;
    }
    return true;
}, {
    message: "La fecha final estimada no puede ser anterior a la fecha de inicio",
    path: ["fecha_final_estimada"]
});

// Esquema Editar Proyecto
export const editProjectSchema = z.object({
    nombre: z.string().trim().min(3).max(255).optional(),
    descripcion: z.string().trim().max(1000).optional().nullable(),
    ubicacion: z.string().trim().max(255).optional().nullable(),
    monto_total_operacion: z.coerce.number().nonnegative().optional(),
    presupuesto_planificado: z.coerce.number().nonnegative().optional(),
    estado: z.enum(['ejecucion', 'paralizada', 'finalizada']).optional(),
    fecha_inicio: z.coerce.date().optional(),
    fecha_final_estimada: z.coerce.date().optional()
}).refine((data) => {
    if (data.fecha_inicio && data.fecha_final_estimada) {
        return data.fecha_final_estimada >= data.fecha_inicio;
    }
    return true;
}, {
    message: "La fecha final estimada no puede ser anterior a la fecha de inicio",
    path: ["fecha_final_estimada"]
});