import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Button,
    Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import dialogStyles from '../ModernDialog.module.css';
import tableStyles from '../ModernTable.module.css';
import { useAuction } from '../../context/AuctionContext';

const ParticipantTable = ({ participants, auctionId, handleDeleteParticipant }) => {
    const navigate = useNavigate();

    return (
        <TableContainer component={Paper} className={tableStyles.tableContainer}>
            <Table>
                <TableHead className={tableStyles.tableHeader}>
                    <TableRow>
                        <TableCell className={tableStyles.tableHeaderCell}>Numéro #</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Nom</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Email</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Téléphone</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Type</TableCell>
                        <TableCell className={tableStyles.tableHeaderCell}>Supprimer</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {participants.map((participant) => {
                        const isNewParticipant = Math.abs(new Date(participant.created_at) - new Date()) / (1000 * 60 * 60) < 1
                        return (
                        <TableRow key={participant.id} className={tableStyles.tableRow}>
                            <TableCell className={tableStyles.tableCell}>
                                <Typography sx={{ fontWeight: 600, color: '#2563eb' }}>
                                    #{participant.local_number}
                                </Typography>
                            </TableCell>
                            <TableCell className={tableStyles.tableCell}>
                                <Button
                                    variant="text"
                                    onClick={() => navigate(`/auction/${auctionId}/participants/${participant.id}`)}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        color: '#2563eb',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        '&:hover': {
                                            backgroundColor: '#eff6ff',
                                            color: '#1e40af'
                                        }
                                    }}
                                >
                                    {participant.name}
                                </Button>
                            </TableCell>
                            <TableCell className={tableStyles.tableCell}>{participant.email}</TableCell>
                            <TableCell className={tableStyles.tableCell}>{participant.phone}</TableCell>
                            <TableCell className={tableStyles.tableCell}>
                                <Chip
                                    label={isNewParticipant ? "Nouveau" : "Ancien"}
                                    size="small"
                                    color={isNewParticipant ? "primary" : "success"}
                                    className={tableStyles.statusChip}
                                />
                            </TableCell>
                            <TableCell className={tableStyles.tableCell}>
                                <Button
                                
                                    className={dialogStyles.secondaryButton}
                                    sx={{
                                        color: "red",
                                        border: "1px solid red",
                                    }}
                                    onClick={() => handleDeleteParticipant(participant.id)}>
                                        SUPPRIMER
                                </Button>
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ParticipantTable;