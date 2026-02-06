const express = require("express");
const { requireAuth, requireOwnerOrAdmin } = require("../middleware/auth");
const { list, getById, create, update, remove } = require("../controllers/taskController");

const router = express.Router();

router.get("/", requireAuth, list);
router.get("/:id", requireAuth, getById);
router.post("/", requireAuth, create);
router.put("/:id", requireOwnerOrAdmin, update);
router.delete("/:id", requireOwnerOrAdmin, remove);

module.exports = router;
