import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Autocomplete
} from '@mui/material';
import dialogStyles from '../ModernDialog.module.css';

const SellBundleDialog = ({
  open,
  onClose,
  selectedBundle,
  sellFormData,
  setSellFormData,
  handleSellSubmit,
  participants
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      className={dialogStyles.modernDialog}
    >
      <DialogTitle className={dialogStyles.dialogTitle}>
        Vendre: {selectedBundle?.name || `Lot #${selectedBundle?.id}`}
      </DialogTitle>
      <DialogContent className={dialogStyles.dialogContent}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <Autocomplete
              options={participants || []}
              getOptionLabel={(option) => `${option.name} (#${option.local_number})`}
              value={participants?.find(p => p.id === sellFormData.participantId) || null}
              onChange={(event, newValue) => {
                setSellFormData({
                  ...sellFormData, 
                  participantId: newValue ? newValue.id : null
                });
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Choississez l'acheteur" 
                  fullWidth 
                  className={dialogStyles.modernTextField}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Prix de vente"
              type="number"
              step="0.01"
              value={sellFormData.finalPrice}
              onChange={(e) => setSellFormData({
                ...sellFormData, 
                finalPrice: e.target.value
              })}
              className={dialogStyles.modernTextField}
              InputProps={{
                endAdornment: '€'
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className={dialogStyles.dialogActions}>
        <Button 
          onClick={onClose}
          className={dialogStyles.secondaryButton}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSellSubmit}
          variant="contained"
          disabled={!sellFormData.participantId || !sellFormData.finalPrice}
          className={dialogStyles.primaryButton}
        >
          💰 Enregistrer la vente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SellBundleDialog;