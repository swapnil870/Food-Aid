const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const ContactUs = require("../models/contactUs");

router.get("/", (req,res) => {
	res.render("home/welcome");
});

router.get("/home/about-us", (req,res) => {
	res.render("home/aboutUs", { title: "About Us | Nourish " });
});

router.get("/home/mission", (req,res) => {
	res.render("home/mission", { title: "Our mission | Nourish" });
});

router.get("/home/contact-us", (req,res) => {
	res.render("home/contactUs", { title: "Contact us | Nourish" });
});

router.post("/home/contact-us/submit", async (req,res) => {
	const{ name, email, mobile_no, message } = req.body;
	console.log('Form data: ', {name, email, mobile_no, message});
	try{
		const contactUsData = new ContactUs({
			name, email, mobile_no, message
		});

		await contactUsData.save();

		req.flash("success", "Form Submitted Succesfully");
		res.redirect("/home/contact-us");
	} catch(error) {
		console.error("Error saving contact us data:", error);
		res.status(500).json({ message: "There was an error submitting the form" });
	}
});

module.exports = router;