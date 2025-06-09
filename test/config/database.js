const TingoDB = require('tingodb')().Db;
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../test_data');

// Create the directory if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

const db = new TingoDB(dbPath, {});

module.exports = db;
