const express = require('express');
const router = express.Router();
const Questionnaire = require('../models/template');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
//register

const saltRounds = 10;

cloudinary.config({
    cloud_name: 'dekh8kxwc',
    api_key: '367788419598357',
    api_secret: 'R82rYraZnFdLukonpRBuGWlGOCQ',
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    folder: 'uploads',
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
});

const upload = multer({ storage: storage });

router.post("/add-member", async (req, res) => {
    try {
        const { first_name, last_name, email, password, role, globaladminId } = req.body;

        // Check if the email already exists
        const existingUser = await Questionnaire.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, msg: 'Email already exists' });
        }

        // Create the member with the specified package and associated globaladminId
        const hashedPwd = await bcrypt.hash(password, saltRounds);
        const insertResult = await Questionnaire.create({
            first_name,
            last_name,
            email,
            isSocial: false,
            provider: "local",
            password: hashedPwd,
            globaladminId,
            role,
        });

        const member = { ...insertResult.toObject() };
        delete member.password;
        res.json({ success: true, msg: 'Member added successfully', member });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error Occurred");
    }
});

router.post("/create-questionnaire", async (req, res) => {
    try {
        const { templateName, questions } = req.body;

        // Create a new Questionnaire
        const newQuestionnaire = new Questionnaire({
            templateName,
            questions,
        });

        // Save the new questionnaire to the database
        const savedQuestionnaire = await newQuestionnaire.save();

        res.json({ success: true, msg: 'Questionnaire created successfully', questionnaire: savedQuestionnaire });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error Occurred");
    }
});

router.put("/edit-questionnaire/:questionnaireId", async (req, res) => {
    try {
        const { questions } = req.body;
        const questionnaireId = req.params.questionnaireId;

        // Check if the questionnaire exists
        const existingQuestionnaire = await Questionnaire.findById(questionnaireId);
        if (!existingQuestionnaire) {
            return res.status(404).json({ success: false, msg: 'Questionnaire not found' });
        }


        // Update the questionnaire details
        existingQuestionnaire.questions = questions || existingQuestionnaire.questions;

        // Save the updated questionnaire
        const updatedQuestionnaire = await existingQuestionnaire.save();

        res.json({ success: true, msg: 'Questionnaire updated successfully', questionnaire: updatedQuestionnaire });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error Occurred");
    }
});

router.get("/get-all-questionnaires", async (req, res) => {
    try {
        // Retrieve all questionnaires from the database
        // const allQuestionnaires = await Questionnaire.find();
        const allQuestionnaires = await Questionnaire.find().populate('questions.sectionId');

        res.json({ success: true, questionnaires: allQuestionnaires });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error Occurred");
    }
});

router.get("/get-questionnaire/:questionnaireId", async (req, res) => {
    try {
        const questionnaireId = req.params.questionnaireId;

        // Check if the questionnaire exists
        const existingQuestionnaire = await Questionnaire.findById(questionnaireId);
        if (!existingQuestionnaire) {
            return res.status(404).json({ success: false, msg: 'Questionnaire not found' });
        }

        res.json({ success: true, questionnaire: existingQuestionnaire });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error Occurred");
    }
});

router.delete("/delete-questionnaire/:questionnaireId", async (req, res) => {
    try {
        const questionnaireId = req.params.questionnaireId;

        // Check if the questionnaire exists
        const existingQuestionnaire = await Questionnaire.findById(questionnaireId);
        if (!existingQuestionnaire) {
            return res.status(404).json({ success: false, msg: 'Questionnaire not found' });
        }

        // Delete the questionnaire
        await Questionnaire.deleteOne({ _id: questionnaireId });

        res.json({ success: true, msg: 'Questionnaire deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error Occurred");
    }
});




module.exports = router;