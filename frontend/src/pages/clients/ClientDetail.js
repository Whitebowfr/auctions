import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Email, 
  Phone, 
  LocationOn, 
  EventNote, 
  ShoppingBag, 
  ArrowBack,
  Edit
} from '@mui/icons-material';
import { useAuction } from '../../context/AuctionContext';
import tableStyles from '../../components/ModernTable.module.css';
import dialogStyles from '../../components/ModernDialog.module.css';
import styles from './ClientDetail.module.css';
import { formatCurrency, formatAsPhoneNumber, validatePhoneNumber } from '../../utils/formatters';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients: globalParticipants, auctions, updateClient } = useAuction();
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  
  const client = globalParticipants.find(c => c.id === parseInt(id));
  
  if (!client) {
    return (
      <Box className={styles.container}>
        <Typography variant="h5" color="error">
          Client non trouvé.
        </Typography>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/clients')}
          sx={{ mt: 2 }}
        >
          Retour au répertoire
        </Button>
      </Box>
    );
  }
  
  // Find all auctions where this client participated
  const participatedAuctions = auctions.filter(auction => 
    auction.participants.some(p => p.email.toLowerCase() === client.email.toLowerCase())
  );
  
  // Find all purchases made by this client across all auctions
  const clientPurchases = auctions.flatMap(auction => {
    const participant = auction.participants.find(
      p => p.email.toLowerCase() === client.email.toLowerCase()
    );
    
    if (!participant) return [];
    
    return auction.sales
      .filter(sale => sale.participantId === participant.id)
      .map(sale => ({
        ...sale,
        auctionId: auction.id,
        auctionName: auction.name,
        auctionDate: auction.date,
        bundle: auction.bundles.find(b => b.id === sale.bundleId)
      }));
  });
  
  // Calculate client statistics
  const totalPurchases = clientPurchases.length;
  const totalSpent = clientPurchases.reduce((sum, purchase) => sum + (parseFloat(purchase.finalPrice) || 0), 0);
  const averagePurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleViewAuction = (auctionId) => {
    navigate(`/auction/${auctionId}`);
  };

  const handleOpenEditDialog = () => {
    setEditForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    if (field === "phone") {
      value = formatAsPhoneNumber(value);
    }
    setEditForm({
      ...editForm,
      [field]: value
    });
  };

  const handleSaveClient = async () => {
    try {
      await updateClient(client.id, editForm);
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update client:", error);
      // You could add error handling UI here
    }
  };
  
  return (
    <Box className={styles.container}>
      <Button 
        startIcon={<ArrowBack />}
        onClick={() => navigate('/clients')}
        className={styles.backButton}
      >
        Retour au répertoire
      </Button>
      
      <Box className={styles.header}>
        <Box className={styles.clientHeader}>
          <Avatar className={styles.clientAvatar}>
            {client.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h3" className={styles.clientName}>
              {client.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {participatedAuctions.length} participation{participatedAuctions.length !== 1 ? 's' : ''} • {totalPurchases} achat{totalPurchases !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Button
            startIcon={<Edit />}
            variant="outlined"
            className={styles.editButton}
            onClick={handleOpenEditDialog}
          >
            Modifier
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card className={styles.infoCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations de contact
              </Typography>
              
              <Box className={styles.contactItem}>
                <Email color="primary" />
                <Typography>{client.email || "Pas d'email renseigné"}</Typography>
              </Box>
              
              <Box className={styles.contactItem}>
                <Phone color="primary" />
                <Typography>
                  {client.phone ? formatAsPhoneNumber(client.phone) : "Pas de téléphone renseigné"}
                </Typography>
              </Box>
              
              <Box className={styles.contactItem}>
                <LocationOn color="primary" />
                <Typography>
                  {client.address || "Pas d'adresse renseignée"}
                </Typography>
              </Box>
              
              <Divider className={styles.divider} />
              
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              
              <Box className={styles.statsGrid}>
                <Box className={styles.statItem}>
                  <Typography variant="h4" className={styles.statValue}>
                    {participatedAuctions.length}
                  </Typography>
                  <Typography variant="body2" className={styles.statLabel}>
                    Ventes participées
                  </Typography>
                </Box>
                
                <Box className={styles.statItem}>
                  <Typography variant="h4" className={styles.statValue}>
                    {totalPurchases}
                  </Typography>
                  <Typography variant="body2" className={styles.statLabel}>
                    Achats totaux
                  </Typography>
                </Box>
                
                <Box className={styles.statItem}>
                  <Typography variant="h4" className={styles.statValue}>
                    {formatCurrency(totalSpent)}
                  </Typography>
                  <Typography variant="body2" className={styles.statLabel}>
                    Dépense totale
                  </Typography>
                </Box>
                
                <Box className={styles.statItem}>
                  <Typography variant="h4" className={styles.statValue}>
                    {formatCurrency(averagePurchase)}
                  </Typography>
                  <Typography variant="body2" className={styles.statLabel}>
                    Moyenne / achat
                  </Typography>
                </Box>
              </Box>
              
              {client.notes && (
                <>
                  <Divider className={styles.divider} />
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2" className={styles.notes}>
                    {client.notes}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper className={styles.tabsContainer}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              className={styles.tabs}
            >
              <Tab
                icon={<EventNote />}
                label="Participations"
                className={styles.tab}
              />
              <Tab
                icon={<ShoppingBag />}
                label="Achats"
                className={styles.tab}
              />
            </Tabs>
            
            <Box className={styles.tabContent}>
              {tabValue === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead className={tableStyles.tableHeader}>
                      <TableRow>
                        <TableCell className={tableStyles.tableHeaderCell}>Vente</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Date</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Numéro d'enchérisseur</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Achats</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participatedAuctions.length > 0 ? (
                        participatedAuctions.map(auction => {
                          const participant = auction.participants.find(
                            p => p.email.toLowerCase() === client.email.toLowerCase()
                          );
                          
                          const auctionPurchases = auction.sales.filter(
                            sale => sale.participantId === participant.id
                          );
                          
                          return (
                            <TableRow key={auction.id} className={tableStyles.tableRow}>
                              <TableCell className={tableStyles.tableCell}>
                                <Typography variant="subtitle2">{auction.name}</Typography>
                              </TableCell>
                              <TableCell className={tableStyles.tableCell}>
                                {new Date(auction.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className={tableStyles.tableCell}>
                                <Chip
                                  label={`#${participant.local_number}`}
                                  size="small"
                                  className={styles.bidderChip}
                                />
                              </TableCell>
                              <TableCell className={tableStyles.tableCell}>
                                <Chip
                                  label={auctionPurchases.length}
                                  color={auctionPurchases.length > 0 ? "success" : "default"}
                                  size="small"
                                  className={styles.countChip}
                                />
                              </TableCell>
                              <TableCell className={tableStyles.tableCell}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleViewAuction(auction.id)}
                                  className={styles.viewButton}
                                >
                                  Voir la vente
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography variant="body1" color="textSecondary">
                              Ce client n'a participé à aucune vente
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {tabValue === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead className={tableStyles.tableHeader}>
                      <TableRow>
                        <TableCell className={tableStyles.tableHeaderCell}>Vente</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Lot</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Prix de départ</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Prix final</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clientPurchases.length > 0 ? (
                        clientPurchases.map(purchase => (
                          <TableRow key={purchase.id} className={tableStyles.tableRow}>
                            <TableCell className={tableStyles.tableCell}>
                              <Typography
                                variant="subtitle2"
                                sx={{ cursor: 'pointer', color: '#3b82f6' }}
                                onClick={() => handleViewAuction(purchase.auctionId)}
                              >
                                {purchase.auctionName}
                              </Typography>
                            </TableCell>
                            <TableCell className={tableStyles.tableCell}>
                              <Typography variant="body2">{purchase.bundle?.name || purchase.bundleId}</Typography>
                            </TableCell>
                            <TableCell className={tableStyles.tableCell}>
                              {formatCurrency(purchase.startingPrice)}
                            </TableCell>
                            <TableCell className={tableStyles.tableCell}>
                              <Typography className={styles.finalPrice}>
                                {formatCurrency(purchase.finalPrice)}
                              </Typography>
                            </TableCell>
                            <TableCell className={tableStyles.tableCell}>
                              {new Date(purchase.auctionDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography variant="body1" color="textSecondary">
                              Ce client n'a effectué aucun achat
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Client Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className={dialogStyles.modernDialog}
      >
        <DialogTitle className={dialogStyles.dialogTitle}>
          Modifier les informations du client
        </DialogTitle>
        <DialogContent className={dialogStyles.dialogContent}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom"
                value={editForm.name}
                onChange={(e) => handleEditFormChange('name', e.target.value)}
                className={dialogStyles.modernTextField}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => handleEditFormChange('email', e.target.value)}
                className={dialogStyles.modernTextField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={editForm.phone}
                onChange={(e) => handleEditFormChange('phone', e.target.value)}
                className={dialogStyles.modernTextField}
                error={validatePhoneNumber(editForm.phone) !== ""}
                helperText={validatePhoneNumber(editForm.phone)}
              />
            </Grid>
            <Grid item xs={12} size={6}>
              <TextField
                fullWidth
                label="Adresse"
                value={editForm.address}
                onChange={(e) => handleEditFormChange('address', e.target.value)}
                className={dialogStyles.modernTextField}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={editForm.notes}
                onChange={(e) => handleEditFormChange('notes', e.target.value)}
                className={dialogStyles.modernTextField}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className={dialogStyles.dialogActions}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            className={dialogStyles.secondaryButton}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSaveClient}
            variant="contained"
            className={dialogStyles.primaryButton}
            disabled={!editForm.name || validatePhoneNumber(editForm.phone) !== ""}
          >
            Enregistrer les modifications
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientDetail;