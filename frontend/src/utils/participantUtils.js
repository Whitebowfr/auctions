// Participant management utility functions

import { formatAsPhoneNumber } from "./formatters";

/**
 * Filters out participants already in this auction
 * @param {Array} globalParticipants - All participants in the system
 * @param {Array} auctionParticipants - Participants already in this auction
 * @returns {Array} - Available participants not in this auction
 */
export const getAvailableParticipants = (globalParticipants, auctionParticipants) => {
    return globalParticipants.filter(global =>
        !auctionParticipants.some(auction =>
            auction.email.toLowerCase() === global.email.toLowerCase()
        )
    );
};

/**
 * Process bulk import text and convert to participant objects
 * @param {string} bulkText - CSV-style text input with participant data
 * @returns {Array} - Array of participant objects
 */
export const processBulkImport = (bulkText) => {
    const lines = bulkText.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
        const [name, email, phone, address] = line.split(';').map(item => item.trim());
        return {
            name: name || `Participant ${index + 1}`,
            email: email || '',
            phone: formatAsPhoneNumber(phone) || '',
            address: address || '',
            notes: 'Added via bulk import'
        };
    });
};

/**
 * Update an existing participant with new form data
 * @param {number} participantId - ID of the participant to update
 * @param {Object} formData - New participant data
 * @returns {Promise} - Promise resolving to the updated participant
 */
export const updateParticipant = async (participantId, formData) => {
    const response = await fetch(`http://localhost:8080/api/clients/${participantId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            notes: formData.notes
        }),
    });
    
    if (!response.ok) {
        throw new Error('Failed to update participant');
    }
    
    return response.json();
};