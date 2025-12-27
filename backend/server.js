const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const clientRoutes = require('./routes/clientRoutes');
const enchereRoutes = require('./routes/enchereRoutes');
const lotRoutes = require('./routes/lotRoutes');
const participationRoutes = require('./routes/participationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const URL = process.env.REACT_APP_URL || "http://localhost:8080";
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: image/file upload features are disabled in the lightweight JSON backend

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/encheres', enchereRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api', participationRoutes); // Contains nested routes
app.use('/api', analyticsRoutes);     // Contains nested routes

// Error handling middleware
app.use(errorHandler);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route for SPA
app.get('*', function (req, res) {
  res.sendFile(path.resolve(__dirname, './public/index.html'));
});

// Initialize and start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 API is running on ${URL}, port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
