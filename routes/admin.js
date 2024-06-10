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

        // Find the donation and populate the donor field
        const donation = await Donation.findById(donationId).populate("donor");
        if (!donation) {
            req.flash("error", "Donation not found.");
            return res.redirect("back");
        }

        // Update the status of the donation
        donation.status = "accepted";
        await donation.save();

        // Send email to the donor
        const mailOptions = {
            from: process.env.EMAIL, // sender address
            to: donation.donor.email, // recipient address
            subject: 'Donation Accepted', // Subject line
            text: `Hello ${donation.donor.firstName},\n\nYour donation has been accepted.\n\nDonation ID: ${donation._id}\n\nThank you for your contribution.\n\nBest regards,\nYour Team`, // plain text body
        };

        await transporter.sendMail(mailOptions);

        req.flash("success", "Donation accepted successfully and donor notified via Email");
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
        
        // Find the donation and populate the donor field
        const donation = await Donation.findById(donationId).populate("donor");
        if (!donation) {
            req.flash("error", "Donation not found.");
            return res.redirect("back");
        }

        // Update the status of the donation
        donation.status = "rejected";
        await donation.save();

        // Send email to the donor
        const mailOptions = {
            from: process.env.EMAIL, // sender address
            to: donation.donor.email, // recipient address
            subject: 'Donation Rejected', // Subject line
            text: `Hello ${donation.donor.firstName},\n\nWe regret to inform you that your donation has been rejected.\n\nDonation ID: ${donation._id}\n\nPlease contact us if you have any questions.\n\nBest regards,\nYour Team`, // plain text body
        };

        await transporter.sendMail(mailOptions);        

        req.flash("success", "Donation rejected and donor notified via Email");
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
        const agentId = req.body.agent;
        const adminToAgentMsg = req.body.adminToAgentMsg;
        // const { agent, adminToAgentMsg } = req.body;
        
        // Log the request body to debug
        console.log(`Request Body: `, req.body);

        // Log the agent ID to debug
        console.log(`Assigning donation ${donationId} to agent ${agentId}`);

        // Find the selected agent
        const agent = await User.findById(agentId);
        if (!agent) {
            req.flash("error", "Selected agent not found.");
            return res.redirect("back");
        }

        const donation = await Donation.findById(donationId).populate("donor");
        if (!donation) {
            req.flash("error", "Donation not found.");
            return res.redirect("back");
        }

        // Log the populated donation to debug
        console.log("Donation:", donation);

        // Update the donation with the agent's ID
        donation.assignedAgent = agentId;
        donation.status = "assigned";
        donation.adminToAgentMsg = adminToAgentMsg;
        await donation.save();

        // Send email to the selected agent
        const mailOptions = {
            from: process.env.EMAIL, // sender address
            to: agent.email, // recipient address
            subject: 'New Donation Assignment', // Subject line
            text: `Hello ${agent.firstName},\n\nYou have been assigned a new donation.\n\nDonation ID: ${donation._id}\nDonor Name: ${donation.donor.firstName}\n\nPlease check your dashboard for more details.\n\nBest regards,\nNourish`, // plain text body
        };
        
        await transporter.sendMail(mailOptions);

        await Donation.findByIdAndUpdate(donationId, { status: "assigned", agent, adminToAgentMsg });
        req.flash("success", `Agent ${agent.firstName} has been assigned and notified via email.`);
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
