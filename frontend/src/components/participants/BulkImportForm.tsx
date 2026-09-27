import { Box, TextField, Typography } from '@mui/material';
import styles from './BulkImportForm.module.css';
import dialogStyles from '../ModernDialog.module.css';

const BulkImportForm = ({ bulkText, setBulkText }) => {
    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
                Entrez les données de participants (un seul par ligne): <strong>Nom, Email, Téléphone, Addresse</strong>
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={10}
                placeholder="John Doe; john@example.com; 06 61 82 92 33; 123 Main St
Jane Smith; jane@example.com; 09 99 23 23 93; 456 Oak Ave"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className={`${dialogStyles.modernTextField} ${styles.bulkTextArea}`}
            />
        </Box>
    );
};

export default BulkImportForm;