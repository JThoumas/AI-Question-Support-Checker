const express = require('express');
const router = express.Router();

const loadDB = require('../utils/loadDB');
const saveDB = require('../utils/saveDB');

// GET all posts
router.get('/', (req, res) => {
  const db = loadDB();
  res.json(db.posts);
});

// CREATE a post
router.post('/', (req, res) => {
  const db = loadDB();

  const newPost = {
    id: Date.now(),
    author: req.body.author || 'Anonymous',
    question: req.body.question || '',
    summary: req.body.summary || '',
    keywords: req.body.keywords || [],
    upvotes: 0,
    downvotes: 0,
    comments: [],
    createdAt: new Date().toISOString()
  };

  db.posts.push(newPost);
  saveDB(db);

  res.json(newPost);
});

// VOTE on a post
router.post('/:id/vote', (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const { delta } = req.body; // 1 for upvote, -1 for downvote

  const post = db.posts.find(p => p.id == id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (delta === 1) {
    post.upvotes = (post.upvotes || 0) + 1;
  } else if (delta === -1) {
    post.downvotes = (post.downvotes || 0) + 1;
  }

  saveDB(db);
  res.json(post);
});

// CREATE a comment on a post
router.post('/:id/comments', (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  
  const post = db.posts.find(p => p.id == id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const newComment = {
    id: Date.now(),
    postId: parseInt(id),
    author: req.body.author || 'Anonymous',
    text: req.body.text || '',
    createdAt: new Date().toISOString()
  };

  // Add to comments array in database
  if (!db.comments) db.comments = [];
  db.comments.push(newComment);
  
  // Also add to post's comments array for easy access
  if (!post.comments) post.comments = [];
  post.comments.push(newComment);
  
  saveDB(db);
  res.json(newComment);
});

module.exports = router;
