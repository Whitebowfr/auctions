import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import styles from './Reports.module.css';
import tableStyles from '../components/ModernTable.module.css';
import dialogStyles from '../components/ModernDialog.module.css';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PictureAsPdf, Settings } from '@mui/icons-material';
import { generateBundlesSheet, generateSalesRecap, downloadPDF } from '../utils/pdfUtils';

const Reports = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions, updateEnchere } = useAuction();
  
  const auction = auctions.find(a => a.id === parseInt(id));
  const [feeSettingsOpen, setFeeSettingsOpen] = useState(false);
  const [managementFeeRate, setManagementFeeRate] = useState(
    auction?.managementFeeRate || 11.8
  );

  if (!auction) {
    return <div>Vente aux enchères introuvable</div>;
  }

  const totalRevenue = auction.sales.reduce((sum, sale) => sum + parseFloat(sale.finalPrice), 0);
  const totalStartingValue = auction.sales.reduce((sum, sale) => sum + parseFloat(sale.startingPrice), 0);
  const totalProfit = totalRevenue - totalStartingValue;
  
  // Calculate management fees
  const feeRate = auction.managementFeeRate || 11.8;
  const managementFee = totalRevenue * (feeRate / 100);
  const vatOnFee = managementFee * 0.2; // 20% VAT
  const totalFees = managementFee + vatOnFee;
  const netAmount = totalRevenue - totalFees;
  
  const soldBundles = auction.sales.length;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
  const successRate = auction.bundles.length > 0 ? ((soldBundles / auction.bundles.length) * 100).toFixed(1) : 0;

  const topSales = auction.sales
    .sort((a, b) => b.finalPrice - a.finalPrice)
    .slice(0, 5);

  const categoryBreakdown = auction.sales.reduce((acc, sale) => {
    const bundle = auction.bundles.find(b => b.id === sale.bundleId);
    if (bundle) {
      const category = bundle.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { items: 0, revenue: 0 };
      }
      acc[category].items += 1;
      acc[category].revenue += sale.finalPrice;
    }
    return acc;
  }, {});

  const exportReport = () => {
    const reportData = {
      auction: {
        name: auction.name,
        date: auction.date,
        location: auction.location,
        totalParticipants: auction.participants.length,
        totalBundles: auction.bundles.length,
        soldBundles: soldBundles,
        totalRevenue: totalRevenue,
        totalProfit: totalProfit,
        managementFee: managementFee,
        vatOnFee: vatOnFee,
        totalFees: totalFees,
        netAmount: netAmount
      },
      topSales: topSales,
      categoryBreakdown: categoryBreakdown,
      generatedOn: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `auction-report-${auction.date}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Function to generate empty bundles sheet before the sale
  const handleExportEmptyBundlesSheet = () => {
    // Sort bundles by ID for better readability
    const sortedBundles = [...auction.bundles].sort((a, b) => a.id - b.id);
    
    // Generate the PDF document
    const doc = generateBundlesSheet(auction, sortedBundles);
    
    // Download the PDF
    downloadPDF(doc, `lots-vides-${auction.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  // Function to generate complete sales recap
  const handleExportSalesRecap = () => {
    // Get all sales with bundle details
    const salesWithDetails = auction.sales.map(sale => {
      const bundle = auction.bundles.find(b => b.id === sale.bundleId);
      return {
        ...sale,
        bundle
      };
    });
    
    // Sort by bundle ID for better readability
    const sortedSales = [...salesWithDetails].sort((a, b) => a.bundleId - b.bundleId);
    
    // Create a modified auction object with the management fee rate
    const auctionWithFeeRate = {
      ...auction,
      managementFeeRate: auction.managementFeeRate || managementFeeRate
    };
    
    // Generate the PDF document
    const doc = generateSalesRecap(auctionWithFeeRate, sortedSales, auction.bundles);
    
    // Download the PDF
    downloadPDF(doc, `recap-ventes-${auction.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const handleSaveFeeSettings = async () => {
    try {
      // Update the auction with the new management fee rate
      await updateEnchere(auction.id, {
        ...auction,
        managementFeeRate: parseFloat(managementFeeRate)
      });
      setFeeSettingsOpen(false);
    } catch (error) {
      console.error('Failed to update management fee rate:', error);
    }
  };

  return (
    <Box className={styles.container}>
      <Button 
        onClick={() => navigate(`/auction/${auction.id}`)} 
        sx={{ 
          mb: 2,
          background: 'transparent !important',
          color: '#64748b !important',
          textTransform: 'none !important',
          fontWeight: '500 !important'
        }}
      >
        ← Retour à {auction.name}
      </Button>

      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          📊 Résumé et statistiques - {auction.name}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<Settings />}
            onClick={() => setFeeSettingsOpen(true)}
            className={styles.settingsButton}
          >
            Frais de gestion
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<PictureAsPdf />}
            onClick={handleExportEmptyBundlesSheet}
            className={styles.pdfButton}
          >
            Feuille de lots vide
          </Button>
          <Button 
            variant="outlined" 
            color="success"
            startIcon={<PictureAsPdf />}
            onClick={handleExportSalesRecap}
            className={styles.pdfButton}
          >
            Récap des ventes
          </Button>
          <Button 
            variant="contained" 
            onClick={exportReport}
            className={styles.exportButton}
          >
            📁 Exporter le rapport
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Box className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Revenu total
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber} color="success.main">
              {formatCurrency(totalRevenue)}
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Frais de gestion ({feeRate.toFixed(1)}% + TVA)
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber} color="error.main">
              {formatCurrency(totalFees)}
            </Typography>
            <Typography variant="body2" className={styles.summarySubtext}>
              {formatCurrency(managementFee)} + {formatCurrency(vatOnFee)} TVA
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Montant net
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber} color="info.main">
              {formatCurrency(netAmount)}
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Écart total avec les prix de départ
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber} color="primary">
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="body2" className={styles.summarySubtext}>
              {profitMargin}%
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Nombre de lots vendus
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber}>
              {soldBundles}/{auction.bundles.length}
            </Typography>
            <Typography variant="body2" className={styles.summarySubtext}>
              {successRate}% de ventes
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Participants
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber}>
              {auction.participants.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Fee Settings Dialog */}
      <Dialog 
        open={feeSettingsOpen} 
        onClose={() => setFeeSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        className={dialogStyles.modernDialog}
      >
        <DialogTitle className={dialogStyles.dialogTitle}>
          Paramètres des frais de gestion
        </DialogTitle>
        <DialogContent className={dialogStyles.dialogContent}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Configurez le taux de frais de gestion pour cette vente. Les frais sont calculés sur le montant total des ventes,
              et la TVA de 20% est appliquée sur ces frais.
            </Typography>
            
            <TextField
              fullWidth
              label="Taux de frais de gestion"
              type="number"
              value={managementFeeRate}
              onChange={(e) => setManagementFeeRate(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { 
                  min: 0, 
                  max: 100,
                  step: 0.1
                }
              }}
              className={dialogStyles.modernTextField}
              sx={{ mt: 2 }}
              helperText={`Les frais pour ${formatCurrency(totalRevenue)} seraient de ${formatCurrency(totalRevenue * (managementFeeRate / 100) * 1.2)}`}
            />
          </Box>
        </DialogContent>
        <DialogActions className={dialogStyles.dialogActions}>
          <Button 
            onClick={() => setFeeSettingsOpen(false)}
            className={dialogStyles.secondaryButton}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSaveFeeSettings}
            variant="contained"
            className={dialogStyles.primaryButton}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auction Details */}
      <Paper className={styles.detailsCard}>
        <Typography variant="h5" className={styles.detailsTitle}>
          Détails
        </Typography>
        <List>
          <ListItem className={styles.detailItem}>
            <ListItemText 
              primary={<span className={styles.detailLabel}>Nom</span>} 
              secondary={<span className={styles.detailValue}>{auction.name}</span>} 
            />
          </ListItem>
          <ListItem className={styles.detailItem}>
            <ListItemText 
              primary={<span className={styles.detailLabel}>Date</span>} 
              secondary={<span className={styles.detailValue}>{formatDate(auction.date)}</span>} 
            />
          </ListItem>
          <ListItem className={styles.detailItem}>
            <ListItemText 
              primary={<span className={styles.detailLabel}>Lieu</span>} 
              secondary={<span className={styles.detailValue}>{auction.address || 'Non spécifié'}</span>} 
            />
          </ListItem>
          <ListItem className={styles.detailItem}>
            <ListItemText 
              primary={<span className={styles.detailLabel}>Frais de gestion</span>} 
              secondary={
                <span className={styles.detailValue}>
                  {feeRate.toFixed(1)}% + TVA (20%) = {formatCurrency(totalFees)}
                </span>
              } 
            />
          </ListItem>
        </List>
      </Paper>

      <Box className={styles.reportsGrid}>
        {/* Top Sales */}
        <Paper className={styles.reportCard}>
          <Typography variant="h5" className={styles.reportTitle}>
            🏆 Top 5 des ventes
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead className={tableStyles.tableHeader}>
                <TableRow>
                  <TableCell className={tableStyles.tableHeaderCell}>Lot</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell}>Acheteur</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Prix</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topSales.map((sale, index) => (
                  <TableRow key={index} className={tableStyles.tableRow}>
                    <TableCell className={tableStyles.tableCell}>{sale.bundleName}</TableCell>
                    <TableCell className={tableStyles.tableCell}>{sale.participantName}</TableCell>
                    <TableCell className={tableStyles.tableCell} align="right">{formatCurrency(sale.finalPrice)}</TableCell>
                    <TableCell className={tableStyles.tableCell} align="right">
                      <Chip 
                        label={formatCurrency(sale.profit)}
                        color="success"
                        size="small"
                        className={tableStyles.statusChip}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Category Breakdown */}
        <Paper className={styles.reportCard}>
          <Typography variant="h5" className={styles.reportTitle}>
            📈 Ventes par catégorie
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead className={tableStyles.tableHeader}>
                <TableRow>
                  <TableCell className={tableStyles.tableHeaderCell}>Catégorie</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Nombre vendus</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Revenus</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Prix moyen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(categoryBreakdown).map(([category, data], index) => (
                  <TableRow key={index} className={tableStyles.tableRow}>
                    <TableCell className={tableStyles.tableCell}>{category}</TableCell>
                    <TableCell className={tableStyles.tableCell} align="right">{data.items}</TableCell>
                    <TableCell className={tableStyles.tableCell} align="right">{formatCurrency(data.revenue)}</TableCell>
                    <TableCell className={tableStyles.tableCell} align="right">{formatCurrency(data.revenue / data.items)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default Reports;