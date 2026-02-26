const API = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Set a participation's payment status.
 * @param {number} participationId
 * @param {true | false | null} paid
 *   null  = no bill generated
 *   false = bill generated, unpaid
 *   true  = paid
 */
export const setParticipationPaymentStatus = async (participationId, paid) => {
  const res = await fetch(`${API}/participation/${participationId}/payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paid: paid ?? null })
  });
  if (!res.ok) throw new Error(`Failed to update payment status: ${res.status}`);
  return res.json();
};
