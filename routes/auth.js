require('dotenv').config();

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

	if (!firstName || !lastName || !email || !password1 || !password2 || (role === 'admin' && !securityKey)) {
		errors.push({ msg: "Please fill in all the fields" });
	}
	if (password1 && password2 && password1 !== password2) {
		errors.push({ msg: "Passwords are not matching" });
	}
	if (password1 && password1.length < 4) {
		errors.push({ msg: "Password length should be at least 4 characters" });
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

router.get("/auth/logout", (req, res) => {
	req.logout();
	req.flash("success", "Logged-out successfully");
	res.redirect("/");
});

module.exports = router;
