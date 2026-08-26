/**
 * Zod request validation middleware
 * Validates req.body, req.query, or req.params against a Zod schema
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // assign sanitized data
      next();
    } catch (err) {
      if (err.errors) {
        const errorMessages = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed for request parameters.',
          errors: errorMessages,
        });
      }
      next(err);
    }
  };
};
