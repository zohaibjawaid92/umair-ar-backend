const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/database");
const User = require("../models/user");
const Members = require("../models/members");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

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

router.post("/add-member", async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, globaladminId } =
      req.body;

    // Check if the email already exists
    const existingUser = await Members.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, msg: "Email already exists" });
    }

    // Check remainingMembers of the globaladmin
    const globalAdmin = await User.findById(globaladminId);
    if (!globalAdmin) {
      return res.status(404).json({ success: false, msg: "Global admin not found" });
    }

    if (globalAdmin.remainingMembers <= 0) {
      return res.status(403).json({ success: false, msg: "You are not allowed to create members. Your package has been expired." });
    }

    // Create the member with the specified package and associated globaladminId
    const hashedPwd = await bcrypt.hash(password, saltRounds);
    const insertResult = await Members.create({
      first_name,
      last_name,
      email,
      isSocial: false,
      provider: "local",
      password: hashedPwd,
      globaladminId,
      role: "user",
    });

    // Update the remainingMembers of the globaladmin
    globalAdmin.remainingMembers -= 1;
    globalAdmin.packageId = globalAdmin.packageId; 
    await globalAdmin.save();

    const member = { ...insertResult.toObject() };
    delete member.password;
    res.json({ success: true, msg: "Member added successfully", member });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});
// google register
// Google signup
router.post("/register/google", async (req, res) => {
  try {
    const { socialToken } = req.body;

    // Decode the Google token and extract user data
    const decodedToken = jwt.decode(socialToken);
    console.log(decodedToken);
    if (!decodedToken) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid Google token" });
    }

    const { first_name, last_name, email } = decodedToken;

    // Check if the user already exists in the database
    let user = await User.findOne({ email });

    // If the user doesn't exist, create a new user
    if (!user) {
      const insertResult = await User.create({
        first_name: first_name,
        last_name: last_name,
        email,
        role: "user",
        provider: "google",
        isSocial: true,
        googleId: decodedToken.sub,
      });

      // user = { ...insertResult.toObject(), id: insertResult._id.toString() };
      // delete user._id; // Remove the _id field from the user object
    }

    const token = jwt.sign({ data: user }, config.secret, {
      expiresIn: 604800, // 1 week
    });

    res.json({
      success: true,
      msg: "User authenticated successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

// facebook register
router.post("/register/facebook", async (req, res) => {
  try {
    const { socialToken } = req.body;

    // Decode the Facebook token and extract user data
    const decodedToken = jwt.decode(socialToken);
    console.log(decodedToken);
    if (!decodedToken) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid Facebook token" });
    }

    const { first_name, last_name, email } = decodedToken;

    // Check if the user already exists in the database
    let user = await User.findOne({ email });

    // If the user doesn't exist, create a new user
    if (!user) {
      const insertResult = await User.create({
        first_name,
        last_name,
        email,
        role: "user",
        isSocial: true,
        provider: "facebook", // Add the "provider" field with the value "facebook"
        facebookId: decodedToken.id,
      });

      user = { ...insertResult.toObject(), id: insertResult._id.toString() };
      delete user._id; // Remove the _id field from the user object
    }

    const token = jwt.sign({ data: user }, config.secret, {
      expiresIn: 604800, // 1 week
    });

    res.json({
      success: true,
      msg: "User authenticated successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

//authenticate

router.post("/login-member", async (req, res) => {
  try {
    const user = await Members.findOne({ email: req.body.email }).populate('globaladminId' , 'package');

    if (user) {
      if (user.isSuspended) {
        return res.json({
          success: false,
          msg: "Sorry, your account has been suspended by an admin",
        });
      }

      const cmp = await bcrypt.compare(req.body.password, user.password);

      if (cmp) {
        // Populate the globaladminId field to get the information about the global admin
        // await user.populate('globaladminId').execPopulate();

        const { password, ...userWithoutPassword } = user.toObject();

        const token = jwt.sign({ data: userWithoutPassword }, config.secret, {
          expiresIn: 604800, //1 week
        });

        return res.json({
          success: true,
          token: token,
          user: userWithoutPassword,
        });
      } else {
        return res.json({ success: false, msg: "Wrong password" });
      }
    } else {
      return res.json({ success: false, msg: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server error Occurred");
  }
});



// edit member by admin
router.put("/edit-member/:memberId", async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, globaladminId } =
      req.body;
    const memberId = req.params.memberId;

    // Check if the member exists
    const existingMember = await Members.findById(memberId);
    if (!existingMember) {
      return res.status(404).json({ success: false, msg: "Member not found" });
    }

    // Update the member details
    existingMember.first_name = first_name || existingMember.first_name;
    existingMember.last_name = last_name || existingMember.last_name;
    existingMember.email = email || existingMember.email;
    existingMember.role = role || existingMember.role;
    existingMember.globaladminId =
      globaladminId || existingMember.globaladminId;

    if (password) {
      const hashedPwd = await bcrypt.hash(password, saltRounds);
      existingMember.password = hashedPwd;
    }

    // Save the updated member
    const updatedMember = await existingMember.save();

    const member = { ...updatedMember.toObject() };
    delete member.password;

    res.json({ success: true, msg: "Member updated successfully", member });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

// delete member by admin
router.delete("/delete-member/:memberId", async (req, res) => {
  try {
    const memberId = req.params.memberId;

    // Check if the member exists
    const existingMember = await Members.findById(memberId);
    if (!existingMember) {
      return res.status(404).json({ success: false, msg: "Member not found" });
    }

    // Delete the member
    await Members.deleteOne({ _id: memberId });

    res.json({ success: true, msg: "Member deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

//
router.put(
  "/profile/:userId",
  upload.single("profileImage"),
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { first_name, last_name } = req.body;
      if (req.file) {
        // If a file is received, upload it to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "auto",
        });
        const profileImageUrl = result.secure_url;

        // Update user's profileImage only if a file is uploaded
        if (profileImageUrl) {
          // Find the user by their ID in the database
          const user = await Members.findById(req.params.userId);

          // Update the user's profileImage
          user.profileImage = profileImageUrl;

          // Save the updated user to the database
          await user.save();
        }
      }

      // Find the user by their ID in the database
      const user = await Members.findById(req.params.userId);

      // Update the user's profile data if the fields exist in the request
      if (first_name) {
        user.first_name = first_name;
      }
      if (last_name) {
        user.last_name = last_name;
      }

      // Save the updated user to the database
      await user.save();

      // Return a success response
      return res
        .status(200)
        .json({
          success: true,
          message: "Profile updated successfully",
          user: user,
        });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

// suspend accounts
router.put("/toggle-suspension/:memberId", async (req, res) => {
  try {
    const { isSuspended } = req.body;
    const memberId = req.params.memberId;

    // Check if the member exists
    const existingMember = await Members.findById(memberId);
    if (!existingMember) {
      return res.status(404).json({ success: false, msg: "Member not found" });
    }

    // Update the suspension status
    existingMember.isSuspended = isSuspended;

    // Save the updated member
    const updatedMember = await existingMember.save();

    const member = { ...updatedMember.toObject() };
    delete member.password;

    res.json({
      success: true,
      msg: `Member ${isSuspended ? "suspended" : "activated"} successfully`,
      member,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    res.json({ user: req.user });
  }
);

// return user

router.get("/getUserById/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by their ID in the database
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Return the user information
    return res.status(200).json({ success: true, user: user });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

//
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Generate a random code
    const resetCode = randomstring.generate(6); // Change the code length as needed

    // Save the reset code to the user in your database or cache
    // ...

    // Send the reset code to the user's email

    await User.findOneAndUpdate({ email }, { resetCode }, { new: true });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "zohaibjawaid92@gmail.com",
        pass: "zvbsmxwswfxszkvq",
      },
    });

    const mailOptions = {
      from: "zohaibjawaid92@gmail.com",
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${resetCode}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Password reset code sent to your email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    // Retrieve the reset code saved for the user from your database
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Compare the reset code
    if (resetCode !== user.resetCode) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reset code" });
    }

    // Reset the resetCode field for the user
    user.resetCode = undefined;

    // Hash and salt the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password with the hashed password
    user.password = hashedPassword;

    // Save the updated user in your database
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.put(
  "/change-password/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { oldPassword, newPassword } = req.body;

      // Find the user by their ID in the database
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Verify the old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid old password" });
      }

      // Hash and salt the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update the user's password with the hashed password
      user.password = hashedPassword;

      // Save the updated user in your database
      await user.save();

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);


// get all users of globaladmin
router.get("/listmembers/:globaladminId", async (req, res) => {
  try {
    const globaladminId = req.params.globaladminId;

    // Find all members with the given globaladminId
    const members = await Members.find({ globaladminId });

    res.json({ success: true, members });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
