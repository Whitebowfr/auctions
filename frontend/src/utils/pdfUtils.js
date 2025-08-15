import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from './formatters';
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
    logo: customizations.logo || null,
    includeNotes: customizations.includeNotes !== undefined ? customizations.includeNotes : true,
    footer: customizations.footer || `${auction.name} - Édité le ${new Date().toLocaleDateString("fr-FR")}`,
    paid: customizations.paid || false,
    participant: customizations.participantName || participant.name
  };

  // Add logo if provided
  if (options.logo) {
    doc.addImage(options.logo, 'JPEG', 14, 10, 50, 20);
  }

  doc.setFontSize(11)
  doc.text('S.C.P R. GRANIER - L. DAVID \n Commissaires de Justice associés \n 66, rue de la République \n BP 52 \n 47202 MARMANDE Cedex \n\n Tél : 05 53 64 12 59 \n Fax : 05 53 64 07 15 \n etude@huisser47.fr \n CDC 40031 000011 43474Z 67', 45, 12, { align: "center"})


  doc.setFontSize(11);
  doc.setTextColor('#000000');
  doc.text(`Nom: ${options.participant}`, 130, 50);
  doc.text(`Email: ${participant.email || 'Non spécifié'}`, 130, 57);
  doc.text(`Téléphone: ${participant.phone || 'Non spécifié'}`, 130, 64);
  doc.text(`Numéro d'enchérisseur: #${participant.local_number}`, 130, 71);

  doc.setTextColor('#666666');
  doc.text(`VENTE DU ${formatDate(auction.date)} à ${auction.address || 'Non spécifié'}`, 14, 77);

  doc.setTextColor('#666666');
  doc.text(options.title, 14, 71);

  doc.setTextColor('#000000');

  doc.text('\t\t Madame, monsieur, \n\n \t\t Je vous prie de trouver ci-dessous, le détail des achats que vous avez effectués lors de la vente \n référencée en marge, à savoir :', 10, 90)

  const totalAmount = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.finalPrice || 0), 0);

  let tableBody = purchases.map(purchase => [
      purchase.bundle?.name || `Lot #${purchase.bundleId}`,
      purchase.bundle?.description?.substring(0, 30) + (purchase.bundle?.description?.length > 30 ? '...' : '') || 'Pas de description',
      `${formatCurrency(purchase.finalPrice)}`,
    ])

  tableBody.push([{colSpan: 2, content: "Dont TVA 20.00% :", styles: { halign: 'right' },}, `${formatCurrency(totalAmount*0.2)}`])
  // Add purchases table
  doc.autoTable({
    startY: 105,
    head: [['Lot', 'Description', 'Prix']],
    body: tableBody,
    headStyles: {
      fillColor: '#2563eb',
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: '#F8FAFC'
    },
    margin: { top: 105 }
  });
  doc.setFontSize(12);
  doc.text(`Sous-total 1: ${formatCurrency(totalAmount)}` , 130, doc.lastAutoTable.finalY + 5);
  
  const frais = totalAmount*0.118
  const tva_frais = frais * 0.2
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Frais de vente (11.80% HT)', `${formatCurrency(frais)}`]],
    body: [["TVA (20%)", `${formatCurrency(tva_frais)}`]]
  })

  doc.setFontSize(12);
  doc.text(`Sous-total 2: ${formatCurrency(frais + tva_frais)}` , 130, doc.lastAutoTable.finalY + 5);
  
  const finalAmount = totalAmount + frais + tva_frais
  // Calculate total
  
  // Add total
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 130, finalY);
  doc.setFontSize(14);
  doc.text(`${formatCurrency(finalAmount)}`, 150, finalY);

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