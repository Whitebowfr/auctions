import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Avatar,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Search, Email, Phone, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuction } from '../../context/AuctionContext';
import BulkImportForm from '../../components/participants/BulkImportForm';
import tableStyles from '../../components/ModernTable.module.css';
import styles from './ClientsDirectory.module.css';
import { formatAsPhoneNumber } from '../../utils/formatters';

const ClientsDirectory = () => {
  const navigate = useNavigate();
  const { clients: globalParticipants, auctions, addOrUpdateClient } = useAuction();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Filter clients based on search term
  const filteredClients = globalParticipants.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  // Calculate client participation statistics
  const clientStats = filteredClients.map(client => {
    const participations = auctions.filter(auction => 
      auction.participants.some(p => p.name.toLowerCase() === client.name.toLowerCase())
    );
    
    const purchases = auctions.flatMap(auction => 
      auction.sales.filter(sale => {
        const participant = auction.participants.find(p => p.id === sale.participantId);
        return participant && participant.name.toLowerCase() === client.name.toLowerCase();
      })
    );
    
    return {
      ...client,
      participationCount: participations.length,
      purchaseCount: purchases.length,
      totalSpent: purchases.reduce((sum, sale) => sum + (parseFloat(sale.finalPrice) || 0), 0)
    };
  });

  // Pagination
  const paginatedClients = clientStats.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleViewClient = (client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleNewClientChange = (field, value) => {
    setNewClientForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateClient = async () => {
    if (!newClientForm.name?.trim()) return;
    try {
      // Normalize optional fields so empty email never causes issues
      const payload = {
        ...newClientForm,
        email: newClientForm.email?.trim() || '',
        phone: newClientForm.phone?.trim() || '',
        address: newClientForm.address?.trim() || ''
      };

      await addOrUpdateClient(payload);
      setNewClientForm({ name: '', email: '', phone: '', address: '' });
      setAddDialogOpen(false);
    } catch (e) {
      // error handled in context
    }
  };

  const handleDeleteClient = async (client) => {
    console.log('[ClientsDirectory] delete clicked for client:', client.id, client.name);
    if (!window.confirm(`Supprimer l'acheteur "${client.name}" ?`)) {
      console.log('[ClientsDirectory] delete canceled by user');
      return;
    }

    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/clients/${client.id}`;
      console.log('[ClientsDirectory] calling DELETE', url);
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[ClientsDirectory] delete client failed', res.status, body);
        return;
      }

      console.log('[ClientsDirectory] client deleted successfully:', client.id);

      // Refresh the current page so the client list and stats are up-to-date
      navigate(0);
    } catch (e) {
      console.error('[ClientsDirectory] network error while deleting client', e);
    }
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          Répertoire des acheteurs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Rechercher un acheteur..."
            variant="outlined"
            className={styles.searchField}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }
            }}
          />
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => setImportDialogOpen(true)}
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Nouvel acheteur
          </Button>
        </Box>
      </Box>

      <Card className={styles.statsCard}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Vue d'ensemble des acheteurs
          </Typography>
          <Box className={styles.statsContainer}>
            <Box className={styles.statItem}>
              <Typography variant="h4">{globalParticipants.length}</Typography>
              <Typography variant="body2">Acheteurs au total</Typography>
            </Box>
            <Box className={styles.statItem}>
              <Typography variant="h4">
                {auctions.reduce((sum, auction) => sum + auction.participants.length, 0)}
              </Typography>
              <Typography variant="body2">Participations</Typography>
            </Box>
            <Box className={styles.statItem}>
              <Typography variant="h4">
                {auctions.reduce((sum, auction) => sum + auction.sales.length, 0)}
              </Typography>
              <Typography variant="body2">Lots adjugés</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} className={tableStyles.tableContainer} sx={{ maxWidth: '100%' }}>
        <Table>
          <TableHead className={tableStyles.tableHeader}>
            <TableRow>
              <TableCell className={tableStyles.tableHeaderCell}>Acheteur</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Contact</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Participations</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Lots adjugés</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Total adjudications</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedClients.map((client) => (
              <TableRow key={client.id} className={tableStyles.tableRow}>
                <TableCell className={tableStyles.tableCell}>
                  <Box className={styles.clientCell}>
                    <Avatar className={styles.clientAvatar}>
                      {client.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" className={styles.clientName}>
                        {client.name}
                      </Typography>
                      {client.address && (
                        <Typography variant="body2" color="textSecondary">
                          {client.address}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell className={tableStyles.tableCell}>
                  <Box className={styles.contactInfo}>
                    {/* email can be empty or undefined; render placeholder */}
                    <Box className={styles.contactItem}>
                      <Email fontSize="small" color="action" />
                      <Typography component="span" variant="body2">
                        {client.email || "—"}
                      </Typography>
                    </Box>
                    <Box className={styles.contactItem}>
                      <Phone fontSize="small" color="action" />
                      <Typography component="span" variant="body2">
                        {client.phone ? formatAsPhoneNumber(client.phone) : "—"}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell className={tableStyles.tableCell}>
                  <Chip
                    label={client.participationCount}
                    color={client.participationCount > 0 ? "primary" : "default"}
                    size="small"
                    className={styles.countChip}
                  />
                </TableCell>
                
                <TableCell className={tableStyles.tableCell}>
                  <Chip
                    label={client.purchaseCount}
                    color={client.purchaseCount > 0 ? "success" : "default"}
                    size="small"
                    className={styles.countChip}
                  />
                </TableCell>
                
                <TableCell className={tableStyles.tableCell}>
                  <Typography variant="body2" className={styles.moneyText}>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
                      .format(client.totalSpent)}
                  </Typography>
                </TableCell>
                
                <TableCell className={tableStyles.tableCell}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewClient(client)}
                      className={styles.viewButton}
                    >
                      Voir le profil
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClient(client)}
                    >
                      Supprimer
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            
            {paginatedClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    {searchTerm ? "Aucun client correspondant à votre recherche" : "Aucun client trouvé"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box className={styles.paginationContainer}>
        <Pagination
          count={Math.ceil(filteredClients.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
          className={styles.pagination}
        />
      </Box>

  {/* Import CSV dialog for bulk adding buyers (reuses participants bulk form) */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className={tableStyles.modernDialog}
      >
        <DialogTitle>Import CSV des acheteurs</DialogTitle>
        <DialogContent>
          <BulkImportForm bulkText={bulkText} setBulkText={setBulkText} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            disabled={!bulkText.trim()}
            // TODO: plug into a dedicated bulk client import handler
            onClick={() => setImportDialogOpen(false)}
          >
            Importer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add new client dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nouvel acheteur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom"
              fullWidth
              required
              value={newClientForm.name}
              onChange={(e) => handleNewClientChange('name', e.target.value)}
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={newClientForm.email}
              onChange={(e) => handleNewClientChange('email', e.target.value)}
            />
            <TextField
              label="Téléphone"
              fullWidth
              value={newClientForm.phone}
              onChange={(e) => handleNewClientChange('phone', e.target.value)}
            />
            <TextField
              label="Adresse"
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              value={newClientForm.address}
              onChange={(e) => handleNewClientChange('address', e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateClient}
            disabled={!newClientForm.name.trim()}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Native confirm used for delete; no extra dialog required */}
    </Box>
  );
};

export default ClientsDirectory;