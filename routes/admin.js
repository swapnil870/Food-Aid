const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Donation = require("../models/donation.js");

// Ensure you have the firebase admin initialized
const { admin } = require('../firebase.js'); 

// Dashboard route
router.get("/admin/dashboard", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const numAdmins = await User.countDocuments({ role: "admin" });
        const numDonors = await User.countDocuments({ role: "donor" });
        const numAgents = await User.countDocuments({ role: "agent" });
        const numPendingDonations = await Donation.countDocuments({ status: "pending" });
        const numAcceptedDonations = await Donation.countDocuments({ status: "accepted" });
        const numAssignedDonations = await Donation.countDocuments({ status: "assigned" });
        const numCollectedDonations = await Donation.countDocuments({ status: "collected" });

        res.render("admin/dashboard", {
            title: "Dashboard",
            numAdmins,
            numDonors,
            numAgents,
            numPendingDonations,
            numAcceptedDonations,
            numAssignedDonations,
            numCollectedDonations
        });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// Pending donations route
router.get("/admin/donations/pending", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const pendingDonations = await Donation.find({ status: { $in: ["pending", "accepted", "assigned"] } }).populate("donor").populate('agent').exec();
        res.render("admin/pendingDonations", { title: "Pending Donations", pendingDonations });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// Previous donations route
router.get("/admin/donations/previous", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const previousDonations = await Donation.find({ status: "collected" }).populate("donor").populate('agent').exec();
        res.render("admin/previousDonations", { title: "Previous Donations", previousDonations });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// View donation details route
router.get("/admin/donation/view/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const donationId = req.params.donationId;
        const donation = await Donation.findById(donationId).populate("donor").populate("agent");
        res.render("admin/donation", { title: "Donation details", donation });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// Accept donation route
router.get("/admin/donation/accept/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const donationId = req.params.donationId;
        await Donation.findByIdAndUpdate(donationId, { status: "accepted" });
        req.flash("success", "Donation accepted successfully");
        res.redirect(`/admin/donation/view/${donationId}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// Reject donation route
router.get("/admin/donation/reject/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const donationId = req.params.donationId;
        await Donation.findByIdAndUpdate(donationId, { status: "rejected" });
        req.flash("success", "Donation rejected successfully");
        res.redirect(`/admin/donation/view/${donationId}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// Assign agent to donation route
router.get("/admin/donation/assign/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const donationId = req.params.donationId;
        const agents = await User.find({ role: "agent" });
        const donation = await Donation.findById(donationId).populate("donor").populate('agent').exec();
        res.render("admin/assignAgent", { title: "Assign agent", donation, agents });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// Handle agent assignment to donation
router.post("/admin/donation/assign/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const donationId = req.params.donationId;
        const { agent, adminToAgentMsg } = req.body;
        await Donation.findByIdAndUpdate(donationId, { status: "assigned", agent, adminToAgentMsg });
        req.flash("success", "Agent assigned successfully");
        res.redirect(`/admin/donation/view/${donationId}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// List agents route
router.get("/admin/agents", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const agents = await User.find({ role: "agent" });
        res.render("admin/agents", { title: "List of agents", agents });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

// Admin profile route
router.get("/admin/profile", middleware.ensureAdminLoggedIn, (req, res) => {
    res.render("admin/profile", { title: "My profile" });
});

// Update admin profile route
router.put("/admin/profile", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const id = req.user._id;
        const { firstName, lastName, gender, address, phone } = req.body.admin;

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
            return res.redirect("/admin/profile");
        } else {
            throw new Error("Country code or phone number is missing.");
        }
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        return res.redirect("back");
    }
});

// Combined donations route
router.get('/admin/donations', middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const previousDonations = await Donation.find().populate("donor");
        const donation = await Donation.findOne().populate("donor");
        res.render('admin/previousDonations', { previousDonations, donation });
    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});

module.exports = router;
