const express = require('express');
const cors = require('cors');

const postsRoute = require('./routes/posts');
const commentsRoute = require('./routes/comments');

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/posts', postsRoute);
app.use('/comments', commentsRoute);

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`JSON server running at http://localhost:${PORT}`);
});

const fs = require('fs');
const path = require('path');

module.exports = function loadDB() {
  const filePath = path.join(__dirname, '..', 'data.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};


