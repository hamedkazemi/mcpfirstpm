const { Db, ObjectID } = require('tingodb')();
const path = require('path');
const fs = require('fs');

let dbPath;

if (process.env.NODE_ENV === 'test') {
  dbPath = path.join(__dirname, '../../test_data');
} else {
  dbPath = path.join(__dirname, '../../data');
}

// Create data directory if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
  console.log(`Database directory created at: ${dbPath}`);
} else {
  console.log(`Database directory already exists at: ${dbPath}`);
}

// Initialize TingoDB database
const db = new Db(dbPath, {});
console.log(`TingoDB initialized with path: ${dbPath}`);

// Export database instance and ObjectID
module.exports = {
  db,
  ObjectID,
  dbPath // Exporting dbPath for potential verification or use in tests
};
