const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("../mongo");

const router = express.Router();
const COLLECTION = "tasks";

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

function parseObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

function parseProjection(fieldsStr) {
  if (!fieldsStr || typeof fieldsStr !== "string") return null;
  const fields = fieldsStr.split(",").map((s) => s.trim()).filter(Boolean);
  if (fields.length === 0) return null;

  const projection = {};
  for (const f of fields) projection[f] = 1;
  projection._id = 1;
  return projection;
}

function parseSort(sort, order) {
  const dir = String(order).toLowerCase() === "desc" ? -1 : 1;
  const key = sort ? String(sort) : "created_at";
  return { [key]: dir };
}

router.get("/", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const col = db.collection(COLLECTION);

    const filter = {};

    if (req.query.is_done !== undefined) {
      const v = String(req.query.is_done).toLowerCase();
      if (v === "true" || v === "1") filter.is_done = true;
      else if (v === "false" || v === "0") filter.is_done = false;
    }

    if (req.query.q) {
      const q = String(req.query.q).trim();
      if (q) filter.title = { $regex: q, $options: "i" };
    }

    const projection = parseProjection(req.query.fields);
    const sort = parseSort(req.query.sort, req.query.order);

    const cursor = col.find(filter, projection ? { projection } : undefined).sort(sort);
    const items = await cursor.toArray();

    res.status(200).json({ count: items.length, items });
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/:id", async (req, res) => {
  const oid = parseObjectId(req.params.id);
  if (!oid) return res.status(400).json({ error: "Invalid id" });

  try {
    const db = await connectToDatabase();
    const col = db.collection(COLLECTION);

    const projection = parseProjection(req.query.fields);
    const item = await col.findOne({ _id: oid }, projection ? { projection } : undefined);

    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json(item);
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { title, description, is_done, priority, due_date, category, time_hour } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Missing or invalid field: title" });
  }

  if (priority !== undefined) {
    const p = Number(priority);
    if (!Number.isInteger(p) || p < 1 || p > 5) {
      return res.status(400).json({ error: "Invalid field: priority (1-5)" });
    }
  }

  if (due_date !== undefined && due_date !== null) {
    const d = new Date(due_date);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: "Invalid field: due_date (ISO date string)" });
    }
  }

  if (category !== undefined && category !== null) {
    if (typeof category !== "string") {
      return res.status(400).json({ error: "Invalid field: category" });
    }
  }

  if (time_hour !== undefined && time_hour !== null) {
    const h = Number(time_hour);
    if (!Number.isInteger(h) || h < 0 || h > 23) {
      return res.status(400).json({ error: "Invalid field: time_hour (0-23)" });
    }
  }

  const doc = {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : null,
    is_done: is_done === true,
    priority: priority !== undefined ? Number(priority) : null,
    due_date: due_date ? new Date(due_date).toISOString() : null,
    category: typeof category === "string" ? category.trim() : null,
    time_hour: time_hour !== undefined && time_hour !== null ? Number(time_hour) : null,
    owner: req.session?.email || null,
    created_at: new Date().toISOString()
  };

  try {
    const db = await connectToDatabase();
    const col = db.collection(COLLECTION);

    const r = await col.insertOne(doc);
    const created = await col.findOne({ _id: r.insertedId });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const oid = parseObjectId(req.params.id);
  if (!oid) return res.status(400).json({ error: "Invalid id" });

  const { title, description, is_done, priority, due_date, category, time_hour } = req.body;

  const update = {};
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Invalid field: title" });
    }
    update.title = title.trim();
  }
  if (description !== undefined) {
    if (description === null) update.description = null;
    else if (typeof description === "string") update.description = description.trim();
    else return res.status(400).json({ error: "Invalid field: description" });
  }
  if (is_done !== undefined) {
    if (typeof is_done !== "boolean") {
      return res.status(400).json({ error: "Invalid field: is_done (boolean required)" });
    }
    update.is_done = is_done;
  }
  if (priority !== undefined) {
    const p = Number(priority);
    if (!Number.isInteger(p) || p < 1 || p > 5) {
      return res.status(400).json({ error: "Invalid field: priority (1-5)" });
    }
    update.priority = p;
  }
  if (due_date !== undefined) {
    if (due_date === null || due_date === "") update.due_date = null;
    else {
      const d = new Date(due_date);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: "Invalid field: due_date (ISO date string)" });
      }
      update.due_date = d.toISOString();
    }
  }
  if (category !== undefined) {
    if (category === null) update.category = null;
    else if (typeof category === "string") update.category = category.trim();
    else return res.status(400).json({ error: "Invalid field: category" });
  }
  if (time_hour !== undefined) {
    if (time_hour === null || time_hour === "") update.time_hour = null;
    else {
      const h = Number(time_hour);
      if (!Number.isInteger(h) || h < 0 || h > 23) {
        return res.status(400).json({ error: "Invalid field: time_hour (0-23)" });
      }
      update.time_hour = h;
    }
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const db = await connectToDatabase();
    const col = db.collection(COLLECTION);

    const r = await col.findOneAndUpdate(
      { _id: oid },
      { $set: update },
      { returnDocument: "after" } // ок для новых драйверов
    );

    // Универсально: в одних версиях документ в r.value, в других — r это и есть документ
    const doc = r?.value ?? r;

    if (!doc) return res.status(404).json({ error: "Item not found" });
    return res.status(200).json(doc);
  } catch (e) {
    return res.status(500).json({ error: "Database error" });
  }
});



router.delete("/:id", requireAuth, async (req, res) => {
  const oid = parseObjectId(req.params.id);
  if (!oid) return res.status(400).json({ error: "Invalid id" });

  try {
    const db = await connectToDatabase();
    const col = db.collection(COLLECTION);

    const r = await col.deleteOne({ _id: oid });
    if (r.deletedCount === 0) return res.status(404).json({ error: "Item not found" });

    res.status(200).json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
