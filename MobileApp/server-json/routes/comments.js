const express = require('express');
const router = express.Router();

const loadDB = require('../utils/loadDB');
const saveDB = require('../utils/saveDB');

// GET comments for a given post
router.get('/', (req, res) => {
  const db = loadDB();
  const { postId } = req.query;
  const comments = db.comments.filter(c => c.postId == postId);
  res.json(comments);
});

// CREATE a comment
router.post('/', (req, res) => {
  const db = loadDB();

  const newComment = {
    id: Date.now(),
    postId: req.body.postId,
    text: req.body.text || '',
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);
  saveDB(db);

  res.json(newComment);
});

module.exports = router;
