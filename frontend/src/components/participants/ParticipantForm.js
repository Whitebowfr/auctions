import {
    Autocomplete,
    TextField,
    Box,
    Grid,
    Alert,
    Typography
} from '@mui/material';
import styles from './ParticipantForm.module.css';
import dialogStyles from '../ModernDialog.module.css';
import { validatePhoneNumber } from '../../utils/formatters';

const ParticipantForm = ({
    participantForm,
    handleFormChange,
    selectedParticipant,
    isNewParticipant,
    availableParticipants,
    handleParticipantSelect
}) => {
    return (
        <Box className={styles.formContainer}>
            <Autocomplete
                value={participantForm.name}
                onChange={handleParticipantSelect}
                options={availableParticipants}
                getOptionLabel={(option) => 
                    typeof option === 'string' ? option : option.name || ''
                }
                filterOptions={(options, params) => {
                    // First, filter the existing options based on input
                    const { inputValue } = params;
                    const filtered = options.filter(option => 
                        option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                        (option.email && option.email.toLowerCase().includes(inputValue.toLowerCase()))
                    );
                    
                    // Add "create new" option if input doesn't match any existing option
                    const inputValueExists = options.some(option => 
                        option.name.toLowerCase() === inputValue.toLowerCase()
                    );
                    
                    if (inputValue !== '' && !inputValueExists) {
                        filtered.push({
                            inputValue: inputValue,
                            name: `Ajouter "${inputValue}"`,
                            isAddOption: true
                        });
                    }
                    
                    return filtered;
                }}
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                renderOption={(props, option) => (
                    <li {...props}>
                        {option.isAddOption ? (
                            <strong>{option.name}</strong>
                        ) : (
                            <>
                                {option.name} 
                                {option.email && <span style={{color: '#666', marginLeft: 8}}>({option.email})</span>}
                            </>
                        )}
                    </li>
                )}
                freeSolo
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Chercher ou ajouter un participant"
                        className={dialogStyles.modernTextField}
                    />
                )}
            />

            <Grid container spacing={2}>
                <Grid sx={{xs: 12}} size={6}>
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={participantForm.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className={dialogStyles.modernTextField}
                        required={isNewParticipant}
                    />
                </Grid>
                <Grid sx={{xs: 12, sm: 6}} size={6}>
                    <TextField
                        fullWidth
                        label="Téléphone"
                        type='phone'
                        placeholder='06 00 00 00 00'
                        value={participantForm.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className={dialogStyles.modernTextField}
                        error={validatePhoneNumber(participantForm.phone) != ''}
                        helperText={validatePhoneNumber(participantForm.phone)} 
                    />
                </Grid>
                <Grid sx={{xs: 12, sm: 6}} size={12}>
                    <TextField
                        fullWidth
                        label="Adresse"
                        value={participantForm.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                        className={dialogStyles.modernTextField}
                    />
                </Grid>
                <Grid sx={{xs: 12}} size={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Notes (optionnel)"
                        value={participantForm.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        className={dialogStyles.modernTextField}
                    />
                </Grid>
            </Grid>

            {selectedParticipant && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Ancien participant:</strong> Cette personne a déjà fait partie d'une ancienne vente.
                    </Typography>
                </Alert>
            )}
        </Box>
    );
};

export default ParticipantForm;