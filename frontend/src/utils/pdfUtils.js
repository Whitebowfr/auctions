import { jsPDF } from 'jspdf';
import { formatCurrency } from './formatters';
import { applyPlugin } from 'jspdf-autotable'

/**
 * Generate a PDF bill for a participant
 * @param {Object} participant - The participant object
 * @param {Array} purchases - The participant's purchases
 * @param {Object} auction - The auction object
 * @param {Object} customizations - Custom settings for the PDF
 * @returns {jsPDF} - The generated PDF document
 */
export const generateParticipantBill = (participant, purchases, auction, customizations = {}) => {
  // Create a new PDF document
  applyPlugin(jsPDF)
  const doc = new jsPDF();
  
  // Default values merged with customizations
  const options = {
    title: customizations.title || `Facture - ${auction.name}`,
    color: customizations.color || '#2563eb',
    logo: customizations.logo || null,
    includeNotes: customizations.includeNotes !== undefined ? customizations.includeNotes : true,
    footer: customizations.footer || `${auction.name} - ${new Date().toLocaleDateString()}`,
    paid: customizations.paid || false
  };

  // Add logo if provided
  if (options.logo) {
    doc.addImage(options.logo, 'JPEG', 14, 10, 50, 20);
  } else {
    // Default header styling
    doc.setFontSize(22);
    doc.setTextColor(options.color);
    doc.text('Vente aux enchères', 14, 20);
  }

  // Add bill title
  doc.setFontSize(18);
  doc.setTextColor('#000000');
  doc.text(options.title, 14, 35);

  // Add auction information
  doc.setFontSize(11);
  doc.setTextColor('#666666');
  doc.text(`Date: ${new Date(auction.date).toLocaleDateString()}`, 14, 45);
  doc.text(`Lieu: ${auction.address || 'Non spécifié'}`, 14, 52);

  // Add participant information
  doc.setFontSize(12);
  doc.setTextColor('#000000');
  doc.text('Informations client', 14, 65);
  
  doc.setFontSize(11);
  doc.text(`Nom: ${participant.name}`, 14, 72);
  doc.text(`Email: ${participant.email || 'Non spécifié'}`, 14, 79);
  doc.text(`Téléphone: ${participant.phone || 'Non spécifié'}`, 14, 86);
  doc.text(`Numéro d'enchérisseur: #${participant.local_number}`, 14, 93);

  // Add purchases table
  doc.autoTable({
    startY: 105,
    head: [['Lot', 'Description', 'Prix de départ', 'Prix final', 'Différence']],
    body: purchases.map(purchase => [
      purchase.bundle?.name || `Lot #${purchase.bundleId}`,
      purchase.bundle?.description?.substring(0, 30) + (purchase.bundle?.description?.length > 30 ? '...' : '') || 'Pas de description',
      `${formatCurrency(purchase.startingPrice)}`,
      `${formatCurrency(purchase.finalPrice)}`,
      `${formatCurrency(purchase.finalPrice - purchase.startingPrice)}`
    ]),
    headStyles: {
      fillColor: options.color,
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: '#F8FAFC'
    },
    margin: { top: 105 }
  });

  // Calculate total
  const totalAmount = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.finalPrice || 0), 0);
  
  // Add total
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 130, finalY);
  doc.setFontSize(14);
  doc.text(`${formatCurrency(totalAmount)}`, 150, finalY);

  // Add payment status
  if (options.paid) {
    doc.setFillColor('#059669');
    doc.rect(130, finalY + 5, 65, 10, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(12);
    doc.text('PAYÉ', 155, finalY + 12);
  } else {
    doc.setFillColor('#DC2626');
    doc.rect(130, finalY + 5, 65, 10, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(12);
    doc.text('EN ATTENTE DE PAIEMENT', 135, finalY + 12);
  }

  // Add notes if available and included
  if (participant.notes && options.includeNotes) {
    doc.setTextColor('#000000');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, finalY + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = doc.splitTextToSize(participant.notes, 180);
    doc.text(splitNotes, 14, finalY + 32);
  }

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(10);
  doc.setTextColor('#94A3B8');
  doc.text(options.footer, 14, doc.internal.pageSize.height - 10);
  doc.text(`Page ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);

  return doc;
};

/**
 * Download the PDF bill
 * @param {jsPDF} doc - The PDF document
 * @param {string} filename - The filename for the downloaded PDF
 */
export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};