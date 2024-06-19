const mongoose = require("mongoose");

const contactUsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile_no: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    }
})

const ContactUs = mongoose.model("ContactUs",contactUsSchema);
module.exports = ContactUs;