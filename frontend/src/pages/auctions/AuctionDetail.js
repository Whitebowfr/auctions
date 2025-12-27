import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Autocomplete,
  Stack
  , Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import ParticipantForm from '../../components/participants/ParticipantForm';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions, setCurrentEnchere, addBundle, addParticipant, addSale, clients } = useAuction();
  const auction = auctions.find(a => a.id === parseInt(id));

  useEffect(() => {
    if (auction) setCurrentEnchere(auction);
  }, [auction, setCurrentEnchere]);

  const [tabIndex, setTabIndex] = useState(0);

  // Bundles inline edit state
  const [bundlePrices, setBundlePrices] = useState({});
  const [bundleBuyers, setBundleBuyers] = useState({});

  // Inline add row state
  const [newBundleName, setNewBundleName] = useState('');
  const [newBundleStartingPrice, setNewBundleStartingPrice] = useState('');

  // Participant form state (show inline)
  const [openParticipantDialog, setOpenParticipantDialog] = useState(false);
  const [participantForm, setParticipantForm] = useState({ name: '', email: '', phone: '', address: '', notes: '', local_number: '' });
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isNewParticipant, setIsNewParticipant] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auction) return;

    const prices = {};
    const buyers = {};
    auction.bundles.forEach(b => {
      prices[b.id] = b.sold_price ?? b.starting_price ?? b.startingPrice ?? '';
      buyers[b.id] = b.sold_to ?? '';
    });
    setBundlePrices(prices);
    setBundleBuyers(buyers);
  }, [auction]);

  if (!auction) {
    return (
      <Alert severity="error">Vente non trouvée. Veuillez retourner à la liste des ventes.</Alert>
    );
  }
  

  const handleAddBundleInline = async () => {
    if (!newBundleName) return;
    setSubmitting(true);
    try {
      const created = await addBundle(auction.id, { name: newBundleName, startingPrice: newBundleStartingPrice });
      // optimistically set value for the new bundle so the starting price appears as a value
      if (created && created.id) {
        setBundlePrices(prev => ({ ...prev, [created.id]: created.starting_price ?? created.startingPrice ?? newBundleStartingPrice }));
        setBundleBuyers(prev => ({ ...prev, [created.id]: '' }));
      }
      setNewBundleName('');
      setNewBundleStartingPrice('');
    } catch (e) {
      // context handles
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBundleOnEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newBundleName) handleAddBundleInline();
    }
  };

  const handleSubmitParticipant = async () => {
    setSubmitting(true);
    try {
      // If we selected an existing participant object with id, pass that id
      const participantPayload = {
        name: participantForm.name,
        email: participantForm.email,
        phone: participantForm.phone,
        local_number: participantForm.local_number ? parseInt(participantForm.local_number, 10) : undefined
      };

      if (selectedParticipant && selectedParticipant.id) {
        // Ensure we create or update client record first via addParticipant implementation
        participantPayload.id = selectedParticipant.id;
      }

      await addParticipant(auction.id, participantPayload);
      setParticipantForm({ name: '', email: '', phone: '', local_number: '' });
      setSelectedParticipant(null);
    } catch (e) {
      // error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (field, value) => {
    setParticipantForm(prev => ({ ...prev, [field]: value }));
  };

  const handleParticipantSelect = async (event, value) => {
    // value can be an object from availableParticipants or a 'create' option
    if (!value) {
      setSelectedParticipant(null);
      return;
    }

    if (typeof value === 'string') {
      // freeSolo string -> new participant
      setSelectedParticipant(null);
      setParticipantForm(prev => ({ ...prev, name: value }));
      return;
    }

    if (value.isAddOption) {
      // Add new name
      setSelectedParticipant(null);
      setParticipantForm(prev => ({ ...prev, name: value.inputValue }));
      return;
    }

    // existing participant selected
    setSelectedParticipant(value);
    setParticipantForm({
      name: value.name || '',
      email: value.email || '',
      phone: value.phone || '',
      local_number: value.local_number ? String(value.local_number) : ''
    });
    // Immediately add existing participant to this auction
    if (value.id) {
      setSubmitting(true);
      try {
        await addParticipant(auction.id, { id: value.id, local_number: value.local_number });
        // Clear selection after add
        setSelectedParticipant(null);
        setParticipantForm({ name: '', email: '', phone: '', local_number: '' });
      } catch (err) {
        // handled by context
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleTabChange = (e, newValue) => setTabIndex(newValue);

  // (old bundle-edit helpers removed; using bundlePrices/bundleBuyers + addSale instead)

  const handlePriceChange = (bundleId, value) => {
    setBundlePrices(prev => ({ ...prev, [bundleId]: value }));
  };

  const handlePriceBlur = async (bundleId) => {
    const buyerId = bundleBuyers[bundleId];
    const price = bundlePrices[bundleId];
    if (buyerId && price) {
      setSubmitting(true);
      try {
        await addSale(auction.id, { bundleId, participantId: buyerId, finalPrice: parseFloat(price) });
      } catch (e) {
        // handled by context
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBuyerSelect = async (bundleId, participant) => {
    const participantId = participant ? participant.id : null;
    setBundleBuyers(prev => ({ ...prev, [bundleId]: participantId }));

    const priceValue = bundlePrices[bundleId] || (auction.bundles.find(b => b.id === bundleId)?.starting_price ?? auction.bundles.find(b => b.id === bundleId)?.startingPrice);
    if (participantId && priceValue) {
      setSubmitting(true);
      try {
        await addSale(auction.id, { bundleId, participantId, finalPrice: parseFloat(priceValue) });
      } catch (e) {
        // handled by context
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button onClick={() => navigate('/auctions')}>← Retour aux ventes</Button>
        <Typography variant="h4">{auction.name}</Typography>
        <Box />
      </Box>

      <Paper sx={{ p: 1, mb: 3 }}>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Lots" />
          <Tab label="Participants" />
        </Tabs>
      </Paper>

      {tabIndex === 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Prix (final)</TableCell>
                <TableCell>Acheteur</TableCell>
                  <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auction.bundles.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.id}</TableCell>
                  <TableCell>{b.name || `Lot #${b.id}`}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                        placeholder={''}
                      value={bundlePrices[b.id] ?? ''}
                      onChange={(e) => handlePriceChange(b.id, e.target.value)}
                      onBlur={() => handlePriceBlur(b.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      options={auction.participants}
                        getOptionLabel={(opt) => opt ? `${opt.name}` : ''}
                        value={auction.participants.find(p => p.id === bundleBuyers[b.id]) || null}
                        onChange={(e, value) => handleBuyerSelect(b.id, value)}
                        renderInput={(params) => (
                          <TextField {...params} size="small" placeholder="Sélectionner un acheteur" />
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        sx={{ minWidth: 200 }}
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Box sx={{ display: 'inline-block', bgcolor: '#1976d2', color: '#fff', px: 1, py: '2px', borderRadius: 1, mr: 1, fontSize: '0.8rem' }}>
                              {option.local_number || '-'}
                            </Box>
                            <span>{option.name}</span>
                            {option.email && <span style={{color: '#666', marginLeft: 8}}>({option.email})</span>}
                          </li>
                        )}
                    />
                  </TableCell>
                    <TableCell />
                </TableRow>
              ))}

              {/* Inline add row */}
              <TableRow>
                <TableCell />
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Nouveau lot"
                    value={newBundleName}
                    onChange={(e) => setNewBundleName(e.target.value)}
                    onKeyDown={handleAddBundleOnEnter}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    placeholder=""
                    value={newBundleStartingPrice}
                    onChange={(e) => setNewBundleStartingPrice(e.target.value)}
                    onKeyDown={handleAddBundleOnEnter}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {/* Buyer column intentionally left empty for add button */}
                  </Stack>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={handleAddBundleInline} disabled={submitting || !newBundleName}>
                    <AddIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}

        {tabIndex === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Participants</Typography>
            {/* Inline participant search/add form - Enter will add */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <ParticipantForm
                  participantForm={participantForm}
                  handleFormChange={handleFormChange}
                  selectedParticipant={selectedParticipant}
                  isNewParticipant={isNewParticipant}
                  availableParticipants={clients.filter(c => !auction.participants.some(p => p.id === c.id))}
                  handleParticipantSelect={handleParticipantSelect}
                  auctionParticipants={auction.participants}
                  onEnter={handleSubmitParticipant}
                />
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button variant="contained" onClick={handleSubmitParticipant} disabled={submitting || !participantForm.name}>Ajouter</Button>
              </Box>
            </Box>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Numéro</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auction.participants.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.local_number || '-'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => navigate(`/auction/${auction.id}/participants/${p.id}`)}>{p.name}</Button>
                  </TableCell>
                  <TableCell>{p.email || '-'}</TableCell>
                  <TableCell>{p.phone || '-'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => navigate(`/auction/${auction.id}/participants/${p.id}`)}>Voir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      
    </Box>
  );
};

export default AuctionDetail;