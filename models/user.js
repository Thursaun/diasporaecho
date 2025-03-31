const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        validate: {
            validator(value) {
              return validator.isEmail(value);
            },
            message: "You must enter a valid email address",
        },
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        select: false,
        minlength: 6,
    },
    role: {
        type: String,
        required: [true, 'Please add an email'],
        enum: ['user', 'admin'],
        default: 'user',
    },
})

module.exports = mongoose.model('User', UserSchema);
