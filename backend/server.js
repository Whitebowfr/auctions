const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { 
  get_request, 
  post_request, 
  put_request, 
  delete_request, 
  transaction,
  testConnection, 
  initializeDatabase 
} = require('./db');

const app = express();
const URL = process.env.REACT_APP_URL || "http://localhost:8080"
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};

// ============================================
// CLIENT ENDPOINTS
// ============================================

// Get all clients
app.get('/api/clients', asyncHandler(async (req, res) => {
  const clients = await get_request("SELECT * FROM client ORDER BY name");
  res.json(clients);
}));

// Get single client
app.get('/api/clients/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clients = await get_request("SELECT * FROM client WHERE id = ?", [id]);
  
  if (clients.length === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  res.json(clients[0]);
}));

// Create new client
app.post('/api/clients', asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  
  // Check if email already exists
  const existing = await get_request("SELECT id FROM client WHERE email = ?", [email]);
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Client with this email already exists' });
  }
  
  const result = await post_request(
    "INSERT INTO client (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)",
    [name, email, phone || '', address || '', req.body.notes || '']
  );
  
  const newClient = await get_request("SELECT * FROM client WHERE id = ?", [result.insertId]);
  res.status(201).json(newClient[0]);
}));

// Update client
app.put('/api/clients/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Add notes to the destructured fields
  const { name, email, phone, address, notes } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  
  // Check if client exists
  const existing = await get_request("SELECT id FROM client WHERE id = ?", [id]);
  if (existing.length === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // Check if email is taken by another client
  const emailCheck = await get_request("SELECT id FROM client WHERE email = ? AND id != ?", [email, id]);
  if (emailCheck.length > 0) {
    return res.status(409).json({ message: 'Email is already taken by another client' });
  }
  
  await put_request(
    "UPDATE client SET name = ?, email = ?, phone = ?, address = ?, notes = ? WHERE id = ?",
    // Use notes variable directly
    [name, email, phone || '', address || '', notes || '', id]
  );
  
  const updatedClient = await get_request("SELECT * FROM client WHERE id = ?", [id]);
  res.json(updatedClient[0]);
}));

// Delete client
app.delete('/api/clients/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await delete_request("DELETE FROM client WHERE id = ?", [id]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  res.json({ message: 'Client deleted successfully' });
}));

// ============================================
// ENCHERES ENDPOINTS
// ============================================

// Get all encheres
app.get('/api/encheres', asyncHandler(async (req, res) => {
  const encheres = await get_request("SELECT * FROM encheres ORDER BY date DESC");
  res.json(encheres);
}));

// Get single enchere
app.get('/api/encheres/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const encheres = await get_request("SELECT * FROM encheres WHERE id = ?", [id]);
  
  if (encheres.length === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  res.json(encheres[0]);
}));

// Create new enchere
app.post('/api/encheres', asyncHandler(async (req, res) => {
  const { name, date, address } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  const result = await post_request(
    "INSERT INTO encheres (name, date, address) VALUES (?, ?, ?)",
    [name, date.split("T")[0], address || '']
  );
  
  const newEnchere = await get_request("SELECT * FROM encheres WHERE id = ?", [result.insertId]);
  res.status(201).json(newEnchere[0]);
}));

// Update enchere
app.put('/api/encheres/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, date, address } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  const result = await put_request(
    "UPDATE encheres SET name = ?, date = ?, address = ? WHERE id = ?",
    [name, date, address || '', id]
  );
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  const updatedEnchere = await get_request("SELECT * FROM encheres WHERE id = ?", [id]);
  res.json(updatedEnchere[0]);
}));

// Delete enchere
app.delete('/api/encheres/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await delete_request("DELETE FROM encheres WHERE id = ?", [id]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  res.json({ message: 'Enchere deleted successfully' });
}));

// ============================================
// LOTS ENDPOINTS
// ============================================

// Get all lots for an enchere
app.get('/api/encheres/:enchereId/lots', asyncHandler(async (req, res) => {
  const { enchereId } = req.params;
  
  const lots = await get_request(`
    SELECT l.*, c.name as sold_to_name
    FROM lots l 
    LEFT JOIN client c ON l.sold_to = c.id 
    WHERE l.enchere_id = ? 
    ORDER BY l.id
  `, [enchereId]);
  
  res.json(lots);
}));

// Get single lot
app.get('/api/lots/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const lots = await get_request(`
    SELECT l.*, c.name as sold_to_name
    FROM lots l 
    LEFT JOIN client c ON l.sold_to = c.id 
    WHERE l.id = ?
  `, [id]);
  
  if (lots.length === 0) {
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  res.json(lots[0]);
}));

// Create new lot
app.post('/api/encheres/:enchereId/lots', upload.single('image'), asyncHandler(async (req, res) => {
  const { enchereId } = req.params;
  const { name, description, category, starting_price, notes } = req.body;
  
  if (!starting_price || starting_price < 0) {
    return res.status(400).json({ message: 'Valid starting price is required' });
  }
  
  // Verify enchere exists
  const enchere = await get_request("SELECT id FROM encheres WHERE id = ?", [enchereId]);
  if (enchere.length === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  // Create lot with notes
  const result = await post_request(
    "INSERT INTO lots (enchere_id, name, description, category, starting_price, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [enchereId, name, description || '', category || '', starting_price || 0, notes || '']
  );
  
  const newLot = await get_request("SELECT * FROM lots WHERE id = ?", [result.insertId]);
  res.status(201).json(newLot[0]);
}));

// Update lot
app.put('/api/lots/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, category, starting_price, notes } = req.body;
  
  if (starting_price !== undefined && (starting_price < 0)) {
    return res.status(400).json({ message: 'Starting price must be non-negative' });
  }
  
  await put_request(
    "UPDATE lots SET name = ?, description = ?, category = ?, starting_price = ?, notes = ? WHERE id = ?",
    [name, description || '', category || '', starting_price || 0, notes || '', id]
  );
  
  const updatedLot = await get_request("SELECT * FROM lots WHERE id = ?", [id]);
  res.json(updatedLot[0]);
}));

// Sell lot
app.post('/api/lots/:id/sell', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { clientId, soldPrice } = req.body;
  
  if (!clientId || !soldPrice || soldPrice <= 0) {
    return res.status(400).json({ message: 'Client ID and valid sold price are required' });
  }
  
  // Verify lot exists and is not already sold
  const lot = await get_request("SELECT * FROM lots WHERE id = ?", [id]);
  if (lot.length === 0) {
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  if (lot[0].sold_to !== null) {
    return res.status(400).json({ message: 'Lot is already sold' });
  }
  
  // Verify client exists
  const client = await get_request("SELECT id FROM client WHERE id = ?", [clientId]);
  if (client.length === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // Update lot as sold
  await put_request(
    "UPDATE lots SET sold_price = ?, sold_to = ? WHERE id = ?",
    [soldPrice, clientId, id]
  );
  
  const updatedLot = await get_request(`
    SELECT l.*, c.name as sold_to_name
    FROM lots l 
    LEFT JOIN client c ON l.sold_to = c.id 
    WHERE l.id = ?
  `, [id]);
  
  res.json(updatedLot[0]);
}));

// Delete lot
app.delete('/api/lots/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await delete_request("DELETE FROM lots WHERE id = ?", [id]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  res.json({ message: 'Lot deleted successfully' });
}));

// ============================================
// IMAGES ENDPOINTS
// ============================================

// Get images for a lot
app.get('/api/lots/:lotId/images', asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  
  const images = await get_request("SELECT * FROM images WHERE lot_id = ?", [lotId]);
  res.json(images);
}));

// Upload image for a lot
app.post('/api/lots/:lotId/images', upload.single('image'), asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  const { name, description } = req.body;
  
  console.log('Upload request received:', { lotId, name, description, file: req.file });
  
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }
  
  // Verify lot exists
  const lot = await get_request("SELECT id FROM lots WHERE id = ?", [lotId]);
  if (lot.length === 0) {
    return res.status(404).json({ message: 'Lot not found' });
  }
  
  console.log('Saving image to database:', {
    lotId,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
  
  const result = await post_request(
    "INSERT INTO images (lot_id, name, description, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)",
    [
      lotId,
      name || req.file.originalname,
      description || '',
      req.file.filename,
      req.file.size,
      req.file.mimetype
    ]
  );
  
  const newImage = await get_request("SELECT * FROM images WHERE id = ?", [result.insertId]);
  
  console.log('Image saved successfully:', newImage[0]);
  
  res.status(201).json({
    ...newImage[0],
    url: `/uploads/${req.file.filename}`
  });
}));

// Delete image
app.delete('/api/images/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get image info before deletion
  const image = await get_request("SELECT * FROM images WHERE id = ?", [id]);
  if (image.length === 0) {
    return res.status(404).json({ message: 'Image not found' });
  }
  
  // Delete file from filesystem
  const filePath = path.join(uploadsDir, image[0].file_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  // Delete from database
  await delete_request("DELETE FROM images WHERE id = ?", [id]);
  
  res.json({ message: 'Image deleted successfully' });
}));

// ============================================
// PARTICIPATION ENDPOINTS
// ============================================

// Get participants for an enchere
app.get('/api/encheres/:enchereId/participants', asyncHandler(async (req, res) => {
  const { enchereId } = req.params;
  
  const participants = await get_request(`
    SELECT c.*, p.local_number, p.registered_at 
    FROM client c 
    JOIN participation p ON c.id = p.client_id 
    WHERE p.enchere_id = ? 
    ORDER BY p.local_number
  `, [enchereId]);
  
  res.json(participants);
}));

// Add participant to enchere
app.post('/api/encheres/:enchereId/participants', asyncHandler(async (req, res) => {
  const { enchereId } = req.params;
  const { clientId, localNumber, notes } = req.body;
  
  if (!clientId) {
    return res.status(400).json({ message: 'Client ID is required' });
  }
  
  // Verify enchere exists
  const enchere = await get_request("SELECT id FROM encheres WHERE id = ?", [enchereId]);
  if (enchere.length === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  // Verify client exists
  const client = await get_request("SELECT id FROM client WHERE id = ?", [clientId]);
  if (client.length === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // Check if already participating
  const existing = await get_request(
    "SELECT id FROM participation WHERE enchere_id = ? AND client_id = ?",
    [enchereId, clientId]
  );
  
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Client is already participating in this enchere' });
  }
  
  // Generate local number if not provided
  let finalLocalNumber = localNumber;
  if (!finalLocalNumber) {
    const maxNumber = await get_request(
      "SELECT MAX(CAST(local_number AS UNSIGNED)) as max_num FROM participation WHERE enchere_id = ?",
      [enchereId]
    );
    finalLocalNumber = String((maxNumber[0].max_num || 0) + 1).padStart(3, '0');
  }
  
  await post_request(
    "INSERT INTO participation (enchere_id, client_id, local_number) VALUES (?, ?, ?)",
    [enchereId, clientId, finalLocalNumber]
  );
  
  // Return the participant with details
  const participant = await get_request(`
    SELECT c.*, p.local_number, p.registered_at 
    FROM client c 
    JOIN participation p ON c.id = p.client_id 
    WHERE p.enchere_id = ? AND p.client_id = ?
  `, [enchereId, clientId]);
  
  res.status(201).json(participant[0]);
}));

// Remove participant from enchere
app.delete('/api/encheres/:enchereId/participants/:clientId', asyncHandler(async (req, res) => {
  const { enchereId, clientId } = req.params;
  
  const result = await delete_request(
    "DELETE FROM participation WHERE enchere_id = ? AND client_id = ?",
    [enchereId, clientId]
  );
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Participation not found' });
  }
  
  res.json({ message: 'Participant removed successfully' });
}));

// Add endpoint to update participant notes
app.put('/api/encheres/:enchereId/participants/:clientId', asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const { notes } = req.body;
  
  // Update notes in the client table (global)
  await put_request(
    "UPDATE client SET notes = ? WHERE id = ?",
    [notes || '', clientId]
  );
  
  res.json({ message: 'Client notes updated successfully' });
}));

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

// Get enchere statistics
app.get('/api/encheres/:enchereId/stats', asyncHandler(async (req, res) => {
  const { enchereId } = req.params;
  
  const [totalLots] = await get_request(
    "SELECT COUNT(*) as count FROM lots WHERE enchere_id = ?",
    [enchereId]
  );
  
  const [soldLots] = await get_request(
    "SELECT COUNT(*) as count FROM lots WHERE enchere_id = ? AND sold_to IS NOT NULL",
    [enchereId]
  );
  
  const [revenue] = await get_request(
    "SELECT SUM(sold_price) as total FROM lots WHERE enchere_id = ? AND sold_to IS NOT NULL",
    [enchereId]
  );
  
  const [startingValue] = await get_request(
    "SELECT SUM(starting_price) as total FROM lots WHERE enchere_id = ?",
    [enchereId]
  );
  
  const [participants] = await get_request(
    "SELECT COUNT(*) as count FROM participation WHERE enchere_id = ?",
    [enchereId]
  );
  
  res.json({
    totalLots: totalLots.count,
    soldLots: soldLots.count,
    availableLots: totalLots.count - soldLots.count,
    totalRevenue: revenue.total || 0,
    totalStartingValue: startingValue.total || 0,
    totalProfit: (revenue.total || 0) - (startingValue.total || 0),
    totalParticipants: participants.count,
    successRate: totalLots.count > 0 ? ((soldLots.count / totalLots.count) * 100) : 0
  });
}));

// Get client purchases for an enchere
app.get('/api/encheres/:enchereId/clients/:clientId/purchases', asyncHandler(async (req, res) => {
  const { enchereId, clientId } = req.params;
  
  const purchases = await get_request(`
    SELECT l.*, (l.sold_price - l.starting_price) as profit
    FROM lots l 
    WHERE l.enchere_id = ? AND l.sold_to = ?
    ORDER BY l.id
  `, [enchereId, clientId]);
  
  const totalSpent = purchases.reduce((sum, p) => sum + (p.sold_price || 0), 0);
  const totalProfit = purchases.reduce((sum, p) => sum + (p.profit || 0), 0);
  
  res.json({
    purchases,
    summary: {
      totalItems: purchases.length,
      totalSpent,
      totalProfit,
      averagePrice: purchases.length > 0 ? totalSpent / purchases.length : 0
    }
  });
}));

// Get complete enchere report
app.get('/api/encheres/:enchereId/report', asyncHandler(async (req, res) => {
  const { enchereId } = req.params;
  
  // Get enchere details
  const enchere = await get_request("SELECT * FROM encheres WHERE id = ?", [enchereId]);
  if (enchere.length === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  // Get stats
  const statsResponse = await fetch(`${URL}/api/encheres/${enchereId}/stats`);
  const stats = await statsResponse.json();
  
  // Get top sales
  const topSales = await get_request(`
    SELECT l.name, l.sold_price, l.starting_price, c.name as client_name
    FROM lots l 
    JOIN client c ON l.sold_to = c.id 
    WHERE l.enchere_id = ? AND l.sold_to IS NOT NULL 
    ORDER BY l.sold_price DESC 
    LIMIT 10
  `, [enchereId]);
  
  // Get sales by category
  const categoryBreakdown = await get_request(`
    SELECT 
      l.category,
      COUNT(*) as items_sold,
      SUM(l.sold_price) as total_revenue,
      AVG(l.sold_price) as average_price
    FROM lots l 
    WHERE l.enchere_id = ? AND l.sold_to IS NOT NULL 
    GROUP BY l.category
    ORDER BY total_revenue DESC
  `, [enchereId]);
  
  res.json({
    enchere: enchere[0],
    stats,
    topSales,
    categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : [{ category: 'No sales yet', items_sold: 0, total_revenue: 0, average_price: 0 }]
  });
}));

// Auth endpoint (keeping your existing one)
app.use('/login', (req, res) => {
  res.send({
    token: 'test123'
  });
});

// Error handling middleware
app.use(errorHandler);

app.use(express.static(path.join(__dirname, 'public')));

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
