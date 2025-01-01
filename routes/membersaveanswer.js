const express = require('express');
const router = express.Router();
const Questionnaire = require('../models/template');
const MemberSaveAnswers = require('../models/memberssaveanswer');
const Members = require("../models/members");
const User = require("../models/user");
const Reports = require('../models/reports');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const axios = require('axios');
//register
const fs = require('fs');
const PDFDocument = require('pdfkit');
const https = require('https');
const saltRounds = 10;

cloudinary.config({
  cloud_name: 'dekh8kxwc',
  api_key: '367788419598357',
  api_secret: 'R82rYraZnFdLukonpRBuGWlGOCQ',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'uploads',
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'pdf'],
});


const upload = multer({ storage: storage });

router.post('/upload-user-image', upload.single('questionImage'), async (req, res) => {
  try {
    // Check if a file is provided in the request
    if (!req.file) {
      return res.status(400).json({ success: false, msg: 'No file provided' });
    }

    // Process image upload
    const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });
    const profileImageUrl = result.secure_url;

    res.json({ success: true, url: profileImageUrl });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Internal Server Error' });
  }
});

const path = require('path');


router.post('/save-answers', async (req, res) => {
  try {
    const { userId, templateId, isDraft, address, eir_code, survey_document_name, developer_name, client_name , images ,records, location, startDate , _id } = req.body;

    // Validate if the template exists
    const template = await Questionnaire.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, msg: 'Template not found' });
    }

    // Get user details including profileImage from the Members model
    const user = await Members.findById(userId);
    const globalAdminId = user.globaladminId;

    const getlobalAdminId = await User.findById(globalAdminId);
    const profileImage = getlobalAdminId.profileImage;

    // Create records based on the provided answers
    const filterRecords = records.map((answer, index) => {
      return {
        questionName: answer.questionName,
        extraDescription: answer.extraDescription,
        questionAccessability: answer.questionAccessability,
        checkIfAnswerUpdated : answer.checkIfAnswerUpdated,
        maintainanceScore: answer.maintainanceScore,
        location: answer.location,
        imageUpload: answer.imageUpload,
        mainImages : answer.mainImages,
        answers: answer.answers,
      };
    });

    // Check if there is an existing record for the user, template, and _id in MemberSaveAnswers
    let existingRecord = await MemberSaveAnswers.findById(_id);

    if (existingRecord) {
      // Update the existing record
      existingRecord.isDraft = isDraft;
      existingRecord.address = address;
      existingRecord.startDate = startDate;
      existingRecord.endDate = new Date();
      existingRecord.eir_code = eir_code;
      existingRecord.location = location;
      existingRecord.survey_document_name = survey_document_name;
      existingRecord.records = filterRecords;
      existingRecord.developer_name = developer_name;
      existingRecord.client_name = client_name;
      existingRecord.images = images;

      await existingRecord.save();
      // If isDraft is true, check if there is an existing report record
      let existingReport = await Reports.findOne({ userId, templateId });

      if (existingReport) {
        // Update existing report record
        existingReport.survey_document_name = survey_document_name;
        existingReport.pdfUrl = await generatePDF(existingRecord, profileImage);
        existingReport.startDate = startDate;
        existingReport.endDate = new Date();
        existingReport.globalAdminId = globalAdminId;
        existingReport.profileImage = profileImage;
        existingReport.surveyId = existingRecord?._id;
        await existingReport.save();
      } else {
        // Create a new report record
        const pdfUrl = await generatePDF(existingRecord, profileImage);
        const report = new Reports({
          userId: userId,
          templateId: templateId,
          survey_document_name: survey_document_name,
          pdfUrl: pdfUrl,
          startDate: startDate,
          endDate: new Date(),
          globalAdminId: globalAdminId,
          profileImage: profileImage,
          surveyId : existingReport?._id
        });

        await report.save();
      }

      res.json({ success: true, msg: 'Answers updated successfully', data: existingRecord });
    } else {
      // If record does not exist, create a new one
      const memberSaveAnswers = new MemberSaveAnswers({
        userId: userId,
        templateId: templateId,
        isDraft: isDraft,
        address: address,
        eir_code: eir_code,
        location: location,
        startDate: startDate,
        endDate: new Date(),
        survey_document_name: survey_document_name,
        developer_name: developer_name,
        client_name: client_name,
        images: images,
        records: filterRecords,
      });

      // Save the record
      await memberSaveAnswers.save();

      // Create a new report record
      const pdfUrl = await generatePDF(memberSaveAnswers, profileImage);
      const report = new Reports({
        userId: userId,
        templateId: templateId,
        survey_document_name: survey_document_name,
        pdfUrl: pdfUrl,
        startDate: startDate,
        endDate: new Date(),
        globalAdminId: globalAdminId,
        profileImage: profileImage,
        surveyId : memberSaveAnswers?._id
      });

      await report.save();

      res.json({ success: true, msg: 'Answers saved successfully', data: memberSaveAnswers });
    }
  } catch (error) {
    console.error('Error saving/updating answers:', error);
    res.status(500).json({ success: false, msg: 'Internal Server Error' });
  }
});

const generatePDF = async (record, profileImage) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument();

    // Add record details to PDF
    doc.fontSize(16).text('Record Details', { align: 'center' }).moveDown();
    doc.moveDown();

    doc.fillColor('black').fontSize(14).text(`Template Name: ${record?.survey_document_name}`).moveDown();
    doc.fillColor('black').fontSize(12).text(`Address: ${record?.address}`).moveDown();
    doc.fillColor('black').fontSize(12).text(`Eir code: ${record?.eir_code}`).moveDown();

    // Iterate through records and add details to PDF
    record.records.forEach((item, index) => {
      doc.fillColor('red').fontSize(13).underline(0, 0, doc.widthOfString(`Question ${index + 1}: ${item.questionName}`), 0.5).text(`Question ${index + 1}: ${item.questionName}`).moveDown();
      doc.fillColor('black').fontSize(12).text(`Extra Description: ${item.extraDescription}`).moveDown();
      doc.fillColor('black').fontSize(12).text(`Maintainace & Durability: ${item?.maintainanceScore ? item?.maintainanceScore : 'Not Given'}`).moveDown();
      doc.fillColor('black').fontSize(12).text(`Location: ${item?.location}`).moveDown();
      doc.fillColor('black').fontSize(12).text(`Answers: ${item.answers.join(', ')}`).moveDown();
      doc.moveDown();
    });

    doc.end();

    // Convert PDF to buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('end', () => {
        doc.removeAllListeners();  // Remove all event listeners to prevent memory leaks
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', (error) => {
        doc.removeAllListeners();  // Remove all event listeners in case of an error
        reject(error);
      });
    });

    // Upload PDF to Cloudinary
    cloudinary.uploader.upload_stream(
      { resource_type: 'raw' },
      (error, result) => {
        if (error) {
          console.error('Error uploading PDF to Cloudinary:', error);
          reject(error);
        } else {
          const secureUrlWithExtension = result.secure_url;
          resolve(secureUrlWithExtension);
        }
      }
    ).end(pdfBuffer);
  });
};

router.get('/download-pdf', async (req, res) => {
  try {
    const { cloudinaryUrl } = req.query;

    // Ensure the cloudinaryUrl is provided
    if (!cloudinaryUrl) {
      return res.status(400).json({ success: false, msg: 'Cloudinary URL is required' });
    }

    // Retrieve PDF from Cloudinary
    const response = await axios.get(cloudinaryUrl, { responseType: 'stream' });

    // Set headers for file download
    res.setHeader('Content-disposition', 'attachment; filename=file.pdf');
    res.setHeader('Content-type', 'application/pdf');

    // Pipe Cloudinary response stream to Express response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading PDF from Cloudinary:', error);
    res.status(500).json({ success: false, msg: 'Internal Server Error' });
  }
});


router.get('/download-report/:userId/:templateId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const templateId = req.params.templateId;

    const report = await Reports.findOne({ userId, templateId });

    if (!report) {
      return res.status(404).json({ success: false, msg: 'Report not found for the given userId and templateId' });
    }

    const filePath = path.join('.', report.pdfUrl); // Assuming pdfUrl contains the file path

    // Send the file in the response
    res.download(filePath, `report_${userId}_${templateId}.pdf`);
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ success: false, msg: 'Internal Server Error' });
  }
});

router.get('/get-report/:surveyId', async (req, res) => {
  try {
    const surveyId = req.params.surveyId;

    const report = await Reports.findOne({ surveyId });

    if (!report) {
      return res.status(404).json({ success: false, msg: 'Report not found for the given userId and templateId' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ success: false, msg: 'Internal Server Error' });
  }
});

router.get('/download-pdf/:pdfUrl', (req, res) => {
  try {
    const pdfUrl = req.params.pdfUrl;

    if (!pdfUrl) {
      return res.status(400).json({ success: false, msg: 'PDF URL is required' });
    }

    const pdfPath = path.join('.', pdfUrl);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ success: false, msg: 'PDF not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${pdfUrl}`);

    const stream = fs.createReadStream(pdfPath);
    stream.on('error', (err) => res.status(500).json({ success: false, msg: 'Internal Server Error' }));
    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ success: false, msg: 'Internal Server Error' });
  }
});


router.get('/get-answers/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find records based on userId and populate the templateId information
    const records = await MemberSaveAnswers.find({ userId: userId })
      .populate('templateId', 'templateName') // Adjust the fields to be populated as needed
      .exec();

    if (!records || records.length === 0) {
      return res.status(404).json({ success: false, msg: 'Records not found for the given userId' });
    }

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error retrieving records:', error);
    res.status(500).json({ success: false, msg: 'Internal Server Error' });
  }
});

router.get('/get-answers-by-id/:recordId', async (req, res) => {
  try {
    const _id = req.params.recordId;

    // Find records based on _id
    const record = await MemberSaveAnswers.findById(_id)
    .populate('templateId', 'templateName') // Adjust the fields to be populated as needed
    .exec();

    if (!record) {
      return res.status(404).json({ success: false, msg: 'Record not found for the given _id' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error retrieving record by _id:', error);
    res.status(500).json({ success: false, msg: 'Internal Server Error' });
  }
});

module.exports = router;