// server-json/index.js
// Simple JSON backend for posts, comments, votes, and AI forwarding

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const PORT = 3002;
const app = express();

app.use(cors());
app.use(express.json());

// Paths to JSON "database"
const DB_PATH = path.join(__dirname, "database.json");
const POSTS_FILE = path.join(__dirname, "posts.json");

// -----------------------------
// Helper: Read JSON File
// -----------------------------
function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  const data = fs.readFileSync(file);
  return JSON.parse(data);
}

// -----------------------------
// Helper: Write JSON File
// -----------------------------
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===============================
// 1. GET ALL POSTS
// ===============================
app.get("/posts", (req, res) => {
  const posts = readJSON(POSTS_FILE);
  res.json(posts);
});

// ===============================
// 2. CREATE NEW POST
// ===============================
app.post("/posts", (req, res) => {
  const posts = readJSON(POSTS_FILE);

  const newPost = {
    id: Date.now().toString(),
    author: req.body.author || "Anonymous",
    text: req.body.text,
    likes: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  };

  posts.unshift(newPost); // newest at top
  writeJSON(POSTS_FILE, posts);

  res.status(201).json(newPost);
});

// ===============================
// 3. LIKE A POST
// ===============================
app.post("/posts/:id/like", (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const post = posts.find((p) => p.id === req.params.id);

  if (!post) return res.status(404).json({ error: "Post not found" });

  post.likes += 1;
  writeJSON(POSTS_FILE, posts);

  res.json({ likes: post.likes });
});

// ===============================
// 4. ADD COMMENT
// ===============================
app.post("/posts/:id/comment", (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const post = posts.find((p) => p.id === req.params.id);

  if (!post) return res.status(404).json({ error: "Post not found" });

  const newComment = {
    id: Date.now().toString(),
    text: req.body.text,
    author: req.body.author || "Anonymous",
    createdAt: new Date().toISOString(),
  };

  post.comments.push(newComment);
  writeJSON(POSTS_FILE, posts);

  res.status(201).json(newComment);
});

// ===============================
// 5. AI FORWARDING
// (Uses your EXISTING backend AI route)
// ===============================
app.post("/ai", async (req, res) => {
  try {
    const response = await fetch("http://localhost:3001/api/generate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI server unavailable" });
  }
});

// ===============================
// Start server-json
// ===============================
app.listen(PORT, () => {
  console.log(`JSON backend running at http://localhost:${PORT}`);
});

