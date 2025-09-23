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

app.post("/apply", async (req, res) => {
  try {
    const formData = req.body;

    const docRef = collectionRef.doc(formData.raNumber); // use raNumber as doc ID
    const existing = await docRef.get();

    if (existing.exists) {
      return res.status(400).send({ error: "RA Number already exists!" });
    }

    await docRef.set({
      ...formData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).send({ id: docRef.id, message: "Form submitted!" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


app.get("/applications", async (req, res) => {
  try {
    const snapshot = await collectionRef.orderBy("createdAt", "desc").get();
    const forms = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
          ? data.createdAt.toDate().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
          : null
      };
    });

    res.status(200).send(forms);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
// DELETE application by raNumber
app.delete("/remove/:raNumber", async (req, res) => {
  console.log("Hit delete route:", req.params.raNumber);
  try {
    const { raNumber } = req.params;
    const docRef = collectionRef.doc(raNumber);
    const doc = await docRef.get();
     console.log("Firestore doc exists?", doc.exists);
    if (!doc.exists) {
      return res.status(404).send({ error: "Application not found!" });
    }

    await docRef.delete();
    res.status(200).send({ message: `Application with RA Number ${raNumber} deleted successfully!` });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
