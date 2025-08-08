import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuctionContext = createContext();

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};

export const AuctionProvider = ({ children }) => {
  const [encheres, setEncheres] = useState([]);
  const [currentEnchere, setCurrentEnchere] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadEncheres();
    loadClients();
  }, []);

  const handleError = (error, context = '') => {
    console.error(`${context}:`, error);
    setError(error.message || 'An error occurred');
    setLoading(false);
  };
  
  // Encheres (Auctions) operations
  const loadEncheres = async () => {
    try {
      setLoading(true);
      setError(null);
      const encheresList = await apiService.getAuctions();
      
      // Load participants and lots for each enchere
      const encheresWithDetails = await Promise.all(
        encheresList.map(async (enchere) => {
          try {
            const [participants, lots] = await Promise.all([
              apiService.getParticipants(enchere.id),
              apiService.getBundles(enchere.id)
            ]);
            
            return {
              ...enchere,
              participants,
              bundles: lots, // Map lots to bundles for frontend compatibility
              sales: lots.filter(lot => lot.sold_to !== null).map(lot => ({
                id: `sale_${lot.id}`,
                bundleId: lot.id,
                bundleName: lot.name || `Lot #${lot.id}`,
                participantId: lot.sold_to,
                participantName: participants.find(p => p.id === lot.sold_to)?.name || 'Unknown',
                bidderNumber: participants.find(p => p.id === lot.sold_to)?.local_number || '000',
                startingPrice: lot.starting_price,
                finalPrice: lot.sold_price,
                profit: lot.sold_price - lot.starting_price,
                date: new Date().toLocaleDateString(), // You might want to add a sale_date field to your DB
                notes: ''
              }))
            };
          } catch (error) {
            console.error(`Error loading details for enchere ${enchere.id}:`, error);
            return {
              ...enchere,
              participants: [],
              bundles: [],
              sales: []
            };
          }
        })
      );
      
      setEncheres(encheresWithDetails);
    } catch (error) {
      handleError(error, 'Loading encheres');
    } finally {
      setLoading(false);
    }
  };

  const addEnchere = async (enchereData) => {
    try {
      setLoading(true);
      setError(null);
      const newEnchere = await apiService.createAuction({
        name: enchereData.name,
        date: enchereData.date,
        address: enchereData.location // Map location to address
      });
      
      await loadEncheres(); // Reload all encheres
      return newEnchere;
    } catch (error) {
      handleError(error, 'Adding enchere');
      throw error;
    }
  };

  const updateEnchere = async (id, updates) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEnchere = await apiService.updateAuction(id, {
        name: updates.name,
        date: updates.date,
        address: updates.location
      });
      
      await loadEncheres(); // Reload all encheres
      return updatedEnchere;
    } catch (error) {
      handleError(error, 'Updating enchere');
      throw error;
    }
  };

  // Clients operations
  const loadClients = async () => {
    try {
      setError(null);
      const clientsList = await apiService.getClients();
      setClients(clientsList);
    } catch (error) {
      handleError(error, 'Loading clients');
    }
  };

  const addOrUpdateClient = async (clientData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if client exists by email
      const existingClient = clients.find(c => 
        c.email.toLowerCase() === clientData.email.toLowerCase()
      );
      
      let client;
      if (existingClient) {
        // Update existing client
        client = await apiService.updateClient(existingClient.id, {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone || '',
          address: clientData.address || ''
        });
      } else {
        // Create new client
        client = await apiService.createClient({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone || '',
          address: clientData.address || ''
        });
      }
      
      await loadClients(); // Reload clients
      return client;
    } catch (error) {
      handleError(error, 'Adding/updating client');
      throw error;
    }
  };

  // Participants operations
  const addParticipant = async (enchereId, participantData) => {
    try {
      setLoading(true);
      setError(null);
      
      // First, create or update the client
      const client = await addOrUpdateClient(participantData);
      
      // Then add them as a participant to the enchere
      const enchere = encheres.find(e => e.id === enchereId);
      const localNumber = enchere ? enchere.participants.length + 1 : 1;
      
      await apiService.addParticipant(enchereId, client.id, localNumber, participantData.notes);
      
      // Reload the specific enchere
      await loadEncheres();
    } catch (error) {
      handleError(error, 'Adding participant');
      throw error;
    }
  };

  const deleteParticipant = async (enchereId, participantId) => {
    try {
      setLoading(true);
      setError(null);
            
      await apiService.removeParticipant(enchereId, participantId);
      
      await loadEncheres();
    } catch (error) {
      handleError(error, 'Adding participant');
      throw error;
    }
  }

  // Bundle/Lot operations
  const addBundle = async (enchereId, bundleData) => {
    try {
      setLoading(true);
      setError(null);
      
      // First create the lot
      const lot = await apiService.createBundle(enchereId, {
        name: bundleData.name,
        description: bundleData.description,
        category: bundleData.category,
        startingPrice: bundleData.startingPrice,
        notes: bundleData.notes  // Add notes
      });
      
      // If there's an image file, upload it
      if (bundleData.imageFile) {
        try {
          await apiService.uploadImage(lot.id, {
            file: bundleData.imageFile,
            name: bundleData.name || 'Bundle Image',
            description: bundleData.description || ''
          });
        } catch (imageError) {
          console.error('Failed to upload image:', imageError);
          // Continue anyway - the bundle was created successfully
        }
      }
      
      await loadEncheres(); // Reload all encheres
      return lot;
    } catch (error) {
      handleError(error, 'Adding bundle');
      throw error;
    }
  };

  // Sales operations
  const addSale = async (enchereId, saleData) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.sellBundle(
        saleData.bundleId,
        saleData.participantId,
        saleData.finalPrice
      );
      
      await loadEncheres(); // Reload all encheres
    } catch (error) {
      handleError(error, 'Recording sale');
      throw error;
    }
  };

  // Analytics
  const getEnchereStats = async (enchereId) => {
    try {
      return await apiService.getAuctionStats(enchereId);
    } catch (error) {
      handleError(error, 'Getting enchere stats');
      return null;
    }
  };

  const getClientPurchases = async (enchereId, clientId) => {
    try {
      return await apiService.getClientPurchases(enchereId, clientId);
    } catch (error) {
      handleError(error, 'Getting client purchases');
      return [];
    }
  };

  const updateClient = async (enchereId, clientId, notes) => {
    try {
      await apiService.updateParticipantNotes(enchereId, clientId, notes);
      await loadClients()
    } catch (error) {
      handleError(error, 'Updating notes');
      return [];
    }
  };

  // Compatibility aliases for existing frontend code
  const auctions = encheres;
  const globalParticipants = clients;
  const addAuction = addEnchere;
  const updateAuction = updateEnchere;
  const addOrUpdateGlobalParticipant = addOrUpdateClient;

  return (
    <AuctionContext.Provider value={{
      // New API-based data
      encheres,
      currentEnchere,
      setCurrentEnchere,
      clients,
      loading,
      error,
      
      // New API-based methods
      loadEncheres,
      addEnchere,
      updateEnchere,
      loadClients,
      addOrUpdateClient,
      addParticipant,
      addBundle,
      addSale,
      getEnchereStats,
      getClientPurchases,
      updateClient,
      
      // Compatibility aliases for existing frontend
      auctions,
      currentAuction: currentEnchere,
      setCurrentAuction: setCurrentEnchere,
      globalParticipants,
      addAuction,
      updateAuction,
      addOrUpdateGlobalParticipant,
      deleteParticipant
    }}>
      {children}
    </AuctionContext.Provider>
  );
};