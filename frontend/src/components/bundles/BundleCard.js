import { Card, CardMedia, CardContent, CardActions, Typography, Chip, Button, Box } from '@mui/material';
import { AttachMoney, Delete, Visibility } from '@mui/icons-material';
import cardStyles from '../ModernCard.module.css';
import { formatCurrency } from '../../utils/formatters';

const BundleCard = ({ bundle, imageUrl, isSold, onSell, onDelete, onViewSale }) => (
  <Card className={cardStyles.modernCard}>
    <CardMedia
      component="img"
      height="160"
      image={imageUrl}
      alt={bundle.name || `Lot #${bundle.id}`}
      className={cardStyles.cardImage}
      sx={{ objectFit: 'cover' }}
    />
    <CardContent className={cardStyles.cardContent}>
      {/* Add bundle number badge */}
      <Chip
        label={`#${bundle.id}`}
        size="small"
        color="primary"
        className={cardStyles.bundleNumberBadge}
        sx={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontWeight: 'bold',
          zIndex: 1
        }}
      />
      
      <Typography variant="h6" className={cardStyles.cardTitle}>
        {bundle.name ? (
          <>
            <span className={cardStyles.bundleNumber}>#{bundle.id}</span> {bundle.name}
          </>
        ) : (
          `Lot #${bundle.id}`
        )}
      </Typography>
      
      {bundle.description && (
        <Typography 
          variant="body2" 
          className={cardStyles.cardDescription}
        >
          {bundle.description}
        </Typography>
      )}
      <Box className={cardStyles.chipContainer}>
        <Chip 
          label={bundle.category || 'Non catégorisé'} 
          size="small" 
          className={cardStyles.modernChip}
        />
        <Chip 
          label={isSold ? 'Vendu' : 'Disponible'} 
          color={isSold ? 'success' : 'primary'} 
          size="small" 
          className={cardStyles.modernChip}
        />
      </Box>
      <Typography variant="body1" className={cardStyles.priceText}>
        {formatCurrency(bundle.starting_price)}
      </Typography>
      {isSold && bundle.sold_to && bundle.sold_price && (
        <Typography variant="body2" className={cardStyles.soldPrice}>
          Vendu pour: {formatCurrency(bundle.sold_price)}
        </Typography>
      )}
    </CardContent>
    <CardActions className={cardStyles.cardActions}>
      {!isSold && (
        <Button 
          size="small" 
          color="primary"
          className={cardStyles.actionButton}
          onClick={() => onSell(bundle)}
          startIcon={<AttachMoney />}
        >
          Vendre #{bundle.id}
        </Button>
      )}
      {isSold && (
        <Button 
          size="small" 
          color="info"
          className={cardStyles.actionButton}
          onClick={() => onViewSale(bundle)}
          startIcon={<Visibility />}
        >
          Voir la vente #{bundle.id}
        </Button>
      )}
      <Button 
        size="small" 
        color="error"
        className={cardStyles.actionButton}
        onClick={() => onDelete(bundle.id)}
        startIcon={<Delete />}
      >
        Supprimer
      </Button>
    </CardActions>
  </Card>
);

export default BundleCard;
