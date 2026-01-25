require('dotenv').config();
const express = require("express");
const path = require("path");
const { connectToDatabase } = require("./mongo");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

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

app.use("/search", require("./routes/searchRoutes"));
app.use("/item", require("./routes/itemRoutes"));
app.use("/contact", require("./routes/contactRoutes"));

app.use("/api/tasks", require("./routes/tasksRoutes"));

app.use("/api", require("./routes/apiRoutes"));

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(() => process.exit(1));