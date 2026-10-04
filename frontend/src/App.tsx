import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme.tsx';
import { AuctionProvider } from './context/AuctionContext.tsx';
import Header from './components/layout/Header.tsx';
import AuctionManagement from './pages/auctions/AuctionManagement.tsx';
import AuctionDetail from './pages/auctions/AuctionDetail.tsx';
import ParticipantDetail from './pages/participants/ParticipantDetail.tsx';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ClientsDirectory from './pages/clients/ClientsDirectory.tsx';
import ClientDetail from './pages/clients/ClientDetail.tsx';

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
                <Route path="/" element={<AuctionManagement />} />
                <Route path="/auctions" element={<AuctionManagement />} />
                <Route path="/auction/:id" element={<AuctionDetail />} />
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
