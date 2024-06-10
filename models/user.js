const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique:true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ["male", "female"]
    },
    address: String,
    phone: String, // Changed from Number to String
    joinedTime: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ["admin", "donor", "agent"],
        required: true
    },
    securityKey: {
        type: String,
        required: function() { return this.role === 'admin'; } // only required for admin role
    }
});

const User = mongoose.model("users", userSchema);
module.exports = User;
