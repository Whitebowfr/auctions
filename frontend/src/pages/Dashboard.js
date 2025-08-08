import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  Grid,
  IconButton,
  Divider,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { auctions } = useAuction();
  const [stats, setStats] = useState({
    totalAuctions: 0,
    totalParticipants: 0,
    totalBundles: 0,
    totalSales: 0,
    totalRevenue: 0
  });

  // Calculate dashboard statistics
  useEffect(() => {
    if (auctions && auctions.length > 0) {
      const totalAuctions = auctions.length;
      let totalParticipants = 0;
      let totalBundles = 0;
      let totalSales = 0;
      let totalRevenue = 0;

      auctions.forEach(auction => {
        totalParticipants += auction.participants ? auction.participants.length : 0;
        totalBundles += auction.bundles ? auction.bundles.length : 0;
        totalSales += auction.sales ? auction.sales.length : 0;
        
        if (auction.sales) {
          auction.sales.forEach(sale => {
            totalRevenue += sale.finalPrice || 0;
          });
        }
      });

      setStats({
        totalAuctions,
        totalParticipants,
        totalBundles,
        totalSales,
        totalRevenue
      });
    }
  }, [auctions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  const dashboardCards = [
    {
      title: 'Manage Auctions',
      description: 'Create and manage auction events with comprehensive tools for organization and tracking.',
      action: () => navigate('/auctions'),
      color: '#2563eb',
      icon: '🏛️'
    },
    {
      title: 'Participants',
      description: 'Add participants individually or in bulk, manage bidder numbers and contact information.',
      action: () => navigate('/clients'),
      color: '#10b981',
      icon: '👥'
    }
  ];

  // Get recent auctions (last 5)
  const recentAuctions = [...auctions]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <Box className={styles.container}>
      <Box className={styles.dashboardHeader}>
        <Typography variant="h2" className={styles.title}>
          Auction Management Dashboard
        </Typography>
        
        <Typography variant="h6" className={styles.subtitle}>
          Welcome to your professional auction management system. Streamline every aspect of your auction from planning to reporting.
        </Typography>
      </Box>
      
      {/* Stats Overview Section */}
      <Grid container spacing={3} className={styles.statsSection}>
        <Grid item xs={12} md={4}>
          <Card className={styles.statsCard}>
            <CardContent>
              <Typography variant="h6" className={styles.statsTitle}>
                Total Revenue
              </Typography>
              <Typography variant="h3" className={styles.statsValue} sx={{ color: '#10b981' }}>
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <Typography variant="body2" className={styles.statsSubtext}>
                From {stats.totalSales} sales across all auctions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card className={styles.statsCard}>
            <CardContent>
              <Typography variant="h6" className={styles.statsTitle}>
                Overview
              </Typography>
              <Box className={styles.overviewGrid}>
                <Box className={styles.overviewItem}>
                  <Typography variant="h4" className={styles.overviewValue}>
                    {stats.totalAuctions}
                  </Typography>
                  <Typography variant="body2" className={styles.overviewLabel}>
                    Auctions
                  </Typography>
                </Box>
                <Box className={styles.overviewItem}>
                  <Typography variant="h4" className={styles.overviewValue}>
                    {stats.totalParticipants}
                  </Typography>
                  <Typography variant="body2" className={styles.overviewLabel}>
                    Participants
                  </Typography>
                </Box>
                <Box className={styles.overviewItem}>
                  <Typography variant="h4" className={styles.overviewValue}>
                    {stats.totalBundles}
                  </Typography>
                  <Typography variant="body2" className={styles.overviewLabel}>
                    Bundles
                  </Typography>
                </Box>
                <Box className={styles.overviewItem}>
                  <Typography variant="h4" className={styles.overviewValue}>
                    {stats.totalSales}
                  </Typography>
                  <Typography variant="body2" className={styles.overviewLabel}>
                    Sales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions Section */}
      <Box className={styles.cardGrid}>
        {dashboardCards.map((card, index) => (
          <Card 
            key={index}
            className={styles.dashboardCard}
            onClick={card.action}
          >
            <CardContent className={styles.cardContent}>
              <Box 
                className={styles.colorBar}
                sx={{ backgroundColor: card.color }}
              />
              <Typography variant="h4" className={styles.cardIcon}>
                {card.icon}
              </Typography>
              <Typography variant="h5" className={styles.cardTitle}>
                {card.title}
              </Typography>
              <Typography variant="body1" className={styles.cardDescription}>
                {card.description}
              </Typography>
              <Button 
                variant="contained" 
                className={styles.cardButton}
                sx={{ backgroundColor: card.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  card.action();
                }}
              >
                Get Started →
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Recent Auctions Section */}
      {recentAuctions.length > 0 && (
        <Box className={styles.recentSection}>
          <Typography variant="h5" className={styles.sectionTitle}>
            Recent Auctions
          </Typography>
          <Card className={styles.recentCard}>
            <List>
              {recentAuctions.map((auction, index) => (
                <React.Fragment key={auction.id}>
                  <ListItem 
                    // button
                    onClick={() => navigate(`/auction/${auction.id}`)}
                    className={styles.recentItem}
                  >
                    <ListItemAvatar>
                      <Avatar className={styles.auctionAvatar}>
                        {auction.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={auction.name}
                      secondary={
                        <Box className={styles.auctionStats}>
                          <Chip 
                            size="small" 
                            label={`${auction.participants?.length || 0} participants`}
                            className={styles.statChip}
                          />
                          <Chip 
                            size="small" 
                            label={`${auction.bundles?.length || 0} bundles`}
                            className={styles.statChip}
                          />
                          <Chip 
                            size="small" 
                            label={`${auction.sales?.length || 0} sales`}
                            className={styles.statChip}
                          />
                        </Box>
                      }
                    />
                    <Button 
                      variant="outlined"
                      size="small"
                      className={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/auction/${auction.id}`);
                      }}
                    >
                      View
                    </Button>
                  </ListItem>
                  {index < recentAuctions.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Card>
          
          <Box textAlign="center" mt={3}>
            <Button 
              variant="outlined" 
              className={styles.viewAllButton}
              onClick={() => navigate('/auctions')}
            >
              View All Auctions
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;