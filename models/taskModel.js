const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("../config/db");

const COLLECTION = "tasks";

function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

async function findById(id, projection) {
  const db = await connectToDatabase();
  const oid = toObjectId(id);
  if (!oid) return null;
  return db.collection(COLLECTION).findOne({ _id: oid }, projection ? { projection } : undefined);
}

async function find(filter, options = {}) {
  const db = await connectToDatabase();
  return db.collection(COLLECTION).find(filter, options);
}

async function count(filter) {
  const db = await connectToDatabase();
  return db.collection(COLLECTION).countDocuments(filter);
}

async function insert(doc) {
  const db = await connectToDatabase();
  const r = await db.collection(COLLECTION).insertOne(doc);
  return db.collection(COLLECTION).findOne({ _id: r.insertedId });
}

async function updateById(id, update) {
  const db = await connectToDatabase();
  const oid = toObjectId(id);
  if (!oid) return null;
  return db.collection(COLLECTION).findOneAndUpdate(
    { _id: oid },
    { $set: update },
    { returnDocument: "after" }
  );
}

async function deleteById(id) {
  const db = await connectToDatabase();
  const oid = toObjectId(id);
  if (!oid) return null;
  return db.collection(COLLECTION).deleteOne({ _id: oid });
}

module.exports = {
  COLLECTION,
  toObjectId,
  findById,
  find,
  count,
  insert,
  updateById,
  deleteById
};
