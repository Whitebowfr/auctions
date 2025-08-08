import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import { getAuctionTimeStatus } from '../../utils/utils';
import { formatCurrency } from '../../utils/formatters';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions, setCurrentAuction } = useAuction();
  
  const auction = auctions.find(a => a.id === parseInt(id));

  useEffect(() => {
    if (auction) {
      setCurrentAuction(auction);
    }
  }, [auction, setCurrentAuction]);

  if (!auction) {
    return (
      <Alert severity="error">
        Vente non trouvée. Veuillez retourner à la liste des ventes.
      </Alert>
    );
  }

  const soldBundles = auction.bundles.filter(b => b.sold_to !== null).length; // Changed from b.status === 'Sold'

  const totalRevenue = auction.sales && auction.sales.length > 0 
    ? auction.sales.reduce((sum, sale) => sum + (parseFloat(sale.finalPrice) || 0), 0)
    : 0; // Handle potential data issues

  const managementCards = [
    {
      title: 'Modifier les participants',
      description: `${auction.participants.length} participants enregistrés`,
      action: () => navigate(`/auction/${auction.id}/participants`),
      color: '#2e7d32',
      count: auction.participants.length
    },
    {
      title: 'Modifier les lots',
      description: `${auction.bundles.length} lots créés`,
      action: () => navigate(`/auction/${auction.id}/bundles`),
      color: '#ed6c02',
      count: auction.bundles.length
    },
    {
      title: 'Gérer les ventes',
      description: `${auction.sales.length} ventes enregistrées`,
      action: () => navigate(`/auction/${auction.id}/sales`),
      color: '#9c27b0',
      count: auction.sales.length
    },
    {
      title: 'Voir le détail général',
      description: 'Générer un compte-rendu',
      action: () => navigate(`/auction/${auction.id}/reports`),
      color: '#d32f2f',
      count: null
    }
  ];

  const timeStatus = getAuctionTimeStatus(auction);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button onClick={() => navigate('/auctions')} sx={{ mb: 2 }}>
          ← Retour aux ventes
        </Button>
        <Typography variant="h3" component="h1" gutterBottom>
          {auction.name}
        </Typography>
      </Box>

      {/* Auction Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{
            xs: 12,
            md: 8
          }} >
            <Typography variant="h6" gutterBottom>
              Informations sur la vente
            </Typography>
            <Typography variant="body1" gutterBottom>
              📅 <strong>Date:</strong> {auction.date}
            </Typography>
            <Typography variant="body1" gutterBottom>
              📍 <strong>Lieu:</strong> {auction.address}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={`${timeStatus.icon} ${timeStatus.label}`}
                color={timeStatus.color} 
                sx={{ mr: 1 }}
              />
            </Box>
          </Grid>
          <Grid size={{
            xs: 12,
            md: 4
          }}>
            <Typography variant="h6" gutterBottom>
              Résumé rapide
            </Typography>
            <Typography variant="body2" gutterBottom>
              Participants: {auction.participants.length}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Lots: {auction.bundles.length}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Lots vendus: {soldBundles}/{auction.bundles.length}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Revenu total: {formatCurrency(totalRevenue)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Management Cards */}
      <Typography variant="h5" gutterBottom>
        Gestion de la vente
      </Typography>
      <Grid container spacing={3}>
        {managementCards.map((card, index) => (
          <Grid size={{
            xs: 12,
            sm: 6,
            md: 3
            }} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                transition: 'all 0.2s'
              }}
              onClick={card.action}
            >
              <CardContent>
                <Box 
                  sx={{ 
                    width: 50, 
                    height: 5, 
                    bgcolor: card.color, 
                    mb: 2,
                    borderRadius: 1 
                  }} 
                />
                {card.count !== null && (
                  <Typography variant="h4" color={card.color} gutterBottom>
                    {card.count}
                  </Typography>
                )}
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2, bgcolor: card.color }}
                  onClick={card.action}
                  fullWidth
                >
                  Ouvrir
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AuctionDetail;