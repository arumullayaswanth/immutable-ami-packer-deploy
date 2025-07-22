const express = require('express');
const path = require('path');
const app = express();
const port = 80;

// Serve static files from "art" folder
app.use(express.static(path.join(__dirname, 'Netflix')));

// Optional: redirect "/" to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Netflix', 'index.html'));
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
