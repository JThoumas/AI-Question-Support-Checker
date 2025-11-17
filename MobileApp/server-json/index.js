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
  console.log(`🚀 JSON server running at http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   - GET  /posts`);
  console.log(`   - POST /posts`);
  console.log(`   - POST /posts/:id/vote`);
  console.log(`   - GET  /comments?postId=<id>`);
  console.log(`   - POST /comments`);
});
