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
import { useState, useEffect } from 'react';

const ParticipantForm = ({
    participantForm,
    handleFormChange,
    selectedParticipant,
    isNewParticipant,
    availableParticipants,
    handleParticipantSelect,
    auctionParticipants = [],
    onEnter
}) => {
    const [nextAvailableNumber, setNextAvailableNumber] = useState(1);
    const [bidderNumberError, setBidderNumberError] = useState('');
    
    // Find next available bidder number
    useEffect(() => {
        // Get all used bidder numbers
        const usedNumbers = auctionParticipants.map(p => 
            parseInt(p.local_number)
        ).filter(num => !isNaN(num));
        
        // Find next available number
        let nextNumber = 1;
        while (usedNumbers.includes(nextNumber)) {
            nextNumber++;
        }
        
        setNextAvailableNumber(nextNumber);
        
        // Set default bidder number if none is selected
        if (!participantForm.local_number) {
            handleFormChange('local_number', nextNumber.toString());
        }
    }, [auctionParticipants, participantForm.local_number, handleFormChange]);
    
    // Validate bidder number
    const validateBidderNumber = (value) => {
        if (!value) return 'Le numéro d\'enchérisseur est requis';
        
        const usedNumbers = auctionParticipants
            .filter(p => p.id !== selectedParticipant?.id) // Exclude current participant
            .map(p => p.local_number);
            
        if (usedNumbers.includes(value)) {
            return 'Ce numéro est déjà utilisé';
        }
        
        return '';
    };
    
    // Handle bidder number change
    const handleBidderNumberChange = (e) => {
        const value = e.target.value;
        const error = validateBidderNumber(value);
        setBidderNumberError(error);
        handleFormChange('local_number', value);
    };

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
                renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                        <li key={key} {...rest}>
                            {option.isAddOption ? (
                                <strong>{option.name}</strong>
                            ) : (
                                <>
                                    {option.name} 
                                    {option.email && (
                                        <span style={{color: '#666', marginLeft: 8}}>
                                            ({option.email})
                                        </span>
                                    )}
                                </>
                            )}
                        </li>
                    );
                }}
                freeSolo
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Chercher ou ajouter un participant"
                        className={dialogStyles.modernTextField}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && typeof onEnter === 'function') {
                                onEnter(e);
                            }
                        }}
                    />
                )}
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Simple number input with default value */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Numéro d'enchérisseur"
                        type="number"
                        value={participantForm.local_number || ''}
                        onChange={handleBidderNumberChange}
                        className={dialogStyles.modernTextField}
                        error={!!bidderNumberError}
                        helperText={bidderNumberError || `Prochain numéro disponible: ${nextAvailableNumber}`}
                        InputProps={{
                            inputProps: { min: 1 }
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Téléphone"
                        type='phone'
                        placeholder='06 00 00 00 00'
                        value={participantForm.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className={dialogStyles.modernTextField}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Adresse"
                        multiline
                        minRows={2}
                        maxRows={4}
                        value={participantForm.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                        className={dialogStyles.modernTextField}
                    />
                </Grid>
                <Grid item xs={12}>
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