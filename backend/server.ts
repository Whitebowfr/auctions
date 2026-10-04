import express from 'express';
import cors from 'cors';
import path from 'path';
import clientRoutes from './routes/clientRoutes.ts';
import enchereRoutes from './routes/enchereRoutes.ts';
import lotRoutes from './routes/lotRoutes.ts';
import participationRoutes from './routes/participationRoutes.ts';

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

// Error handling middleware

// Serve static frontend files
app.use(express.static(path.join(import.meta.dirname, 'public')));

// Catch-all route for SPA
app.get('*', function(_: any, res) {
  res.sendFile(path.resolve(import.meta.dirname, './public/index.html'));
});

// Initialize and start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Le logiciel est lancé sur l'URL suivante : ${URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
