const bcrypt = require("bcrypt");
const { findByEmail, createUser } = require("../models/userModel");

async function register(req, res) {
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
    const exists = await findByEmail(cleanEmail);
    if (exists) return res.status(409).json({ error: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    await createUser({
      email: cleanEmail,
      password_hash,
      role: "user",
      created_at: new Date().toISOString()
    });

    return res.status(201).json({ message: "Registered" });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  try {
    const user = await findByEmail(email.trim().toLowerCase());
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = String(user._id);
    req.session.email = user.email;
    req.session.role = user.role || "user";

    return res.status(200).json({ message: "Logged in" });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.status(200).json({ message: "Logged out" });
  });
}

function me(req, res) {
  if (!req.session || !req.session.userId) return res.status(200).json({ authenticated: false });
  return res.status(200).json({
    authenticated: true,
    email: req.session.email || null,
    role: req.session.role || "user"
  });
}

module.exports = { register, login, logout, me };
