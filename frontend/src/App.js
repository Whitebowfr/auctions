import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import { AuctionProvider } from './context/AuctionContext';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import AuctionManagement from './pages/auctions/AuctionManagement';
import AuctionDetail from './pages/auctions/AuctionDetail';
import ParticipantManagement from './pages/participants/ParticipantManagement';
import BundleManagement from './pages/bundles/BundleManagement';
import SalesTracking from './pages/SalesTracking';
import Reports from './pages/Reports';
import ParticipantDetail from './pages/participants/ParticipantDetail';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ClientsDirectory from './pages/clients/ClientsDirectory';
import ClientDetail from './pages/clients/ClientDetail';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AuctionProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <CssBaseline />
          <Header />
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/auctions" element={<AuctionManagement />} />
              <Route path="/auction/:id" element={<AuctionDetail />} />
              <Route path="/auction/:id/participants" element={<ParticipantManagement />} />
              <Route path="/auction/:id/bundles" element={<BundleManagement />} />
              <Route path="/auction/:id/sales" element={<SalesTracking />} />
              <Route path="/auction/:id/reports" element={<Reports />} />
              <Route path="/auction/:auctionId/participants/:participantId" element={<ParticipantDetail />} />
              <Route path="/clients" element={<ClientsDirectory />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
            </Routes>
          </Container>
        </Router>
      </AuctionProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;