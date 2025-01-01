const mongoose = require("mongoose");

// Subcategory Schema
const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // Reference to the Category model
        required: true,
    },
    image: {
        type: String, // URL of the subcategory image stored in Cloudinary
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to update `updatedAt` on save
subcategorySchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

module.exports = Subcategory;
