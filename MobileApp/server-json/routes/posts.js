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
    text: req.body.text || '',
    votes: 0,
    aiSummary: req.body.aiSummary || '',
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
  const { direction } = req.body; // "up" or "down"

  const post = db.posts.find(p => p.id == id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (direction === 'up') post.votes++;
  if (direction === 'down') post.votes--;

  saveDB(db);
  res.json(post);
});

module.exports = router;
