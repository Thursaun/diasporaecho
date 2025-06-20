const { celebrate, Joi } = require('celebrate');
const validator = require('validator');

function validateURL(value, helpers) {
    if (!validator.isURL(value)) {
        return helpers.message('Invalid URL format');
    }
    return value;
}

const validateSignUp = celebrate({
    body: Joi.object().keys({
        name: Joi.string().min(2).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    }),
});

const validateSignin = celebrate({
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    }),
});

module.exports = {
    validateSignUp,
    validateSignin,
    validateURL,
};