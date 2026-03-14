const Joi = require('joi');

const moveRequestSchema = Joi.object({
    fen: Joi.string()
        .pattern(/^[rnbqkbnrpPRNBQK\d\/]+ [wb] [KQkq-]+ [a-h36-]+ \d+ \d+$/i)
        .required()
        .messages({
            'string.pattern.base': 'Invalid FEN format',
            'any.required': 'FEN position is required'
        }),
    engine: Joi.string()
        .valid('stockfish', 'reckless', 'torch-2', 'plentychess', 'PlentyChess', 'gnuchess', 'fruit', 'toga2', 'phalanx', 'crafty', 'glaurung', 'critter', 'rubi')
        .default('stockfish')
        .messages({
            'any.only': 'Invalid engine. Available: stockfish, reckless, torch-2, plentychess, gnuchess, fruit, toga2, phalanx, crafty, glaurung, critter, rubi'
        }),
    level: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .default(1)
        .messages({
            'number.min': 'Level must be at least 1',
            'number.max': 'Level must be at most 20',
            'number.integer': 'Level must be an integer'
        })
});

const validateMoveRequest = (req, res, next) => {
    const { error, value } = moveRequestSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }

    req.body = value;
    next();
};

module.exports = { validateMoveRequest };
