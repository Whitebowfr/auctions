const { get_request } = require('../db');
const fetch = require('node-fetch');

const URL = process.env.REACT_APP_URL || "http://localhost:8080";

/**
 * Get statistics for an enchere
 */
const getEnchereStats = async (req, res) => {
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
};

/**
 * Get client purchases for an enchere
 */
const getClientPurchases = async (req, res) => {
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
};

/**
 * Get a complete report for an enchere
 */
const getEnchereReport = async (req, res) => {
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
};

module.exports = {
  getEnchereStats,
  getClientPurchases,
  getEnchereReport
};