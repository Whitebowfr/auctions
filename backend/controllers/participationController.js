const { get_request, post_request, put_request, delete_request } = require('../db');

/**
 * Get all participants for an enchere
 */
const getParticipants = async (req, res) => {
  const { enchereId } = req.params;
  
  const participants = await get_request(`
    SELECT p.*, c.name, c.email, c.phone, c.address
    FROM participation p
    JOIN client c ON p.client_id = c.id
    WHERE p.enchere_id = ?
    ORDER BY p.registered_at DESC
  `, [enchereId]);
  
  // Format the response
  const formattedParticipants = participants.map(p => ({
    id: p.client_id,
    participation_id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    address: p.address,
    local_number: p.local_number,
    registered_at: p.registered_at
  }));
  
  res.json(formattedParticipants);
};

/**
 * Add a participant to an enchere
 */
const addParticipant = async (req, res) => {
  const { enchereId } = req.params;
  const { clientId, localNumber } = req.body;
  
  if (!clientId) {
    return res.status(400).json({ message: 'Client ID is required' });
  }
  
  // Check if enchere exists
  const encheres = await get_request("SELECT id FROM encheres WHERE id = ?", [enchereId]);
  if (encheres.length === 0) {
    return res.status(404).json({ message: 'Enchere not found' });
  }
  
  // Check if client exists
  const clients = await get_request("SELECT id FROM client WHERE id = ?", [clientId]);
  if (clients.length === 0) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // Check if client is already a participant
  const existing = await get_request(
    "SELECT id FROM participation WHERE enchere_id = ? AND client_id = ?",
    [enchereId, clientId]
  );
  
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Client is already a participant' });
  }
  
  // Create participation record
  await post_request(
    "INSERT INTO participation (enchere_id, client_id, local_number) VALUES (?, ?, ?)",
    [enchereId, clientId, localNumber || '']
  );
  
  // Get the client details
  const [client] = await get_request("SELECT * FROM client WHERE id = ?", [clientId]);
  
  // Get the participation record
  const [participation] = await get_request(
    "SELECT * FROM participation WHERE enchere_id = ? AND client_id = ?",
    [enchereId, clientId]
  );
  
  const response = {
    id: client.id,
    participation_id: participation.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    local_number: participation.local_number,
    registered_at: participation.registered_at
  };
  
  res.status(201).json(response);
};

/**
 * Update a participant's details (local number)
 */
const updateParticipant = async (req, res) => {
  const { enchereId, clientId } = req.params;
  const { localNumber } = req.body;
  
  // Check if participation exists
  const participations = await get_request(
    "SELECT id FROM participation WHERE enchere_id = ? AND client_id = ?",
    [enchereId, clientId]
  );
  
  if (participations.length === 0) {
    return res.status(404).json({ message: 'Participant not found' });
  }
  
  await put_request(
    "UPDATE participation SET local_number = ? WHERE enchere_id = ? AND client_id = ?",
    [localNumber || '', enchereId, clientId]
  );
  
  // Get updated client and participation details
  const [client] = await get_request("SELECT * FROM client WHERE id = ?", [clientId]);
  
  const [participation] = await get_request(
    "SELECT * FROM participation WHERE enchere_id = ? AND client_id = ?",
    [enchereId, clientId]
  );
  
  const response = {
    id: client.id,
    participation_id: participation.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    local_number: participation.local_number,
    registered_at: participation.registered_at
  };
  
  res.json(response);
};

/**
 * Remove a participant from an enchere
 */
const removeParticipant = async (req, res) => {
  const { enchereId, clientId } = req.params;
  
  // Check if participant has bought any lots
  const lotsBought = await get_request(
    "SELECT COUNT(*) as count FROM lots WHERE enchere_id = ? AND sold_to = ?",
    [enchereId, clientId]
  );
  
  if (lotsBought[0].count > 0) {
    return res.status(400).json({
      message: 'Cannot remove participant who has purchased lots',
      lotsBought: lotsBought[0].count
    });
  }
  
  const result = await delete_request(
    "DELETE FROM participation WHERE enchere_id = ? AND client_id = ?",
    [enchereId, clientId]
  );
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Participant not found' });
  }
  
  res.json({ message: 'Participant removed successfully' });
};

module.exports = {
  getParticipants,
  addParticipant,
  updateParticipant,
  removeParticipant
};