import { Select, MenuItem } from '@mui/material';
import styles from './ModernDialog.module.css';

function PaymentSelector({ value, onChange }) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.modernTextField}
    >
      <MenuItem value={1} selected>Payé</MenuItem>
      <MenuItem value={2}>Payé par carte</MenuItem>
      <MenuItem value={3}>Payé par chèque</MenuItem>
      <MenuItem value={4}>Payé en espèces</MenuItem>
    </Select>)
}

export default PaymentSelector;
