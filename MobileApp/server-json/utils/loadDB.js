const fs = require('fs');
const path = require('path');

module.exports = function loadDB() {
  const filePath = path.join(__dirname, '..', 'data.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};
