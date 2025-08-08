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
import AddBundleDialog from '../../components/bundles/AddBundleDialog';
import SellBundleDialog from '../../components/bundles/SellBundleDialog';
import { getBundleImageUrl } from '../../utils/imageHandlers';

const BundleManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions, addBundle, addSale } = useAuction(); // Add addSale here
  
  const auction = auctions.find(a => a.id === parseInt(id));
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    starting_price: '',
    category: '',
    notes: '',         // Add notes field
    imageFile: null,
    imagePreview: ''
  });

  // Add this state for the sell dialog
  const [sellDialog, setSellDialog] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);

  // Add state for the sell form
  const [sellFormData, setSellFormData] = useState({
    participantId: null,
    finalPrice: ''
  });

  // Add missing bundleImages state
  const [bundleImages, setBundleImages] = useState({});

  // Load images for all bundles
  useEffect(() => {
    const loadBundleImages = async () => {
      if (auction && auction.bundles) {
        const imagePromises = auction.bundles.map(async (bundle) => {
          try {
            const response = await fetch(`http://localhost:8080/api/lots/${bundle.id}/images`);
            if (response.ok) {
              const images = await response.json();
              return { bundleId: bundle.id, images };
            }
          } catch (error) {
            console.error(`Failed to load images for bundle ${bundle.id}:`, error);
          }
          return { bundleId: bundle.id, images: [] };
        });

        const results = await Promise.all(imagePromises);
        const imagesMap = {};
        results.forEach(({ bundleId, images }) => {
          imagesMap[bundleId] = images;
        });
        setBundleImages(imagesMap);
      }
    };

    loadBundleImages();
  }, [auction]);

  if (!auction) {
    return <Alert severity="error">Vente non trouvée.</Alert>;
  }

  const handleSubmit = async () => {
    console.log('Submitting bundle data:', formData);
    
    const bundleData = {
      name: formData.name,
      description: formData.description,
      startingPrice: parseFloat(formData.starting_price) || 0,
      category: formData.category,
      notes: formData.notes,  // Add notes to bundleData
      imageFile: formData.imageFile
    };
    
    console.log('Bundle data to send:', bundleData);
    console.log('Image file:', formData.imageFile);
    
    try {
      await addBundle(auction.id, bundleData);
      setFormData({ 
        name: '', 
        description: '', 
        starting_price: '', 
        category: '', 
        notes: '',      // Reset notes field
        imageFile: null,
        imagePreview: ''
      });
      setOpenDialog(false);
    } catch (error) {
      console.error('Failed to add bundle:', error);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData({ 
        ...formData, 
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  // Add this function to handle the sell button click
  const handleSellBundle = (bundle) => {
    setSelectedBundle(bundle);
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

  // Sort bundles into available and sold
  const availableBundles = auction.bundles.filter(b => !b.sold_to).sort((a, b) => a.id - b.id);
  const soldBundles = auction.bundles.filter(b => b.sold_to).sort((a, b) => a.id - b.id);

  // Add this for bundle deletion
  const handleDeleteBundle = (bundleId) => {
    // Show confirmation dialog
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce lot?")) {
      // Call API to delete bundle
      fetch(`http://localhost:8080/api/lots/${bundleId}`, {
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
        <Button 
          variant="contained" 
          onClick={() => setOpenDialog(true)}
          className={styles.addButton}
        >
          ➕ Ajouter un lot
        </Button>
      </Box>

      <Alert severity="info" className={styles.infoAlert}>
        <Typography className={styles.infoText}>
          Nombre de lots: {auction.bundles.length} | Disponibles: {availableBundles.length}
        </Typography>
      </Alert>

      {/* Available Bundles Section */}
      {availableBundles.length > 0 && (
        <>
          <Typography variant="h6" className={styles.sectionTitle}>
            Lots disponibles ({availableBundles.length})
          </Typography>
          <Box className={styles.bundleGrid}>
            {availableBundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                imageUrl={getBundleImageUrl(bundle, bundleImages)}
                isSold={false}
                onSell={handleSellBundle}
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
            Lots vendus ({soldBundles.length})
          </Typography>
          <Box className={styles.bundleGrid}>
            {soldBundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                imageUrl={getBundleImageUrl(bundle, bundleImages)}
                isSold={true}
                onViewSale={handleViewSale}
                onDelete={handleDeleteBundle}
              />
            ))}
          </Box>
        </>
      )}

      {/* Add Bundle Dialog */}
      <AddBundleDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleImageUpload={handleImageUpload}
        existingCategories={existingCategories}
      />

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