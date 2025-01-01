const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//user schema
const packageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    templateId : { type: mongoose.Schema.Types.ObjectId, ref: 'Questionnaire'},
    isDraft : {type : Boolean},
    address  : {type : String},
    eir_code : {type : String},
    startDate : {type : Date},
    endDate : {type : Date},
    survey_document_name : {type : String},
    developer_name : {type : String},
    client_name : {type : String},
    location: {
        type: [Number], // Array of Numbers representing [longitude, latitude]
        default: [0, 0], // Default value [0, 0] if not provided
        validate: {
            validator: function (v) {
                return Array.isArray(v) && v.length === 2;
            },
            message: 'Location array must have exactly two elements: [longitude, latitude]',
        },
    },
    records: [
        {
            questionName : {
                type: String,
                required: true
            },
            extraDescription : {
                type: String
            },
            imageUpload : {
                type: String
            },
            mainImages : [{type : String}],
            questionAccessability : {
                type : Boolean,
                default : false
            },
            checkIfAnswerUpdated : {
                type : Boolean
            },
            location: {
                type: [Number], // Array of Numbers representing [longitude, latitude]
                default: [0, 0], // Default value [0, 0] if not provided
                validate: {
                    validator: function (v) {
                        return Array.isArray(v) && v.length === 2;
                    },
                    message: 'Location array must have exactly two elements: [longitude, latitude]',
                },
            },
            maintainanceScore : {
                type : Number
            },
            answers: [
                {
                type: String,
                required: true
                }
            ]
        }
    ],
});

const MemberSaveAnswers = module.exports = mongoose.model('MemberSaveAnswers', packageSchema);





