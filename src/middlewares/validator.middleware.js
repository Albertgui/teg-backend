// Validar si el body es válido y darle formato a los datos
export const validateSchema = (schema, target = 'body') => (req, res, next) => {
    try {
        const validatedData = schema.parse(req[target]);
        req[target] = validatedData;
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            errors: error.errors.map((err) => ({
                field: err.path[0],
                message: err.message,
            })),
        });
    }
};