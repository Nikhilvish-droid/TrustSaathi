const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import your router files
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Link the router file to a specific base path
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'TrustSaathi Backend is running smoothly.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});