const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/database");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, package, role, isActive } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, msg: "Email already exists" });
    }

    let profileImageUrl = '';
    

    // Create the user with the specified package
    const hashedPwd = await bcrypt.hash(password, saltRounds);
    const insertResult = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPwd,
      role: role,
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


router.post("/authenticate", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
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
      // 
    } else {
      res.json({ success: false, msg: "User not found" });
    }
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


module.exports = router;
