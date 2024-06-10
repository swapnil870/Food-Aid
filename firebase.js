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
  apiKey: "AIzaSyAfJJoC7NyEyZeSScgjQT-4ScxcFdzz7NI",
  authDomain: "food-donation-system-1f45f.firebaseapp.com",
  projectId: "food-donation-system-1f45f",
  storageBucket: "food-donation-system-1f45f.appspot.com",
  messagingSenderId: "130151732478",
  appId: "1:130151732478:web:194a4cb3368c2251da81af"
};

firebase.initializeApp(firebaseConfig);

module.exports = { admin, firebase };
