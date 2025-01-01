const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const Subcategory = require("../models/sub-category");

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

router.post("/subcategory", async (req, res) => {
    try {
        const { name, description, category } = req.body;
        // Validate the required fields
        if (!name || !category) {
            return res.status(400).json({ success: false, msg: "Name and Category are required fields." });
        }

        // Create the subcategory
        const newSubcategory = new Subcategory({
            name,
            description,
            category,
        });

        // Save to the database
        await newSubcategory.save();

        res.status(201).json({ success: true, msg: "Subcategory created successfully.", data: newSubcategory });
    } catch (error) {
        console.error("Error creating subcategory:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});

router.get("/subcategories", async (req, res) => {
    try {
        const subcategories = await Subcategory.find()
            .populate("category", "name") // Populate category details (e.g., name)
            .sort({ createdAt: -1 }); // Optional: Sort by newest first

        res.json({ success: true, data: subcategories });
    } catch (error) {
        console.error("Error retrieving subcategories:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});

router.get("/subcategories/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;

        const subcategories = await Subcategory.find({ category: categoryId })
            .populate("category", "name") // Populate category details (e.g., name)
            .sort({ createdAt: -1 });

        res.json({ success: true, data: subcategories });
    } catch (error) {
        console.error("Error retrieving subcategories by category:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});

module.exports = router;
