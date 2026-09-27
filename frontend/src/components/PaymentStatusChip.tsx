import { Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { PaymentStatus } from '../../../types';

type PaymentStatusChipProps = {
  paid: PaymentStatus;
  onClick?: () => void;
}

/**
 * Shows payment status on a lot/bundle row.
 */
const PaymentStatusChip = ({ paid, onClick }: PaymentStatusChipProps) => {
  if (paid === null || paid === undefined) return null;
  let chipText: string;
  switch (paid) {
    case 0: chipText = 'Non payé'; break;
    case 1: chipText = 'Payé'; break;
    case 2: chipText = 'Payé par carte'; break;
    case 3: chipText = 'Payé par chèque'; break;
    case 4: chipText = 'Payé en espèces'; break;
    default: chipText = 'Payé'; break;
  }
  return paid > 0 ? (
    <Tooltip title={onClick ? 'Cliquer pour marquer comme non payé' : ''}>
      <Chip
        icon={<CheckCircleIcon />}
        label={chipText}
        color="success"
        size="small"
        onClick={onClick}
        sx={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    </Tooltip>
  ) : (
    <Tooltip title={onClick ? 'Cliquer pour marquer comme payé' : ''}>
      <Chip
        icon={<HourglassEmptyIcon />}
        label="Non payé"
        color="warning"
        size="small"
        onClick={onClick}
        sx={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    </Tooltip>
  );
};

export default PaymentStatusChip;
