export function getAuctionTimeStatus (enchere) {
  if (!enchere.date) {
    return { label: 'No Date Set', color: 'default', icon: '📅' };
  }

  const auctionDate = new Date(enchere.date);
  const today = new Date();
  
  // Reset time to compare only dates
  const auctionDateOnly = new Date(auctionDate.getFullYear(), auctionDate.getMonth(), auctionDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const timeDiff = auctionDateOnly.getTime() - todayOnly.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysDiff === 0) {
    return { label: "Aujourd'hui", color: 'success', icon: '🔥' };
  } else if (daysDiff === 1) {
    return { label: 'Demain', color: 'warning', icon: '⏰' };
  } else if (daysDiff > 0 && daysDiff <= 7) {
    return { label: `Dans ${daysDiff} jours`, color: 'info', icon: '📆' };
  } else if (daysDiff > 7) {
    return { label: `Dans ${Math.ceil(daysDiff / 7)} semaines`, color: 'primary', icon: '📅' };
  } else if (daysDiff === -1) {
    return { label: 'Hier', color: 'error', icon: '⏳' };
  } else if (daysDiff < -1 && daysDiff >= -7) {
    return { label: `Il y a ${Math.abs(daysDiff)} jours`, color: 'error', icon: '⏳' };
  } else {
    return { label: `Il y a ${Math.ceil(Math.abs(daysDiff) / 7)} semaines`, color: 'error', icon: '📋' };
  }
};

export const getRootUrl = () => process.env.REACT_APP_URL || "http://localhost:8080"