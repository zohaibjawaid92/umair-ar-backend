const express = require("express");
const router = express.Router();
const Questionnaire = require("../models/template");
const Package = require("../models/package");
const ContactUs = require('../models/feedback');
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
//register

const saltRounds = 10;

cloudinary.config({
    cloud_name: "dekh8kxwc",
    api_key: "367788419598357",
    api_secret: "R82rYraZnFdLukonpRBuGWlGOCQ",
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    folder: "uploads",
    allowedFormats: ["jpg", "jpeg", "png", "gif", "mp4", "mov"],
});

const upload = multer({ storage: storage });

router.post('/feedback', async (req, res) => {
    try {
        const { email, description } = req.body;

        // Validate the request data
        if (!email || !description) {
            return res.status(400).json({ success: false, msg: 'Email and Description are required fields.' });
        }

        // Create a new contact us entry
        const newContactUs = new ContactUs({ email, description });
        await newContactUs.save();

        res.status(201).json({ success: true, msg: 'Feedback entry created successfully , we will get back to you shortly.' });
    } catch (error) {
        console.error('Error creating contact us entry:', error);
        res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
});

// GET: Get all contact us entries
router.get('/getFeedbacks', async (req, res) => {
    try {
        const contactUsEntries = await ContactUs.find();
        res.json({ success: true, data: contactUsEntries });
    } catch (error) {
        console.error('Error retrieving contact us entries:', error);
        res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
});

module.exports = router;
