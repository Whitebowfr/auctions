import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Packer } from 'docx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorAlert from '../../components/common/ErrorAlert.tsx';
import Loading from '../../components/common/Loading.tsx';
import cardStyles from '../../components/ModernCard.module.css';
import dialogStyles from '../../components/ModernDialog.module.css';
import { useAuction } from '../../context/AuctionContext.tsx';
import { formatDate } from '../../utils/formatters.tsx';
import { downloadDocx, generateClosingReport } from '../../utils/pdfUtils.tsx';
import { getAuctionTimeStatus } from '../../utils/utils.tsx';
import styles from './AuctionManagement.module.css';

const AuctionManagement = () => {
  const navigate = useNavigate();
  const { encheres, addEnchere, deleteEnchere, loading, error, loadEncheres } = useAuction();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Closing report dialog state ───────────────────────────────────────────
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportEnchere, setReportEnchere] = useState(null);
  const [reportOptions, setReportOptions] = useState({
    bodyText: '',
    address: '',
    auctioneerName: 'Me R. GRANIER ou Me L. DAVID, Commissaire de Justice Associé(e) à la SCP R. GRANIER - L. DAVID, près le Tribunal Judiciaire d\'AGEN, demeurant 66 rue de la République 47200 MARMANDE',
    clientName: '',
    agissantEnVertu: `D'un jugement rendu par le Tribunal de commerce d'AGEN en date du 18.09.2024, nous commetant aux fins de procéder à la vente aux enchères publiques de l'actif de la société ci-dessous.`
  });

  const handleOpenReport = (e, enchere) => {
    e.stopPropagation();
    setReportEnchere(enchere);
    setReportOptions(prev => ({
      bodyText: '',
      address: enchere.address || '',
      auctioneerName: prev.auctioneerName || '',
      clientName: prev.clientName || '',
      agissantEnVertu: prev.agissantEnVertu || ""
    }));
    setReportDialogOpen(true);
  };

  const handleGenerateReport = () => {
    if (!reportEnchere) return;
    const sales = reportEnchere.sales || [];
    // Enrich sales with bundle info
    const enriched = sales.map(s => ({
      ...s,
      bundle: reportEnchere.bundles?.find(b => b.id === s.bundleId) || null
    }));
    const doc = generateClosingReport(reportEnchere, enriched, reportOptions);
    const filename = `pv-vente-${reportEnchere.name.replace(/\s+/g, '-').toLowerCase()}.docx`;
    Packer.toBlob(doc).then(blob => {
      downloadDocx(blob, filename);
    });
    setReportDialogOpen(false);
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await addEnchere(formData);
      setFormData({ name: '', date: '', location: '', description: '' });
      setOpen(false);
    } catch (error) {
      console.error('Failed to create enchere:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAuction = (enchere) => {
    navigate(`/auction/${enchere.id}`);
  };

  if (loading && encheres.length === 0) {
    return <Loading message="Chargement des enchères..." />;
  }

  return (
    <Box className={styles.container}>
      {error && (
        <ErrorAlert
          error={error}
          onRetry={loadEncheres}
          title="Échec du chargement."
        />
      )}

      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          Gestion des ventes aux enchères
        </Typography>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          className={styles.createButton}
          disabled={loading}
        >
          Créer une nouvelle vente aux enchères
        </Button>
      </Box>

      <Box className={styles.auctionGrid}>
        {encheres.map((enchere) => {
          const timeStatus = getAuctionTimeStatus(enchere);
          return (
            <Card key={enchere.id} className={cardStyles.modernCard}>
              <CardContent className={cardStyles.cardContent}>
                <Typography variant="h6" className={cardStyles.cardTitle}>
                  {enchere.name}
                </Typography>

                <Typography variant="body2" sx={{ color: '#64748b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  📅 {formatDate(enchere.date)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  📍 {enchere.address}
                </Typography>

                <Box className={cardStyles.chipContainer}>
                  <Chip
                    label={`${enchere.participantAmount} Participants`}
                    size="small"
                    className={cardStyles.modernChip}
                  />
                  <Chip
                    label={`${enchere.bundleAmount} Lots`}
                    size="small"
                    className={cardStyles.modernChip}
                  />
                </Box>

                <Chip
                  label={`${timeStatus.icon} ${timeStatus.label}`}
                  color={timeStatus.color}
                  className={cardStyles.modernChip}
                  sx={{ mt: 1 }}
                />
              </CardContent>
              <CardActions className={cardStyles.cardActions}>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewAuction(enchere);
                  }}
                  className={styles.viewButton}
                  variant="outlined"
                >
                  Voir le détail →
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={(e) => handleOpenReport(e, enchere)}
                  sx={{ textTransform: 'none' }}
                >
                  PV de vente
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm('Supprimer cette vente et toutes les données associées ?')) {
                      await deleteEnchere(enchere.id);
                    }
                  }}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          );
        })}
      </Box>

      {/* Create auction dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        className={dialogStyles.modernDialog}
      >
        <DialogTitle className={dialogStyles.dialogTitle}>
          Créer une nouvelle vente aux enchères
        </DialogTitle>
        <DialogContent className={dialogStyles.dialogContent}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid sx={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nom de la vente"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={dialogStyles.modernTextField}
                disabled={submitting}
              />
            </Grid>
            <Grid sx={{ xs: 12, sm: 6 }}>
              <DatePicker
                fullWidth
                label="Date"
                value={formData.date || null}
                format='DD/MM/YYYY'
                onChange={(newVal) => setFormData({ ...formData, date: newVal })}
                className={dialogStyles.modernTextField}
                disabled={submitting}
              />
            </Grid>
            <Grid sx={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Lieu"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={dialogStyles.modernTextField}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className={dialogStyles.dialogActions}>
          <Button
            onClick={() => setOpen(false)}
            className={dialogStyles.secondaryButton}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            className={dialogStyles.primaryButton}
            disabled={submitting || !formData.name || !formData.date || !formData.location}
          >
            {submitting ? 'En cours de création...' : 'Créer la vente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Closing report customization dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className={dialogStyles.modernDialog}
      >
        <DialogTitle className={dialogStyles.dialogTitle}>
          PV de vente — {reportEnchere?.name}
        </DialogTitle>
        <DialogContent className={dialogStyles.dialogContent}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Nom & coordonnées du commissaire-priseur (colonne gauche)"
                value={reportOptions.auctioneerName}
                onChange={(e) =>
                  setReportOptions(prev => ({ ...prev, auctioneerName: e.target.value }))
                }
                className={dialogStyles.modernTextField}
                placeholder={"S.C.P R. GRANIER - L. DAVID\nCommissaires de Justice associés\n66, rue de la République\nTél : 05 53 64 12 59"}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="À la demande de (client)"
                value={reportOptions.clientName}
                onChange={(e) =>
                  setReportOptions(prev => ({ ...prev, clientName: e.target.value }))
                }
                className={dialogStyles.modernTextField}
                placeholder="M. / Mme ..., demeurant ..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Agissant en vertu de"
                value={reportOptions.agissantEnVertu}
                onChange={(e) =>
                  setReportOptions(prev => ({ ...prev, agissantEnVertu: e.target.value }))
                }
                className={dialogStyles.modernTextField}
                placeholder="D'un jugement rendu par le Tribunal de ... en date du ..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Adresse de la vente"
                value={reportOptions.address}
                onChange={(e) =>
                  setReportOptions(prev => ({ ...prev, address: e.target.value }))
                }
                className={dialogStyles.modernTextField}
                placeholder="Adresse du lieu de la vente..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className={dialogStyles.dialogActions}>
          <Button
            onClick={() => setReportDialogOpen(false)}
            className={dialogStyles.secondaryButton}
          >
            Annuler
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            className={dialogStyles.primaryButton}
          >
            Générer le PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuctionManagement;
