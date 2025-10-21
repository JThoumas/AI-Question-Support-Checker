const express = require('express');
const app = express();

// Use a port like 3001 to avoid conflicts
// React Native often uses 3000 or 8081
const PORT = process.env.PORT || 3001;

// A simple test route
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the AI Question Checker API!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});