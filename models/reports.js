const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//user schema
const packageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    templateId : { type: mongoose.Schema.Types.ObjectId, ref: 'Questionnaire'},
    surveyId : { type: mongoose.Schema.Types.ObjectId, ref: 'MemberSaveAnswers'},
    globalAdminId : { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    survey_document_name : {type : String},
    pdfUrl : {type : String},
    startDate: { type: Date },
    endDate: { type: Date },
});

const Reports = module.exports = mongoose.model('Reports', packageSchema);





