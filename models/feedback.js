const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//user schema
const packageSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
});

const ContactUs = module.exports = mongoose.model('ContactUs', packageSchema);





