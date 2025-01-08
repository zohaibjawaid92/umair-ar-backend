const express = require("express");
const router = express.Router();
const Questionnaire = require("../models/template");
const UserPackage = require('../models/user-packages');
const User = require('../models/user');
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

router.post('/save-user-package', async (req, res) => {
    try {
      const {
        userId,
        userEmail,
        packageId,
        packageName,
        packagePrice,
        packageMembers,
      } = req.body;
  
    
      // Create a new UserPackage document
      const newUserPackage = new UserPackage({
        userId,
        userEmail,
        packageId,
        packageName,
        packagePrice,
        packageMembers,
      });
  
      // Save the new UserPackage document to the database
      const savedUserPackage = await newUserPackage.save();
  
      // Update user schema with current packageId, remainingMembers, and purchasedExpiry if applicable
      const user = await User.findById(userId);
      if (user) {
        user.packageId = packageId;
        user.remainingMembers = packageMembers;
        user.package = 'paid';
        const packageDetails = await Package.findById(packageId);
        if (packageDetails) {
          user.purchasedExpiry = new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ); // 1 year for purchased packages
        }
  
        await user.save();
      }
  
      res.json({
        success: true,
        msg: 'User package saved successfully',
        userPackage: savedUserPackage,
      });
    } catch (error) {
      console.error('Error saving user package:', error);
      res.status(500).send('Internal Server error occurred');
    }
});

router.get('/get-user-packages/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Retrieve all user packages for the given userId
    const userPackages = await UserPackage.find({ userId });

    res.json({
      success: true,
      userPackages,
    });
  } catch (error) {
    console.error('Error fetching user packages:', error);
    res.status(500).send('Internal Server error occurred');
  }
});

module.exports = router;
