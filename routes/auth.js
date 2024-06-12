require('dotenv').config();
const crypto = require('crypto');
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user.js");
const passport = require("passport");
const middleware = require("../middleware/index.js");
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');

const ADMIN_SECURITY_KEY = process.env.ADMIN_SECURITY_KEY;

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

router.get("/auth/signup", middleware.ensureNotLoggedIn, (req, res) => {
  res.render("auth/signup", { title: "User Signup" });
});

router.post("/auth/signup", middleware.ensureNotLoggedIn, async (req, res) => {
  const { firstName, lastName, email, password1, password2, role, securityKey } = req.body;
  let errors = [];

  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@])[A-Za-z\d@]{4,}$/;

  if (!firstName || !lastName || !email || !password1 || !password2 || (role === 'admin' && !securityKey)) {
    errors.push({ msg: "Please fill in all the fields" });
  }
  if (password1 && password2 && password1 !== password2) {
    errors.push({ msg: "Passwords are not matching" });
  }
  if (password1 && password1.length < 4) {
    errors.push({ msg: "Password length should be at least 4 characters" });
  }
  if (password1 && !passwordPattern.test(password1)) {
	errors.push({ msg: "Password must contain at least one letter, one number, and one '@' character, and be at least 4 characters long." });
  }
  if (role === 'admin' && securityKey !== ADMIN_SECURITY_KEY) {
    errors.push({ msg: "Invalid security key for admin role" });
  }
  if (errors.length > 0) {
    return res.render("auth/signup", {
      title: "User Signup",
      errors, firstName, lastName, email, password1, password2, role
    });
  }

  try {
    const user = await User.findOne({ email: email });
    if (user) {
      errors.push({ msg: "This Email is already registered. Please try another email." });
      return res.render("auth/signup", {
        title: "User Signup",
        firstName, lastName, errors, email, password1, password2, role
      });
    }

    const otp = speakeasy.totp({
      secret: process.env.OTP_SECRET,
      encoding: 'base32',
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL,
      subject: 'Verify your email',
      text: `Your OTP code is ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    req.session.tempUser = { firstName, lastName, email, password1, role, securityKey, otp };
    res.redirect('/auth/verify-otp');
  } catch (err) {
    console.log(err);
    req.flash("error", "Some error occurred on the server.");
    res.redirect("back");
  }
});

router.get('/auth/verify-otp', middleware.ensureNotLoggedIn, (req, res) => {
  res.render('auth/verify-otp', { title: 'Verify OTP' });
});

router.post('/auth/verify-otp', middleware.ensureNotLoggedIn, async (req, res) => {
  const { otp } = req.body;
  const { tempUser } = req.session;
  const { firstName, lastName, email, password1, role, securityKey, otp: sentOtp } = tempUser;

  if (otp !== sentOtp) {
    req.flash('error', 'Invalid OTP');
    return res.redirect('/auth/verify-otp');
  }

  try {
    const newUser = new User({ firstName, lastName, email, password: password1, role });
    if (role === 'admin') {
      newUser.securityKey = securityKey;
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.password, salt);
    newUser.password = hash;
    await newUser.save();
    req.flash("success", "You are successfully registered and can log in.");
    delete req.session.tempUser;
    res.redirect("/auth/login");
  } catch (err) {
    console.log(err);
    req.flash("error", "Some error occurred on the server.");
    res.redirect("back");
  }
});

router.get("/auth/login", middleware.ensureNotLoggedIn, (req, res) => {
  res.render("auth/login", { title: "User login" });
});

router.post("/auth/login", middleware.ensureNotLoggedIn,
  passport.authenticate('local', {
    failureRedirect: "/auth/login",
    failureFlash: true,
    successFlash: true
  }), (req, res) => {
    res.redirect(req.session.returnTo || `/${req.user.role}/dashboard`);
  }
);

router.get('/auth/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password' });
});

router.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const token = crypto.randomBytes(20).toString('hex');
    // Save the token and its expiration date in the database
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `http://localhost:5000/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Password Reset',
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`
    };

    await transporter.sendMail(mailOptions);
    res.send('Password reset email sent');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending email');
  }
});

router.get("/auth/logout", (req, res) => {
  req.logout();
  req.flash("success", "Logged-out successfully");
  res.redirect("/");
});

router.get("/auth/reset-password", (req,res) =>{
	res.render('auth/reset-password')
});

router.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).send('Invalid or expired token');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    user.password = hash;
    user.resetPasswordToken = undefined; // Clear the token
    user.resetPasswordExpires = undefined; // Clear the expiration
    await user.save();

    res.send('Password reset successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error resetting password');
  }
});

module.exports = router;
