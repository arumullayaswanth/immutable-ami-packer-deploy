const express = require('express');
const path = require('path');
const app = express();
const port = 80;

// Serve index.html when visiting "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
