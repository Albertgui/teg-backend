import { ZodError } from 'zod';

export const validateSchema = (schema, target = 'body') => (req, res, next) => {
    try {
        const validatedData = schema.parse(req[target] || {});
        req[target] = validatedData;
        next();
    } catch (error) {
        console.log("== ERROR DE VALIDACIÓN DETECTADO ==");
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                errors: error.issues.map((issue) => ({
                    field: issue.path[issue.path.length - 1],
                    message: issue.message,
                })),
            });
        }
        console.error("Error no relacionado con Zod:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
};