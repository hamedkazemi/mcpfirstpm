const { Db, ObjectID } = require('tingodb')();
const path = require('path');

// Create data directory if it doesn't exist
const dbPath = path.join(__dirname, '../../data');

// Initialize TingoDB database
const db = new Db(dbPath, {});

// Export database instance and ObjectID
module.exports = {
  db,
  ObjectID
};
