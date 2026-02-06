const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("../config/db");

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.session.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

async function requireOwnerOrAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const taskId = req.params.id;
  if (!ObjectId.isValid(taskId)) return res.status(400).json({ error: "Invalid id" });

  try {
    const db = await connectToDatabase();
    const task = await db.collection("tasks").findOne({ _id: new ObjectId(taskId) });
    if (!task) return res.status(404).json({ error: "Item not found" });

    const isOwner = String(task.ownerId) === String(req.session.userId);
    const isAdmin = req.session.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    return next();
  } catch (e) {
    return res.status(500).json({ error: "Database error" });
  }
}

module.exports = { requireAuth, requireRole, requireOwnerOrAdmin };
