const express = require('express');
const router = express.Router();
const Section = require('../models/sections');
//register


router.post('/create', async (req, res) => {
    try {
        const { sectionName } = req.body;
        const newSection = new Section({
            sectionName
        });
        const savedSection = await newSection.save();
        res.json({ success: true, msg: 'Section created successfully', section: savedSection });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server error Occurred');
    }
});

//edit
router.put('/edit-section/:sectionId', async (req, res) => {
    try {
        const { sectionName, isRequired } = req.body;
        const sectionId = req.params.sectionId;

        const existingSection = await Section.findById(sectionId);
        if (!existingSection) {
            return res.status(404).json({ success: false, msg: 'Section not found' });
        }

        existingSection.sectionName = sectionName || existingSection.sectionName;
        existingSection.isRequired = isRequired !== undefined ? isRequired : existingSection.isRequired;

        const updatedSection = await existingSection.save();

        res.json({ success: true, msg: 'Section updated successfully', section: updatedSection });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server error Occurred');
    }
});

// Get all sections
router.get('/list', async (req, res) => {
    try {
        const allSections = await Section.find();

        res.json({ success: true, sections: allSections });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server error Occurred');
    }
});


// Get a specific section
router.get('/get-section/:sectionId', async (req, res) => {
    try {
        const sectionId = req.params.sectionId;

        const existingSection = await Section.findById(sectionId);
        if (!existingSection) {
            return res.status(404).json({ success: false, msg: 'Section not found' });
        }

        res.json({ success: true, section: existingSection });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server error Occurred');
    }
});

// Delete a section
router.delete('/delete-section/:sectionId', async (req, res) => {
    try {
        const sectionId = req.params.sectionId;

        const existingSection = await Section.findById(sectionId);
        if (!existingSection) {
            return res.status(404).json({ success: false, msg: 'Section not found' });
        }

        await Section.deleteOne({ _id: sectionId });

        res.json({ success: true, msg: 'Section deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server error Occurred');
    }
});



module.exports = router;