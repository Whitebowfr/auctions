const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
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

  async createClient(client) {
    return this.request('/clients', {
      method: 'POST',
      body: client,
    });
  }

  async updateClient(id, client) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: client,
    });
  }

  async getClient(id) {
    return this.request(`/clients/${id}`);
  }

  // Auction endpoints - fix these to match your server
  async getAuctions() { // Renamed to avoid duplicate
    return this.request('/encheres');
  }

  async createAuction(auction) {
    return this.request('/encheres', {
      method: 'POST',
      body: auction,
    });
  }

  async getAuction(id) {
    return this.request(`/encheres/${id}`);
  }

  async updateAuction(id, auction) {
    return this.request(`/encheres/${id}`, {
      method: 'PUT',
      body: auction,
    });
  }

  async deleteAuction(id) {
    return this.request(`/encheres/${id}`, {
      method: 'DELETE',
    });
  }

  // Bundles endpoints - fix these to match your server (lots)
  async getBundles(auctionId) {
    return this.request(`/encheres/${auctionId}/lots`);
  }

  async createBundle(auctionId, bundle) {
    return this.request(`/encheres/${auctionId}/lots`, {
      method: 'POST',
      body: {
        name: bundle.name,
        description: bundle.description,
        category: bundle.category,
        starting_price: bundle.startingPrice,
        notes: bundle.notes  // Add notes
      },
    });
  }

  async updateBundle(bundleId, bundle) {
    return this.request(`/lots/${bundleId}`, {
      method: 'PUT',
      body: {
        name: bundle.name,
        description: bundle.description,
        category: bundle.category,
        starting_price: bundle.startingPrice,
        notes: bundle.notes  // Add notes
      },
    });
  }

  async sellBundle(bundleId, clientId, soldPrice) {
    return this.request(`/lots/${bundleId}/sell`, {
      method: 'POST',
      body: { clientId, soldPrice },  // Changed from { sold_to: clientId, sold_price: soldPrice }
    });
  }

  async deleteBundle(bundleId) {
    return this.request(`/lots/${bundleId}`, {
      method: 'DELETE',
    });
  }

  // Images endpoints - fix these
  async uploadImage(bundleId, imageData) {
    const formData = new FormData();
    formData.append('image', imageData.file); // The multer field name is 'image'
    formData.append('name', imageData.name);
    formData.append('description', imageData.description);

    return this.request(`/lots/${bundleId}/images`, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type header to let browser set it for FormData
    });
  }

  async getImages(bundleId) {
    return this.request(`/lots/${bundleId}/images`);
  }

  async deleteImage(imageId) {
    return this.request(`/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  // Participation endpoints - fix these
  async getParticipants(auctionId) {
    return this.request(`/encheres/${auctionId}/participants`);
  }

  async addParticipant(auctionId, clientId, localNumber = null, notes = '') {
    return this.request(`/encheres/${auctionId}/participants`, {
      method: 'POST',
      body: { clientId, localNumber, notes },
    });
  }

  async updateParticipantNotes(auctionId, clientId, notes) {
    return this.request(`/encheres/${auctionId}/participants/${clientId}`, {
      method: 'PUT',
      body: { notes },
    });
  }

  async removeParticipant(auctionId, clientId) {
    return this.request(`/encheres/${auctionId}/participants/${clientId}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints - fix these
  async getAuctionStats(auctionId) {
    return this.request(`/encheres/${auctionId}/stats`);
  }

  async getClientPurchases(auctionId, clientId) {
    return this.request(`/encheres/${auctionId}/clients/${clientId}/purchases`);
  }

  async getAuctionReport(auctionId) {
    return this.request(`/encheres/${auctionId}/report`);
  }
}

export const apiService = new ApiService();