import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Autocomplete,
  Grid,
  Alert,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import styles from './SalesTracking.module.css';
import dialogStyles from '../components/ModernDialog.module.css';
import tableStyles from '../components/ModernTable.module.css';
import { formatCurrency, formatProfit } from '../utils/formatters';

const SalesTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions, addSale } = useAuction();
  
  const auction = auctions.find(a => a.id === parseInt(id));
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    bundleId: null,
    participantId: null,
    finalPrice: '',
    notes: ''
  });

  if (!auction) {
    return <Alert severity="error">Auction not found.</Alert>;
  }

  const availableBundles = auction.bundles.filter(b => !b.sold_to);
  const totalRevenue = auction.sales && auction.sales.length > 0 
    ? auction.sales.reduce((sum, sale) => sum + (parseFloat(sale.finalPrice) || 0), 0) 
    : 0;
  const totalProfit = auction.sales && auction.sales.length > 0 
    ? auction.sales.reduce((sum, sale) => sum + (parseFloat(sale.profit) || 0), 0) 
    : 0;

  const handleSubmit = () => {
    const selectedBundle = auction.bundles.find(b => b.id === formData.bundleId);
    const selectedParticipant = auction.participants.find(p => p.id === formData.participantId);
    
    const saleData = {
      bundleId: formData.bundleId,
      bundleName: selectedBundle.name,
      participantId: formData.participantId,
      participantName: selectedParticipant.name,
      bidderNumber: selectedParticipant.local_number,
      startingPrice: selectedBundle.starting_price,
      finalPrice: parseFloat(formData.finalPrice),
      profit: parseFloat(formData.finalPrice) - selectedBundle.starting_price,
      notes: formData.notes
    };

    addSale(auction.id, saleData);
    setFormData({ bundleId: null, participantId: null, finalPrice: '', notes: '' });
    setOpenDialog(false);
  };

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
          💰 Ventes - {auction.name}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setOpenDialog(true)}
          disabled={availableBundles.length === 0 || auction.participants.length === 0}
          className={styles.recordButton}
        >
          📝 Nouvelle Vente
        </Button>
      </Box>

      <Box className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" className={styles.statNumber} color="success.main">
              {auction.sales.length}
            </Typography>
            <Typography className={styles.statLabel}>
              VENTES TOTALES
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" className={styles.statNumber} color="primary">
              {formatCurrency(totalRevenue)}
            </Typography>
            <Typography className={styles.statLabel}>
              REVENU
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              className={styles.statNumber} 
              color={(totalProfit || 0) >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography className={styles.statLabel}>
              PROFIT
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {auction.sales.length === 0 ? (
        <Alert severity="info" className={styles.noSalesAlert}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Pas encore de ventes enregistrées
          </Typography>
          <Typography>
            Enregistrez la première vente en utilisant le bouton ci-dessus.
          </Typography>
        </Alert>
      ) : (
        <TableContainer component={Paper} className={tableStyles.tableContainer}>
          <Table>
            <TableHead className={tableStyles.tableHeader}>
              <TableRow>
                <TableCell className={tableStyles.tableHeaderCell}>Date</TableCell>
                <TableCell className={tableStyles.tableHeaderCell}>Lot</TableCell>
                <TableCell className={tableStyles.tableHeaderCell}>Acheteur</TableCell>
                <TableCell className={tableStyles.tableHeaderCell}>Numéro #</TableCell>
                <TableCell className={tableStyles.tableHeaderCell}>Prix de départ</TableCell>
                <TableCell className={tableStyles.tableHeaderCell}>Prix de vente</TableCell>
                <TableCell className={tableStyles.tableHeaderCell}>Écart</TableCell>
                <TableCell className={tableStyles.tableHeaderCell}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auction.sales.map((sale) => (
                <TableRow key={sale.id} className={tableStyles.tableRow}>
                  <TableCell className={tableStyles.tableCell}>{sale.date}</TableCell>
                  <TableCell className={tableStyles.tableCell}>{sale.bundleName}</TableCell>
                  <TableCell className={tableStyles.tableCell}>{sale.participantName}</TableCell>
                  <TableCell className={tableStyles.tableCell}>
                    <Typography sx={{ fontWeight: 600, color: '#2563eb' }}>
                      #{sale.bidderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell className={tableStyles.tableCell}>
                    {formatCurrency(sale.startingPrice)}
                  </TableCell>
                  <TableCell className={tableStyles.tableCell}>
                    {formatCurrency(sale.finalPrice)}
                  </TableCell>
                  <TableCell className={tableStyles.tableCell}>
                    <Chip 
                      label={formatProfit(sale.profit)}
                      color={(parseFloat(sale.profit || 0)) >= 0 ? "success" : "error"}
                      size="small"
                      className={tableStyles.statusChip}
                    />
                  </TableCell>
                  <TableCell className={tableStyles.tableCell}>{sale.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" // Changed from "sm" to "md" for larger dialog
        fullWidth
        className={dialogStyles.modernDialog}
      >
        <DialogTitle className={dialogStyles.dialogTitle}>
          Enregistrer une nouvelle vente
        </DialogTitle>
        <DialogContent className={dialogStyles.dialogContent}>
          <Grid container spacing={4} sx={{ mt: 0.5 }}> {/* Increased spacing from 3 to 4 */}
            <Grid item xs={12}>
              <Autocomplete
                options={availableBundles}
                getOptionLabel={(option) => `${option.name || `Lot #${option.id}`} (Prix de départ: ${formatCurrency(option.starting_price)})`}
                value={availableBundles.find(b => b.id === formData.bundleId) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData, 
                    bundleId: newValue ? newValue.id : null,
                    finalPrice: newValue ? newValue.starting_price : '' // Set starting price as default
                  });
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Sélectionner le lot" 
                    fullWidth 
                    className={dialogStyles.modernTextField}
                    size="medium"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '1.1rem',
                        minHeight: '56px'
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1.1rem'
                      }
                    }}
                  />
                )}
                slotProps={{
                  listbox: {
                    style: {
                      fontSize: '1.1rem', // FIXED: was '11rem'
                      maxHeight: '300px'
                    }
                  },
                  popper: {
                    style: {
                      width: 'auto',
                      minWidth: '300px'
                    }
                  },
                  paper: {
                    style: {
                      padding: '8px'
                    }
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    minWidth: '13vw'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={auction.participants}
                getOptionLabel={(option) => `${option.name} (#${option.local_number})`}
                value={auction.participants.find(p => p.id === formData.participantId) || null}
                onChange={(event, newValue) => {
                  setFormData({...formData, participantId: newValue ? newValue.id : null});
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Choisissez l'acheteur" 
                    fullWidth 
                    className={dialogStyles.modernTextField}
                    size="medium"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '1.1rem',
                        minHeight: '56px'
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1.1rem'
                      }
                    }}
                  />
                )}
                slotProps={{
                  listbox: {
                    style: {
                      fontSize: '1.1rem', // FIXED: was '11rem'
                      maxHeight: '300px'
                    }
                  },
                  popper: {
                    style: {
                      width: 'auto',
                      minWidth: '300px'
                    }
                  },
                  paper: {
                    style: {
                      padding: '8px'
                    }
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    minWidth: '13vw'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Prix de vente final"
                type="number"
                step="0.01"
                value={formData.finalPrice}
                onChange={(e) => setFormData({...formData, finalPrice: e.target.value})}
                className={dialogStyles.modernTextField}
                size="medium" // Make input larger
                InputProps={{
                  endAdornment: '€'
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '1.1rem', // Larger font
                    minHeight: '56px'    // Taller input
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1.1rem'   // Larger label
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4} // Increased from 3 to 4 for larger text area
                label="Notes (optionnel)"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className={dialogStyles.modernTextField}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '1.1rem' // Larger font
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1.1rem' // Larger label
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className={dialogStyles.dialogActions}>
          <Button 
            onClick={() => setOpenDialog(false)}
            className={dialogStyles.secondaryButton}
            size="large" // Larger buttons
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.bundleId || !formData.participantId || !formData.finalPrice}
            className={dialogStyles.primaryButton}
            size="large" // Larger buttons
          >
            💾 Enregistrer la vente
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesTracking;