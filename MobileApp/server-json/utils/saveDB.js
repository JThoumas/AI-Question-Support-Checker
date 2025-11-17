const fs = require('fs');
const path = require('path');

module.exports = function saveDB(db) {
  const filePath = path.join(__dirname, '..', 'data.json');
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
};
