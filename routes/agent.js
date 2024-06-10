const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const nodemailer = require('nodemailer');
const User = require("../models/user.js");
const Donation = require("../models/donation.js");

// Ensure you have the firebase admin initialized
const { admin } = require('../firebase.js');

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // e.g., 'Gmail', 'SendGrid', etc.
    auth: {
        user: process.env.EMAIL, // replace with your email
        pass: process.env.EMAIL_PASSWORD, // replace with your email password
    },
});


router.get("/agent/dashboard", middleware.ensureAgentLoggedIn, async (req, res) => {
    const agentId = req.user._id;
    const numAssignedDonations = await Donation.countDocuments({ agent: agentId, status: "assigned" });
    const numCollectedDonations = await Donation.countDocuments({ agent: agentId, status: "collected" });
    res.render("agent/dashboard", {
        title: "Dashboard",
        numAssignedDonations, numCollectedDonations
    });
});

router.get("/agent/collections/pending", middleware.ensureAgentLoggedIn, async (req, res) => {
    try {
        const pendingCollections = await Donation.find({ agent: req.user._id, status: "assigned" }).populate("donor").exec();
        res.render("agent/pendingCollections", { title: "Pending Collections", pendingCollections });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

router.get("/agent/collections/previous", middleware.ensureAgentLoggedIn, async (req, res) => {
    try {
        const previousCollections = await Donation.find({ agent: req.user._id, status: "collected" }).populate("donor");
        res.render("agent/previousCollections", { title: "Previous Collections", previousCollections });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

router.get("/agent/collection/view/:collectionId", middleware.ensureAgentLoggedIn, async (req, res) => {
    try {
        const collectionId = req.params.collectionId;
        const collection = await Donation.findById(collectionId).populate("donor");
        res.render("agent/collection", { title: "Collection details", collection });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

router.get("/agent/collection/collect/:collectionId", middleware.ensureAgentLoggedIn, async (req, res) => {
    try {
        const collectionId = req.params.collectionId;
        
        const collection = await Donation.findByIdAndUpdate(collectionId, { status: "collected", collectionTime: Date.now() }, { new: true }).populate("donor");
        
        // Fetch admin email from the User collection
        const admin = await User.findOne({ role: "admin" });
        if (!admin) {
            throw new Error("Admin not found");
        }
        const adminEmail = admin.email;

        // Send email notifications
        const donorEmail = collection.donor.email;
        
        const mailOptionsDonor = {
            from: process.env.EMAIL,
            to: donorEmail,
            subject: 'Donation Collected',
            text: `Dear ${collection.donor.firstName},\n\nYour donation has been successfully collected. Thank you for your generosity!\n\nBest regards,\nYour Organization`
        };

        const mailOptionsAdmin = {
            from: process.env.EMAIL,
            to: adminEmail,
            subject: 'Donation Collected',
            text: `A donation has been collected.\n\nDetails:\nDonor: ${collection.donor.firstName} ${collection.donor.lastName}\nDonation ID: ${collection._id}\n\nBest regards,\nYour Organization`
        };

        await transporter.sendMail(mailOptionsDonor);
        await transporter.sendMail(mailOptionsAdmin);

        
        // await Donation.findByIdAndUpdate(collectionId, { status: "collected", collectionTime: Date.now() });
        req.flash("success", "Donation collected successfully and notified via Email");
        res.redirect(`/agent/collection/view/${collectionId}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

router.get("/agent/profile", middleware.ensureAgentLoggedIn, (req, res) => {
    res.render("agent/profile", { title: "My Profile" });
});

router.put("/agent/profile", middleware.ensureAgentLoggedIn, async (req, res) => {
    try {
        const id = req.user._id;
        const { firstName, lastName, gender, address, phone } = req.body.agent;

        // Ensure phone is defined and correctly formatted
        if (phone) {
            await User.findByIdAndUpdate(id, {
                firstName,
                lastName,
                gender,
                address,
                phone
            });

            req.flash("success", "Profile updated successfully");
            return res.redirect("/agent/profile");
        } else {
            throw new Error("Phone number is missing.");
        }
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        return res.redirect("back");
    }
});

module.exports = router;
