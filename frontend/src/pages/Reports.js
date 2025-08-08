import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import styles from './Reports.module.css';
import tableStyles from '../components/ModernTable.module.css';
import { formatCurrency } from '../utils/formatters';

const Reports = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions } = useAuction();
  
  const auction = auctions.find(a => a.id === parseInt(id));

  if (!auction) {
    return <div>Auction not found</div>;
  }

  const totalRevenue = auction.sales.reduce((sum, sale) => sum + sale.finalPrice, 0);
  const totalStartingValue = auction.bundles.reduce((sum, bundle) => sum + parseFloat(bundle.startingPrice || 0), 0);
  const totalProfit = totalRevenue - totalStartingValue;
  const soldBundles = auction.bundles.filter(b => b.status === 'Sold').length;
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
        totalProfit: totalProfit
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
        ← Back to {auction.name}
      </Button>

      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          📊 Reports & Summary - {auction.name}
        </Typography>
        <Button 
          variant="contained" 
          onClick={exportReport}
          className={styles.exportButton}
        >
          📁 Export Report
        </Button>
      </Box>

      {/* Summary Cards */}
      <Box className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Total Revenue
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber} color="success.main">
              {formatCurrency(totalRevenue)}
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Total Profit
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber} color="primary">
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="body2" className={styles.summarySubtext}>
              {profitMargin}% margin
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="body2" className={styles.summaryLabel}>
              Items Sold
            </Typography>
            <Typography variant="h3" className={styles.summaryNumber}>
              {soldBundles}/{auction.bundles.length}
            </Typography>
            <Typography variant="body2" className={styles.summarySubtext}>
              {successRate}% success rate
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

      {/* Auction Details */}
      <Paper className={styles.detailsCard}>
        <Typography variant="h5" className={styles.detailsTitle}>
          Auction Details
        </Typography>
        <List>
          <ListItem className={styles.detailItem}>
            <ListItemText 
              primary={<span className={styles.detailLabel}>Auction Name</span>} 
              secondary={<span className={styles.detailValue}>{auction.name}</span>} 
            />
          </ListItem>
          <ListItem className={styles.detailItem}>
            <ListItemText 
              primary={<span className={styles.detailLabel}>Date</span>} 
              secondary={<span className={styles.detailValue}>{auction.date}</span>} 
            />
          </ListItem>
          <ListItem className={styles.detailItem}>
            <ListItemText 
              primary={<span className={styles.detailLabel}>Location</span>} 
              secondary={<span className={styles.detailValue}>{auction.location}</span>} 
            />
          </ListItem>
        </List>
      </Paper>

      <Box className={styles.reportsGrid}>
        {/* Top Sales */}
        <Paper className={styles.reportCard}>
          <Typography variant="h5" className={styles.reportTitle}>
            🏆 Top 5 Sales
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead className={tableStyles.tableHeader}>
                <TableRow>
                  <TableCell className={tableStyles.tableHeaderCell}>Bundle</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell}>Buyer</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Price</TableCell>
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
            📈 Sales by Category
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead className={tableStyles.tableHeader}>
                <TableRow>
                  <TableCell className={tableStyles.tableHeaderCell}>Category</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Items</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Revenue</TableCell>
                  <TableCell className={tableStyles.tableHeaderCell} align="right">Avg Price</TableCell>
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