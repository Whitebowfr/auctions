import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Autocomplete
} from '@mui/material';
import dialogStyles from '../ModernDialog.module.css';
import styles from './AddBundleDialog.module.css';

const AddBundleDialog = ({ 
  open, 
  onClose, 
  formData, 
  setFormData, 
  handleSubmit,
  handleImageUpload,
  existingCategories
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      className={dialogStyles.modernDialog}
    >
      <DialogTitle className={dialogStyles.dialogTitle}>
        Ajouter un lot
      </DialogTitle>
      <DialogContent className={dialogStyles.dialogContent}>
        <Grid container spacing={3} className={styles.formGrid}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nom du lot"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={dialogStyles.modernTextField}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={dialogStyles.modernTextField}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prix de départ"
              type="number"
              step="0.01"
              value={formData.starting_price}
              onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
              className={dialogStyles.modernTextField}
              InputProps={{
                endAdornment: '€'
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={existingCategories}
              value={formData.category}
              onChange={(event, newValue) => {
                setFormData({...formData, category: newValue || ''});
              }}
              inputValue={formData.category}
              onInputChange={(event, newInputValue) => {
                setFormData({...formData, category: newInputValue || ''});
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Catégorie"
                  fullWidth
                  className={dialogStyles.modernTextField}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optionnel)"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className={dialogStyles.modernTextField}
            />
          </Grid>
          <Grid item xs={12}>
            <Box className={styles.imageUploadContainer}>
              <Typography variant="body2" className={styles.uploadLabel}>
                📸 Ajouter une image:
              </Typography>
              <Box className={styles.imageUploadInput}>
                <input
                  accept="image/*"
                  type="file"
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                />
              </Box>
              {formData.imagePreview && (
                <Box className={styles.imagePreview}>
                  <img 
                    src={formData.imagePreview} 
                    alt="Preview" 
                    className={styles.previewImage}
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className={dialogStyles.dialogActions}>
        <Button 
          onClick={onClose}
          className={dialogStyles.secondaryButton}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          className={dialogStyles.primaryButton}
        >
          ➕ Ajouter un lot
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBundleDialog;