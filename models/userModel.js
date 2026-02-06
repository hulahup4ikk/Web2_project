const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("../config/db");

const COLLECTION = "users";

async function findByEmail(email) {
  const db = await connectToDatabase();
  return db.collection(COLLECTION).findOne({ email });
}

async function findById(id) {
  const db = await connectToDatabase();
  if (!ObjectId.isValid(id)) return null;
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

async function createUser(doc) {
  const db = await connectToDatabase();
  const r = await db.collection(COLLECTION).insertOne(doc);
  return db.collection(COLLECTION).findOne({ _id: r.insertedId });
}

async function updateRoleByEmail(email, role) {
  const db = await connectToDatabase();
  await db.collection(COLLECTION).updateOne(
    { email },
    { $set: { role } }
  );
  return db.collection(COLLECTION).findOne({ email });
}

module.exports = {
  COLLECTION,
  findByEmail,
  findById,
  createUser,
  updateRoleByEmail
};
