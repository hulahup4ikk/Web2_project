const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("../mongo");

const router = express.Router();
const COLLECTION = "tasks";

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

router.post("/", async (req, res) => {
  const { title, description, is_done } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Missing or invalid field: title" });
  }

  const doc = {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : null,
    is_done: is_done === true,
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

router.put("/:id", async (req, res) => {
  const oid = parseObjectId(req.params.id);
  if (!oid) return res.status(400).json({ error: "Invalid id" });

  const { title, description, is_done } = req.body;

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



router.delete("/:id", async (req, res) => {
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