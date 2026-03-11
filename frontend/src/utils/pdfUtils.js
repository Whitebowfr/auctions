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
 * Generate a closing report PDF for an auction
 * @param {Object} auction - The auction object
 * @param {Array} sales - The auction sales
 * @param {Object} options - Customization options
 * @param {string} options.bodyText - Free text for the first page
 * @param {string} options.address - Address to display on the first page
 * @param {string} options.auctioneerName - Auctioneer name shown in the left column
 * @param {string} options.clientName - Client name shown in the right column (e.g. "A LA DEMANDE DE ...")
 * @param {string} options.agissantEnVertu - Shown after clientName in the right column (e.g. "AGISSANT EN VERTU DE ...")
 * @param {string|null} options.logo - Base64 image for the logo shown in the left column
 * @returns {jsPDF} - The generated PDF document
 */
export const generateClosingReport = (auction, sales, options = {}) => {
  applyPlugin(jsPDF);
  const doc = new jsPDF();

  // ── Layout constants ─────────────────────────────────────────────────────
  const pageW = doc.internal.pageSize.width;   // 210 mm (A4)
  const margin = 10;
  const leftColW = Math.round(pageW * 0.20);   // ~42 mm  (20 %)
  const dividerX = margin + leftColW;           // ~52 mm
  const rightColX = dividerX + 5;              // 5 mm gutter
  const rightColW = pageW - rightColX - margin; // ~143 mm

  // ── PAGE 1 : two-column header ───────────────────────────────────────────

  // ── Left column : logo + auctioneer name ────────────────────────────────
  let leftY = 15;

  if (options.logo) {
    // Draw logo centred in the left column
    const logoW = leftColW - 4;
    const logoH = 20;
    doc.addImage(options.logo, 'JPEG', margin + 2, leftY, logoW, logoH);
    leftY += logoH + 4;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#1e3a5f');
  doc.text("SCP R. GRANIER - L. DAVID", 3, leftY);
  leftY += 10;
  doc.setFontSize(7);
  const leftCenterX = leftColW / 2 + 4;
  doc.text(`Commissaires de Justice associés 
66, rue de la République 
B.P. 52 
47202 MARMANDE Cedex 
Tél : 05 53 64 12 59 
Fax : 05 53 64 07 15
E-mail : etude@huissier47.fr
Paiement sécurisé 24/7 sur : 
www.huissier47.fr
IBAN
FR45 4003 1000 0100 0014 3474 Z67
CDCGFRPPXXXX
SIRET 31281503800046 
COMPETENCE 47 - 46 - 32
COMPETENCE NATIONALE POUR LES CONSTATS`, leftCenterX, leftY, { maxWidth: leftColW - 4, align: 'center' });
  const colLineBottom = 80;
  doc.setDrawColor('#CBD5E1');
  doc.setLineWidth(0.4);
  doc.line(dividerX, 10, dividerX, colLineBottom);

  // ── Right column : auction info + address + body text ───────────────────
  let rightY = 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#1e293b');
  const titleX = rightColX + rightColW / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('PROCÈS VERBAL DE VENTE', titleX, rightY, { align: 'center' });
  rightY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#64748b');
  (() => {
    const d = new Date(auction.date);
    if (isNaN(d)) {
      doc.text("L'AN INCONNU, le jour inconnu.", rightColX, rightY);
      return;
    }

    const month = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(d); // "juin"
    const day = d.getDate();

    // Day words for 1..31 (use "premier" for 1)
    const dayWords = [
      null,
      'premier',
      'deux',
      'trois',
      'quatre',
      'cinq',
      'six',
      'sept',
      'huit',
      'neuf',
      'dix',
      'onze',
      'douze',
      'treize',
      'quatorze',
      'quinze',
      'seize',
      'dix-sept',
      'dix-huit',
      'dix-neuf',
      'vingt',
      'vingt et un',
      'vingt-deux',
      'vingt-trois',
      'vingt-quatre',
      'vingt-cinq',
      'vingt-six',
      'vingt-sept',
      'vingt-huit',
      'vingt-neuf',
      'trente',
      'trente et un'
    ];
    const dayWord = dayWords[day] || String(day);

    // Helper to convert 1..99 to french words (simple, sufficient for years)
    const under100 = (n) => {
      const units = [
        'zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
        'dix','onze','douze','treize','quatorze','quinze','seize'
      ];
      const tens = {
        20: 'vingt',
        30: 'trente',
        40: 'quarante',
        50: 'cinquante',
        60: 'soixante',
        80: 'quatre-vingt'
      };
      if (n < 17) return units[n];
      if (n < 20) return 'dix-' + units[n - 10];
      if (n < 70) {
        const t = Math.floor(n / 10) * 10;
        const u = n % 10;
        if (u === 0) return tens[t];
        if (u === 1 && t !== 80) return `${tens[t]} et un`;
        return `${tens[t]}-${units[u]}`;
      }
      if (n < 80) {
        // 70..79 => soixante + 10..19
        return `soixante-${under100(n - 60)}`;
      }
      // 80..99
      if (n < 100) {
        if (n === 80) return 'quatre-vingt';
        return `quatre-vingt-${under100(n - 80)}`;
      }
      return String(n);
    };

    // Convert year (supports typical auction years like 2000-2099; reasonable fallback for others)
    const year = d.getFullYear();
    const yearToWords = (y) => {
      if (y === 2000) return 'deux mille';
      if (y > 2000 && y < 2100) {
        const rem = y - 2000;
        return rem === 0 ? 'deux mille' : `deux mille ${under100(rem)}`;
      }
      // generic thousand handler (basic)
      const thousands = Math.floor(y / 1000);
      const rem = y % 1000;
      const thousandsWord = thousands === 1 ? 'mille' : `${under100(thousands)} mille`;
      if (rem === 0) return thousandsWord;
      if (rem < 100) return `${thousandsWord} ${under100(rem)}`;
      // handle hundreds simply
      const hundreds = Math.floor(rem / 100);
      const rest = rem % 100;
      const hundredsWord = hundreds === 1 ? 'cent' : `${under100(hundreds)} cent`;
      return rest === 0 ? `${thousandsWord} ${hundredsWord}` : `${thousandsWord} ${hundredsWord} ${under100(rest)}`;
    };

    const yearWords = yearToWords(year).toUpperCase(); // "DEUX MILLE VINGT CINQ"

    doc.text(`L'AN ${yearWords}, le ${dayWord} ${month}.`, rightColX, rightY);
  })();

  rightY += 6;
  doc.text(`Je soussigné(e), ${options.auctioneerName || "Nom de l'officier de justice"}`, rightColX, rightY);
  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text("A LA DEMANDE DE", rightColX, rightY);
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  let splitName = doc.splitTextToSize(options.clientName || "Nom du client", rightColW);
  doc.text(splitName, rightColX, rightY);
  rightY += splitName.length * 5 + 5;
  doc.text("Élisant domicile en mon étude,", rightColX, rightY);
  rightY += 5;

  doc.setFont('helvetica', 'bold');
  doc.text("AGISSANT EN VERTU", rightColX, rightY);
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  let splitAgissant = doc.splitTextToSize(options.agissantEnVertu || "Non spécifié", rightColW);
  doc.text(splitAgissant, rightColX, rightY);
  rightY += splitAgissant.length * 5 + 5;

  doc.setFont('helvetica', 'bold');
  doc.text("ME SUIS TRANSPORTÉ EN CE JOUR", rightColX, rightY);
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  let splitAdress = doc.splitTextToSize(options.fullAddress || auction.address || "Adresse de la vente non spécifiée", rightColW);
  doc.text(splitAdress, rightColX, rightY);
  rightY += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text("ET, LA ÉTANT", rightColX, rightY);
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Après avoir procédé aux publicités prescrites par la Loi, et annoncé la vente pour ce jour le nombre légal d'acquéreurs potentiels étant présent, j'ai annoncé l'ouverture de la vente aux enchères publiques et rappelé les conditions générales de vente, dont notamment :
    
    - Adjudication au plus offrant, après trois criées ; frais légaux en sus du prix d'adjudication.
    
    - Biens vendus dans l'état où ils se trouvent, sans aucune réserve ni recours contre le vendeur ou l'officier vendeur, la responsabilité de ces derniers ne pourra être recherchée notamment sur l'éventuelle défaillance ou non-conformité des biens vendus (véhicules ou machines notamment), sur la péremption ou la mauvaise conservation des biens vendus (produits consommables notamment), les biens ayant été exposés au public préalablement.
    
    
    - Revent immédiate à défaut de paiement au comptant.
    
    - Enlèvement immédiatement après la dernière adjudication, adjudication qui transfère aussitôt la garde et la responsabilité du bien adjugé à l'adjudicataire.
    
    - L'enlèvement est fait sous l'entière responsabilité de l'acquéreur ou de ses préposés, lequel prendre toute disposition utile pour s'assurer des qualificatons adéquate (machines sous tension, permis spécifiques...), et des assurances nécessaires (véhicules notamment). Il en va de même lors des visites préalables.
    
    - Pour tout paiement en espèces, le plafond est fixé à mille euros.
    
    - En cas de vente d'un bien immatriculé, il est précisé lors de la vente, toute éventuelle difficulté pour une nouvelle immatriculation (carte grise perdue, gage ou opposition inscrit, problème de titulaire...).`, rightColX, rightY, { maxWidth: rightColW });

  rightY += 120;
  doc.setFont('helvetica', 'bold');
  doc.text("PUIS J'AI ADJUGÉ AINSI", rightColX, rightY);

  // Footer page 1
  doc.setFontSize(9);
  doc.setTextColor('#94A3B8');
  doc.text(
    `${auction.name} - Édité le ${new Date().toLocaleDateString('fr-FR')}`,
    margin,
    doc.internal.pageSize.height - 10
  );
  doc.text('Page 1', pageW - 25, doc.internal.pageSize.height - 10);
  doc.setTextColor('#000000');

  // ──────────────────── PAGE 2 : Sales table ────────────────────────────────
  doc.addPage();
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  doc.autoTable({
    startY: 38,
    head: [['Descriptif', 'Prix (€)', 'Adjudicateur']],
    body: sales.map(sale => {
      const lotNumberRaw = sale.bundle?.number ?? sale.bundleId ?? sale.bundle?.id ?? '';
      const lotNumber = lotNumberRaw !== '' ? String(lotNumberRaw).padStart(2, '0') : '00';
      const lotName = sale.bundleName || sale.bundle?.name || 'Non spécifié';
      const price = formatCurrency(sale.finalPrice);
      const participantName = sale.participantName || sale.participant?.name || 'Inconnu';
      const participantAddress = sale.participantAddress || sale.participant?.address || sale.address || '';
      return [
        `${lotNumber} - ${lotName}`,
        price,
        `A ${participantName}, ${participantAddress}`
      ];
    }),
    headStyles: {
      fillColor: '#2563eb',
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: '#F8FAFC'
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Récapitulatif des adjudications - ${auction.name} (suite)`, 14, 20);
      }
    }
  });

  doc.setFontSize(12);
  doc.text(`J'ai remis à chaque acquéreur une facture détaillée laissant apparaître: le montant de l'adjudication, le montant des frais, et le montant de la T.V.A.
    
Et, de tout ce que dessus, j'ai dressé le présent procès verbal, conformément aux articles R221-37 à R221-39 du Code des procédures civiles d'exécution.`, 14, doc.lastAutoTable.finalY + 10, { maxWidth: pageW - 3 * margin });

  // Footer on all pages of page 2+
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor('#94A3B8');
    doc.text(
      `${auction.name} - Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width - 35,
      doc.internal.pageSize.height - 10
    );
    doc.setTextColor('#000000');
  }

  return doc;
};