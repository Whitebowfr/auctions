import React, { useState, useEffect } from 'react'; // Add useEffect
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
  Autocomplete,
  InputAdornment,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import dialogStyles from '../ModernDialog.module.css';
import styles from './AddBundleDialog.module.css';

const AddBundleDialog = ({ 
  open, 
  onClose, 
  formData, 
  setFormData, 
  handleSubmit,
  handleBulkImport,
  handleImageUpload,
  existingCategories,
  bulkText,
  setBulkText,
  isEditMode = false // Add this prop
}) => {
  const [tabValue, setTabValue] = useState(0);

  // Reset to first tab when dialog opens in edit mode
  useEffect(() => {
    if (open && isEditMode) {
      setTabValue(0);
    }
  }, [open, isEditMode]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      className={dialogStyles.modernDialog}
    >
      <DialogTitle className={dialogStyles.dialogTitle}>
        {isEditMode ? `Modifier le lot #${formData.id}` : 'Ajouter des lots'}
      </DialogTitle>
      
      {!isEditMode && (
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          className={dialogStyles.tabs}
        >
          <Tab label="Lot unique" id="tab-0" />
          <Tab label="Import en masse" id="tab-1" />
        </Tabs>
      )}
      
      <DialogContent className={dialogStyles.dialogContent}>
        {(tabValue === 0 || isEditMode) ? (
          // Single Bundle Form
          <Grid container spacing={3} className={styles.formGrid}>
            <Grid sx={{xs: 12, sm: 4}}>
              <TextField
                fullWidth
                label="Numéro du lot (ex: 1, 9bis, 9ter)"
                value={formData.number || ''}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                className={dialogStyles.modernTextField}
              />
            </Grid>
            <Grid sx={{xs: 12, sm: 8}}>
              <TextField
                fullWidth
                label="Nom du lot"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={dialogStyles.modernTextField}
              />
            </Grid>
            <Grid sx={{xs: 12}}>
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
            {/* Starting price removed — we no longer set a default starting price */}
            <Grid  sx={{xs: 12, sm: 6}}>
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
            <Grid  sx={{xs: 12}}>
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
            {/* Image upload removed — lightweight backend does not store images */}
          </Grid>
        ) : (
          // Bulk Import Form
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Importez plusieurs lots à la fois en utilisant le format CSV. 
            </Alert>
            
            <Typography variant="body2" className={styles.helpText}>
              Format: <strong>Nom; Description; Prix de départ; Catégorie; Notes</strong>
            </Typography>
            
            <Box className={styles.sampleText}>
              Lot #1; Description du premier lot; 25; Meubles; Notes sur le lot 1<br/>
              Lot #2; Description du deuxième lot; 50; Bijoux; Notes sur le lot 2<br/>
              Lot #3; Description du troisième lot; 15; Meubles; Notes sur le lot 3
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={10}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Copiez-collez vos données ici..."
              className={`${dialogStyles.modernTextField} ${styles.bulkTextArea}`}
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions className={dialogStyles.dialogActions}>
        <Button 
          onClick={onClose}
          className={dialogStyles.secondaryButton}
        >
          Annuler
        </Button>
        
        {(tabValue === 0 || isEditMode) ? (
            <Button 
            onClick={handleSubmit} 
            variant="contained"
            className={dialogStyles.primaryButton}
            disabled={!formData.name}
          >
            {isEditMode ? '💾 Enregistrer les modifications' : '➕ Ajouter un lot'}
          </Button>
        ) : (
          <Button 
            onClick={handleBulkImport}
            variant="contained"
            className={dialogStyles.primaryButton}
            disabled={!bulkText.trim()}
          >
            📥 Importer les lots
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddBundleDialog;