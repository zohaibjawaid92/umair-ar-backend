const express = require("express");
const router = express.Router();
const Questionnaire = require("../models/template");
const Package = require("../models/package");
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

router.post("/create-package", async (req, res) => {
  try {
    const { packageName, packagePrice, packageMembers } = req.body;

    // Create a new Questionnaire
    const newPackage = new Package({
      packageName,
      packagePrice,
      packageMembers,
    });

    // Save the new questionnaire to the database
    const savedQuestionnaire = await newPackage.save();

    res.json({
      success: true,
      msg: "Package created successfully",
      packages: savedQuestionnaire,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

router.put("/update-package/:packageId", async (req, res) => {
  try {
    const { packageName, packagePrice, packageMembers } = req.body;
    const packageId = req.params.packageId;

    // Check if the package exists
    const existingPackage = await Package.findById(packageId);
    if (!existingPackage) {
      return res.status(404).json({ success: false, msg: "Package not found" });
    }

    // Update the package details
    existingPackage.packageName = packageName || existingPackage.packageName;
    existingPackage.packagePrice = packagePrice || existingPackage.packagePrice;
    existingPackage.packageMembers =
      packageMembers || existingPackage.packageMembers;

    // Save the updated package
    const updatedPackage = await existingPackage.save();

    res.json({
      success: true,
      msg: "Package updated successfully",
      package: updatedPackage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

// Get all packages
router.get("/list", async (req, res) => {
  try {
    // Find all packages
    const packages = await Package.find();

    res.json({ success: true, packages });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete('/delete-package/:packageId', async (req, res) => {
    try {
      const packageId = req.params.packageId;
  
      // Check if the package exists and remove it
      const deletedPackage = await Package.findByIdAndRemove(packageId);
  
      if (!deletedPackage) {
        return res.status(404).json({ success: false, msg: 'Package not found' });
      }
  
      res.json({
        success: true,
        msg: 'Package deleted successfully',
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server error Occurred');
    }
});

module.exports = router;
