import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import GavelIcon from '@mui/icons-material/Gavel';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Enchères', path: '/auctions' },
    { label: 'Clients', path: '/clients'}
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <AppBar position="static" className={styles.header} elevation={0}>
      <Toolbar className={styles.toolbar}>
        <Box className={styles.logo} onClick={() => navigate('/')}>
          <Box className={styles.logoIcon}>
            <GavelIcon/>
          </Box>
          <Box>
            <Typography variant="h6" className={styles.logoText}>
              Gestionnaire de vente aux enchères
            </Typography>
          </Box>
        </Box>
        
        <Box className={styles.spacer} />
        
        <Box className={styles.navContainer}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`${styles.navButton} ${isActive(item.path) ? styles.active : ''}`}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;