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
    return { label: 'Today', color: 'success', icon: '🔥' };
  } else if (daysDiff === 1) {
    return { label: 'Tomorrow', color: 'warning', icon: '⏰' };
  } else if (daysDiff > 0 && daysDiff <= 7) {
    return { label: `In ${daysDiff} days`, color: 'info', icon: '📆' };
  } else if (daysDiff > 7) {
    return { label: `In ${Math.ceil(daysDiff / 7)} weeks`, color: 'primary', icon: '📅' };
  } else if (daysDiff === -1) {
    return { label: 'Yesterday', color: 'error', icon: '⏳' };
  } else if (daysDiff < -1 && daysDiff >= -7) {
    return { label: `${Math.abs(daysDiff)} days ago`, color: 'error', icon: '⏳' };
  } else {
    return { label: `${Math.ceil(Math.abs(daysDiff) / 7)} weeks ago`, color: 'error', icon: '📋' };
  }
};