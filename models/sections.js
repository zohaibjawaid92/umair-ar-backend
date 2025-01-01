const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//user schema
const sectionSchema = new mongoose.Schema({
    sectionName: {
        type: String,
        required: true
    },
    isRequred: {
        type : Boolean,
        default : false
    },
});

const Section = module.exports = mongoose.model('Section', sectionSchema);