const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/database");
const User = require("../models/user");
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

router.post("/register", upload.single('profileImage'), async (req, res) => {
  try {
    const { first_name, last_name, email, password, package, role, isActive } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, msg: "Email already exists" });
    }

    let profileImageUrl = '';
    
    // Check if a profile image was provided in the request
    if (req.file) {
      // Upload profile image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });
      profileImageUrl = result.secure_url;
    }

    // Create the user with the specified package
    const hashedPwd = await bcrypt.hash(password, saltRounds);
    const insertResult = await User.create({
      first_name,
      last_name,
      email,
      isSocial: false,
      provider: "local",
      password: hashedPwd,
      role: role,
      package: package || "trial",
      isActive: isActive || true,
      remainingMembers: 1,
      profileImage: profileImageUrl, // Add profile image URL to the user object
    });

    const user = { ...insertResult.toObject() };
    delete user.password;

    const token = jwt.sign({ data: insertResult }, config.secret, {
      expiresIn: 604800, // 1 week
    });

    res.json({
      success: true,
      msg: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

// router.post("/register", async (req, res) => {
//   try {
//     const { first_name, last_name, email, password, package, role, isActive } =
//       req.body;

//     // Check if the email already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ success: false, msg: "Email already exists" });
//     }

//     // Create the user with the specified package
//     const hashedPwd = await bcrypt.hash(password, saltRounds);
//     const insertResult = await User.create({
//       first_name,
//       last_name,
//       email,
//       isSocial: false,
//       provider: "local",
//       password: hashedPwd,
//       role: role,
//       package: package || "trial",
//       isActive: isActive || true,
//       remainingMembers: 1,
//     });

//     const user = { ...insertResult.toObject() };
//     delete user.password;

//     const token = jwt.sign({ data: insertResult }, config.secret, {
//       expiresIn: 604800, // 1 week
//     });

//     res.json({
//       success: true,
//       msg: "User registered successfully",
//       user,
//       token,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Internal Server error Occurred");
//   }
// });

//
router.get("/user-details", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    // Access user information from the request (set by the verifyToken middleware)
    const userId = req.user._id;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // Return the user details excluding the password
    const { password, ...userDetails } = user.toObject();
    res.json({ success: true, user: userDetails });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server error occurred");
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

router.post("/authenticate", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).populate('packageId');

    if (user) {
      if (user.isActive) {
        const cmp = await bcrypt.compare(req.body.password, user.password);

        if (cmp) {
          const { password, ...userWithoutPassword } = user.toObject(); // Remove the password field

          const token = jwt.sign({ data: userWithoutPassword }, config.secret, {
            expiresIn: 3600, // 1 hour
          });

          res.json({
            success: true,
            token: token,
            user: userWithoutPassword,
          });
        } else {
          res.json({ success: false, msg: "Wrong password" });
        }
      } else {
        res.json({
          success: false,
          msg: "Your account is inactive. Please coordinate with the admin.",
        });
      }
    } else {
      res.json({ success: false, msg: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

// Update user isActive status by userId
router.put("/update-user-status/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { isActive } = req.body;

    // Check if the user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // Update isActive status
    existingUser.isActive = isActive;

    // Save the updated user
    const updatedUser = await existingUser.save();

    const user = { ...updatedUser.toObject() };
    delete user.password;

    res.json({
      success: true,
      msg: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

router.put(
  "/profile/:userId",
  upload.single("profileImage"),
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { first_name, last_name, address, latitude, longitude } = req.body;

      if (req.file) {
        // If a file is received, upload it to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "auto",
        });
        const profileImageUrl = result.secure_url;

        // Update user's profileImage only if a file is uploaded
        if (profileImageUrl) {
          // Find the user by their ID in the database
          const user = await User.findById(req.params.userId);

          // Update the user's profileImage
          user.profileImage = profileImageUrl;

          // Save the updated user to the database
          await user.save();
        }
      }

      // Find the user by their ID in the database
      const user = await User.findById(req.params.userId);

      // Update the user's profile data if the fields exist in the request
      if (first_name) {
        user.first_name = first_name;
      }
      if (last_name) {
        user.last_name = last_name;
      }
      if (address && latitude && longitude) {
        user.location = { address, latitude, longitude };
      }

      // Save the updated user to the database
      await user.save();

      // Return a success response
      return res.status(200).json({
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

// get all globaladmins
router.get("/globaladmins", async (req, res) => {
  try {
    // Select the fields you want to retrieve (excluding the password)
    const globalAdmins = await User.find({ role: "globaladmin" }).select(
      "-password"
    );

    res.json({ success: true, globalAdmins });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occurred");
  }
});

module.exports = router;
