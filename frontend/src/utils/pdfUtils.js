import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from './formatters';
import { applyPlugin } from 'jspdf-autotable';
import { setParticipationPaymentStatus } from './paymentStatus';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  PageBreak,
  VerticalAlign,
  ShadingType,
  Footer
} from 'docx';

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
    includeNotes: customizations.includeNotes !== undefined ? customizations.includeNotes : false,
    fraisEnSus: customizations.fraisEnSus !== undefined ? parseFloat(customizations.fraisEnSus) : 0,
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
  const fraisensus = options.fraisEnSus || 0
  const tva_fraisensus = fraisensus * 0.2
  const tva_frais = frais * 0.2
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    tableWidth: "wrap",
    head: [[`Honoraires (${auction.managementFeeRate}% HT)`, `${formatCurrency(frais)}`]],
    body: [["TVA (20%)", `${formatCurrency(tva_frais)}`]],
    styles: { cellPadding: 1 }
  })
  if (fraisensus > 0) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 5,
    tableWidth: "wrap",
    head: [[`Frais en sus`, `${formatCurrency(fraisensus)}`]],
     styles: { cellPadding: 1 },
    body: [["TVA (20%)", `${formatCurrency(tva_fraisensus)}`]],
  })
  }
  // compute subtotal 2 as a number to ensure correct arithmetic and reuse it for the final total
  const sousTotal2 = frais + tva_frais + fraisensus + tva_fraisensus;
  doc.setFontSize(12);
  doc.text(`Sous-total 2: ${formatCurrency(sousTotal2)}` , 130, doc.lastAutoTable.finalY + 5);
  
  const finalAmount = totalAmount + sousTotal2;
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

// ...existing code...

/**
 * Download a docx Blob as a file in the browser.
 * @param {Blob} blob
 * @param {string} filename
 */
export const downloadDocx = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Shared docx style helpers ────────────────────────────────────────────────

/** Invisible border for table cells we don't want visually bordered */
const noBorder = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

/** Thin grey border for the vertical divider cell */
const rightDividerBorder = {
  top:    { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
};

const bold    = (text, size = 20) => new TextRun({ text, bold: true,  size });
const normal  = (text, size = 20) => new TextRun({ text, bold: false, size });
const newline = ()                => new TextRun({ break: 1 });

/**
 * Build a Paragraph with optional alignment and spacing
 */
const para = (runs, { align = AlignmentType.LEFT, spaceBefore = 0, spaceAfter = 80 } = {}) =>
  new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    alignment: align,
    spacing: { before: spaceBefore, after: spaceAfter },
  });

/**
 * Generate a closing report as a .docx Document.
 *
 * @param {Object} auction
 * @param {Array}  sales
 * @param {Object} options
 * @param {string} options.auctioneerName  - Left column: office identity block
 * @param {string} options.clientName      - "À la demande de …"
 * @param {string} options.agissantEnVertu - "Agissant en vertu de …"
 * @param {string} options.address         - "Me suis transporté …"
 * @param {string} [options.logo]          - Ignored in docx (use a header image manually)
 * @returns {Document}
 */
export const generateClosingReport = (auction, sales, options = {}) => {

  // ── Date in full French letters ──────────────────────────────────────────
  const frenchDate = (() => {
    const d = new Date(auction.date);
    if (isNaN(d)) return "L'AN INCONNU, le jour inconnu";

    const month = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(d);
    const day   = d.getDate();

    const dayWords = [
      null,'premier','deux','trois','quatre','cinq','six','sept','huit','neuf',
      'dix','onze','douze','treize','quatorze','quinze','seize','dix-sept',
      'dix-huit','dix-neuf','vingt','vingt et un','vingt-deux','vingt-trois',
      'vingt-quatre','vingt-cinq','vingt-six','vingt-sept','vingt-huit',
      'vingt-neuf','trente','trente et un',
    ];

    const under100 = (n) => {
      const units = ['zéro','un','deux','trois','quatre','cinq','six','sept',
        'huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'];
      const tens  = { 20:'vingt',30:'trente',40:'quarante',50:'cinquante',
                      60:'soixante',80:'quatre-vingt' };
      if (n < 17) return units[n];
      if (n < 20) return 'dix-' + units[n - 10];
      if (n < 70) {
        const t = Math.floor(n/10)*10, u = n%10;
        if (u === 0) return tens[t];
        if (u === 1 && t !== 80) return `${tens[t]} et un`;
        return `${tens[t]}-${units[u]}`;
      }
      if (n < 80) return `soixante-${under100(n - 60)}`;
      if (n < 100) return n === 80 ? 'quatre-vingt' : `quatre-vingt-${under100(n - 80)}`;
      return String(n);
    };

    const year = d.getFullYear();
    const yearToWords = (y) => {
      if (y === 2000) return 'deux mille';
      if (y > 2000 && y < 2100) {
        const r = y - 2000;
        return r === 0 ? 'deux mille' : `deux mille ${under100(r)}`;
      }
      const th  = Math.floor(y / 1000);
      const rem = y % 1000;
      const thW = th === 1 ? 'mille' : `${under100(th)} mille`;
      if (rem === 0) return thW;
      if (rem < 100) return `${thW} ${under100(rem)}`;
      const h = Math.floor(rem/100), r2 = rem%100;
      const hW = h === 1 ? 'cent' : `${under100(h)} cent`;
      return r2 === 0 ? `${thW} ${hW}` : `${thW} ${hW} ${under100(r2)}`;
    };

    return `L'AN ${yearToWords(year).toUpperCase()}, le ${dayWords[day]} ${month}`;
  })();

  // ── Page 1 — Full two-column layout (30% left | 70% right) ─────────────

  const CONDITIONS = `Après avoir procédé aux publicités prescrites par la Loi, et annoncé la vente pour ce jour le nombre légal d'acquéreurs potentiels étant présent, j'ai annoncé l'ouverture de la vente aux enchères publiques et rappelé les conditions générales de vente, dont notamment :

- Adjudication au plus offrant, après trois criées ; frais légaux en sus du prix d'adjudication.

- Biens vendus dans l'état où ils se trouvent, sans aucune réserve ni recours contre le vendeur ou l'officier vendeur, la responsabilité de ces derniers ne pourra être recherchée notamment sur l'éventuelle défaillance ou non-conformité des biens vendus (véhicules ou machines notamment), sur la péremption ou la mauvaise conservation des biens vendus (produits consommables notamment), les biens ayant été exposés au public préalablement.

- Revente immédiate à défaut de paiement au comptant.

- Enlèvement immédiatement après la dernière adjudication, adjudication qui transfère aussitôt la garde et la responsabilité du bien adjugé à l'adjudicataire.

- L'enlèvement est fait sous l'entière responsabilité de l'acquéreur ou de ses préposés, lequel prendra toute disposition utile pour s'assurer des qualifications adéquates (machines sous tension, permis spécifiques...), et des assurances nécessaires (véhicules notamment). Il en va de même lors des visites préalables.

- Pour tout paiement en espèces, le plafond est fixé à mille euros.

- En cas de vente d'un bien immatriculé, il est précisé lors de la vente, toute éventuelle difficulté pour une nouvelle immatriculation (carte grise perdue, gage ou opposition inscrit, problème de titulaire...).`;

  // Left column: fixed office identity block (hardcoded, not from options)
  const leftColChildren = [
    para(bold('SCP R. GRANIER - L. DAVID', 18), { spaceAfter: 60, align: AlignmentType.CENTER }),
    para(normal('Commissaires de Justice associés', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('66, rue de la République', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('B.P. 52', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('47202 MARMANDE Cedex', 16), { spaceAfter: 60, align: AlignmentType.CENTER }),
    para(normal('Tél : 05 53 64 12 59', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('Fax : 05 53 64 07 15', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('E-mail : etude@huissier47.fr', 16), { spaceAfter: 60, align: AlignmentType.CENTER }),
    para(normal('Paiement sécurisé 24/7 sur :', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('www.huissier47.fr', 16), { spaceAfter: 60, align: AlignmentType.CENTER }),
    para(normal('IBAN', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('FR45 4003 1000 0100 0014 3474 Z67', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('CDCGFRPPXXXX', 16), { spaceAfter: 60, align: AlignmentType.CENTER }),
    para(normal('SIRET 31281503800046', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('COMPÉTENCE 47 - 46 - 32', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(normal('COMPÉTENCE NATIONALE POUR LES CONSTATS', 16), { spaceAfter: 20, align: AlignmentType.CENTER }),
    para(bold('ACTE DE COMMISSAIRE DE JUSTICE', 24), { spaceAfter: 1000, spaceBefore: 1000, align: AlignmentType.CENTER }),
    new Table({
      alignment: AlignmentType.CENTER,
      width:  { size: 90, type: WidthType.PERCENTAGE },
      layout: 'autofit',
      borders: {
        top:     { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        bottom:  { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        left:    { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        right:   { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        insideH: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        insideV: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [para(bold('COÛT ACTE', 20), { align
                : AlignmentType.CENTER, spaceAfter: 0 })],
              margins: { top: 20, bottom: 20, left: 20, right: 10 },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                para(normal("EMOLUMENT ART. R444-3"), 20, {}),
                para(normal("46.00", 20), { align: AlignmentType.RIGHT }),
                para(normal("TVA 20%", 20), {}),
                para(normal("9.20", 20), { align: AlignmentType.RIGHT }),
                para(normal("TAXE FORFAITAIRE", 20), {}),
                para(normal("Art. 302bis Y CGI", 20), {}),
                para(bold("TOTAL", 20), { align: AlignmentType.LEFT, spaceBefore: 20 }),
                para(bold("55.20 €", 20), { align: AlignmentType.RIGHT, spaceBefore: 20 }),

              ],
              margins: { top: 20, bottom: 20, left: 10, right: 20 },
            }),
          ],
        }),
      ],
    }),
  ];

  // Right column: all page-1 legal content
  const rightColChildren = [
    para(bold('PROCÈS VERBAL DE VENTE', 26), { align: AlignmentType.CENTER, spaceAfter: 160 }),
    para(normal(frenchDate + '.', 20), { spaceAfter: 80 }),
    para([
      normal('Je soussigné(e), ', 20),
      bold(options.auctioneerName || "Nom de l'officier de justice", 20),
    ], { spaceAfter: 120 }),

    // A LA DEMANDE DE
    para(bold('A LA DEMANDE DE', 20), { spaceAfter: 60 }),
    ...(options.clientName || 'Nom du client')
      .split('\n')
      .map(line => para(normal(line, 20), { spaceAfter: 20, align: AlignmentType.JUSTIFIED })),
    para(normal('Élisant domicile en mon étude,', 20), { spaceAfter: 120 }),

    // AGISSANT EN VERTU
    para(bold('AGISSANT EN VERTU', 20), { spaceAfter: 60 }),
    ...(options.agissantEnVertu || 'Non spécifié')
      .split('\n')
      .map(line => para(normal(line, 20), { spaceAfter: 20, align: AlignmentType.JUSTIFIED })),
    para(normal(''), { spaceAfter: 120 }),

    // ME SUIS TRANSPORTÉ
    para(bold('ME SUIS TRANSPORTÉ EN CE JOUR', 20), { spaceAfter: 60 }),
    ...(options.address || auction.address || 'Adresse de la vente non spécifiée')
      .split('\n')
      .map(line => para(normal(line, 20), { spaceAfter: 20, align: AlignmentType.JUSTIFIED })),
    para(normal(''), { spaceAfter: 120 }),

    // ET, LA ÉTANT
    para(bold('ET, LA ÉTANT', 20), { spaceAfter: 60 }),
    ...CONDITIONS.split('\n').map(line =>
      para(normal(line, 20), { spaceAfter: line.startsWith('-') ? 80 : 20, align: AlignmentType.JUSTIFIED })
    ),

    para(bold("PUIS J'AI ADJUGÉ AINSI", 20), { spaceBefore: 160, spaceAfter: 80 }),
  ];

  const page1Table = new Table({
    width:  { size: 100, type: WidthType.PERCENTAGE },
    layout: 'autofit',
    columnWidths: [3000, 7000],
    borders: {
      top:     { style: BorderStyle.NONE },
      bottom:  { style: BorderStyle.NONE },
      left:    { style: BorderStyle.NONE },
      right:   { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE },
      insideV: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          // ── Left column (30%) ──────────────────────────────────────────
          new TableCell({
            width:         { size: 0, type: WidthType.AUTO },
            borders:       rightDividerBorder,
            verticalAlign: VerticalAlign.TOP,
            children:      leftColChildren,
            margins:       { top: 0, bottom: 0, left: 0, right: 100 },
          }),
          // ── Right column (70%) ─────────────────────────────────────────
          new TableCell({
            width:         { size: 0, type: WidthType.AUTO },
            borders:       noBorder,
            verticalAlign: VerticalAlign.TOP,
            children:      rightColChildren,
            margins:       { top: 0, bottom: 0, left: 100, right: 0 },
          }),
        ],
      }),
    ],
  });

  // ── Page 2 — Sales table ─────────────────────────────────────────────────

  const BLUE   = '2563EB';
  const STRIPE = 'F8FAFC';

  const cellBorder = {
    top:    { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    left:   { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    right:  { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
  };

  const headerCell = (text) => new TableCell({
    borders: cellBorder,
    shading: { type: ShadingType.CLEAR, fill: BLUE },
    children: [para(bold(text, 18), { align: AlignmentType.CENTER, spaceAfter: 0 })],
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });

  const dataCell = (text, shade, align = AlignmentType.LEFT) => new TableCell({
    borders: cellBorder,
    shading: shade ? { type: ShadingType.CLEAR, fill: STRIPE } : undefined,
    children: [para(new TextRun({ text, size: 18 }), { align, spaceAfter: 0 })],
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });

  const salesTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Descriptif'),
        headerCell('Prix (€)'),
        headerCell('Adjudicataire'),
      ],
    }),
    ...sales.map((sale, idx) => {
      const lotNumberRaw = sale.bundle?.number ?? sale.bundleId ?? sale.bundle?.id ?? '';
      const lotNumber    = lotNumberRaw !== '' ? String(lotNumberRaw).padStart(2, '0') : '00';
      const lotName      = sale.bundleName || sale.bundle?.name || 'Non spécifié';
      const price        = formatCurrency(sale.finalPrice);
      const buyer        = sale.participantName || sale.participant?.name || 'Inconnu';
      const buyerAddr    = sale.participantAddress || sale.participant?.address || sale.address || '';
      const shade        = idx % 2 === 1;
      return new TableRow({
        children: [
          dataCell(`${lotNumber} - ${lotName}`,    shade),
          dataCell(price,                           shade, AlignmentType.RIGHT),
          dataCell(`À ${buyer}${buyerAddr ? ', ' + buyerAddr : ''}`, shade),
        ],
      });
    }),
  ];

  const salesTable = new Table({
    width:  { size: 100, type: WidthType.PERCENTAGE },
    rows:   salesTableRows,
  });

  const closingText = `J'ai remis à chaque acquéreur une facture détaillée laissant apparaître : le montant de l'adjudication, le montant des frais, et le montant de la T.V.A.\n\nEt, de tout ce que dessus, j'ai dressé le présent procès verbal, conformément aux articles R221-37 à R221-39 du Code des procédures civiles d'exécution.`;

  // ── Assemble document ────────────────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run:       { font: 'Times New Roman', size: 20 },
          paragraph: { spacing: { after: 80 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    720,  // 1.27 cm
              bottom: 720,
              left:   720,  // 1.27 cm  (default Word is 1800 = ~3.17 cm)
              right:  720,
            },
          },
        },
        children: [
          // Page 1 — full two-column layout
          page1Table,

          // Page break before page 2
          new Paragraph({
            children: [new PageBreak()],
            spacing: { after: 0 },
          }),

          // Page 2 header
          para(bold('RÉCAPITULATIF DES ADJUDICATIONS', 24), {
            align: AlignmentType.CENTER,
            spaceBefore: 0,
            spaceAfter: 200,
          }),
          para(
            [
              normal(`Lots vendus : ${sales.length}   |   `, 20),
              bold(`Revenu total : ${formatCurrency(sales.reduce((s, x) => s + parseFloat(x.finalPrice || 0), 0))}`, 20),
            ],
            { spaceAfter: 200 }
          ),

          // Sales table
          salesTable,

          // Closing paragraph
          ...closingText.split('\n').map(line =>
            para(normal(line, 20), { spaceBefore: line ? 160 : 0, spaceAfter: 80 })
          ),
        ],
        footers: {
          default: new Footer({
            children: [
              para(normal(`SCP R. GRANIER - L. DAVID | ${auction.name} | Édité le ${new Date().toLocaleDateString("fr-FR")}`, 16), {
                align: AlignmentType.CENTER,
                spaceBefore: 0,
                spaceAfter: 0,
              }),
            ],
          }),
        },
      },
    ],
  });

  return doc;
};