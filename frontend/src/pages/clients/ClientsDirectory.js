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
  Pagination
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Search, Person, Email, Phone } from '@mui/icons-material';
import { useAuction } from '../../context/AuctionContext';
import tableStyles from '../../components/ModernTable.module.css';
import styles from './ClientsDirectory.module.css';
import { formatAsPhoneNumber } from '../../utils/formatters';

const ClientsDirectory = () => {
  const navigate = useNavigate();
  const { clients: globalParticipants, auctions } = useAuction();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Filter clients based on search term
  const filteredClients = globalParticipants.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  // Calculate client participation statistics
  const clientStats = filteredClients.map(client => {
    const participations = auctions.filter(auction => 
      auction.participants.some(p => p.email.toLowerCase() === client.email.toLowerCase())
    );
    
    const purchases = auctions.flatMap(auction => 
      auction.sales.filter(sale => {
        const participant = auction.participants.find(p => p.id === sale.participantId);
        return participant && participant.email.toLowerCase() === client.email.toLowerCase();
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

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          Répertoire des clients
        </Typography>
        <TextField
          placeholder="Rechercher un client..."
          variant="outlined"
          className={styles.searchField}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Card className={styles.statsCard}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Vue d'ensemble
          </Typography>
          <Box className={styles.statsContainer}>
            <Box className={styles.statItem}>
              <Typography variant="h4">{globalParticipants.length}</Typography>
              <Typography variant="body2">Clients au total</Typography>
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
              <Typography variant="body2">Achats</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} className={tableStyles.tableContainer}>
        <Table>
          <TableHead className={tableStyles.tableHeader}>
            <TableRow>
              <TableCell className={tableStyles.tableHeaderCell}>Client</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Contact</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Participations</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Achats</TableCell>
              <TableCell className={tableStyles.tableHeaderCell}>Total dépensé</TableCell>
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
                    {/* Fix: Change the nested structure to avoid div inside p */}
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
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewClient(client)}
                    className={styles.viewButton}
                  >
                    Voir le profil
                  </Button>
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
    </Box>
  );
};

export default ClientsDirectory;