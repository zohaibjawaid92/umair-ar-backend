const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//user schema
const questionnaireSchema = new mongoose.Schema({
    templateName: {
        type: String,
        required: true
    },
    questions: [
        {
            questionName: {
                type: String,
                required: true
            },
            sectionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Section',
                required: true
            },
            questionType: {
                type: String,
                required: true
            },
            questionAccessability: {
                type: Boolean
            },
            answers: {
                type: [String],
                required: true
            }
        }
    ]
});

const Questionnaire = module.exports = mongoose.model('Questionnaire', questionnaireSchema);





