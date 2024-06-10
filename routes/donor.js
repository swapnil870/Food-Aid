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

router.get("/donor/dashboard", middleware.ensureDonorLoggedIn, async (req, res) => {
    const donorId = req.user._id;
    const numPendingDonations = await Donation.countDocuments({ donor: donorId, status: "pending" });
    const numAcceptedDonations = await Donation.countDocuments({ donor: donorId, status: "accepted" });
    const numAssignedDonations = await Donation.countDocuments({ donor: donorId, status: "assigned" });
    const numCollectedDonations = await Donation.countDocuments({ donor: donorId, status: "collected" });
    res.render("donor/dashboard", {
        title: "Dashboard",
        numPendingDonations,
        numAcceptedDonations,
        numAssignedDonations,
        numCollectedDonations
    });
});

router.get("/donor/donate", middleware.ensureDonorLoggedIn, (req, res) => {
    res.render("donor/donate", { title: "Donate" });
});

router.post("/donor/donate", middleware.ensureDonorLoggedIn, async (req, res) => {
    try {
        const donation = req.body.donation;
        donation.status = "pending";
        donation.donor = req.user._id;
        if (!donation.phone) {
            throw new Error('Phone number is missing.');
        }
        const newDonation = new Donation(donation);
        await newDonation.save();

        // Fetch admin email from the User collection
        const admin = await User.findOne({ role: "admin" });
        if (!admin) {
            throw new Error("Admin not found");
        }
        const adminEmail = admin.email;

        // Send email notification to admin
        const mailOptionsAdmin = {
            from: process.env.EMAIL,
            to: adminEmail,
            subject: 'New Donation Request',
            text: `A new donation request has been made.\n\nDetails:\nDonor: ${req.user.firstName} ${req.user.lastName}\nDonation ID: ${newDonation._id}\nFood Type: ${newDonation.foodType}\nQuantity: ${newDonation.quantity}\nCooking Time: ${newDonation.cookingTime}\nAddress: ${newDonation.address}\nPhone: ${newDonation.phone}\n\nBest regards,\nYour Organization`
        };

        await transporter.sendMail(mailOptionsAdmin);

        req.flash("success", "Donation request sent successfully and notified via Email");
        res.redirect("/donor/donations/pending");
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

router.get("/donor/donations/pending", middleware.ensureDonorLoggedIn, async (req, res) => {
    try {
        const pendingDonations = await Donation.find({ donor: req.user._id, status: ["pending", "rejected", "accepted", "assigned"] }).populate("agent").exec();
        res.render("donor/pendingDonations", { title: "Pending Donations", pendingDonations });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

router.get("/donor/donations/previous", middleware.ensureDonorLoggedIn, async (req, res) => {
    try {
        const previousDonations = await Donation.find({ donor: req.user._id, status: "collected" }).populate("agent");
        res.render("donor/previousDonations", { title: "Previous Donations", previousDonations });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

router.get("/donor/donation/deleteRejected/:donationId", async (req, res) => {
    try {
        const donationId = req.params.donationId;
        await Donation.findByIdAndDelete(donationId);
        res.redirect("/donor/donations/pending");
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

router.get("/donor/profile", middleware.ensureDonorLoggedIn, (req, res) => {
    res.render("donor/profile", { title: "My Profile" });
});

router.put("/donor/profile", middleware.ensureDonorLoggedIn, async (req, res) => {
    try {
        const id = req.user._id;
        const { firstName, lastName, gender, address, phone } = req.body.donor;

        if (phone) {
            await User.findByIdAndUpdate(id, {
                firstName,
                lastName,
                gender,
                address,
                phone
            });

            req.flash("success", "Profile updated successfully");
            return res.redirect("/donor/profile");
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