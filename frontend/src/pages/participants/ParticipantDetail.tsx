import {
  ArrowBack,
  DateRange,
  Email,
  Home,
  Inventory2,
  Receipt,
  ShoppingCart,
  Smartphone,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BillCustomizationDialog from '../../components/participants/BillCustomizationDialog.tsx';
import { useAuction } from '../../context/AuctionContext.tsx';
import { formatCurrency } from '../../utils/formatters.tsx';
import { setParticipationPaymentStatus } from '../../utils/paymentStatus.tsx';
import { downloadPDF, generateAndDownloadBill, generateParticipantBill } from '../../utils/pdfUtils.tsx';
import styles from './ParticipantDetail.module.css';

const ParticipantDetail = () => {
  const { auctionId, participantId } = useParams();
  const navigate = useNavigate();
  const { encheres, loadEncheres } = useAuction();

  const auction = encheres.find(a => a.id === parseInt(auctionId));
  const participant = auction?.participants.find(p => p.client.id === parseInt(participantId));

  const [billDialog, setBillDialog] = useState(false);

  if (!auction) {
    return <Alert severity="error">Enchère non trouvée.</Alert>;
  }

  if (!participant) {
    return <Alert severity="error">Participant non trouvé.</Alert>;
  }

  // Get all sales for this participant in this auction
  const participantSales = auction.bundles.filter(sale => sale.soldTo.id === participant.client.id);

  // Calculate totals using the correct field names
  const totalSpent = participantSales.reduce((sum, sale) => sum + (sale.finalPrice || 0), 0);
  const totalOwed = totalSpent + totalSpent * auction.managementFeeRate / 100 * 1.2;
  const totalItems = participantSales.length;

  // Get bundle details for each purchase
  const purchaseDetails = participantSales.map(sale => {
    const bundle = auction.bundles.find(b => b.id === sale.id);
    return {
      ...sale,
      bundle: bundle
    };
  });


  const handleGenerateBill = async (customizations: any) => {
    console.log(participant, customizations)
    const participationId = participant.client.id;
    // If the dialog passed selectedSaleIds, filter the purchaseDetails accordingly
    let filteredPurchases = purchaseDetails;
    if (customizations && Array.isArray(customizations.selectedSaleIds)) {
      filteredPurchases = purchaseDetails.filter(pd => customizations.selectedSaleIds.includes(pd.id));
      if (filteredPurchases.length === 0) {
        // No purchases selected — warn the user and abort
        window.alert('Veuillez sélectionner au moins un lot à inclure dans la facture.');
        return;
      }
    }

    if (!participationId) {
      // fallback: no participation_id available, just download without marking
      const doc = generateParticipantBill(participant, filteredPurchases, auction, customizations);
      downloadPDF(doc, `facture-${participant.client.name.replace(/\s+/g, '-').toLowerCase()}-${auction.id}.pdf`);
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
    const participationId = participant.client.id;
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
            {participant.client.name}
          </Typography>

          <Box className={styles.bidderNumber}>
            Numéro #{participant.localNumber}
          </Box>

          <Box className={styles.contactInfo}>
            <Box className={styles.contactItem}>
              <Email color="action" />
              <Typography>{participant.client.email || "Pas d'email renseigné"}</Typography>
            </Box>
            <Box className={styles.contactItem}>
              <Smartphone color="action" />
              <Typography>{participant.client.phone || 'Pas de numéro renseigné'}</Typography>
            </Box>
            <Box className={styles.contactItem}>
              <Home color="action" />
              <Typography>{participant.client.address || "Pas d'adresse renseignée"}</Typography>
            </Box>
            <Box className={styles.contactItem}>
              <DateRange color="action" />
              <Typography>Enregistré le : {new Date().toLocaleDateString("fr-FR")}</Typography>
            </Box>
          </Box>

          {participant.client.id && (
            <Chip
              label="Ancien participant"
              color="success"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Paper>
      </Box>

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
                    Lot N. {purchase.bundle?.number || "?"} - {purchase.bundle?.name || `Lot #${purchase.id}`}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography className={styles.finalPrice}>
                      Montant adjugé : <br />{formatCurrency(purchase.finalPrice)}
                    </Typography>
                  </Box>

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
