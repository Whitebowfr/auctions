import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, Enchere, Lot, Participation } from '../../../types';
import { apiService } from '../services/api.tsx';

type UnfinishedClient = Omit<Client, "id"> & { id?: number };

type Sale = {
  enchereId: number;
  bundleId: number;
  participantId: number;
  finalPrice: number;
};

export type AuctionContextValue = {
  encheres: Enchere[];
  currentEnchere: Enchere | null;
  setCurrentEnchere: React.Dispatch<React.SetStateAction<Enchere | null>>;
  clients: Client[];
  loading: boolean;
  error: string | null;
  loadEncheres: () => Promise<void>;
  loadSpecificEnchere: (id: number) => Promise<void>;
  addEnchere: (enchereData: Partial<Enchere>) => Promise<Enchere | void>;
  deleteEnchere: (id: number) => Promise<void>;
  updateEnchere: (enchere: Enchere) => Promise<Enchere | void>;
  loadClients: () => Promise<void>;
  addOrUpdateClient: (clientData: UnfinishedClient) => Promise<Client>;
  deleteClient: (clientId: number) => Promise<void>;
  addParticipant: (enchereId: number, participantData: Partial<Participation>) => Promise<void>;
  deleteParticipant: (enchereId: number, participantId: number) => Promise<void>;
  addBundle: (enchereId: number, bundleData: Partial<Lot>) => Promise<Lot | void>;
  updateBundle: (bundleData: Lot) => Promise<boolean | void>;
  deleteBundle: (bundleId: number) => Promise<void>;
  addSale: (saleData: Sale) => Promise<void>;
  getClientPurchases: (enchereId: number, clientId: number) => Promise<unknown[]>;
  updateClient: (data: Client) => Promise<void>;
};

const AuctionContext = createContext<AuctionContextValue | undefined>(undefined);

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [encheres, setEncheres] = useState<Enchere[]>([]);
  const [currentEnchere, setCurrentEnchere] = useState<Enchere | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Load initial data
  useEffect(() => {
    // Load lightweight list (names only) initially
    (async () => {
      try {
        setLoading(true);
        const list = await apiService.getAuctionsList();
        // map to expected Enchere shape with empty placeholders for participants/bundles/sales
        const mapped = list.map((l: any) => ({
          ...l,
          participants: [],
          bundles: [],
          sales: []
        }));
        setEncheres(mapped);
      } catch (e) {
        handleError(e, 'Loading encheres');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleError = (error: Error, context = '') => {
    console.error(`${context}:`, error);
    setError(error.message || 'An error occurred');
    setLoading(false);
  };

  const loadSpecificEnchere = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Here")
      // Fetch auction details and participants in parallel
      const [auctionDetails, participants] = await Promise.all([
        apiService.getAuction(id),
        apiService.getParticipants(id)
      ]);

      const normalizedParticipants = (participants || []).map((p: Participation) => ({
        ...p,
        paid: p.paid !== undefined ? p.paid : null,
      }));

      const bundles = auctionDetails.bundles || [];

      const enriched: Enchere = {
        ...auctionDetails,
        participants: normalizedParticipants,
        bundles,
        sales: bundles
          .filter((lot: Lot) => lot.soldTo !== null)
          .map((lot: Lot) => ({
            id: `sale_${lot.id}`,
            bundleId: lot.id,
            bundleName: lot.name || `Lot #${lot.id}`,
            participantId: lot.soldTo.id,
            participantName:
              normalizedParticipants.find(p => p.client.id === lot.soldTo.id)?.client.name || 'Unknown',
            bidderNumber:
              normalizedParticipants.find(p => p.client.id === lot.soldTo.id)?.localNumber || '000',
            startingPrice: lot.startingPrice,
            finalPrice: lot.finalPrice,
            profit: (lot.finalPrice || 0) - (lot.startingPrice || 0),
            date: new Date().toLocaleDateString(),
            notes: ''
          })),
      } as Enchere;

      setEncheres(prev => {
        const exists = prev.some(e => e.id === id);
        if (exists) {
          return prev.map(e => e.id === id ? enriched : e);
        }
        return [enriched, ...prev];
      });

      setCurrentEnchere(enriched);
    } catch (error) {
      handleError(error, 'Loading specific enchere');
    } finally {
      setLoading(false);
    }
  }

  // Encheres (Auctions) operations
  const loadEncheres = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lightweight list endpoint — only names/ids for the index page
      const list = await apiService.getAuctionsList();
      const mapped = list.map((l: any) => ({
        ...l,
        managementFeeRate: l.managementFeeRate || 11.9,
        participants: [],
        bundles: [],
        sales: []
      }));

      setEncheres(mapped);
    } catch (error) {
      handleError(error, 'Loading encheres');
    } finally {
      setLoading(false);
    }
  };

  const addEnchere = async (enchereData: Partial<Enchere>) => {
    try {
      setLoading(true);
      setError(null);
      const newEnchere = await apiService.createAuction(enchereData);

      await loadEncheres(); // Reload all encheres
      return newEnchere;
    } catch (error) {
      handleError(error, 'Adding enchere');
      throw error;
    }
  };

  const deleteEnchere = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      await apiService.deleteAuction(id);
      await loadEncheres();
    } catch (error) {
      handleError(error, 'Deleting enchere');
      throw error;
    }
  };

  const updateEnchere = async (enchere: Enchere) => {
    try {
      setLoading(true);
      setError(null);

      // Create a data object with just the fields API expects

      const updatedEnchere = await apiService.updateAuction(enchere);

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

  const addOrUpdateClient = async (clientData: UnfinishedClient): Promise<Client> => {
    try {
      setLoading(true);
      setError(null);
      let client: Client;
      if (clientData.id != null) {
        client = await apiService.updateClient(clientData as Client);
      } else {
        // Create new client
        client = await apiService.createClient(clientData);
      }

      await loadClients(); // Reload clients
      return client;
    } catch (error) {
      handleError(error, 'Adding/updating client');
      throw error;
    }
  };

  const deleteClient = async (clientId: number) => {
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteClient(clientId);
      await loadClients();
    } catch (error) {
      handleError(error, 'Deleting client');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Participants operations
  const addParticipant = async (enchereId: number, participantData: Partial<Participation>) => {
    try {
      setLoading(true);
      setError(null);

      // Always create or update the client first so edits (email, phone, address) are persisted
      const client = await addOrUpdateClient(participantData.client);

      // Then add them as a participant to the enchere
      const enchere = encheres.find(e => e.id === enchereId);

      // Use provided local_number if available, otherwise generate the next available one
      let localNumber: number;
      if (participantData.localNumber) {
        localNumber = participantData.localNumber;
      } else {
        // Find next available local number
        const usedNumbers = enchere ? enchere.participants.map(p =>
          p.localNumber
        ).filter((num: number) => !isNaN(num)) : [];

        localNumber = 1;
        while (usedNumbers.includes(localNumber)) {
          localNumber++;
        }
      }

      await apiService.addParticipant(enchereId, client.id, localNumber, participantData.client.notes);

      // Reload the specific enchere
      await loadSpecificEnchere(enchereId);
    } catch (error) {
      handleError(error, 'Adding participant');
      throw error;
    }
  };

  const deleteParticipant = async (enchereId: number, participantId: number) => {
    try {
      setLoading(true);
      setError(null);

      await apiService.removeParticipant(enchereId, participantId);

      await loadSpecificEnchere(enchereId);
    } catch (error) {
      handleError(error, 'Adding participant');
      throw error;
    }
  }

  // Bundle/Lot operations
  const addBundle = async (enchereId: number, bundleData: Partial<Lot>) => {
    try {
      setLoading(true);
      setError(null);

      // First create the lot
      const lot = await apiService.createBundle(enchereId, {
        number: bundleData.number,
        name: bundleData.name,
        startingPrice: bundleData.startingPrice,
      });

      await loadSpecificEnchere(enchereId); // Reload this enchere
      return lot;
    } catch (error) {
      handleError(error, 'Adding bundle');
      throw error;
    }
  };

  const deleteBundle = async (bundleId: number) => {
    try {
      setLoading(true);
      setError(null);

      await apiService.deleteBundle(bundleId);
      // Try to reload the parent enchere if we can find it, otherwise refresh the list
      const parent = encheres.find(e => e.bundles?.some(b => b.id === bundleId));
      if (parent) {
        await loadSpecificEnchere(parent.id);
      } else {
        await loadEncheres();
      }
    } catch (error) {
      handleError(error, 'Deleting bundle');
      throw error;
    }
  };

  const updateBundle = async (bundleData: Lot) => {
    try {
      setLoading(true);
      setError(null);

      // Update the lot
      await apiService.updateBundle(bundleData);

      // Image uploads are not supported in the lightweight backend; ignore imageFile

      await loadSpecificEnchere(bundleData.enchereId); // Reload this enchere
      return true;
    } catch (error) {
      handleError(error, 'Updating bundle');
      throw error;
    }
  };

  const addSale = async (saleData: Sale) => {
    try {
      setLoading(true);
      setError(null);

      await apiService.sellBundle(
        saleData.bundleId,
        saleData.participantId,
        saleData.finalPrice
      );

      await loadSpecificEnchere(saleData.enchereId); // Reload all encheres
    } catch (error) {
      handleError(error, 'Recording sale');
      throw error;
    }
  };

  const getClientPurchases = async (enchereId: number, clientId: number) => {
    try {
      return await apiService.getClientPurchases(enchereId, clientId);
    } catch (error) {
      handleError(error, 'Getting client purchases');
      return [];
    }
  };

  // Update a global client (buyers directory / ClientDetail)
  const updateClient = async (data: Client) => {
    try {
      setLoading(true);
      setError(null);

      await apiService.updateClient(data);

      await loadClients();
    } catch (error) {
      handleError(error, 'Updating client');
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
      loadSpecificEnchere,
      addEnchere,
      deleteEnchere,
      updateEnchere,
      loadClients,
      addOrUpdateClient,
      addParticipant,
      addBundle,
      updateBundle,
      deleteBundle,
      addSale,
      getClientPurchases,
      updateClient,
      deleteClient,
      deleteParticipant
    }}>
      {children}
    </AuctionContext.Provider>
  );
};
