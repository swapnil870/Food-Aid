require('dotenv').config();
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const firebase = require("firebase/app");
require("firebase/auth");

const serviceAccountPath = path.resolve(__dirname, process.env.SERVICE_ACCOUNT_KEY_PATH);

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account key file not found: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firebaseConfig = {
  apiKey: "AIzaSyCLvZ-thlW5gC1EQnhyBeeSSfLRadWUZ78",
  authDomain: "food-donation-system-87d9d.firebaseapp.com",
  projectId: "food-donation-system-87d9d",
  storageBucket: "food-donation-system-87d9d.appspot.com",
  messagingSenderId: "134570691935",
  appId: "1:134570691935:web:0439343cee3916e7c8faea",
};

firebase.initializeApp(firebaseConfig);

module.exports = { admin, firebase };
