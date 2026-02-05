require('dotenv').config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { connectToDatabase } = require("./mongo");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev_secret_change_me";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", 1);

app.use(session({
  name: "sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "contact.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.use("/search", require("./routes/searchRoutes"));
app.use("/item", require("./routes/itemRoutes"));
app.use("/contact", require("./routes/contactRoutes"));

app.use("/api/tasks", require("./routes/tasksRoutes"));

app.use("/auth", require("./routes/authRoutes"));

app.use("/api", require("./routes/apiRoutes"));

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

async function ensureAdminUser() {
  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "");
  if (!adminEmail || !adminPassword) return;

  const db = await connectToDatabase();
  const users = db.collection("users");

  const existing = await users.findOne({ email: adminEmail });
  if (existing) return;

  const password_hash = await bcrypt.hash(adminPassword, 10);
  await users.insertOne({
    email: adminEmail,
    password_hash,
    created_at: new Date().toISOString()
  });
}

connectToDatabase()
  .then(() => {
    return ensureAdminUser();
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(() => process.exit(1));
