const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//user schema
const packageSchema = new mongoose.Schema({
    packageName: {
        type: String,
        required: true
    },
    packagePrice: {
        type: String,
        required: true
    },
    packageMembers: {
        type: Number,
        required: true
    },
});

const Package = module.exports = mongoose.model('Package', packageSchema);





