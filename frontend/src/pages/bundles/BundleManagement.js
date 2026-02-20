import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import styles from './BundleManagement.module.css';
import BundleCard from '../../components/bundles/BundleCard';
import SellBundleDialog from '../../components/bundles/SellBundleDialog';
// image handling removed for lightweight backend
import { processBulkBundleImport } from '../../utils/bundleUtils';

const BundleManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions, addBundle, addSale, updateBundle } = useAuction(); // Add updateBundle
  
  const auction = auctions.find(a => a.id === parseInt(id));
  // Legacy add/edit dialog removed; lots are now managed inline in AuctionDetail

  // Add this state for the sell dialog
  const [sellDialog, setSellDialog] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);

  // Add state for the sell form
  const [sellFormData, setSellFormData] = useState({
    participantId: null,
    finalPrice: ''
  });

  // image handling removed

  // Add this state variable
  const [bulkText, setBulkText] = useState('');

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // images removed — no-op

  if (!auction) {
    return <Alert severity="error">Vente non trouvée.</Alert>;
  }

  const handleImageUpload = (event) => {
    // image uploads removed
  };

  // Add this function to handle the sell button click
  const handleSellBundle = (bundle) => {
    setSelectedBundle(bundle);
    setSellFormData({ participantId: null, finalPrice: bundle.starting_price });
    setSellDialog(true);
  };

  // Add this function to handle the sell form submission
  const handleSellSubmit = async () => {
    if (!selectedBundle || !sellFormData.participantId || !sellFormData.finalPrice) {
      return; // Don't submit if required fields are missing
    }

    const selectedParticipant = auction.participants.find(p => p.id === sellFormData.participantId);
    
    const saleData = {
      bundleId: selectedBundle.id,
      bundleName: selectedBundle.name || `Lot #${selectedBundle.id}`,
      participantId: sellFormData.participantId,
      participantName: selectedParticipant.name,
      bidderNumber: selectedParticipant.local_number,
      startingPrice: selectedBundle.starting_price,
      finalPrice: parseFloat(sellFormData.finalPrice),
      profit: parseFloat(sellFormData.finalPrice) - selectedBundle.starting_price,
      notes: ''
    };

    try {
      await addSale(auction.id, saleData);
      // Reset form and close dialog
      setSellFormData({ participantId: null, finalPrice: '' });
      setSelectedBundle(null);
      setSellDialog(false);
    } catch (error) {
      console.error('Failed to record sale:', error);
    }
  };

  // Add this function after handleSubmit
  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    
    try {
      const bundles = processBulkBundleImport(bulkText);
      console.log('Importing bundles:', bundles);
      
      // Show loading indicator or message
      setIsLoading(true);
      
      // Process bundles sequentially to avoid race conditions
      for (const bundle of bundles) {
        await addBundle(auction.id, bundle);
      }
      
      // Reset form and close dialog
      setBulkText('');
      setIsLoading(false);
      
      // Refresh the page to show new bundles
      window.location.reload();
    } catch (error) {
      console.error('Failed to import bundles:', error);
      setIsLoading(false);
    }
  };

  // Sort bundles into available and sold using custom lot number (supports 9bis, 9ter)
  const parseLotNumber = (value) => {
    if (value === null || value === undefined) return { base: 0, suffixOrder: 0 };
    const str = String(value).trim();
    const match = str.match(/^(\d+)([a-zA-Z]*)$/);
    if (!match) return { base: 0, suffixOrder: 0 };
    const base = parseInt(match[1], 10);
    const suffix = match[2].toLowerCase();
    const map = { 'bis': 1, 'ter': 2, 'quater': 3 };
    return { base, suffixOrder: map[suffix] || 0 };
  };

  const lotComparator = (a, b) => {
    const aParsed = parseLotNumber(a.number ?? a.id);
    const bParsed = parseLotNumber(b.number ?? b.id);
    if (aParsed.base !== bParsed.base) return aParsed.base - bParsed.base;
    return aParsed.suffixOrder - bParsed.suffixOrder;
  };

  const availableBundles = auction.bundles.filter(b => !b.sold_to).sort(lotComparator);
  const soldBundles = auction.bundles.filter(b => b.sold_to).sort(lotComparator);

  // Add this for bundle deletion
  const handleDeleteBundle = (bundleId) => {
    // Show confirmation dialog
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce lot?")) {
      // Call API to delete bundle
      fetch(`/api/lots/${bundleId}`, {
        method: 'DELETE',
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to delete');
          // Reload auctions data to reflect changes
          window.location.reload();
        })
        .catch(error => {
          console.error('Error deleting bundle:', error);
          alert('Une erreur est survenue lors de la suppression du lot.');
        });
    }
  };

  // Add this for viewing sale details
  const handleViewSale = (bundle) => {
    const sale = auction.sales.find(s => s.bundleId === bundle.id);
    if (sale) {
      navigate(`/auction/${auction.id}/sales`);
    } else {
      alert("Détails de la vente non disponibles");
    }
  };

  // Extract unique categories from all bundles
  const getExistingCategories = () => {
    if (!auction || !auction.bundles) return [];
    
    const categories = auction.bundles
      .map(bundle => bundle.category)
      .filter(category => category && category.trim() !== '')
      .reduce((unique, category) => {
        if (!unique.includes(category)) {
          unique.push(category);
        }
        return unique;
      }, []);
    
    return categories;
  };

  const existingCategories = getExistingCategories();

  return (
    <Box className={styles.container}>
      <Button 
        onClick={() => navigate(`/auction/${auction.id}`)} 
        className={styles.backButton}
      >
        ← Retour à la vente {auction.name}
      </Button>
      
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          📦 Lots - {auction.name}
        </Typography>
        {/* Lots are now added from the AuctionDetail view; keep only navigation and stats here */}
      </Box>

      <Alert severity="info" className={styles.infoAlert}>
        <Typography className={styles.infoText}>
          Nombre de lots: {auction.bundles.length} | Disponibles: {availableBundles.length}
        </Typography>
      </Alert>

      {/* Show loading state */}
      {isLoading && (
        <Alert severity="info" className={styles.infoAlert}>
          <Typography className={styles.infoText}>
            Importation des lots en cours...
          </Typography>
        </Alert>
      )}

      {/* Available Bundles Section */}
      {availableBundles.length > 0 && (
        <>
          <Typography variant="h6" className={styles.sectionTitle}>
            Lots disponibles ({availableBundles.length}) - IDs: {availableBundles.map(b => `#${b.id}`).join(', ')}
          </Typography>
          <Box className={styles.bundleGrid}>
            {availableBundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                isSold={false}
                onSell={handleSellBundle}
                onEdit={() => {}}
                onDelete={handleDeleteBundle}
              />
            ))}
          </Box>
        </>
      )}

      {/* Sold Bundles Section */}
      {soldBundles.length > 0 && (
        <>
          <Typography variant="h6" className={styles.soldSectionTitle}>
            Lots vendus ({soldBundles.length}) - IDs: {soldBundles.length > 0 && soldBundles.length <= 5 
              ? soldBundles.map(b => `#${b.id}`).join(', ')
              : `#${soldBundles[0].id} - #${soldBundles[soldBundles.length-1].id}`}
          </Typography>
          <Box className={styles.bundleGrid}>
            {soldBundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                isSold={true}
                onViewSale={handleViewSale}
                onEdit={() => {}}
                onDelete={handleDeleteBundle}
              />
            ))}
          </Box>
        </>
      )}

      {/* Sell Bundle Dialog */}
      <SellBundleDialog
        open={sellDialog}
        onClose={() => {
          setSellDialog(false);
          setSellFormData({ participantId: null, finalPrice: '' });
          setSelectedBundle(null);
        }}
        selectedBundle={selectedBundle}
        sellFormData={sellFormData}
        setSellFormData={setSellFormData}
        handleSellSubmit={handleSellSubmit}
        participants={auction.participants}
      />
    </Box>
  );
};

export default BundleManagement;