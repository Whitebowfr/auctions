import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import styles from './ParticipantManagement.module.css';
import dialogStyles from '../../components/ModernDialog.module.css';
import { formatAsPhoneNumber } from '../../utils/formatters';

// Import custom components
import ParticipantForm from '../../components/participants/ParticipantForm';
import ParticipantTable from '../../components/participants/ParticipantTable';
import BulkImportForm from '../../components/participants/BulkImportForm';

// Import utility functions
import { 
    getAvailableParticipants, 
    processBulkImport, 
    updateParticipant 
} from '../../utils/participantUtils';

const ParticipantManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { auctions, addParticipant, globalParticipants, deleteParticipant } = useAuction();

    const auction = auctions.find(a => a.id === parseInt(id));
    const [tabValue, setTabValue] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [participantForm, setParticipantForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
    });
    const [isNewParticipant, setIsNewParticipant] = useState(false);

    if (!auction) {
        return <Alert severity="error">Auction not found.</Alert>;
    }

    // Get available participants using utility function
    const availableParticipants = getAvailableParticipants(globalParticipants, auction.participants);

    const handleParticipantSelect = (event, newValue) => {
        if (typeof newValue === 'string') {
            // User typed a new name
            setParticipantForm({
                name: newValue,
                email: '',
                phone: '',
                address: '',
                notes: ''
            });
            setSelectedParticipant(null);
            setIsNewParticipant(true);
        } else if (newValue && newValue.isAddOption) {
            // User selected "Add new participant"
            setParticipantForm({
                name: newValue.inputValue,
                email: '',
                phone: '',
                address: '',
                notes: ''
            });
            setSelectedParticipant(null);
            setIsNewParticipant(true);
        } else if (newValue) {
            // User selected existing participant
            setParticipantForm({
                name: newValue.name,
                email: newValue.email || '',
                phone: newValue.phone || '',
                address: newValue.address || '',
                notes: newValue.notes || ''
            });
            setSelectedParticipant(newValue);
            setIsNewParticipant(false);
        } else {
            // Clear selection
            setParticipantForm({
                name: '',
                email: '',
                phone: '',
                address: '',
                notes: ''
            });
            setSelectedParticipant(null);
            setIsNewParticipant(false);
        }
    };

    const handleFormChange = (field, value) => {
        if (field == "phone") {
            value = formatAsPhoneNumber(value)
        }

        setParticipantForm(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Don't automatically mark as new participant when editing
        // This allows us to track when we're updating an existing participant
    };

    const handleBulkImport = () => {
        const participants = processBulkImport(bulkText);
        participants.forEach(participant => {
            addParticipant(auction.id, participant);
        });
        setBulkText('');
        setOpenDialog(false);
    };

    const handleAddSingle = () => {
        if (!participantForm.name.trim()) return;

        addParticipant(auction.id, participantForm);

        // Reset form
        setParticipantForm({
            name: '',
            email: '',
            phone: '',
            address: '',
            notes: ''
        });
        setSelectedParticipant(null);
        setIsNewParticipant(false);
        setOpenDialog(false);
    };

    // Update handleUpdateAndAdd with console logs
    const handleUpdateAndAdd = async () => {
        if (!selectedParticipant || !participantForm.name.trim()) return;
        
        console.log('Updating participant with data:', participantForm); // Add log
        
        try {
            // First update the client using the utility function
            const result = await updateParticipant(selectedParticipant.id, participantForm);
            console.log('Update response:', result); // Add log
            
            // Then add them to the auction
            addParticipant(auction.id, {
                ...participantForm,
                id: selectedParticipant.id
            });
            
            // Reset form
            resetForm();
            setOpenDialog(false); // Close dialog after success
        } catch (error) {
            console.error('Error updating client:', error);
        }
    };

    const handleDeleteParticipant = (id) => {
        if (window.confirm("Etes-vous sûrs de vouloir supprimer cet utilisateur de cette vente ? Il pourra être rajouté par la suite.")) {
            deleteParticipant(auction.id, id)
        }
    }

    const resetForm = () => {
        setParticipantForm({
            name: '',
            email: '',
            phone: '',
            address: '',
            notes: ''
        });
        setSelectedParticipant(null);
        setIsNewParticipant(false);
        setTabValue(0);
    };

    return (
        <Box className={styles.container}>
            <Button
                onClick={() => navigate(`/auction/${auction.id}`)}
                className={styles.backButton}
            >
                ← Retourner à la vente {auction.name}
            </Button>

            <Box className={styles.header}>
                <Typography variant="h4" className={styles.title}>
                    👥 Participants - {auction.name}
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => setOpenDialog(true)}
                    className={styles.addButton}
                >
                    ➕ Ajouter des participants
                </Button>
            </Box>

            <Alert severity="info" className={styles.infoAlert}>
                <Typography sx={{ fontWeight: 600 }}>
                    Nombre de participants: {auction.participants.length} |
                    Nombre total enregistrés: {globalParticipants.length} participants
                </Typography>
            </Alert>

            <ParticipantTable participants={auction.participants} auctionId={auction.id} handleDeleteParticipant={handleDeleteParticipant} />

            <Dialog
                open={openDialog}
                onClose={() => {
                    setOpenDialog(false);
                    resetForm();
                }}
                maxWidth="md"
                fullWidth
                className={dialogStyles.modernDialog}
            >
                <DialogTitle className={dialogStyles.dialogTitle}>
                    Ajouter des participants
                </DialogTitle>
                <DialogContent className={dialogStyles.dialogContent}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, v) => setTabValue(v)}
                        className={styles.tabsContainer}
                    >
                        <Tab label="Ajout simple" className={styles.tab} />
                        <Tab label="Ajout en vrac" className={styles.tab} />
                    </Tabs>

                    {tabValue === 0 && (
                        <ParticipantForm
                            participantForm={participantForm}
                            handleFormChange={handleFormChange}
                            selectedParticipant={selectedParticipant}
                            isNewParticipant={isNewParticipant}
                            availableParticipants={availableParticipants}
                            handleParticipantSelect={handleParticipantSelect}
                        />
                    )}

                    {tabValue === 1 && (
                        <BulkImportForm
                            bulkText={bulkText}
                            setBulkText={setBulkText}
                        />
                    )}
                </DialogContent>
                <DialogActions className={dialogStyles.dialogActions}>
                    <Button
                        onClick={() => {
                            setOpenDialog(false);
                            resetForm();
                        }}
                        className={dialogStyles.secondaryButton}
                    >
                        Annuler
                    </Button>
                    {tabValue === 0 && (
                        <>
                            {selectedParticipant && !isNewParticipant ? (
                                <>
                                    <Button
                                        onClick={handleUpdateAndAdd}
                                        variant="contained"
                                        color="primary"
                                        className={dialogStyles.primaryButton}
                                        disabled={!participantForm.name}
                                    >
                                        Mettre à jour et ajouter
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={handleAddSingle}
                                    variant="contained"
                                    className={dialogStyles.primaryButton}
                                    disabled={!participantForm.name}
                                >
                                    Ajouter le participant
                                </Button>
                            )}
                        </>
                    )}
                    {tabValue === 1 && (
                        <Button
                            onClick={handleBulkImport}
                            variant="contained"
                            className={dialogStyles.primaryButton}
                            disabled={!bulkText.trim()}
                        >
                            Importer
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ParticipantManagement;