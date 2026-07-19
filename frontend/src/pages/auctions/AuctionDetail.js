import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  MenuItem,
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
  , Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import ParticipantForm from '../../components/participants/ParticipantForm';
import { apiService } from '../../services/api';
import PaymentStatusChip from '../../components/PaymentStatusChip';
const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { auctions, setCurrentEnchere, addBundle, updateBundle, deleteBundle, addParticipant, deleteParticipant, addSale, clients, loadEncheres } = useAuction();
  const auction = auctions.find(a => a.id === parseInt(id));

  // Determine initial tab from query param (?tab=participants) or default to 0 (Lots)
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'participants' ? 1 : 0;

  const [tabIndex, setTabIndex] = useState(initialTab);

  useEffect(() => {
    if (auction) setCurrentEnchere(auction);
  }, [auction, setCurrentEnchere]);

  // Bundles inline edit state
  const [bundlePrices, setBundlePrices] = useState({});
  const [bundleBuyers, setBundleBuyers] = useState({});

  // Inline add row state
  const [newBundleName, setNewBundleName] = useState('');
  const [newBundleStartingPrice, setNewBundleStartingPrice] = useState('');
  const [newBundleNumber, setNewBundleNumber] = useState('');

  // Participant form state (show inline)
  const [participantForm, setParticipantForm] = useState({ name: '', email: '', phone: '', address: '', notes: '', local_number: '' });
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState(null);
  const [transfering, setTransfering] = useState(false);

  // Inline bundle edit state (number + name)
  const [editingBundleId, setEditingBundleId] = useState(null);
  const [editFields, setEditFields] = useState({ number: '', name: '' });

  // Filter participants with no purchases
  const [filterNoBuys, setFilterNoBuys] = useState(false);

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


  const getNextBundleNumber = () => {
    if (!auction || !auction.bundles || auction.bundles.length === 0) {
      return '1';
    }

    const parse = (val) => {
      if (val === null || val === undefined) return { base: 0, suffix: 0 };
      const str = String(val).trim();
      const match = str.match(/^(\d+)([a-zA-Z]*)$/);
      if (!match) return { base: 0, suffix: 0 };
      const base = parseInt(match[1], 10);
      const sufMap = { 'bis': 1, 'ter': 2, 'quater': 3 };
      const sufKey = (match[2] || '').toLowerCase();
      return { base, suffix: sufMap[sufKey] || 0 };
    };

    const sorted = auction.bundles.slice().sort((a, b) => {
      const aParsed = parse(a.number ?? a.id);
      const bParsed = parse(b.number ?? b.id);
      if (aParsed.base !== bParsed.base) return aParsed.base - bParsed.base;
      return aParsed.suffix - bParsed.suffix;
    });

    const last = sorted[sorted.length - 1];
    const lastParsed = parse(last.number ?? last.id);
    return String(lastParsed.base + 1);
  };

  const handleAddBundleInline = async () => {
    if (!newBundleName) return;
    setSubmitting(true);
    try {
      const created = await addBundle(auction.id, {
        number: newBundleNumber || getNextBundleNumber(),
        name: newBundleName,
        startingPrice: newBundleStartingPrice
      });
      // optimistically set value for the new bundle so the starting price appears as a value
      if (created && created.id) {
        setBundlePrices(prev => ({ ...prev, [created.id]: created.starting_price ?? created.startingPrice ?? newBundleStartingPrice }));
        setBundleBuyers(prev => ({ ...prev, [created.id]: '' }));
      }
      setNewBundleName('');
      setNewBundleStartingPrice('');
      setNewBundleNumber('');
    } catch (e) {
      // context handles
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingBundle = (bundle) => {
    setEditingBundleId(bundle.id);
    setEditFields({
      // Pre-fill with existing display value: prefer custom number, fallback to id
      number: bundle.number ?? String(bundle.id),
      name: bundle.name || ''
    });
  };

  const cancelEditingBundle = () => {
    setEditingBundleId(null);
    setEditFields({ number: '', name: '' });
  };

  const saveEditingBundle = async (bundle) => {
    // If user left number empty, fall back to existing number or id
    const newNumberRaw = editFields.number && editFields.number.trim() !== ''
      ? editFields.number.trim()
      : (bundle.number ?? String(bundle.id));
    const newNumber = newNumberRaw;
    const newName = editFields.name || '';

    // If nothing changed, just exit edit mode
    if (newNumber === (bundle.number ?? String(bundle.id)) && newName === (bundle.name || '')) {
      cancelEditingBundle();
      return;
    }

    setSubmitting(true);
    try {
      await updateBundle({
        id: bundle.id,
        number: newNumber,
        name: newName,
        description: bundle.description,
        startingPrice: bundle.starting_price ?? bundle.startingPrice,
        category: bundle.category,
        notes: bundle.notes
      });
      cancelEditingBundle();
    } catch (e) {
      // handled in context
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
        address: participantForm.address,      // ✅ include address
        notes: participantForm.notes,          // optional but useful
        local_number: participantForm.local_number
          ? parseInt(participantForm.local_number, 10)
          : undefined,
      };

      if (selectedParticipant && selectedParticipant.id) {
        // Ensure we create or update client record first via addParticipant implementation
        participantPayload.id = selectedParticipant.id;
      }

      await addParticipant(auction.id, participantPayload);
      setParticipantForm({ name: '', email: '', phone: '', address: '', notes: '', local_number: '' });
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
      setParticipantForm({ name: '', email: '', phone: '', address: '', notes: '', local_number: '' });
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

    // existing participant selected -> prefill form but do NOT auto-add
    setSelectedParticipant(value);
    setParticipantForm({
      name: value.name || '',
      email: value.email || '',
      phone: value.phone || '',
      address: value.address || '',
      notes: '',
      local_number: value.local_number ? String(value.local_number) : ''
    });
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
                <TableCell>N. lot</TableCell>
                <TableCell>Descriptif</TableCell>
                <TableCell>Prix d'Adjudication</TableCell>
                <TableCell>Total avec frais</TableCell>
                <TableCell>Acheteur</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auction.bundles
                .slice()
                .sort((a, b) => {
                  const parse = (val) => {
                    if (val === null || val === undefined) return { base: 0, suffix: 0 };
                    const str = String(val).trim();
                    const match = str.match(/^(\d+)([a-zA-Z]*)$/);
                    if (!match) return { base: 0, suffix: 0 };
                    const base = parseInt(match[1], 10);
                    const sufMap = { 'bis': 1, 'ter': 2, 'quater': 3 };
                    const sufKey = (match[2] || '').toLowerCase();
                    return { base, suffix: sufMap[sufKey] || 0 };
                  };
                  const aParsed = parse(a.number ?? a.id);
                  const bParsed = parse(b.number ?? b.id);
                  if (aParsed.base !== bParsed.base) return aParsed.base - bParsed.base;
                  return aParsed.suffix - bParsed.suffix;
                })
                .map((b) => {
                  const isEditing = editingBundleId === b.id;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editFields.number}
                            placeholder={String(b.id)}
                            onChange={(e) => setEditFields(prev => ({ ...prev, number: e.target.value }))}
                          />
                        ) : (
                          b.number ?? b.id
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editFields.name}
                            placeholder={`Lot ${b.number ?? b.id}`}
                            onChange={(e) => setEditFields(prev => ({ ...prev, name: e.target.value }))}
                          />
                        ) : (
                          b.name || ''
                        )}
                      </TableCell>
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
                        {(() => {
                          const raw = bundlePrices[b.id];
                          const priceNum = raw ? parseFloat(raw) : null;
                          if (!priceNum || Number.isNaN(priceNum)) return '';
                          const commissionRate = 0.119; // 11.9%
                          const vatRate = 0.20; // 20% on the commission
                          const commission = priceNum * commissionRate;
                          const vat = commission * vatRate;
                          const total = priceNum + commission + vat;
                          return total.toFixed(2);
                        })()}
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          options={auction.participants}
                          getOptionLabel={(opt) => {
                            if (!opt) return '';
                            const num = opt.local_number ? String(opt.local_number) : '';
                            return num ? `${num} - ${opt.name}` : opt.name;
                          }}
                          filterOptions={(options, state) => {
                            const input = state.inputValue.trim().toLowerCase();
                            if (!input) return options;
                            return options.filter((opt) => {
                              if (!opt) return false;
                              const nameMatch = opt.name && opt.name.toLowerCase().includes(input);
                              const localNumStr = opt.local_number != null ? String(opt.local_number) : '';
                              const localMatch = localNumStr && localNumStr.toLowerCase().includes(input);
                              return nameMatch || localMatch;
                            });
                          }}
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
                              {option.email && <span style={{ color: '#666', marginLeft: 8 }}>({option.email})</span>}
                            </li>
                          )}
                        />
                        {(() => {
                          const buyerId = bundleBuyers[b.id] ?? b.sold_to;
                          if (!buyerId) return null;
                          const buyer = auction.participants.find(p => p.id === buyerId);
                          if (!buyer || buyer.paid === null || buyer.paid === undefined) return null;
                          return PaymentStatusChip({ paid: buyer.paid });
                        })()}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => saveEditingBundle(b)}
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => cancelEditingBundle()}
                            >
                              ✕
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => startEditingBundle(b)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                if (window.confirm('Supprimer ce lot ?')) {
                                  await deleteBundle(b.id);
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

              {/* Inline add row */}
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder={getNextBundleNumber()}
                    value={newBundleNumber}
                    onChange={(e) => setNewBundleNumber(e.target.value)}
                    onKeyDown={handleAddBundleOnEnter}
                  />
                </TableCell>
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button
              variant={filterNoBuys ? 'contained' : 'outlined'}
              size="small"
              color="warning"
              onClick={() => setFilterNoBuys(prev => !prev)}
              sx={{ textTransform: 'none', borderRadius: '999px' }}
            >
              {filterNoBuys ? 'Afficher tous' : 'Acheteurs uniquement'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              sx={{ ml: 2, textTransform: 'none', borderRadius: '999px' }}
              onClick={() => setTransferDialogOpen(true)}
            >
              Dupliquer les participants
            </Button>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Numéro</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Facture</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auction.participants
                .filter(p => !filterNoBuys || auction.sales.some(s => s.participantId === p.id))
                .map((p) => (
                  <TableRow
                    key={p.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/auction/${auction.id}/participants/${p.id}`)}
                  >
                    <TableCell>{p.local_number || '-'}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.email || '-'}</TableCell>
                    <TableCell>{p.phone || '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {p.paid === null || p.paid === undefined ? null : PaymentStatusChip({ paid: p.paid })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="small" onClick={() => navigate(`/auction/${auction.id}/participants/${p.id}`)}>Voir</Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={async () => {
                          if (window.confirm('Retirer ce participant de cette vente ?')) {
                            await deleteParticipant(auction.id, p.id);
                          }
                        }}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Transfer dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dupliquer les participants</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Sélectionnez la vente de destination. Les participants existants seront remplacés.</Typography>
          <TextField
            select
            label="Vente de destination"
            fullWidth
            value={transferTargetId ?? ''}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              setTransferTargetId(Number.isFinite(parsed) ? parsed : null);
            }}
          >
            <MenuItem value="">-- Sélectionnez une vente --</MenuItem>
            {auctions.filter(a => a.id !== auction.id).map(a => (
              <MenuItem key={a.id} value={a.id}>{a.name} — {new Date(a.date).toLocaleDateString()}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            disabled={!transferTargetId || transfering || transferTargetId === auction.id}
            onClick={async () => {
              if (!transferTargetId) return;
              if (transferTargetId === auction.id) {
                window.alert('La vente de destination ne peut pas être la même que la vente source.');
                return;
              }
              // Double-check the target exists
              const targetAuction = auctions.find(a => a.id === transferTargetId);
              if (!targetAuction) {
                window.alert('Vente de destination invalide.');
                return;
              }

              try {
                setTransfering(true);
                // Fetch source and target participants
                const source = await apiService.getParticipants(auction.id);
                const target = await apiService.getParticipants(transferTargetId);

                if (target && target.length > 0) {
                  const ok = window.confirm(`La vente de destination (${targetAuction.name}) contient déjà ${target.length} participant(s). Ils seront remplacés. Continuer ?`);
                  if (!ok) {
                    setTransfering(false);
                    return;
                  }
                  // Remove existing participants from target using participation_id (force deletion)
                  for (const p of target) {
                    try {
                      if (p.participation_id) {
                        await apiService.deleteParticipation(p.participation_id, true);
                      } else {
                        // Fallback: remove by client id
                        await apiService.removeParticipant(transferTargetId, p.id);
                      }
                    } catch (e) {
                      console.error('Failed to remove participant', p, e);
                    }
                  }
                }

                // Add all source participants to target, preserving participation ids when possible
                for (const p of source) {
                  try {
                    // p.id is client id; preserve local_number and participation_id
                    await apiService.addParticipant(transferTargetId, p.id, p.local_number || null, '', p.participation_id || null);
                  } catch (e) {
                    console.error('Failed to add participant', p, e);
                  }
                }

                // reload auctions to reflect changes
                await loadEncheres();
                setTransferDialogOpen(false);
              } catch (e) {
                console.error('Transfer failed', e);
                window.alert('Échec du transfert. Voir la console pour détails.');
              } finally {
                setTransfering(false);
              }
            }}
          >
            Dupliquer
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AuctionDetail;
