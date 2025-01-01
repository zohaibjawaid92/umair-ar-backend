const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const Category = require("../models/category");

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


router.post("/category", upload.single("image"), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, msg: "Name is a required field." });
        }

        const newCategory = new Category({
            name,
            description,
            image: req.file?.path,
        });
        await newCategory.save();

        res.status(201).json({ success: true, msg: "Category created successfully.", data: newCategory });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});

// GET: Retrieve all categories
router.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find() // Populate parent category details
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error("Error retrieving categories:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});

// PUT: Edit an existing category
router.put("/category/:id", upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Find the category by ID
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, msg: "Category not found." });
        }

        // Update fields
        if (name) category.name = name;
        if (description) category.description = description;

        // If a new image is uploaded, update it
        if (req.file?.path) {
            // Optional: Delete the old image from Cloudinary (if exists)
            if (category.image) {
                const publicId = category.image.split('/').pop().split('.')[0]; // Extract public ID from URL
                await cloudinary.uploader.destroy(publicId);
            }
            category.image = req.file.path;
        }

        // Save updated category
        const updatedCategory = await category.save();
        res.json({ success: true, msg: "Category updated successfully.", data: updatedCategory });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});


module.exports = router;
