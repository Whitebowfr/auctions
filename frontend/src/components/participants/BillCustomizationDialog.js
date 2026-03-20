import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Typography
} from '@mui/material';
import styles from '../ModernDialog.module.css';

const BillCustomizationDialog = ({ 
  open, 
  onClose, 
  onGenerate, 
  participant, 
  auction 
}) => {
  const [customizations, setCustomizations] = useState({
    title: `Facture - ${participant?.name || 'Client'}`,
    includeNotes: false,
    paid: false,
    footer: `${auction?.name || 'Vente aux enchères'} - Le ${new Date().toLocaleDateString("fr-FR")}`,
    name: `${participant?.name}`,
    email: participant?.email || '',
    address: participant?.address || '',
    phone: participant?.phone || '',
    fraisEnSus: 0,
  });

  const [purchases, setPurchases] = useState([]);
  const [selected, setSelected] = useState({});

  // Initialize purchases and selection when dialog opens / participant or auction changes
  React.useEffect(() => {
    if (!open || !participant || !auction) return;
    const participantSales = (auction.sales || []).filter(sale => sale.participantId === participant.id);
    // Map to include bundle details if available
    const detailed = participantSales.map(sale => ({ ...sale, bundle: (auction.bundles || []).find(b => b.bundleId === sale.bundleId) }));
    setPurchases(detailed);
    // default select all
    const sel = {};
    detailed.forEach(s => { sel[s.bundleId] = true; });
    setSelected(sel);
  }, [open, participant, auction]);

  const handleChange = (field, value) => {
    setCustomizations({
      ...customizations,
      [field]: value
    });
  };

  const handleGenerate = () => {
    // include selected sale ids in customizations so caller can filter purchases
    const selectedSaleIds = Object.keys(selected).filter(k => selected[k]).map(k => parseInt(k));
    onGenerate({ ...customizations, selectedSaleIds });
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      className={styles.modernDialog}
    >
      <DialogTitle className={styles.dialogTitle}>
        Personnaliser la facture
      </DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid sx={{xs: 12}}>
            <TextField
              fullWidth
              label="Titre de la facture"
              value={customizations.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={styles.modernTextField}
            />
          </Grid>
          
          <Grid sx={{xs: 12, sm: 6}}>
            <TextField
              fullWidth
              label="Nom affiché"
              value={customizations.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={styles.modernTextField}
            />
          </Grid>
          
          <Grid sx={{xs: 12, sm: 6}}>
            <TextField
              fullWidth
              label="Email affiché"
              value={customizations.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={styles.modernTextField}
            />
          </Grid>
          
          <Grid sx={{xs: 12}}>
            <TextField
              fullWidth
              label="Pied de page"
              value={customizations.footer}
              onChange={(e) => handleChange('footer', e.target.value)}
              className={styles.modernTextField}
            />
          </Grid>

          <Grid sx={{xs: 12}}>
            <TextField
              fullWidth
              label="Adresse affichée"
              value={customizations.address}
              onChange={(e) => handleChange('address', e.target.value)}
              multiline
              minRows={2}
              maxRows={4}
              className={styles.modernTextField}
            />
          </Grid>

          <Grid sx={{xs: 12, sm: 6}}>
            <TextField
              fullWidth
              label="Téléphone affiché"
              value={customizations.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={styles.modernTextField}
            />
          </Grid>

          <Grid sx={{xs: 12, sm: 6}}>
            <TextField
              fullWidth
              label="Frais en sus"
              value={customizations.fraisEnSus}
              onChange={(e) => handleChange('fraisEnSus', e.target.value)}
              className={styles.modernTextField}
              type="number"
              slotProps={{
                input: {
                  endAdornment: <Box component="span" sx={{ ml: 1 }}>€</Box>
                }
              }}
              placeholder='Hors TVA'
            />
          </Grid>
          
          <Grid sx={{xs: 12, sm: 6}}>
            <FormControlLabel
              control={
                <Switch
                  checked={customizations.paid}
                  onChange={(e) => handleChange('paid', e.target.checked)}
                  color="success"
                />
              }
              label="Marqué comme payé"
            />
          </Grid>

          {/* Purchases selection table */}
          <Grid sx={{xs: 12}}>
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Sélectionnez les lots à inclure dans la facture</Typography>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: 260 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>N. Lot</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell align="right">Prix (TTC)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchases.map((p) => (
                    <TableRow key={p.bundleId} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={!!selected[p.bundleId]}
                          onChange={(e) => setSelected({ ...selected, [p.bundleId]: e.target.checked })}
                        />
                      </TableCell>
                      <TableCell>{p.bundleId}</TableCell>
                      <TableCell>{p.bundleName || `Lot #${p.bundleId}`}</TableCell>
                      <TableCell align="right">{p.finalPrice ? `${p.finalPrice} €` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {purchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Aucun achat pour ce participant sur cette vente.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          
        </Grid>
      </DialogContent>
      <DialogActions className={styles.dialogActions}>
        <Button 
          onClick={onClose}
          className={styles.secondaryButton}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleGenerate} 
          variant="contained"
          className={styles.primaryButton}
        >
          Générer la facture
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BillCustomizationDialog;