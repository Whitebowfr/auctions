import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  CardActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import styles from './AuctionManagement.module.css';
import dialogStyles from '../../components/ModernDialog.module.css';
import cardStyles from '../../components/ModernCard.module.css';
import { getAuctionTimeStatus } from '../../utils/utils';

const AuctionManagement = () => {
  const navigate = useNavigate();
  const { encheres, addEnchere, loading, error, loadEncheres } = useAuction();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await addEnchere(formData);
      setFormData({ name: '', date: '', location: '', description: '' });
      setOpen(false);
    } catch (error) {
      console.error('Failed to create enchere:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Fix the handleViewAuction function:
  const handleViewAuction = (enchere) => {
    console.log('Navigating to auction:', enchere); // Add debug log
    navigate(`/auction/${enchere.id}`);
  };

  if (loading && encheres.length === 0) {
    return <Loading message="Chargement des enchères..." />;
  }

  return (
    <Box className={styles.container}>
      {error && (
        <ErrorAlert 
          error={error} 
          onRetry={loadEncheres} 
          title="Échec du chargement." 
        />
      )}
      
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          Gestion des ventes aux enchères
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setOpen(true)}
          className={styles.createButton}
          disabled={loading}
        >
          Créer une nouvelle vente aux enchères
        </Button>
      </Box>

      <Box className={styles.auctionGrid}>
        {encheres.map((enchere) => {
          const timeStatus = getAuctionTimeStatus(enchere);

          return (
          <Card key={enchere.id} className={cardStyles.modernCard}>
            <CardContent className={cardStyles.cardContent}>
              <Typography variant="h6" className={cardStyles.cardTitle}>
                {enchere.name}
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                📅 {new Date(enchere.date).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                📍 {enchere.address}
              </Typography>
              
              <Box className={cardStyles.chipContainer}>
                <Chip 
                  label={`${enchere.participants.length} Participants`} 
                  size="small" 
                  className={cardStyles.modernChip}
                />
                <Chip 
                  label={`${enchere.bundles.length} Lots`} 
                  size="small" 
                  className={cardStyles.modernChip}
                />
                <Chip 
                  label={`${enchere.sales.length} Sales`} 
                  size="small" 
                  className={cardStyles.modernChip}
                />
              </Box>
              
              <Chip 
                label={`${timeStatus.icon} ${timeStatus.label}`}
                color={timeStatus.color}
                className={cardStyles.modernChip}
                sx={{ mt: 1 }}
              />
            </CardContent>
            <CardActions className={cardStyles.cardActions}>
              <Button 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  handleViewAuction(enchere);
                }}
                className={styles.viewButton}
                variant="outlined"
              >
                Voir le détail →
              </Button>
            </CardActions>
          </Card>
        )})}
      </Box>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        className={dialogStyles.modernDialog}
      >
        <DialogTitle className={dialogStyles.dialogTitle}>
          Créer une nouvelle vente aux enchères
        </DialogTitle>
        <DialogContent className={dialogStyles.dialogContent}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom de la vente"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={dialogStyles.modernTextField}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                fullWidth
                label="Date"
                // slotProps={{ inputLabel: { shrink: true } }}
                // type="date"
                value={formData.date || null}
                format='DD/MM/YYYY'
                onChange={(newVal) => setFormData({...formData, date: newVal})}
                className={dialogStyles.modernTextField}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lieu"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className={dialogStyles.modernTextField}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className={dialogStyles.dialogActions}>
          <Button 
            onClick={() => setOpen(false)}
            className={dialogStyles.secondaryButton}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            className={dialogStyles.primaryButton}
            disabled={submitting || !formData.name || !formData.date || !formData.location}
          >
            {submitting ? 'En cours de création...' : 'Créer la vente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuctionManagement;