import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from './formatters';
import { applyPlugin } from 'jspdf-autotable';
import { setParticipationPaymentStatus } from './paymentStatus'

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
    participant: customizations.participantName || customizations.name || participant.name,
    address: customizations.address || participant.address || '',
    email: customizations.email || participant.email || '',
    phone: customizations.phone || participant.phone || ''
  };

  // Add logo if provided
  if (options.logo) {
    doc.addImage(options.logo, 'JPEG', 14, 10, 50, 20);
  }

  doc.setFontSize(11)
  doc.text('S.C.P R. GRANIER - L. DAVID \n Commissaires de Justice associés \n 66, rue de la République \n BP 52 \n 47202 MARMANDE Cedex \n\n Tél : 05 53 64 12 59 \n Fax : 05 53 64 07 15 \n etude@huissier47.fr \n CDC 40031 000011 43474Z 67', 45, 12, { align: "center"})


  doc.setFontSize(11);
  doc.setTextColor('#000000');
  doc.text(`${options.participant}`, 130, 35);
  doc.text(`${options.email || 'Non spécifié'}`, 130, 42);
  doc.text(`${options.address || 'Non spécifiée'}`, 130, 49, { maxWidth: 70 });
  doc.text(`${options.phone || 'Non spécifié'}`, 130, 63);
  doc.text(`Numéro d'enchérisseur: #${participant.local_number}`, 130, 70);

  doc.setTextColor('#666666');
  doc.text(options.title, 14, 71);
  doc.text(`VENTE DU ${formatDate(auction.date)} à ${auction.address || 'Non spécifié'}`, 14, 77);

  doc.setTextColor('#000000');

  doc.text('\t\t Madame, Monsieur, \n\n \t\t Je vous prie de trouver ci-dessous, le détail des achats que vous avez effectués lors de la vente \n référencée en marge, à savoir :', 10, 90)

  const totalAmount = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.finalPrice || 0), 0);

  let tableBody = purchases.map(purchase => {
    const bundle = purchase.bundle || {};
    const lotNumber = bundle.number ?? bundle.id ?? purchase.bundleId;
    return [
      lotNumber,
      bundle.name || `Lot sans nom`,
      `${formatCurrency(purchase.finalPrice)}`,
    ];
  });

  // Add purchases table
  doc.autoTable({
    startY: 110,
    head: [['N. Lot', 'Description', 'Prix (TTC)']],
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
  doc.setFontSize(10);
  doc.setTextColor('#666666');
  doc.text(`(Dont TVA 20%: ${formatCurrency(totalAmount*0.2)})` , 130, doc.lastAutoTable.finalY + 10);
  
  doc.setFontSize(12);
  doc.setTextColor('#000000')
  const frais = totalAmount*auction.managementFeeRate/100
  const tva_frais = frais * 0.2
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    tableWidth: "wrap",
    head: [[`Honoraires (${auction.managementFeeRate}% HT)`, `${formatCurrency(frais)}`]],
    body: [["TVA (20%)", `${formatCurrency(tva_frais)}`]],
    styles: { cellPadding: 1 }
  })

  doc.setFontSize(12);
  doc.text(`Sous-total 2: ${formatCurrency(frais + tva_frais)}` , 130, doc.lastAutoTable.finalY + 5);
  
  const finalAmount = totalAmount + frais + tva_frais
  // Calculate total
  
  // Add total
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 130, finalY);
  doc.setFontSize(16);
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

/**
 * Generate a PDF with empty bundles listing for pre-sale preparation
 * @param {Object} auction - The auction object
 * @param {Array} bundles - The auction bundles sorted by ID
 * @returns {jsPDF} - The generated PDF document
 */
export const generateBundlesSheet = (auction, bundles) => {
  // Create a new PDF document
  applyPlugin(jsPDF)
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Liste des lots - ${auction.name}`, 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(auction.date)}`, 14, 30);
  doc.text(`Lieu: ${auction.address || 'Non spécifié'}`, 14, 37);
  doc.text(`Lots: ${bundles.length}`, 14, 44);
  
  // Create the table
  doc.autoTable({
    startY: 55,
    head: [['Nom du lot', 'Prix de départ', 'Prix de vente', 'N° Enchérisseur']],
    body: bundles.map(bundle => [
      `#${bundle.id} - ${bundle.name || "Non spécifié"}`,
      formatCurrency(bundle.starting_price),
      '', // Empty column for sale price
      ''  // Empty column for bidder number
    ]),
    headStyles: {
      fillColor: '#2563eb',
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Lot ID
      1: { cellWidth: 35, halign: 'right' }, // Starting price
      2: { cellWidth: 35, halign: 'right' }, // Sale price
      3: { cellWidth: 35, halign: 'center' } // Bidder number
    },
    alternateRowStyles: {
      fillColor: '#F8FAFC'
    },
    margin: { top: 55 }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(10);
  doc.setTextColor('#94A3B8');
  doc.text(`${auction.name} - Préparé le ${new Date().toLocaleDateString("fr-FR")}`, 14, doc.internal.pageSize.height - 10);
  doc.text(`Page ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
  
  return doc;
};

/**
 * Generate a PDF with complete sales recap
 * @param {Object} auction - The auction object
 * @param {Array} sales - The auction sales with bundle details
 * @param {Array} allBundles - All bundles for showing unsold items
 * @returns {jsPDF} - The generated PDF document
 */
export const generateSalesRecap = (auction, sales, allBundles) => {
  // Create a new PDF document
  applyPlugin(jsPDF)
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Récapitulatif des ventes - ${auction.name}`, 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(auction.date)}`, 14, 30);
  doc.text(`Lieu: ${auction.address || 'Non spécifié'}`, 14, 37);
  
  // Add summary
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé:', 14, 47);
  doc.setFont('helvetica', 'normal');
  
  const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.finalPrice), 0);
  
  doc.text(`Nombre de lots vendus: ${sales.length} sur ${allBundles.length}`, 14, 54);
  doc.text(`Revenu total: ${formatCurrency(totalRevenue)}`, 14, 61);
  
  // Create the table for sold items
  doc.autoTable({
    startY: 78,
    head: [['Nom du lot', 'Prix de vente', 'Acheteur']],
    body: sales.map(sale => [
      `#${sale.bundleId} - ${sale.bundleName || "Non spécifié"}`,
      formatCurrency(sale.finalPrice),
      sale.participantName
    ]),
    headStyles: {
      fillColor: '#2563eb',
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: '#F8FAFC'
    },
    margin: { top: 78 },
    didDrawPage: (data) => {
      // Add header on each page
      if (data.pageNumber > 1) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Récapitulatif des ventes - ${auction.name} (suite)`, 14, 20);
      }
    }
  });
  
  // Get unsold bundles
  const soldBundleIds = sales.map(sale => sale.bundleId);
  const unsoldBundles = allBundles.filter(bundle => !soldBundleIds.includes(bundle.id));
  
  if (unsoldBundles.length > 0) {
    // Add unsold bundles section
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Lots non vendus', 14, 20);
    
    doc.autoTable({
      startY: 30,
      head: [['Nom du lot', 'Prix de départ', 'Catégorie']],
      body: unsoldBundles.map(bundle => [
        `#${bundle.id} - ${bundle.name || "Non spécifié"}`,
        formatCurrency(bundle.starting_price),
        bundle.category || 'Non catégorisé'
      ]),
      headStyles: {
        fillColor: '#94A3B8',
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: '#F8FAFC'
      }
    });
  }
  
  // Add footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor('#94A3B8');
    doc.text(`${auction.name} - Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, doc.internal.pageSize.height - 10);
    doc.text(`Page ${i} sur ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
  }
  
  return doc;
};

/**
 * Generate, download the bill PDF and mark the participation as billed (paid: false).
 * Use this instead of calling generateParticipantBill + downloadPDF manually.
 *
 * @param {Object} participant   - participant object (must have .id for the DB record)
 * @param {number} participationId - the participation table row id
 * @param {Array}  purchases
 * @param {Object} auction
 * @param {Object} customizations
 * @returns {Promise<void>}
 */
export const generateAndDownloadBill = async (
  participant,
  participationId,
  purchases,
  auction,
  customizations = {}
) => {
  const doc = generateParticipantBill(participant, purchases, auction, customizations);
  const filename = `facture_${participant.name.replace(/\s+/g, '_')}_${auction.name.replace(/\s+/g, '_')}.pdf`;
  downloadPDF(doc, filename);

  const paidStatus = customizations.paid === true ? true : false;


  // Mark participation as billed but not yet paid
  try {
    await setParticipationPaymentStatus(participationId, paidStatus);
  } catch (e) {
    console.error('[pdfUtils] Failed to mark participation as billed:', e);
  }
};