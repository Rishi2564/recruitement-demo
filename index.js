const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const collectionRef = db.collection("recruitmentForms");

// POST API → Save form data
app.post("/apply", async (req, res) => {
  try {
    const formData = req.body;
    const newDoc = await collectionRef.add(formData);
    res.status(201).send({ id: newDoc.id, message: "Form submitted!" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// GET API → Fetch all form submissions
app.get("/applications", async (req, res) => {
  try {
    const snapshot = await collectionRef.get();
    const forms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.send(forms);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
