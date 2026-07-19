import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  Email,
  Smartphone,
  Home,
  DateRange,
  ShoppingCart,
  Inventory2,
  Edit,
  Receipt,
  PictureAsPdf
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import styles from './ParticipantDetail.module.css';
import { formatCurrency } from '../../utils/formatters';
import BillCustomizationDialog from '../../components/participants/BillCustomizationDialog';
import { generateParticipantBill, downloadPDF, generateAndDownloadBill } from '../../utils/pdfUtils';
import { setParticipationPaymentStatus } from '../../utils/paymentStatus';

const ParticipantDetail = () => {
  const { auctionId, participantId } = useParams();
  const navigate = useNavigate();
  const { auctions, updateClient, loadEncheres } = useAuction();

  const auction = auctions.find(a => a.id === parseInt(auctionId));
  const participant = auction?.participants.find(p => p.id === parseInt(participantId));

  const [notesDialog, setNotesDialog] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [billDialog, setBillDialog] = useState(false);

  if (!auction) {
    return <Alert severity="error">Enchère non trouvée.</Alert>;
  }

  if (!participant) {
    return <Alert severity="error">Participant non trouvé.</Alert>;
  }

  // Get all sales for this participant in this auction
  const participantSales = auction.sales.filter(sale => sale.participantId === participant.id);

  // Calculate totals using the correct field names
  const totalSpent = participantSales.reduce((sum, sale) => sum + (parseFloat(sale.finalPrice) || 0), 0);
  const totalOwed = totalSpent + totalSpent * auction.managementFeeRate / 100 * 1.2;
  const totalItems = participantSales.length;

  // Get bundle details for each purchase
  const purchaseDetails = participantSales.map(sale => {
    const bundle = auction.bundles.find(b => b.id === sale.bundleId);
    return {
      ...sale,
      bundle: bundle
    };
  });

  const handleUpdateNotes = async () => {
    try {
      await updateClient(auctionId, participantId, editedNotes);
      // Update the local state
      participant.notes = editedNotes;
      // Force refresh or update local state as needed
      setNotesDialog(false);
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  // const handleGenerateBill = (customizations) => {
  //   // Generate PDF bill
  //   const doc = generateParticipantBill(
  //     participant, 
  //     purchaseDetails, 
  //     auction, 
  //     customizations
  //   );

  //   // Download the PDF
  //   downloadPDF(doc, `facture-${participant.name.replace(/\s+/g, '-').toLowerCase()}-${auction.id}.pdf`);
  // };

  const handleGenerateBill = async (customizations) => {
    console.log(participant, customizations)
    const participationId = participant.participation_id;
    // If the dialog passed selectedSaleIds, filter the purchaseDetails accordingly
    let filteredPurchases = purchaseDetails;
    if (customizations && Array.isArray(customizations.selectedSaleIds)) {
      filteredPurchases = purchaseDetails.filter(pd => customizations.selectedSaleIds.includes(pd.bundleId));
      if (filteredPurchases.length === 0) {
        // No purchases selected — warn the user and abort
        window.alert('Veuillez sélectionner au moins un lot à inclure dans la facture.');
        return;
      }
    }

    if (!participationId) {
      // fallback: no participation_id available, just download without marking
      const doc = generateParticipantBill(participant, filteredPurchases, auction, customizations);
      downloadPDF(doc, `facture-${participant.name.replace(/\s+/g, '-').toLowerCase()}-${auction.id}.pdf`);
      return;
    }

    await generateAndDownloadBill(
      participant,
      participationId,
      filteredPurchases,
      auction,
      customizations
    );
    await loadEncheres();
  };

  const handleResetPaymentStatus = async () => {
    const participationId = participant.participation_id;
    if (!participationId) return;
    try {
      await setParticipationPaymentStatus(participationId, null);
      await loadEncheres();
    } catch (e) {
      console.error('[ParticipantDetail] Failed to reset payment status:', e);
    }
  };

  return (
    <Box className={styles.container}>
      <Button
        onClick={() => navigate(`/auction/${auction.id}?tab=participants`)}
        className={styles.backButton}
        startIcon={<ArrowBack />}
      >
        Retourner à la liste des participants
      </Button>

      <Box className={styles.header}>
        <Paper className={styles.participantInfo}>
          <Typography variant="h3" className={styles.participantName}>
            {participant.name}
          </Typography>

          <Box className={styles.bidderNumber}>
            Numéro #{participant.local_number}
          </Box>

          <Box className={styles.contactInfo}>
            <Box className={styles.contactItem}>
              <Email color="action" />
              <Typography>{participant.email || "Pas d'email renseigné"}</Typography>
            </Box>
            <Box className={styles.contactItem}>
              <Smartphone color="action" />
              <Typography>{participant.phone || 'Pas de numéro renseigné'}</Typography>
            </Box>
            <Box className={styles.contactItem}>
              <Home color="action" />
              <Typography>{participant.address || "Pas d'adresse renseignée"}</Typography>
            </Box>
            <Box className={styles.contactItem}>
              <DateRange color="action" />
              <Typography>Enregistré le : {new Date().toLocaleDateString("fr-FR")}</Typography>
            </Box>
          </Box>

          {participant.global_id && (
            <Chip
              label="Ancien participant"
              color="success"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Paper>
      </Box>

      {participant.notes ? (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1, position: 'relative' }}>
          <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
            Notes :
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic' }}>
            {participant.notes}
          </Typography>
          <Button
            size="small"
            onClick={() => {
              setEditedNotes(participant.notes);
              setNotesDialog(true);
            }}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            Modifier
          </Button>
        </Box>
      ) : (
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setEditedNotes('');
            setNotesDialog(true);
          }}
          sx={{ mt: 2 }}
          startIcon={<Edit />}
        >
          Ajouter des notes
        </Button>
      )}

      {/* Summary Statistics */}
      <Box className={styles.summaryGrid} sx={{ mt: 2 }}>
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="h3" className={styles.summaryNumber} color="primary">
              {totalItems}
            </Typography>
            <Typography className={styles.summaryLabel}>
              Nombre de lots achetés
            </Typography>
          </CardContent>
        </Card>

        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryCardContent}>
            <Typography variant="h3" className={styles.summaryNumber} color="success.main">
              {formatCurrency(totalSpent)}
            </Typography>
            <Typography className={styles.summaryLabel}>
              Total Adjudications
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Action Buttons */}
      <Box className={styles.actionButtons} sx={{ display: 'flex', gap: 2, mt: 3, mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Receipt />}
          onClick={() => setBillDialog(true)}
          sx={{
            borderRadius: '999px',
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: '0 6px 10px rgba(37, 99, 235, 0.25)',
            '&:hover': {
              boxShadow: '0 10px 18px rgba(37, 99, 235, 0.35)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.2s'
          }}
        >
          Générer la facture
        </Button>

        {/*participantSales.length > 0 && (
          <Button
            variant="text"
            color="primary"
            startIcon={<PictureAsPdf />}
            onClick={() => handleGenerateBill({})}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s'
            }}
          >
            Télécharger facture rapide
          </Button>
        )*/}

        {participant.paid !== null && participant.paid !== undefined && (
          <Button
            variant="outlined"
            color="warning"
            onClick={handleResetPaymentStatus}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '999px',
              px: 3,
            }}
          >
            Réinitialiser statut facture
          </Button>
        )}
      </Box>

      {/* Purchases Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ShoppingCart color="primary" style={{ transform: "translateY(-.5rem)" }} />
        <Typography variant="h4" className={styles.sectionTitle}>
          Achats (sur cette vente)
        </Typography>
      </Box>

      {purchaseDetails.length === 0 ? (
        <Paper className={styles.noPurchases}>
          <Inventory2 sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, color: '#64748b' }}>
            Pas encore d'achats
          </Typography>
          <Typography color="text.secondary">
            Ce participant n'a pas encore acheté d'article sur cette vente.
          </Typography>
        </Paper>
      ) : (
        <>
          <Box className={styles.purchaseGrid}>
            {purchaseDetails.map((purchase) => (
              <Card key={purchase.id} className={styles.purchaseCard}>
                <CardContent className={styles.purchaseCardContent}>
                  <Typography variant="h6" className={styles.bundleName}>
                    Lot N. {purchase.bundle?.number || "?"} - {purchase.bundle?.name || `Lot #${purchase.bundleId}`}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography className={styles.finalPrice}>
                      Montant adjugé : <br />{formatCurrency(purchase.finalPrice)}
                    </Typography>
                  </Box>

                  {purchase.notes && (
                    <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#64748b' }}>
                      Notes : {purchase.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          <Paper className={styles.totalOwed}>
            <Typography className={styles.totalOwedLabel} variant='h5'>
              Montant total dû :
            </Typography>
            <Typography variant="h3" className={styles.totalOwedAmount}>
              {formatCurrency(totalOwed)}
            </Typography>
            <Typography className={styles.summaryLabel}>
              (Dont Honoraires : {formatCurrency(totalSpent * auction.managementFeeRate / 100 * 1.2)} TTC)
            </Typography>
          </Paper>
        </>
      )}

      <Dialog open={notesDialog} onClose={() => setNotesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Notes sur le participant</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Ajoutez vos notes concernant ce participant..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialog(false)}>Annuler</Button>
          <Button onClick={handleUpdateNotes} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <BillCustomizationDialog
        open={billDialog}
        onClose={() => setBillDialog(false)}
        onGenerate={handleGenerateBill}
        participant={participant}
        auction={auction}
      />
    </Box>
  );
};

export default ParticipantDetail;
