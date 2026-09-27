import { Enchere, Client, Lot } from "../../../types.ts";
import { getRootUrl } from "../utils/utils.tsx";
const API_BASE_URL = getRootUrl() + "/api";

class ApiService {
  async request(endpoint: string, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      body: null,
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Client endpoints
  async getClients() {
    return this.request('/clients');
  }

  async createClient(client: Partial<Client>) {
    return this.request('/clients', {
      method: 'POST',
      body: client,
    });
  }

  async updateClient(client: Client) {
    return this.request(`/clients/${client.id}`, {
      method: 'PUT',
      body: client,
    });
  }

  async deleteClient(id: number) {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async getClient(id: number): Promise<Client> {
    return this.request(`/clients/${id}`);
  }

  // Auction endpoints - fix these to match your server
  async getAuctionsList(): Promise<Enchere[]> { // Renamed to avoid duplicate
    return this.request('/encheres');
  }

  async getAllAuctions(): Promise<Enchere[]> {
    return this.request('/encheres/all');
  }

  async createAuction(auction: Partial<Enchere>) {
    return this.request('/encheres', {
      method: 'POST',
      body: auction,
    });
  }

  async getAuction(id: number) {
    return this.request(`/encheres/${id}`);
  }

  async updateAuction(data: Enchere) {
    return this.request(`/encheres/${data.id}`, {
      method: 'PUT',
      body: {
        name: data.name,
        date: data.date,
        address: data.address,
      },
    });
  }

  async deleteAuction(id: number) {
    return this.request(`/encheres/${id}`, {
      method: 'DELETE',
    });
  }

  async getBundles(id: number) {
    return this.request(`/encheres/${id}/lots`);
  }

  async createBundle(id: number, bundle: Partial<Lot>) {
    return this.request(`/encheres/${id}/lots`, {
      method: 'POST',
      body: bundle,
    });
  }

  async updateBundle(bundle: Lot) {
    return this.request(`/lots/${bundle.id}`, {
      method: 'PUT',
      body: bundle,
    });
  }

  async sellBundle(bundleId: number, clientId: number, soldPrice: number) {
    return this.request(`/lots/${bundleId}/sell`, {
      method: 'POST',
      body: { clientId, soldPrice },  // Changed from { sold_to: clientId, sold_price: soldPrice }
    });
  }

  async deleteBundle(bundleId: number) {
    return this.request(`/lots/${bundleId}`, {
      method: 'DELETE',
    });
  }

  // Participation endpoints - fix these
  async getParticipants(auctionId: number) {
    return this.request(`/encheres/${auctionId}/participants`);
  }

  async addParticipant(auctionId: number, clientId: number, localNumber: number | null = null, notes: string = '', participationId: number | null = null) {
    const body = { clientId, localNumber, notes, participationId: null };
    if (participationId !== null && participationId !== undefined) body.participationId = participationId;
    return this.request(`/encheres/${auctionId}/participants`, {
      method: 'POST',
      body,
    });
  }

  async updateParticipantNotes(auctionId: number, clientId: number, notes: string) {
    return this.request(`/encheres/${auctionId}/participants/${clientId}`, {
      method: 'PUT',
      body: { notes },
    });
  }

  async removeParticipant(auctionId: number, clientId: number) {
    return this.request(`/encheres/${auctionId}/participants/${clientId}`, {
      method: 'DELETE',
    });
  }

  async deleteParticipation(participationId: number, force = false) {
    const qs = force ? '?force=true' : '';
    return this.request(`/participation/${participationId}${qs}`, {
      method: 'DELETE'
    });
  }

  async getClientPurchases(auctionId: number, clientId: number) {
    return this.request(`/encheres/${auctionId}/clients/${clientId}/purchases`);
  }

  async getAuctionReport(auctionId: number) {
    return this.request(`/encheres/${auctionId}/report`);
  }
}

export const apiService = new ApiService();
