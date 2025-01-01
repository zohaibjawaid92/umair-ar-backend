const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config/database");

//user schema
const userPackageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
    required: true,
  },
  packageName: { type: String, required: true },
  packagePrice: { type: Number, required: true },
  packageMembers: { type: Number, required: true },
});

const UserPackage = (module.exports = mongoose.model(
  "UserPackage",
  userPackageSchema
));
