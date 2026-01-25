const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI environment variable is required. Please set it in your .env file or environment variables.');
}

let client;
let db;

async function connectToDatabase() {
  if (db) return db;

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    console.log('Successfully connected to MongoDB Atlas');

    db = client.db('todo_db');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

function getCollection(collectionName) {
  if (!db) throw new Error('Database not connected');
  return db.collection(collectionName);
}

module.exports = { connectToDatabase, getCollection };