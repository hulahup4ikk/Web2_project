const { ObjectId } = require("mongodb");
const {
  find,
  findById,
  insert,
  updateById,
  deleteById,
  count
} = require("../models/taskModel");

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

function parseObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

async function list(req, res) {
  try {
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

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "10", 10)));
    const skip = (page - 1) * limit;

    if (req.session?.role !== "admin") {
      if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
      filter.ownerId = new ObjectId(req.session.userId);
    }

    const cursor = await find(filter, projection ? { projection } : undefined);
    const items = await cursor.sort(sort).skip(skip).limit(limit).toArray();
    const total = await count(filter);

    res.status(200).json({ count: items.length, total, page, limit, items });
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
}

async function getById(req, res) {
  const oid = parseObjectId(req.params.id);
  if (!oid) return res.status(400).json({ error: "Invalid id" });

  try {
    const projection = parseProjection(req.query.fields);
    const item = await findById(req.params.id, projection);

    if (!item) return res.status(404).json({ error: "Item not found" });
    if (req.session?.role !== "admin") {
      if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
      if (String(item.ownerId) !== String(req.session.userId)) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    res.status(200).json(item);
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
}

async function create(req, res) {
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
    ownerId: new ObjectId(req.session.userId),
    created_at: new Date().toISOString()
  };

  try {
    const created = await insert(doc);
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
}

async function update(req, res) {
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
    const r = await updateById(req.params.id, update);
    const doc = r?.value ?? r;
    if (!doc) return res.status(404).json({ error: "Item not found" });
    return res.status(200).json(doc);
  } catch (e) {
    return res.status(500).json({ error: "Database error" });
  }
}

async function remove(req, res) {
  const oid = parseObjectId(req.params.id);
  if (!oid) return res.status(400).json({ error: "Invalid id" });

  try {
    const r = await deleteById(req.params.id);
    if (r.deletedCount === 0) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: "Database error" });
  }
}

module.exports = { list, getById, create, update, remove };
