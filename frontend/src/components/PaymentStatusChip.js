import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

/**
 * Shows payment status on a lot/bundle row.
 * @param {true | false | null | undefined} paid
 *   undefined/null = no bill generated → render nothing
 *   false          = bill generated, not paid
 *   true           = paid
 * @param {function} onClick – optional, to toggle status
 */
const PaymentStatusChip = ({ paid, onClick }) => {
  if (paid === null || paid === undefined) return null;

  return paid ? (
    <Tooltip title={onClick ? 'Cliquer pour marquer comme non payé' : ''}>
      <Chip
        icon={<CheckCircleIcon />}
        label="Payé"
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
