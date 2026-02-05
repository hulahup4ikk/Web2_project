const express = require("express");
const bcrypt = require("bcrypt");
const { connectToDatabase } = require("../mongo");

const router = express.Router();
const USERS_COLLECTION = "users";

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail.length < 5 || !cleanEmail.includes("@")) {
    return res.status(400).json({ error: "Invalid input" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const db = await connectToDatabase();
    const users = db.collection(USERS_COLLECTION);

    const exists = await users.findOne({ email: cleanEmail });
    if (exists) return res.status(409).json({ error: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    await users.insertOne({
      email: cleanEmail,
      password_hash,
      created_at: new Date().toISOString()
    });

    return res.status(201).json({ message: "Registered" });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  try {
    const db = await connectToDatabase();
    const users = db.collection(USERS_COLLECTION);

    const user = await users.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = String(user._id);
    req.session.email = user.email;

    return res.status(200).json({ message: "Logged in" });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.status(200).json({ message: "Logged out" });
  });
});

router.get("/me", (req, res) => {
  if (!req.session || !req.session.userId) return res.status(200).json({ authenticated: false });
  return res.status(200).json({
    authenticated: true,
    email: req.session.email || null
  });
});

module.exports = router;
