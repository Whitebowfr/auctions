const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./db');
const { errorHandler } = require('./middleware/errorHandler');
const { setupUploadDir } = require('./utils/fileUtils');

// Import routes
const clientRoutes = require('./routes/clientRoutes');
const enchereRoutes = require('./routes/enchereRoutes');
const lotRoutes = require('./routes/lotRoutes');
const imageRoutes = require('./routes/imageRoutes');
const participationRoutes = require('./routes/participationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const URL = process.env.REACT_APP_URL || "http://localhost:8080";
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup uploads directory
const uploadsDir = setupUploadDir();
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/encheres', enchereRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/images', imageRoutes);
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
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`🚀 API is running on ${URL}, port ${PORT}`);
      console.log(`📁 File uploads available at ${URL}/uploads/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
