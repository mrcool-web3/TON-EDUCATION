
// Import necessary modules
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files if needed
app.use(express.static('public'));

// API Route
app.get('/', (req, res) => {
    res.send('TON EDUCATION Mini App is running!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
