/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Translations for "Opere & Raccolte Fondi" (Community Works & Fundraisers)
 * Complete, accurate, professional translations for all 11 official portal languages:
 * it, en, fr, es, pt, ru, hi, bn, zh, ja, ar.
 */

import { Language } from './translations';
import { ProjectCategory, ProjectStatus } from '../services/projectsService';

export interface ProjectsPageTranslations {
  pageBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  pillarBank: string;
  pillarStatements: string;
  pillarTransparency: string;

  fundsRaised: string;
  fundsGoal: (target: string) => string;
  directBeneficiaries: string;
  beneficiariesSub: string;
  auditedStatements: string;
  auditedStatementsSub: string;
  civicGuarantee: string;
  civicGuaranteeSub: string;

  searchPlaceholder: string;
  activeProjectsCount: (count: number) => string;
  categoryAll: string;
  categoryWater: string;
  categoryHealth: string;
  categoryEducation: string;
  categoryEcology: string;
  categoryHumanitarian: string;
  categoryCivic: string;

  raised: string;
  target: string;
  funded: string;
  beneficiaries: string;
  statementsCount: (count: number) => string;
  detailsButton: string;

  emptyTitle: string;
  emptyDesc: string;
  showAllBtn: string;

  closeAria: string;
  progressTitle: string;
  progressOfGoal: (target: string) => string;
  populationServed: string;
  peopleCount: (count: string) => string;
  projectStartDate: string;
  targetDeliveryDate: string;

  descriptionTitle: string;
  executionSteps: string;

  howToSupportTitle: string;
  bankCoordsTitle: string;
  reportPledgeBtn: string;
  closePledgeBtn: string;
  beneficiaryName: string;
  bankName: string;
  bicCode: string;
  ibanCode: string;
  copy: string;
  copied: string;
  mandatoryReason: string;
  copiedReason: string;
  reasonInstruction: string;
  sepaTransfer: string;
  sepaTransferDesc: string;

  pledgeTitle: string;
  pledgeSubtitle: string;
  pledgeDesc: string;
  donorNameLabel: string;
  donorNamePlaceholder: string;
  amountLabel: string;
  transferDateLabel: string;
  emailLabel: string;
  croTrnLabel: string;
  croTrnPlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  cancel: string;
  submitting: string;
  submitNotice: string;
  invalidAmount: string;

  auditTitle: string;
  auditDesc: string;
  auditedDocsCount: (count: number) => string;
  downloadDoc: string;
  noStatementsYet: string;
  statementsPeriodic: string;

  donorLedgerTitle: string;
  donationsCount: (count: number) => string;
  auditedBadge: string;
  pendingBadge: string;
  noDonationsYet: string;
  donationsAuditNote: string;

  footerStatutory: string;
  closeWindow: string;
}

export const PROJECTS_PAGE_I18N: Record<Language, ProjectsPageTranslations> = {
  // 1. ITALIANO (IT)
  it: {
    pageBadge: 'New World State • Opere Umanitarie Civiche',
    heroTitle: 'Opere Comunitarie & Raccolte Fondi',
    heroSubtitle: 'con Rendicontazione Totale Bancaria',
    heroDescription: "Costruiamo insieme il bene comune tangibile: pozzi d'acqua potabile a energia solare nei villaggi dell'Africa sub-sahariana, presidi medici rurali per madri e bambini, scuole connesse e riforestazione. Tutte le donazioni avvengono con versamento diretto sul conto corrente dell'associazione e sono rendicontate al centesimo con la pubblicazione periodica degli estratti conto bancari ufficiali.",
    pillarBank: 'Conto Corrente Bancario Dedicato',
    pillarStatements: 'Estratti Conto PDF Scaricabili',
    pillarTransparency: 'Controllo Civico & Trasparenza 100%',

    fundsRaised: 'Fondi Raccolti',
    fundsGoal: (target) => `su € ${target} obiettivo complessivo`,
    directBeneficiaries: 'Beneficiari Diretti',
    beneficiariesSub: 'Persone e famiglie con accesso ad acqua e servizi',
    auditedStatements: 'Estratti Conto Pubblicati',
    auditedStatementsSub: 'Documenti contabili e fatture consultabili',
    civicGuarantee: 'Garanzia Istituzionale',
    civicGuaranteeSub: 'Fondi destinati integralmente alle opere',

    searchPlaceholder: 'Cerca opera per nome, parola chiave o nazione...',
    activeProjectsCount: (count) => `${count} opere e raccolte disponibili`,
    categoryAll: 'Tutte le Opere',
    categoryWater: "Pozzi d'Acqua (Africa)",
    categoryHealth: 'Sanità & Cliniche Rurali',
    categoryEducation: 'Scuole & Connettività',
    categoryEcology: 'Riforestazione & Agro-Ecologia',
    categoryHumanitarian: 'Soccorso Civico & Emergenze',
    categoryCivic: 'Infrastrutture Comunitarie',

    raised: 'Raccolti',
    target: 'Obiettivo',
    funded: 'completato',
    beneficiaries: 'beneficiari',
    statementsCount: (count) => `${count} Estratti conto pubblicati`,
    detailsButton: 'Dettagli, Coordinate & Rendicontazione',

    emptyTitle: 'Nessuna opera trovata per i criteri selezionati',
    emptyDesc: "Prova a selezionare un'altra categoria o a pulire la barra di ricerca.",
    showAllBtn: 'Mostra tutte le opere',

    closeAria: 'Chiudi finestra',
    progressTitle: 'Stato Avanzamento Raccolta',
    progressOfGoal: (target) => `su € ${target} target finale`,
    populationServed: 'Popolazione Servita:',
    peopleCount: (count) => `${count} persone`,
    projectStartDate: 'Data inizio opera:',
    targetDeliveryDate: 'Completamento previsto:',

    descriptionTitle: "Descrizione dell'Opera & Impatto Comunitario",
    executionSteps: 'Fasi di Realizzazione Tecnica:',

    howToSupportTitle: 'Come Sostenere Questa Opera con Versamento Bancario',
    bankCoordsTitle: "Coordinate Bancarie Ufficiali dell'Associazione",
    reportPledgeBtn: 'Hai già fatto il bonifico? Segnalalo',
    closePledgeBtn: 'Chiudi Segnalazione',
    beneficiaryName: 'Intestatario del Conto:',
    bankName: 'Banca di Appoggio:',
    bicCode: 'Codice BIC / SWIFT:',
    ibanCode: 'Codice IBAN:',
    copy: 'Copia',
    copied: 'Copiato!',
    mandatoryReason: 'Causale Obbligatoria per Questo Progetto:',
    copiedReason: 'Copiata!',
    reasonInstruction: "Inserisci questa causale esatta nel tuo bonifico per vincolare i tuoi fondi alla realizzazione di quest'opera.",
    sepaTransfer: 'Bonifico SEPA / Ordinario:',
    sepaTransferDesc: 'Puoi effettuare il bonifico direttamente dalla tua app bancaria abituale, home banking o sportello.',

    pledgeTitle: 'Segnalazione Bonifico Effettuato',
    pledgeSubtitle: 'Controllo contabile & Albo donatori',
    pledgeDesc: "Hai effettuato il bonifico bancario? Inserisci qui i dati della tua donazione per permettere al nostro ufficio contabile di riscontrarla sull'estratto conto e rilasciare la ricevuta.",
    donorNameLabel: 'Nome Donatore (o "Anonimo")',
    donorNamePlaceholder: 'es. Mario Rossi o Anonimo',
    amountLabel: 'Importo Versato (€)*',
    transferDateLabel: 'Data Bonifico',
    emailLabel: 'Email per Ricevuta (facoltativa)',
    croTrnLabel: 'Codice CRO / TRN (facoltativo)',
    croTrnPlaceholder: 'Identificativo contabile del bonifico',
    noteLabel: 'Messaggio o Dedica Pubblica (facoltativo)',
    notePlaceholder: "Lascia un messaggio che apparirà nell'albo dei donatori",
    cancel: 'Annulla',
    submitting: 'Registrazione in corso...',
    submitNotice: 'Invia Segnalazione Donazione',
    invalidAmount: 'Inserisci un importo valido in Euro (€).',

    auditTitle: 'Rendicontazione Bancaria Ufficiale & Estratti Conto',
    auditDesc: "Tutti i bonifici in entrata e le uscite per i fornitori dell'opera sono rendicontati con la pubblicazione degli estratti conto bancari.",
    auditedDocsCount: (count) => `${count} Documenti Pubblicati`,
    downloadDoc: 'Scarica Documento',
    noStatementsYet: 'Nessun estratto conto ancora caricato per questo progetto.',
    statementsPeriodic: "I documenti contabili vengono caricati periodicamente all'emissione dell'estratto conto dalla banca.",

    donorLedgerTitle: 'Albo dei Donatori & Riscontri Contabili',
    donationsCount: (count) => `${count} donazioni registrate`,
    auditedBadge: 'Verificato c/c',
    pendingBadge: 'In attesa e/c',
    noDonationsYet: 'Nessuna donazione ancora registrata nel libro contabile.',
    donationsAuditNote: "I bonifici pervenuti con causale dedicata vengono verificati ed inseriti dall'amministrazione con il riscontro bancario.",

    footerStatutory: 'New World State • Trasparenza Statutaria Bancaria',
    closeWindow: 'Chiudi Finestra',
  },

  // 2. ENGLISH (EN)
  en: {
    pageBadge: 'New World State • Civic Humanitarian Works',
    heroTitle: 'Community Works & Transparent Fundraisers',
    heroSubtitle: 'with 100% Audited Bank Statements',
    heroDescription: "Building tangible global common good together: solar-powered drinking water wells in sub-Saharan African villages, rural health clinics for mothers and children, connected schools, and reforestation. All donations are sent directly to the association's official bank account and accounted for to the cent with published official bank statements.",
    pillarBank: 'Dedicated Official Bank Account',
    pillarStatements: 'Downloadable PDF Statements',
    pillarTransparency: 'Civic Oversight & 100% Transparency',

    fundsRaised: 'Funds Raised',
    fundsGoal: (target) => `of € ${target} overall goal`,
    directBeneficiaries: 'Direct Beneficiaries',
    beneficiariesSub: 'People and families with verified access to water and care',
    auditedStatements: 'Audited Statements Published',
    auditedStatementsSub: 'Public accounting documents and invoices',
    civicGuarantee: 'Civic Guarantee',
    civicGuaranteeSub: '100% of donations allocated to projects',

    searchPlaceholder: 'Search projects by name, country or keyword...',
    activeProjectsCount: (count) => `${count} projects and fundraisers active`,
    categoryAll: 'All Projects',
    categoryWater: 'Water Wells (Africa)',
    categoryHealth: 'Rural Health & Clinics',
    categoryEducation: 'Schools & Education',
    categoryEcology: 'Reforestation & Ecology',
    categoryHumanitarian: 'Humanitarian Relief & Civic Aid',
    categoryCivic: 'Civic Infrastructure',

    raised: 'Raised',
    target: 'Target',
    funded: 'funded',
    beneficiaries: 'beneficiaries',
    statementsCount: (count) => `${count} Bank statements published`,
    detailsButton: 'Details, Bank Info & Audit',

    emptyTitle: 'No projects found for current filters',
    emptyDesc: 'Try selecting another category or clearing your search query.',
    showAllBtn: 'Show all projects',

    closeAria: 'Close window',
    progressTitle: 'Fundraising Progress',
    progressOfGoal: (target) => `of € ${target} final goal`,
    populationServed: 'Population Served:',
    peopleCount: (count) => `${count} people`,
    projectStartDate: 'Project start date:',
    targetDeliveryDate: 'Target delivery date:',

    descriptionTitle: 'Project Description & Community Impact',
    executionSteps: 'Technical Execution Phases:',

    howToSupportTitle: 'How to Support this Project via Bank Transfer',
    bankCoordsTitle: "Association's Official Bank Coordinates",
    reportPledgeBtn: 'Already sent transfer? Report it',
    closePledgeBtn: 'Close Notice',
    beneficiaryName: 'Beneficiary Name:',
    bankName: 'Bank Name:',
    bicCode: 'BIC / SWIFT Code:',
    ibanCode: 'IBAN Code:',
    copy: 'Copy',
    copied: 'Copied!',
    mandatoryReason: 'Dedicated Transfer Reason (Required):',
    copiedReason: 'Copied!',
    reasonInstruction: 'Paste this exact reason into your bank transfer to bind your donation directly to this project.',
    sepaTransfer: 'SEPA / Wire Bank Transfer:',
    sepaTransferDesc: 'Use your regular banking app, online banking or physical branch to send your donation safely.',

    pledgeTitle: 'Report Your Bank Donation',
    pledgeSubtitle: 'Audit check & public ledger',
    pledgeDesc: 'Did you make a bank transfer? Enter the details here so our accounting office can cross-check it against the upcoming bank statement and issue your receipt.',
    donorNameLabel: 'Donor Name (or "Anonymous")',
    donorNamePlaceholder: 'e.g. John Doe or Anonymous',
    amountLabel: 'Donated Amount (€)*',
    transferDateLabel: 'Transfer Date',
    emailLabel: 'Email for Receipt (optional)',
    croTrnLabel: 'CRO / TRN Code (optional)',
    croTrnPlaceholder: 'Bank transfer transaction code',
    noteLabel: 'Public Note or Dedication (optional)',
    notePlaceholder: 'Leave a message to appear in the public donor ledger',
    cancel: 'Cancel',
    submitting: 'Submitting...',
    submitNotice: 'Submit Donation Notice',
    invalidAmount: 'Please enter a valid amount in Euro (€).',

    auditTitle: 'Official Bank Statements & Audit Reports',
    auditDesc: 'All incoming donations and vendor construction expenses are audited and substantiated with downloadable bank statements.',
    auditedDocsCount: (count) => `${count} Audited Documents`,
    downloadDoc: 'Download Document',
    noStatementsYet: 'No bank statements published for this project yet.',
    statementsPeriodic: 'Financial statements are uploaded periodically upon issuance by the bank.',

    donorLedgerTitle: 'Donor Ledger & Verified Deposits',
    donationsCount: (count) => `${count} recorded donations`,
    auditedBadge: 'Audited',
    pendingBadge: 'Pending stmt',
    noDonationsYet: 'No donations recorded in the ledger yet.',
    donationsAuditNote: 'Direct bank transfers with dedicated references are audited and recorded manually.',

    footerStatutory: 'New World State • Statutory Bank Transparency',
    closeWindow: 'Close Window',
  },

  // 3. FRANÇAIS (FR)
  fr: {
    pageBadge: 'New World State • Œuvres Humanitaires Civiques',
    heroTitle: 'Œuvres Communautaires & Levées de Fonds',
    heroSubtitle: 'avec Reddition de Comptes Bancaires Totale',
    heroDescription: "Bâtissons ensemble le bien commun tangible : puits d'eau potable solaires en Afrique subsaharienne, dispensaires médicaux ruraux pour mères et enfants, écoles connectées et reforestation. Tous les dons s'effectuent par virement direct sur le compte bancaire de l'association et sont justifiés au centime près par la publication périodique des relevés bancaires officiels.",
    pillarBank: 'Compte Bancaire Dédié',
    pillarStatements: 'Relevés Bancaires PDF Téléchargeables',
    pillarTransparency: 'Contrôle Citoyen & Transparence 100%',

    fundsRaised: 'Fonds Collectés',
    fundsGoal: (target) => `sur € ${target} objectif global`,
    directBeneficiaries: 'Bénéficiaires Directs',
    beneficiariesSub: "Personnes et familles ayant accès à l'eau et aux soins",
    auditedStatements: 'Relevés Bancaires Publiés',
    auditedStatementsSub: 'Documents comptables et factures consultables',
    civicGuarantee: 'Garantie Civique',
    civicGuaranteeSub: '100% des fonds alloués aux réalisations',

    searchPlaceholder: 'Rechercher par nom, pays ou mot-clé...',
    activeProjectsCount: (count) => `${count} projets et collectes actives`,
    categoryAll: 'Toutes les Œuvres',
    categoryWater: "Puits d'Eau (Afrique)",
    categoryHealth: 'Santé & Cliniques Rurales',
    categoryEducation: 'Écoles & Connectivité',
    categoryEcology: 'Reforestation & Agro-Écologie',
    categoryHumanitarian: 'Secours Humanitaire & Urgences',
    categoryCivic: 'Infrastructures Civiques',

    raised: 'Collectés',
    target: 'Objectif',
    funded: 'financé',
    beneficiaries: 'bénéficiaires',
    statementsCount: (count) => `${count} Relevés bancaires publiés`,
    detailsButton: 'Détails, Coordonnées & Comptes',

    emptyTitle: 'Aucun projet trouvé pour les critères sélectionnés',
    emptyDesc: 'Essayez de sélectionner une autre catégorie ou de vider la recherche.',
    showAllBtn: 'Afficher tous les projets',

    closeAria: 'Fermer la fenêtre',
    progressTitle: 'Progression de la Collecte',
    progressOfGoal: (target) => `sur € ${target} objectif final`,
    populationServed: 'Population Bénéficiaire :',
    peopleCount: (count) => `${count} personnes`,
    projectStartDate: 'Début des travaux :',
    targetDeliveryDate: 'Achèvement prévu :',

    descriptionTitle: "Description de l'Œuvre & Impact Communautaire",
    executionSteps: 'Phases Techniques de Réalisation :',

    howToSupportTitle: 'Comment Soutenir Cette Œuvre par Virement Bancaire',
    bankCoordsTitle: "Coordonnées Bancaires Officielles de l'Association",
    reportPledgeBtn: 'Virement effectué ? Signalez-le',
    closePledgeBtn: 'Fermer le Formulaire',
    beneficiaryName: 'Titulaire du Compte :',
    bankName: 'Établissement Bancaire :',
    bicCode: 'Code BIC / SWIFT :',
    ibanCode: 'Code IBAN :',
    copy: 'Copier',
    copied: 'Copié !',
    mandatoryReason: 'Motif Obligatoire pour ce Projet :',
    copiedReason: 'Copié !',
    reasonInstruction: 'Indiquez ce libellé exact dans votre virement pour affecter vos fonds exclusivement à ce projet.',
    sepaTransfer: 'Virement Bancaire SEPA / International :',
    sepaTransferDesc: 'Effectuez votre don depuis votre application bancaire, banque en ligne ou guichet habituel.',

    pledgeTitle: 'Signalement de Virement Effectué',
    pledgeSubtitle: 'Contrôle comptable & Registre des donateurs',
    pledgeDesc: 'Vous avez effectué le virement bancaire ? Renseignez ici les détails pour permettre à notre service comptable de vérifier le relevé et délivrer votre reçu.',
    donorNameLabel: 'Nom du Donateur (ou "Anonyme")',
    donorNamePlaceholder: 'ex. Jean Dupont ou Anonyme',
    amountLabel: 'Montant Versé (€)*',
    transferDateLabel: 'Date du Virement',
    emailLabel: 'E-mail pour Reçu (facultatif)',
    croTrnLabel: 'Code CRO / TRN (facultatif)',
    croTrnPlaceholder: 'Référence comptable du virement',
    noteLabel: 'Message ou Dédicace Publique (facultatif)',
    notePlaceholder: 'Laissez un mot qui apparaîtra dans le registre des donateurs',
    cancel: 'Annuler',
    submitting: 'Enregistrement en cours...',
    submitNotice: 'Envoyer le Signalement',
    invalidAmount: 'Veuillez saisir un montant valide en Euros (€).',

    auditTitle: 'Rendition de Comptes & Relevés Bancaires Officiels',
    auditDesc: "Tous les dons perçus et les dépenses engagées sont justifiés par la publication intégrale des relevés bancaires de l'association.",
    auditedDocsCount: (count) => `${count} Documents Publiés`,
    downloadDoc: 'Télécharger le Document',
    noStatementsYet: 'Aucun relevé encore publié pour ce projet.',
    statementsPeriodic: 'Les relevés bancaires sont mis en ligne périodiquement à réception du document de la banque.',

    donorLedgerTitle: 'Registre des Donateurs & Rapprochements',
    donationsCount: (count) => `${count} dons enregistrés`,
    auditedBadge: 'Vérifié s/ relevé',
    pendingBadge: 'En attente relevé',
    noDonationsYet: 'Aucun don encore inscrit au livre comptable.',
    donationsAuditNote: "Les virements reçus avec libellé dédié sont audités et saisis manuellement par l'administration.",

    footerStatutory: 'New World State • Transparence Bancaire Statutaire',
    closeWindow: 'Fermer la Fenêtre',
  },

  // 4. ESPAÑOL (ES)
  es: {
    pageBadge: 'New World State • Obras Humanitarias Cívicas',
    heroTitle: 'Obras Comunitarias y Recaudación de Fondos',
    heroSubtitle: 'con Rendición de Cuentas Bancarias 100% Transparente',
    heroDescription: 'Construyamos juntos el bien común tangible: pozos de agua potable con energía solar en África subsahariana, dispensarios médicos rurales para madres y niños, escuelas conectadas y reforestación. Todas las donaciones se realizan mediante transferencia bancaria directa a la cuenta de la asociación y se justifican al céntimo con la publicación periódica de los extractos bancarios oficiales.',
    pillarBank: 'Cuenta Bancaria Dedicada',
    pillarStatements: 'Extractos Bancarios en PDF Descargables',
    pillarTransparency: 'Control Cívico y Transparencia 100%',

    fundsRaised: 'Fondos Recaudados',
    fundsGoal: (target) => `de € ${target} meta global`,
    directBeneficiaries: 'Beneficiarios Directos',
    beneficiariesSub: 'Personas y familias con acceso a agua y atención médica',
    auditedStatements: 'Extractos Bancarios Publicados',
    auditedStatementsSub: 'Documentos contables y facturas auditadas',
    civicGuarantee: 'Garantía Cívica',
    civicGuaranteeSub: '100% de donaciones destinadas a las obras',

    searchPlaceholder: 'Buscar proyectos por nombre, país o palabra clave...',
    activeProjectsCount: (count) => `${count} obras y colectas activas`,
    categoryAll: 'Todas las Obras',
    categoryWater: 'Pozos de Agua (África)',
    categoryHealth: 'Salud y Clínicas Rurales',
    categoryEducation: 'Escuelas y Conectividad',
    categoryEcology: 'Reforestación y Agroecología',
    categoryHumanitarian: 'Ayuda Humanitaria y Emergencias',
    categoryCivic: 'Infraestructura Comunitaria',

    raised: 'Recaudado',
    target: 'Objetivo',
    funded: 'completado',
    beneficiaries: 'beneficiarios',
    statementsCount: (count) => `${count} Extractos bancarios publicados`,
    detailsButton: 'Detalles, Datos Bancarios y Auditoría',

    emptyTitle: 'No se encontraron obras para los filtros seleccionados',
    emptyDesc: 'Prueba seleccionando otra categoría o borrando la búsqueda.',
    showAllBtn: 'Ver todas las obras',

    closeAria: 'Cerrar ventana',
    progressTitle: 'Estado de Avance de la Colecta',
    progressOfGoal: (target) => `de € ${target} objetivo final`,
    populationServed: 'Población Atendida:',
    peopleCount: (count) => `${count} personas`,
    projectStartDate: 'Fecha de inicio:',
    targetDeliveryDate: 'Finalización prevista:',

    descriptionTitle: 'Descripción del Proyecto e Impacto Comunitario',
    executionSteps: 'Fases Técnicas de Ejecución:',

    howToSupportTitle: 'Cómo Apoyar Este Proyecto por Transferencia Bancaria',
    bankCoordsTitle: 'Datos Bancarios Oficiales de la Asociación',
    reportPledgeBtn: '¿Ya realizaste la transferencia? Notifícalo',
    closePledgeBtn: 'Cerrar Notificación',
    beneficiaryName: 'Titular de la Cuenta:',
    bankName: 'Entidad Bancaria:',
    bicCode: 'Código BIC / SWIFT:',
    ibanCode: 'Código IBAN:',
    copy: 'Copiar',
    copied: '¡Copiado!',
    mandatoryReason: 'Concepto Obligatorio para Este Proyecto:',
    copiedReason: '¡Copiado!',
    reasonInstruction: 'Coloca este concepto exacto en tu transferencia para vincular tus fondos directamente a este proyecto.',
    sepaTransfer: 'Transferencia Bancaria SEPA / Ordinaria:',
    sepaTransferDesc: 'Realiza la donación desde la app de tu banco, banca en línea o sucursal habitual.',

    pledgeTitle: 'Notificación de Donación Realizada',
    pledgeSubtitle: 'Control contable y libro de donantes',
    pledgeDesc: '¿Has realizado la transferencia? Rellena estos datos para que nuestro equipo contable pueda cotejarla en el próximo extracto y expedir tu recibo.',
    donorNameLabel: 'Nombre del Donante (o "Anónimo")',
    donorNamePlaceholder: 'ej. Juan Pérez o Anónimo',
    amountLabel: 'Importe Transferido (€)*',
    transferDateLabel: 'Fecha de Transferencia',
    emailLabel: 'Correo para Recibo (opcional)',
    croTrnLabel: 'Código CRO / TRN (opcional)',
    croTrnPlaceholder: 'Identificador contable de la transferencia',
    noteLabel: 'Mensaje o Dedicatoria Pública (opcional)',
    notePlaceholder: 'Deja un mensaje que aparecerá en el libro de donantes',
    cancel: 'Cancelar',
    submitting: 'Registrando...',
    submitNotice: 'Enviar Notificación',
    invalidAmount: 'Introduce un importe válido en Euros (€).',

    auditTitle: 'Rendición de Cuentas y Extractos Bancarios Oficiales',
    auditDesc: 'Todos los ingresos de donantes y los pagos a constructores se auditan mediante la publicación íntegra de los extractos bancarios.',
    auditedDocsCount: (count) => `${count} Documentos Publicados`,
    downloadDoc: 'Descargar Documento',
    noStatementsYet: 'Aún no hay extractos publicados para este proyecto.',
    statementsPeriodic: 'Los extractos se publican periódicamente tras la emisión oficial por parte del banco.',

    donorLedgerTitle: 'Libro de Donantes y Cotejos Contables',
    donationsCount: (count) => `${count} donaciones registradas`,
    auditedBadge: 'Verificado banco',
    pendingBadge: 'Pendiente extracto',
    noDonationsYet: 'No hay donaciones registradas aún en el libro contable.',
    donationsAuditNote: 'Las transferencias con concepto dedicado son verificadas e incorporadas manualmente por la administración.',

    footerStatutory: 'New World State • Transparencia Bancaria Estatutaria',
    closeWindow: 'Cerrar Ventana',
  },

  // 5. PORTUGUÊS (PT)
  pt: {
    pageBadge: 'New World State • Obras Humanitárias Cívicas',
    heroTitle: 'Obras Comunitárias e Campanhas de Doação',
    heroSubtitle: 'com Prestação de Contas Bancárias 100% Auditada',
    heroDescription: 'Construímos juntos o bem comum tangível: poços de água potável solares em vilas da África Subsaariana, postos médicos rurais para mães e bebês, escolas conectadas e reflorestamento. Todas as doações são efetuadas por transferência direta para a conta bancária da associação e comprovadas ao centavo com extratos bancários oficiais publicados periodicamente.',
    pillarBank: 'Conta Bancária Dedicada',
    pillarStatements: 'Extratos Bancários em PDF para Download',
    pillarTransparency: 'Controle Cívico e Transparência 100%',

    fundsRaised: 'Fundos Arrecadados',
    fundsGoal: (target) => `de € ${target} meta global`,
    directBeneficiaries: 'Beneficiários Diretos',
    beneficiariesSub: 'Pessoas e famílias com acesso seguro a água e saúde',
    auditedStatements: 'Extratos Bancários Publicados',
    auditedStatementsSub: 'Documentos contábeis e notas fiscais públicas',
    civicGuarantee: 'Garantia Cívica',
    civicGuaranteeSub: '100% dos fundos destinados diretamente às obras',

    searchPlaceholder: 'Pesquisar obras por nome, país ou palavra-chave...',
    activeProjectsCount: (count) => `${count} obras e campanhas ativas`,
    categoryAll: 'Todas as Obras',
    categoryWater: 'Poços de Água (África)',
    categoryHealth: 'Saúde e Postos Rurais',
    categoryEducation: 'Escolas e Conectividade',
    categoryEcology: 'Reflorestamento e Agroecologia',
    categoryHumanitarian: 'Ajuda Humanitária e Emergências',
    categoryCivic: 'Infraestrutura Comunitária',

    raised: 'Arrecadado',
    target: 'Meta',
    funded: 'concluído',
    beneficiaries: 'beneficiários',
    statementsCount: (count) => `${count} Extratos bancários publicados`,
    detailsButton: 'Detalhes, Dados Bancários e Auditoria',

    emptyTitle: 'Nenhuma obra encontrada para os filtros selecionados',
    emptyDesc: 'Tente selecionar outra categoria ou limpar a busca.',
    showAllBtn: 'Exibir todas as obras',

    closeAria: 'Fechar janela',
    progressTitle: 'Andamento da Arrecadação',
    progressOfGoal: (target) => `de € ${target} meta final`,
    populationServed: 'População Atendida:',
    peopleCount: (count) => `${count} pessoas`,
    projectStartDate: 'Início da obra:',
    targetDeliveryDate: 'Conclusão prevista:',

    descriptionTitle: 'Descrição do Projeto e Impacto Social',
    executionSteps: 'Etapas Técnicas de Execução:',

    howToSupportTitle: 'Como Apoiar Esta Obra via Transferência Bancária',
    bankCoordsTitle: 'Dados Bancários Oficiais da Associação',
    reportPledgeBtn: 'Já fez a transferência? Avise-nos',
    closePledgeBtn: 'Fechar Notificação',
    beneficiaryName: 'Titular da Conta:',
    bankName: 'Instituição Bancária:',
    bicCode: 'Código BIC / SWIFT:',
    ibanCode: 'Código IBAN:',
    copy: 'Copiar',
    copied: 'Copiado!',
    mandatoryReason: 'Identificador / Descritivo Obrigatório:',
    copiedReason: 'Copiado!',
    reasonInstruction: 'Insira este descritivo exato na sua transferência para vincular sua doação diretamente à realização deste projeto.',
    sepaTransfer: 'Transferência Bancária SEPA / Internacional:',
    sepaTransferDesc: 'Faça a doação através do seu aplicativo de banco, internet banking ou agência física.',

    pledgeTitle: 'Notificação de Transferência Realizada',
    pledgeSubtitle: 'Auditoria contábil e livro de doadores',
    pledgeDesc: 'Fez a transferência bancária? Preencha os dados aqui para que o nosso setor contábil possa cruzar com o extrato bancário e emitir o seu recibo.',
    donorNameLabel: 'Nome do Doador (ou "Anônimo")',
    donorNamePlaceholder: 'ex. João Silva ou Anônimo',
    amountLabel: 'Valor Transferido (€)*',
    transferDateLabel: 'Data da Transferência',
    emailLabel: 'E-mail para Recibo (opcional)',
    croTrnLabel: 'Código CRO / TRN (opcional)',
    croTrnPlaceholder: 'Código da transação bancária',
    noteLabel: 'Mensagem ou Dedicatória Pública (opcional)',
    notePlaceholder: 'Deixe uma mensagem que será publicada no livro de doadores',
    cancel: 'Cancelar',
    submitting: 'Enviando registro...',
    submitNotice: 'Enviar Notificação de Doação',
    invalidAmount: 'Por favor, insira um valor válido em Euros (€).',

    auditTitle: 'Prestação de Contas e Extratos Bancários Oficiais',
    auditDesc: 'Todas as doações recebidas e os pagamentos a fornecedores são auditados com a publicação integral dos extratos bancários.',
    auditedDocsCount: (count) => `${count} Documentos Publicados`,
    downloadDoc: 'Baixar Documento',
    noStatementsYet: 'Nenhum extrato bancário publicado para este projeto ainda.',
    statementsPeriodic: 'Os extratos bancários são publicados periodicamente após emissão oficial pelo banco.',

    donorLedgerTitle: 'Livro de Doadores e Confrontação Contábil',
    donationsCount: (count) => `${count} doações registradas`,
    auditedBadge: 'Auditado c/c',
    pendingBadge: 'Aguardando extrato',
    noDonationsYet: 'Nenhuma doação registrada no livro contábil até o momento.',
    donationsAuditNote: 'As transferências com descritivo dedicado são auditadas e inseridas pela administração após verificação bancária.',

    footerStatutory: 'New World State • Transparência Bancária Estatutária',
    closeWindow: 'Fechar Janela',
  },

  // 6. RUSSIAN (RU)
  ru: {
    pageBadge: 'New World State • Гуманитарные общественные проекты',
    heroTitle: 'Общественные проекты и сбор средств',
    heroSubtitle: 'со 100% прозрачной банковской отчетностью',
    heroDescription: 'Вместе создаем осязаемое общее благо: солнечные скважины с чистой питьевой водой в деревнях Африки к югу от Сахары, сельские медицинские пункты для матерей и новорожденных, школы с интернетом и лесовосстановление. Все пожертвования перечисляются напрямую на официальный банковский счет ассоциации и подтверждаются до цента регулярной публикацией официальных выписок.',
    pillarBank: 'Специальный банковский счет',
    pillarStatements: 'Официальные банковские выписки PDF',
    pillarTransparency: 'Гражданский контроль и 100% прозрачность',

    fundsRaised: 'Собрано средств',
    fundsGoal: (target) => `из € ${target} общей цели`,
    directBeneficiaries: 'Прямые благополучатели',
    beneficiariesSub: 'Люди и семьи с доступом к воде и медицинской помощи',
    auditedStatements: 'Опубликовано банковских выписок',
    auditedStatementsSub: 'Доступные финансовые отчеты и счета',
    civicGuarantee: 'Институциональная гарантия',
    civicGuaranteeSub: '100% пожертвований направляется строго на проекты',

    searchPlaceholder: 'Поиск проекта по названию, стране или ключевому слову...',
    activeProjectsCount: (count) => `${count} действующих проектов и сборов`,
    categoryAll: 'Все проекты',
    categoryWater: 'Скважины с водой (Африка)',
    categoryHealth: 'Сельская медицина и клиники',
    categoryEducation: 'Школы и цифровое образование',
    categoryEcology: 'Лесовосстановление и агроэкология',
    categoryHumanitarian: 'Гуманитарная помощь и ЧС',
    categoryCivic: 'Общественная инфраструктура',

    raised: 'Собрано',
    target: 'Цель',
    funded: 'собрано',
    beneficiaries: 'получателей',
    statementsCount: (count) => `${count} Опубликованных выписок`,
    detailsButton: 'Реквизиты, подробности и аудит',

    emptyTitle: 'По выбранным критериям проекты не найдены',
    emptyDesc: 'Попробуйте выбрать другую категорию или очистить поисковую строку.',
    showAllBtn: 'Показать все проекты',

    closeAria: 'Закрыть окно',
    progressTitle: 'Ход сбора средств',
    progressOfGoal: (target) => `из € ${target} итоговой цели`,
    populationServed: 'Охват населения:',
    peopleCount: (count) => `${count} человек`,
    projectStartDate: 'Дата начала работ:',
    targetDeliveryDate: 'Планируемое завершение:',

    descriptionTitle: 'Описание проекта и социальный эффект',
    executionSteps: 'Этапы технической реализации:',

    howToSupportTitle: 'Как поддержать проект банковским переводом',
    bankCoordsTitle: 'Официальные банковские реквизиты ассоциации',
    reportPledgeBtn: 'Уже сделали перевод? Сообщите нам',
    closePledgeBtn: 'Закрыть форму',
    beneficiaryName: 'Получатель платежа:',
    bankName: 'Банк получателя:',
    bicCode: 'БИК / SWIFT код:',
    ibanCode: 'Номер IBAN:',
    copy: 'Копировать',
    copied: 'Скопировано!',
    mandatoryReason: 'Обязательное назначение платежа:',
    copiedReason: 'Скопировано!',
    reasonInstruction: 'Укажите именно это назначение платежа при переводе, чтобы целевые средства были юридически закреплены за данным проектом.',
    sepaTransfer: 'Перевод SEPA / Международный банковский перевод:',
    sepaTransferDesc: 'Сделайте перевод через ваше банковское приложение, онлайн-банк или в отделении банка.',

    pledgeTitle: 'Уведомление о совершенном пожертвовании',
    pledgeSubtitle: 'Бухгалтерский контроль и реестр доноров',
    pledgeDesc: 'Вы совершили перевод? Заполните эту форму, чтобы бухгалтерия смогла сопоставить платеж с банковской выпиской и направить вам квитанцию.',
    donorNameLabel: 'Имя благотворителя (или "Анонимно")',
    donorNamePlaceholder: 'например, Иван Иванов или Аноним',
    amountLabel: 'Сумма перевода (€)*',
    transferDateLabel: 'Дата перевода',
    emailLabel: 'Email для квитанции (необязательно)',
    croTrnLabel: 'Код транзакции / TRN (необязательно)',
    croTrnPlaceholder: 'Номер банковской проводки',
    noteLabel: 'Публичное пожелание или посвящение (необязательно)',
    notePlaceholder: 'Оставьте сообщение для книги благотворителей',
    cancel: 'Отмена',
    submitting: 'Отправка данных...',
    submitNotice: 'Отправить уведомление',
    invalidAmount: 'Пожалуйста, введите корректную сумму в Евро (€).',

    auditTitle: 'Официальные банковские выписки и аудит',
    auditDesc: 'Все поступившие пожертвования и расходы на подрядчиков подтверждаются публикацией сканов банковских выписок.',
    auditedDocsCount: (count) => `${count} Отчетных документов`,
    downloadDoc: 'Скачать документ',
    noStatementsYet: 'Для этого проекта выписки еще не публиковались.',
    statementsPeriodic: 'Финансовые документы публикуются регулярно по мере предоставления банком ежемесячных выписок.',

    donorLedgerTitle: 'Реестр благотворителей и подтвержденные переводы',
    donationsCount: (count) => `${count} зарегистрированных пожертвований`,
    auditedBadge: 'Сверено с банком',
    pendingBadge: 'Ожидает выписки',
    noDonationsYet: 'В бухгалтерской книге пока нет записанных пожертвований.',
    donationsAuditNote: 'Переводы с целевым назначением проверяются администрацией и вносятся после сверки с банковской выпиской.',

    footerStatutory: 'New World State • Уставная банковская прозрачность',
    closeWindow: 'Закрыть окно',
  },

  // 7. HINDI (HI)
  hi: {
    pageBadge: 'New World State • नागरिक मानवीय कार्य',
    heroTitle: 'सामुदायिक कार्य और पारदर्शी दान संचय',
    heroSubtitle: 'पूर्ण प्रमाणित बैंक स्टेटमेंट ऑडिट के साथ',
    heroDescription: 'आइए मिलकर मूर्त वैश्विक भलाई का निर्माण करें: उप-सहारा अफ्रीका के गांवों में सौर-ऊर्जा संचालित पेयजल कुएं, माताओं और शिशुओं के लिए ग्रामीण स्वास्थ्य क्लीनिक, डिजिटल स्कूल और वृक्षारोपण। सभी दान सीधे संस्था के आधिकारिक बैंक खाते में जमा होते हैं और आवधिक बैंक स्टेटमेंट जारी कर पाई-पाई का हिसाब सार्वजनिक किया जाता है।',
    pillarBank: 'समर्पित आधिकारिक बैंक खाता',
    pillarStatements: 'डाउनलोड करने योग्य PDF बैंक विवरण',
    pillarTransparency: 'नागरिक निगरानी और 100% पारदर्शिता',

    fundsRaised: 'एकत्रित राशि',
    fundsGoal: (target) => `कुल लक्ष्य € ${target} में से`,
    directBeneficiaries: 'प्रत्यक्ष लाभार्थी',
    beneficiariesSub: 'पानी और स्वास्थ्य सेवा तक प्रमाणित पहुंच वाले परिवार',
    auditedStatements: 'प्रकाशित बैंक स्टेटमेंट',
    auditedStatementsSub: 'सार्वजनिक ऑडिट दस्तावेज और बिल',
    civicGuarantee: 'नागरिक गारंटी',
    civicGuaranteeSub: '100% दान राशि सीधे परियोजनाओं में प्रयुक्त',

    searchPlaceholder: 'परियोजना, देश या कीवर्ड से खोजें...',
    activeProjectsCount: (count) => `${count} सक्रिय कार्य और संचय`,
    categoryAll: 'सभी कार्य',
    categoryWater: 'पेयजल कुएं (अफ्रीका)',
    categoryHealth: 'ग्रामीण स्वास्थ्य और क्लीनिक',
    categoryEducation: 'स्कूल और कनेक्टिविटी',
    categoryEcology: 'पुनर्वनीकरण और कृषि-पारिस्थितिकी',
    categoryHumanitarian: 'मानवीय सहायता और आपातकाल',
    categoryCivic: 'सामुदायिक अवसंरचना',

    raised: 'एकत्रित',
    target: 'लक्ष्य',
    funded: 'पूर्ण',
    beneficiaries: 'लाभार्थी',
    statementsCount: (count) => `${count} बैंक विवरण प्रकाशित`,
    detailsButton: 'विवरण, बैंक विवरण और ऑडिट',

    emptyTitle: 'चयनित मानदंडों के लिए कोई परियोजना नहीं मिली',
    emptyDesc: 'कृपया कोई अन्य श्रेणी चुनें या खोज बार साफ करें।',
    showAllBtn: 'सभी परियोजनाएं देखें',

    closeAria: 'विंडो बंद करें',
    progressTitle: 'संग्रहण की प्रगति',
    progressOfGoal: (target) => `अंतिम लक्ष्य € ${target} में से`,
    populationServed: 'लाभान्वित आबादी:',
    peopleCount: (count) => `${count} लोग`,
    projectStartDate: 'कार्य प्रारंभ तिथि:',
    targetDeliveryDate: 'अपेक्षित पूर्णता तिथि:',

    descriptionTitle: 'परियोजना विवरण और सामुदायिक प्रभाव',
    executionSteps: 'तकनीकी कार्यान्वयन के चरण:',

    howToSupportTitle: 'बैंक ट्रांसफर द्वारा इस कार्य का समर्थन कैसे करें',
    bankCoordsTitle: 'संस्था का आधिकारिक बैंक खाता विवरण',
    reportPledgeBtn: 'क्या आपने बैंक ट्रांसफर किया है? सूचित करें',
    closePledgeBtn: 'सूचना फॉर्म बंद करें',
    beneficiaryName: 'खाताधारक का नाम:',
    bankName: 'बैंक का नाम:',
    bicCode: 'BIC / SWIFT कोड:',
    ibanCode: 'IBAN कोड:',
    copy: 'कॉपी करें',
    copied: 'कॉपी हो गया!',
    mandatoryReason: 'अनिवार्य ट्रांसफर विवरण (Reason):',
    copiedReason: 'कॉपी हो गया!',
    reasonInstruction: 'अपने बैंक ट्रांसफर में यह सटीक विवरण दर्ज करें ताकि आपका दान विशेष रूप से इसी परियोजना के लिए सुरक्षित रहे।',
    sepaTransfer: 'SEPA / साधारण बैंक ट्रांसफर:',
    sepaTransferDesc: 'अपने बैंकिंग ऐप, ऑनलाइन बैंकिंग या बैंक शाखा से सीधे ट्रांसफर करें।',

    pledgeTitle: 'बैंक ट्रांसफर की सूचना दर्ज करें',
    pledgeSubtitle: 'लेखा परीक्षण और सार्वजनिक दानकर्ता बहीखाता',
    pledgeDesc: 'क्या आपने बैंक ट्रांसफर पूरा कर लिया है? यहां विवरण दर्ज करें ताकि हमारी लेखा टीम बैंक स्टेटमेंट से इसका मिलान कर रसीद जारी कर सके।',
    donorNameLabel: 'दानकर्ता का नाम (या "अनाम")',
    donorNamePlaceholder: 'उदा. रमेश कुमार या अनाम',
    amountLabel: 'अंतरित राशि (€)*',
    transferDateLabel: 'ट्रांसफर की तिथि',
    emailLabel: 'रसीद के लिए ईमेल (वैकल्पिक)',
    croTrnLabel: 'CRO / TRN / संदर्भ संख्या (वैकल्पिक)',
    croTrnPlaceholder: 'बैंक लेनदेन पहचान कोड',
    noteLabel: 'सार्वजनिक संदेश या समर्पण (वैकल्पिक)',
    notePlaceholder: 'दानकर्ता सूची में प्रदर्शित होने वाला संदेश लिखें',
    cancel: 'रद्द करें',
    submitting: 'दर्ज किया जा रहा है...',
    submitNotice: 'दान सूचना भेजें',
    invalidAmount: 'कृपया यूरो (€) में एक मान्य राशि दर्ज करें।',

    auditTitle: 'आधिकारिक बैंक विवरण और लेखा परीक्षण रिपोर्ट',
    auditDesc: 'सभी प्राप्त दान और सामग्री/निर्माण व्यय बैंक स्टेटमेंट की प्रतिलिपि जारी कर प्रमाणित किए जाते हैं।',
    auditedDocsCount: (count) => `${count} प्रमाणित दस्तावेज प्रकाशित`,
    downloadDoc: 'दस्तावेज डाउनलोड करें',
    noStatementsYet: 'इस परियोजना के लिए अभी कोई बैंक स्टेटमेंट अपलोड नहीं हुआ है।',
    statementsPeriodic: 'बैंक से मासिक/त्रैमासिक स्टेटमेंट प्राप्त होते ही दस्तावेज अपलोड किए जाते हैं।',

    donorLedgerTitle: 'दानकर्ता रजिस्टर और बैंक सत्यापन',
    donationsCount: (count) => `${count} पंजीकृत दान`,
    auditedBadge: 'बैंक द्वारा सत्यापित',
    pendingBadge: 'स्टेटमेंट प्रतीक्षारत',
    noDonationsYet: 'बहीखाते में अभी कोई दान दर्ज नहीं है।',
    donationsAuditNote: 'समर्पित कारण के साथ आए बैंक ट्रांसफर का मिलान कर प्रशासन द्वारा मैन्युअल सत्यापन किया जाता है।',

    footerStatutory: 'New World State • वैधानिक बैंक वित्तीय पारदर्शिता',
    closeWindow: 'विंडो बंद करें',
  },

  // 8. BENGALI (BN)
  bn: {
    pageBadge: 'New World State • নাগরিক মানবিক উন্নয়ন প্রকল্প',
    heroTitle: 'কমিউনিটি প্রকল্প এবং স্বচ্ছ তহবিল সংগ্রহ',
    heroSubtitle: 'শতভাগ ব্যাংক স্টেটমেন্ট অডিট এবং জবাবদিহিতা সহ',
    heroDescription: 'আসুন একসাথে দৃশ্যমান বৈশ্বিক কল্যাণে অংশ নিই: সাব-সাহারান আফ্রিকায় সৌরবিদ্যুৎ চালিত সুপেয় পানির কূপ, গ্রামীণ মা ও শিশু স্বাস্থ্যকেন্দ্র, ইন্টারনেট সুবিধাযুক্ত স্কুল এবং বনায়ন। প্রতিটি অনুদান সরাসরি সংগঠনের ব্যাংক অ্যাকাউন্টে জমা হয় এবং নিয়মিত অফিসিয়াল ব্যাংক স্টেটমেন্ট প্রকাশ করে শতভাগ স্বচ্ছতার সাথে অডিট করা হয়।',
    pillarBank: 'নির্ধারিত অফিশিয়াল ব্যাংক একাউন্ট',
    pillarStatements: 'ডাউনলোডযোগ্য PDF ব্যাংক স্টেটমেন্ট',
    pillarTransparency: 'নাগরিক তদারকি এবং ১০০% স্বচ্ছতা',

    fundsRaised: 'সংগৃহীত তহবিল',
    fundsGoal: (target) => `সর্বমোট € ${target} লক্ষ্যমাত্রার মধ্যে`,
    directBeneficiaries: 'সরাসরি উপকৃত জনসংখ্যা',
    beneficiariesSub: 'পানি ও চিকিৎসাসেবায় নিশ্চিত প্রবেশাধিকারপ্রাপ্ত পরিবার',
    auditedStatements: 'প্রকাশিত ব্যাংক স্টেটমেন্ট',
    auditedStatementsSub: 'সার্বজনীনভাবে উন্মুক্ত আর্থিক নথি ও বিল',
    civicGuarantee: 'নাগরিক গ্যারান্টি',
    civicGuaranteeSub: '১০০% অনুদান সরাসরি প্রকল্পের কাজে নিয়োজিত',

    searchPlaceholder: 'প্রকল্পের নাম, দেশ বা কিওয়ার্ড দিয়ে খুঁজুন...',
    activeProjectsCount: (count) => `${count} টি প্রকল্প ও ক্যাম্পেইন চলমান`,
    categoryAll: 'সকল প্রকল্প',
    categoryWater: 'পানির কূপ (আফ্রিকা)',
    categoryHealth: 'গ্রামীণ স্বাস্থ্য ও ক্লিনিক',
    categoryEducation: 'বিদ্যালয় ও তথ্যপ্রযুক্তি',
    categoryEcology: 'বনায়ন ও কৃষি-বাস্তুবিদ্যা',
    categoryHumanitarian: 'জরুরি মানবিক সহায়তা',
    categoryCivic: 'নাগরিক অবকাঠামো',

    raised: 'উত্তোলিত',
    target: 'লক্ষ্যমাত্রা',
    funded: 'সম্পন্ন',
    beneficiaries: 'উপকৃত মানুষ',
    statementsCount: (count) => `${count} টি ব্যাংক স্টেটমেন্ট প্রকাশিত`,
    detailsButton: 'বিস্তারিত, ব্যাংক তথ্য ও অডিট রিপোর্ট',

    emptyTitle: 'কোনো প্রকল্প খুঁজে পাওয়া যায়নি',
    emptyDesc: 'অন্য কোনো ক্যাটাগরি বেছে নিন অথবা অনুসন্ধান ফিল্টার পরিবর্তন করুন।',
    showAllBtn: 'সবগুলো প্রকল্প প্রদর্শন করুন',

    closeAria: 'উইন্ডো বন্ধ করুন',
    progressTitle: 'তহবিল সংগ্রহের অগ্রগতি',
    progressOfGoal: (target) => `চূড়ান্ত লক্ষ্যমাত্রা € ${target} এর মধ্যে`,
    populationServed: 'উপকৃত জনগোষ্ঠী:',
    peopleCount: (count) => `${count} জন`,
    projectStartDate: 'কাজের শুরুর তারিখ:',
    targetDeliveryDate: 'সমাপ্তির সম্ভাব্য তারিখ:',

    descriptionTitle: 'প্রকল্পের বিবরণ ও সামাজিক প্রভাব',
    executionSteps: 'বাস্তবায়নের কারিগরি ধাপসমূহ:',

    howToSupportTitle: 'ব্যাংক ট্রান্সফারের মাধ্যমে কীভাবে সহায়তা করবেন',
    bankCoordsTitle: 'সংগঠনের অফিশিয়াল ব্যাংক একাউন্ট তথ্য',
    reportPledgeBtn: 'ট্রান্সফার সম্পন্ন করেছেন? অবহিত করুন',
    closePledgeBtn: 'ফরমটি বন্ধ করুন',
    beneficiaryName: 'হিসাবধারীর নাম:',
    bankName: 'ব্যাংকের নাম:',
    bicCode: 'BIC / SWIFT কোড:',
    ibanCode: 'IBAN নম্বর:',
    copy: 'কপি করুন',
    copied: 'কপি হয়েছে!',
    mandatoryReason: 'বাধ্যতামূলক ট্রান্সফার কারণ (Reference):',
    copiedReason: 'কপি হয়েছে!',
    reasonInstruction: 'আপনার ব্যাংক ট্রান্সফারে এই নির্দিষ্ট কারণটি উল্লেখ করুন যাতে অনুদানটি আইনগতভাবে এই প্রকল্পের জন্যই বরাদ্দ থাকে।',
    sepaTransfer: 'SEPA / সাধারণ ব্যাংক ট্রান্সফার:',
    sepaTransferDesc: 'আপনার মোবাইল ব্যাংকিং অ্যাপ, অনলাইন ব্যাংক অথবা শাখা থেকে সরাসরি পাঠান।',

    pledgeTitle: 'ব্যাংক ট্রান্সফারের তথ্য প্রদান',
    pledgeSubtitle: 'হিসাব নিরীক্ষা ও সার্বজনীন দাতা তালিকা',
    pledgeDesc: 'আপনি কি ব্যাংক ট্রান্সফার করেছেন? এই সংক্ষিপ্ত ফরমটি পূরণ করুন যাতে আমাদের হিসাব বিভাগ ব্যাংক স্টেটমেন্টের সাথে মিলিয়ে আপনার রসিদ পাঠাতে পারে।',
    donorNameLabel: 'দাতার নাম (অথবা "বেনামী")',
    donorNamePlaceholder: 'যেমন: মো: করিম অথবা বেনামী',
    amountLabel: 'প্রেরিত অর্থ (€)*',
    transferDateLabel: 'ট্রান্সফারের তারিখ',
    emailLabel: 'রসিদ পাওয়ার ইমেইল (ঐচ্ছিক)',
    croTrnLabel: 'CRO / TRN ট্রানজেকশন কোড (ঐচ্ছিক)',
    croTrnPlaceholder: 'ব্যাংক লেনদেনের রেফারেন্স কোড',
    noteLabel: 'বার্তা অথবা উৎসর্গ (ঐচ্ছিক)',
    notePlaceholder: 'দাতাদের খাতায় প্রদর্শিত হওয়ার জন্য একটি বার্তা লিখুন',
    cancel: 'বাতিল',
    submitting: 'সংরক্ষণ করা হচ্ছে...',
    submitNotice: 'অনুদান তথ্য জমা দিন',
    invalidAmount: 'দয়া করে ইউরো (€) মুদ্রায় সঠিক পরিমাণ লিখুন।',

    auditTitle: 'অফিশিয়াল ব্যাংক স্টেটমেন্ট এবং নিরীক্ষা প্রতিবেদন',
    auditDesc: 'সকল প্রাপ্ত অনুদান এবং নির্মাণ ব্যয়ের প্রতিটি হিসাব ডাউনলোডযোগ্য ব্যাংক স্টেটমেন্টের মাধ্যমে জনসমক্ষে প্রকাশিত হয়।',
    auditedDocsCount: (count) => `${count} টি নিরীক্ষিত নথি প্রকাশিত`,
    downloadDoc: 'নথি ডাউনলোড করুন',
    noStatementsYet: 'এই প্রকল্পের জন্য এখনও কোনো ব্যাংক স্টেটমেন্ট প্রকাশ করা হয়নি।',
    statementsPeriodic: 'ব্যাংক কর্তৃক ত্রৈমাসিক বা মাসিক স্টেটমেন্ট জারির সাথে সাথেই তা প্রকাশ করা হয়।',

    donorLedgerTitle: 'দাতাদের তালিকা ও ব্যাংক স্বীকৃতি',
    donationsCount: (count) => `${count} টি অনুদান লিপিবদ্ধ`,
    auditedBadge: 'ব্যাংকে যাচাইকৃত',
    pendingBadge: 'স্টেটমেন্টের অপেক্ষায়',
    noDonationsYet: 'হিসাব বইয়ে এখনও কোনো অনুদান যুক্ত হয়নি।',
    donationsAuditNote: 'নির্দিষ্ট রেফারেন্স সহ আসা ট্রান্সফারগুলো ব্যাংক যাচাইয়ের পর প্রশাসন কর্তৃক হাতে-কলমে লিপিবদ্ধ করা হয়।',

    footerStatutory: 'New World State • বিধিবদ্ধ ব্যাংক স্বচ্ছতা',
    closeWindow: 'উইন্ডো বন্ধ করুন',
  },

  // 9. CHINESE (ZH)
  zh: {
    pageBadge: 'New World State • 公民人道主义善行工程',
    heroTitle: '社区公用工程与透明募捐',
    heroSubtitle: '附百分之百经官方银行对账单审计报告',
    heroDescription: '让我们共同建设切实可见的人类公共福祉：在撒哈拉以南非洲乡村建设太阳能饮用水水井、为母婴建立乡村太阳能疫苗诊所、连接网络学校与生态再造林。所有善款均通过直接汇入协会官方银行账户收集，并通过定期公开发布官方银行流水对账单，对每分钱做到毫厘不差的公开核算。',
    pillarBank: '专属官方银行账户',
    pillarStatements: '可供下载核查的银行对账单PDF',
    pillarTransparency: '全民监督与100%完全透明',

    fundsRaised: '已筹集资金',
    fundsGoal: (target) => `目标总额 € ${target}`,
    directBeneficiaries: '直接受益人群',
    beneficiariesSub: '获得经核验的安全水源与医疗服务人口',
    auditedStatements: '已公布银行对账单',
    auditedStatementsSub: '完全公开透明的会计凭证与发票',
    civicGuarantee: '制度性保障',
    civicGuaranteeSub: '善款100%全额专门用于工程实施',

    searchPlaceholder: '输入工程名称、国家或关键词搜索...',
    activeProjectsCount: (count) => `${count} 个正在进行的工程与募捐`,
    categoryAll: '所有工程',
    categoryWater: '饮用水水井 (非洲)',
    categoryHealth: '乡村医疗与诊所',
    categoryEducation: '学校与网络教育',
    categoryEcology: '再造林与生态农业',
    categoryHumanitarian: '人道救助与应急援助',
    categoryCivic: '社区公共基础设施',

    raised: '已筹款',
    target: '目标',
    funded: '已达成',
    beneficiaries: '受益人',
    statementsCount: (count) => `已公示 ${count} 份银行对账单`,
    detailsButton: '详情、银行账户与审计报告',

    emptyTitle: '未找到符合所选条件的工程',
    emptyDesc: '请尝试切换其他分类或清空搜索栏内容。',
    showAllBtn: '查看所有工程',

    closeAria: '关闭窗口',
    progressTitle: '募捐筹款进展',
    progressOfGoal: (target) => `最终目标 € ${target}`,
    populationServed: '服务惠及人口：',
    peopleCount: (count) => `${count} 人`,
    projectStartDate: '工程启动日期：',
    targetDeliveryDate: '预计完工交付：',

    descriptionTitle: '工程详细介绍与社区长远成效',
    executionSteps: '工程技术实施阶段：',

    howToSupportTitle: '如何通过银行转账汇款支持该工程',
    bankCoordsTitle: '协会官方银行受捐账户详细信息',
    reportPledgeBtn: '已经完成转账汇款？立即报备',
    closePledgeBtn: '收起汇款报备',
    beneficiaryName: '账户所有人：',
    bankName: '开户银行名称：',
    bicCode: 'BIC / SWIFT 代码：',
    ibanCode: 'IBAN 国际银行账号：',
    copy: '复制',
    copied: '已复制！',
    mandatoryReason: '该工程专属汇款附言/备注（必填）：',
    copiedReason: '已复制！',
    reasonInstruction: '请在银行转账时务必在备注或附言栏中完整填入该代码，以在法律上确保资金专门定向用于该工程建设。',
    sepaTransfer: 'SEPA / 国际银行电汇：',
    sepaTransferDesc: '您可以通过您的个人手机银行App、网上银行或线下银行网点直接办理转账。',

    pledgeTitle: '已转账善款登记申报',
    pledgeSubtitle: '财务对账与公开爱心芳名录',
    pledgeDesc: '您是否已完成银行汇款？请在此填写您的捐赠信息，以便我们的会计部门在收到下期银行对账单时及时核对并开具正式捐赠收据。',
    donorNameLabel: '捐赠人姓名（或填写"匿名"）',
    donorNamePlaceholder: '例如：张三 或 匿名爱心人士',
    amountLabel: '转账金额 (€)*',
    transferDateLabel: '转账日期',
    emailLabel: '用于接收收据的电子邮箱（选填）',
    croTrnLabel: '银行转账流水号 / TRN（选填）',
    croTrnPlaceholder: '银行汇款回执编号',
    noteLabel: '寄语或公开留言（选填）',
    notePlaceholder: '留下您的祝福，将展示在捐款者名录中',
    cancel: '取消',
    submitting: '正在提交申报...',
    submitNotice: '提交转账报备',
    invalidAmount: '请输入有效的欧元 (€) 金额。',

    auditTitle: '官方银行对账单公示与审计文档',
    auditDesc: '所有善款入账与工程供应商支出均通过定期公开发布的银行流水对账单进行完全公开透明的审计核验。',
    auditedDocsCount: (count) => `已公开发布 ${count} 份会计文档`,
    downloadDoc: '下载核验文档',
    noStatementsYet: '该工程尚未上传银行对账单。',
    statementsPeriodic: '当银行按月度或季度寄出纸质及电子对账单后，工作人员将在此及时发布公示。',

    donorLedgerTitle: '爱心捐款芳名录与银行核销台账',
    donationsCount: (count) => `已录入 ${count} 笔爱心捐款`,
    auditedBadge: '已核验对账单',
    pendingBadge: '待核对对账单',
    noDonationsYet: '账簿中目前尚未记录善款条目。',
    donationsAuditNote: '附带指定汇款附言的资金在收到银行入账核实后，由管理团队核销录入。',

    footerStatutory: 'New World State • 法定银行透明度体系',
    closeWindow: '关闭窗口',
  },

  // 10. JAPANESE (JA)
  ja: {
    pageBadge: 'New World State • 市民人道支援プロジェクト',
    heroTitle: '地域事業・透明な募金活動',
    heroSubtitle: '公式銀行取引明細書による完全公開監査',
    heroDescription: '目に見える世界の共通善を共に築きましょう。サブサハラ・アフリカの村々における太陽光発電井戸の掘削、母子のための遠隔地診療所、ネット接続スクール、森林再生。すべての寄付は当団体の公式銀行口座に直接送金され、定期的に公開される公式銀行取引明細書によって1セント単位まで完全に監査・公表されます。',
    pillarBank: '専用の公式銀行口座',
    pillarStatements: 'PDFダウンロード可能な銀行取引明細書',
    pillarTransparency: '市民による監視と100%の透明性',

    fundsRaised: '集まった寄付金',
    fundsGoal: (target) => `全体目標 € ${target} 中`,
    directBeneficiaries: '直接の受益者数',
    beneficiariesSub: '安全な水や医療へのアクセスが確立された人々・家族',
    auditedStatements: '公開済みの銀行明細書',
    auditedStatementsSub: '閲覧可能な公式会計帳簿・領収書',
    civicGuarantee: '制度的保証',
    civicGuaranteeSub: '寄付金は100%プロジェクト建設に直接充当',

    searchPlaceholder: 'プロジェクト名、国、キーワードで検索...',
    activeProjectsCount: (count) => `${count} 件のプロジェクトと募金が進行中`,
    categoryAll: 'すべての事業',
    categoryWater: '飲料水井戸（アフリカ）',
    categoryHealth: '地方医療・診療所',
    categoryEducation: '学校・教育インフラ',
    categoryEcology: '森林再生・アグロエコロジー',
    categoryHumanitarian: '人道支援・緊急援助',
    categoryCivic: '市民コミュニティ基盤',

    raised: '調達額',
    target: '目標額',
    funded: '達成',
    beneficiaries: '受益者',
    statementsCount: (count) => `${count} 件の公式銀行明細書を公開中`,
    detailsButton: '詳細・口座情報・会計監査',

    emptyTitle: '条件に一致するプロジェクトが見つかりません',
    emptyDesc: '他のカテゴリーを選択するか、検索キーワードを変更してください。',
    showAllBtn: 'すべてのプロジェクトを表示',

    closeAria: 'ウィンドウを閉じる',
    progressTitle: '募金の進捗状況',
    progressOfGoal: (target) => `最終目標 € ${target} 中`,
    populationServed: '恩恵を受ける地域住民：',
    peopleCount: (count) => `${count} 人`,
    projectStartDate: '工事着工日：',
    targetDeliveryDate: '完成予定期日：',

    descriptionTitle: '事業の概要と地域社会への影響',
    executionSteps: '技術的実施フェーズ：',

    howToSupportTitle: '銀行振込によるこの事業への支援方法',
    bankCoordsTitle: '当協会の公式受取銀行口座情報',
    reportPledgeBtn: 'すでにお振込み済みですか？こちらから報告',
    closePledgeBtn: 'フォームを閉じる',
    beneficiaryName: '口座名義人：',
    bankName: '取扱金融機関：',
    bicCode: 'BIC / SWIFT コード：',
    ibanCode: 'IBAN コード：',
    copy: 'コピー',
    copied: 'コピー完了！',
    mandatoryReason: 'この事業専用の必須振込名義・通信欄コード：',
    copiedReason: 'コピー完了！',
    reasonInstruction: 'お振込みの際、通信欄にこのコードを正確にご入力いただくことで、寄付金が確実に本事業に紐付けられます。',
    sepaTransfer: 'SEPA / 一般銀行振込：',
    sepaTransferDesc: '普段お使いの銀行アプリ、インターネットバンキング、窓口から安全にお振込みいただけます。',

    pledgeTitle: '銀行振込完了のご報告',
    pledgeSubtitle: '会計照合および支援者名簿',
    pledgeDesc: 'お振込みを完了されましたか？こちらのフォームにご入力いただくと、会計担当者が次回銀行明細書と照合し、速やかに受領書を発行いたします。',
    donorNameLabel: 'ご芳名（または「匿名」）',
    donorNamePlaceholder: '例：山田 太郎 または 匿名希望',
    amountLabel: '振込金額 (€)*',
    transferDateLabel: '振込実施日',
    emailLabel: '受領証送付先メールアドレス（任意）',
    croTrnLabel: '振込照会番号 / TRN（任意）',
    croTrnPlaceholder: '銀行発行の取引番号',
    noteLabel: '公開メッセージまたは応援コメント（任意）',
    notePlaceholder: '支援者名簿に掲載されるメッセージをご記入ください',
    cancel: 'キャンセル',
    submitting: '送信中...',
    submitNotice: '振込報告を送信する',
    invalidAmount: 'ユーロ（€）で有効な金額を入力してください。',

    auditTitle: '公式銀行取引明細書および監査レポート',
    auditDesc: 'すべての寄付金の受入れと施工業者への支出は、銀行取引明細書のPDF公開を通じて透明に監査されています。',
    auditedDocsCount: (count) => `${count} 件の会計書類を公開中`,
    downloadDoc: '書類をダウンロード',
    noStatementsYet: 'このプロジェクトにはまだ銀行明細書が登録されていません。',
    statementsPeriodic: '銀行から月次または四半期ごとの明細書が発行され次第、順次公開されます。',

    donorLedgerTitle: '支援者名簿および入金照合台帳',
    donationsCount: (count) => `${count} 件の寄付が記帳済み`,
    auditedBadge: '銀行照合済',
    pendingBadge: '明細照合中',
    noDonationsYet: '台帳に登録された寄付はまだありません。',
    donationsAuditNote: '指定通信欄を付けて送金された寄付金は、銀行照合を経て事務局により台帳へ登録されます。',

    footerStatutory: 'New World State • 定款に基づく銀行財務の完全透明性',
    closeWindow: 'ウィンドウを閉じる',
  },

  // 11. ARABIC (AR)
  ar: {
    pageBadge: 'New World State • المشاريع الإنسانية والمدنية',
    heroTitle: 'المشاريع المجتمعية وحملات جمع التبرعات',
    heroSubtitle: 'مع شفافية مصرفية كاملة وكشوف حسابات رسمية',
    heroDescription: 'نبني معاً الصالح العام الملموس: آبار مياه الشرب بالطاقة الشمسية في قرى إفريقيا جنوب الصحراء، والمراكز الطبية الريفية للأمهات والأطفال، والمدارس المتصلة بالإنترنت، وإعادة التشجير. تتم جميع التبرعات عن طريق التحويل المباشر إلى الحساب المصرفي الرسمي للجمعية وتخضع للتدقيق والمساءلة حتى آخر سنت من خلال النشر الدوري لكشوف الحسابات المصرفية الرسمية.',
    pillarBank: 'حساب مصرفي رسمي مخصص',
    pillarStatements: 'كشوف حسابات مصرفية PDF قابلة للتحميل',
    pillarTransparency: 'رقابة مدنية وشفافية بنسبة 100%',

    fundsRaised: 'الأموال المجمعة',
    fundsGoal: (target) => `من إجمالي الهدف € ${target}`,
    directBeneficiaries: 'المستفيدون المباشرون',
    beneficiariesSub: 'أفراد وعائلات لديهم وصول موثق للمياه والرعاية الصحية',
    auditedStatements: 'كشوف الحسابات المنشورة',
    auditedStatementsSub: 'وثائق ومستندات محاسبية وفواتير متاحة للجميع',
    civicGuarantee: 'ضمانة مؤسسية ومدنية',
    civicGuaranteeSub: '100% من أموال التبرعات مخصصة حصرياً للمشاريع',

    searchPlaceholder: 'ابحث عن مشروع بالاسم أو الدولة أو الكلمة المفتاحية...',
    activeProjectsCount: (count) => `${count} من المشاريع والحملات النشطة`,
    categoryAll: 'جميع المشاريع',
    categoryWater: 'آبار المياه (إفريقيا)',
    categoryHealth: 'الصحة والعيادات الريفية',
    categoryEducation: 'المدارس والتعليم الرقمي',
    categoryEcology: 'إعادة التشجير والبيئة',
    categoryHumanitarian: 'الإغاثة الإنسانية والطوارئ',
    categoryCivic: 'البنية التحتية المجتمعية',

    raised: 'تم جمع',
    target: 'الهدف',
    funded: 'مكتمل',
    beneficiaries: 'مستفيد',
    statementsCount: (count) => `تم نشر ${count} من كشوف الحسابات`,
    detailsButton: 'التفاصيل والبيانات المصرفية والتدقيق',

    emptyTitle: 'لم يتم العثور على مشاريع تطابق المعايير المحددة',
    emptyDesc: 'يرجى تجربة تصنيف آخر أو مسح شريط البحث.',
    showAllBtn: 'عرض جميع المشاريع',

    closeAria: 'إغلاق النافذة',
    progressTitle: 'تقدم جمع التبرعات',
    progressOfGoal: (target) => `من الهدف النهائي € ${target}`,
    populationServed: 'عدد السكان المستفيدين:',
    peopleCount: (count) => `${count} نسمة`,
    projectStartDate: 'تاريخ بدء العمل:',
    targetDeliveryDate: 'التاريخ المتوقع للإنجاز:',

    descriptionTitle: 'وصف المشروع والأثر المجتمعي المستدام',
    executionSteps: 'مراحل التنفيذ الفني والهندسي:',

    howToSupportTitle: 'كيفية دعم هذا المشروع عبر التحويل المصرفي',
    bankCoordsTitle: 'البيانات المصرفية الرسمية لحساب الجمعية',
    reportPledgeBtn: 'هل قمت بالتحويل المصرفي بالفعل؟ أبلغنا هنا',
    closePledgeBtn: 'إغلاق نموذج الإبلاغ',
    beneficiaryName: 'اسم صاحب الحساب:',
    bankName: 'اسم المصرف:',
    bicCode: 'رمز BIC / SWIFT:',
    ibanCode: 'رقم الحساب الدولي IBAN:',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    mandatoryReason: 'الغرض الإلزامي للتحويل (الكود المرجعي):',
    copiedReason: 'تم النسخ!',
    reasonInstruction: 'يرجى كتابة هذا الغرض بدقة في تحويلك المصرفي لربط تبرعك قانونياً بتنفيذ هذا المشروع بعينه.',
    sepaTransfer: 'تحويل مصرفي SEPA أو دولي:',
    sepaTransferDesc: 'يمكنك إجراء التحويل بسهولة عبر تطبيقك المصرفي المعتاد أو فرع البنك.',

    pledgeTitle: 'إشعار بإجراء تحويل مصرفي',
    pledgeSubtitle: 'المطابقة المحاسبية وسجل المتبرعين العام',
    pledgeDesc: 'هل قمت بإجراء التحويل المصرفي؟ يرجى إدخال بيانات التبرع هنا لتتمكن إدارتنا المالية من مطابقته مع كشف الحساب المصرفي القادم وإصدار الإيصال.',
    donorNameLabel: 'اسم المتبرع (أو "فاعل خير / مجهول")',
    donorNamePlaceholder: 'مثال: محمد أحمد أو فاعل خير',
    amountLabel: 'المبلغ المحول باليورو (€)*',
    transferDateLabel: 'تاريخ التحويل',
    emailLabel: 'البريد الإلكتروني لاستلام الإيصال (اختياري)',
    croTrnLabel: 'رقم التحويل المرجعي / CRO / TRN (اختياري)',
    croTrnPlaceholder: 'الرمز المحاسبي للعملية المصرفية',
    noteLabel: 'رسالة أو إهداء عام (اختياري)',
    notePlaceholder: 'اكتب رسالة لتظهر في سجل المتبرعين العام',
    cancel: 'إلغاء',
    submitting: 'جارٍ تسجيل البيانات...',
    submitNotice: 'إرسال إشعار التبرع',
    invalidAmount: 'يرجى إدخال مبلغ صحيح باليورو (€).',

    auditTitle: 'كشوف الحسابات المصرفية الرسمية وتقارير التدقيق',
    auditDesc: 'تخضع جميع التبرعات الواردة ومصروفات الموردين للتدقيق الكامل من خلال النشر الشفاف لكشوف الحسابات المصرفية.',
    auditedDocsCount: (count) => `تم نشر ${count} وثيقة محاسبية`,
    downloadDoc: 'تحميل الوثيقة',
    noStatementsYet: 'لم يتم تحميل أي كشف حساب لهذا المشروع حتى الآن.',
    statementsPeriodic: 'يتم نشر الوثائق المحاسبية دورياً فور صدورها من البنك شهرياً أو فصلياً.',

    donorLedgerTitle: 'سجل المتبرعين والمطابقات المحاسبية',
    donationsCount: (count) => `${count} تبرع مسجل`,
    auditedBadge: 'تم التحقق بنكياً',
    pendingBadge: 'بانتظار كشف الحساب',
    noDonationsYet: 'لم يتم تسجيل أي تبرعات في الدفتر المحاسبي بعد.',
    donationsAuditNote: 'يتم تدقيق التحويلات الواردة ذات الغرض المخصص وإدراجها من قبل الإدارة بعد المطابقة المصرفية.',

    footerStatutory: 'New World State • الشفافية المصرفية القانونية',
    closeWindow: 'إغلاق النافذة',
  },
};

/**
 * Returns the localized translations object for CommunityProjectsPage
 */
export function useProjectsTranslation(lang: Language): ProjectsPageTranslations {
  return PROJECTS_PAGE_I18N[lang] || PROJECTS_PAGE_I18N['it'];
}

/**
 * Multilingual category labels for all 11 portal languages
 */
export const CATEGORY_LABELS_I18N: Record<ProjectCategory, Record<Language, string>> = {
  water_wells: {
    it: "Pozzi d'Acqua & Risorse Idriche",
    en: 'Water Wells & Clean Water',
    fr: "Puits d'Eau & Ressources Hydriques",
    es: 'Pozos de Agua y Recursos Hídricos',
    pt: 'Poços de Água e Recursos Hídricos',
    ru: 'Водные скважины и чистая вода',
    hi: 'पेयजल कुएं और जल संसाधन',
    bn: 'পানির কূপ ও বিশুদ্ধ জল সম্পদ',
    zh: '饮用水水井与水资源工程',
    ja: '飲料水井戸・水資源インフラ',
    ar: 'آبار المياه ومصادر المياه النظيفة',
  },
  health_clinics: {
    it: 'Salute & Presidi Medici Rurali',
    en: 'Health & Rural Medical Clinics',
    fr: 'Santé & Dispensaires Ruraux',
    es: 'Salud y Clínicas Médicas Rurales',
    pt: 'Saúde e Postos Médicos Rurais',
    ru: 'Здравоохранение и сельские клиники',
    hi: 'स्वास्थ्य और ग्रामीण चिकित्सा क्लीनिक',
    bn: 'স্বাস্থ্য ও গ্রামীণ চিকিৎসা কেন্দ্র',
    zh: '乡村医疗中心与公共卫生',
    ja: '地域医療・農村部クリニック',
    ar: 'الصحة والمراكز الطبية الريفية',
  },
  education: {
    it: 'Istruzione & Scuole Comunitarie',
    en: 'Education & Community Schools',
    fr: 'Éducation & Écoles Communautaires',
    es: 'Educación y Escuelas Comunitarias',
    pt: 'Educação e Escolas Comunitárias',
    ru: 'Образование и общественные школы',
    hi: 'शिक्षा और सामुदायिक विद्यालय',
    bn: 'শিক্ষা ও কমিউনিটি বিদ্যালয়',
    zh: '教育支持与社区希望学校',
    ja: '教育・地域コミュニティ学校',
    ar: 'التعليم والمدارس المجتمعية',
  },
  ecology: {
    it: 'Riforestazione & Agro-Ecologia',
    en: 'Reforestation & Agro-Ecology',
    fr: 'Reforestation & Agro-Écologie',
    es: 'Reforestación y Agroecología',
    pt: 'Reflorestamento e Agroecologia',
    ru: 'Лесовосстановление и агроэкология',
    hi: 'पुनर्वनीकरण और कृषि-पारिस्थितिकी',
    bn: 'বনায়ন ও কৃষি-বাস্তুসংস্থান',
    zh: '植树造林与生态可持续农业',
    ja: '森林再生・アグロエコロジー',
    ar: 'إعادة التشجير والزراعة البيئية',
  },
  humanitarian: {
    it: 'Soccorso Civico & Emergenze',
    en: 'Humanitarian Relief & Civic Aid',
    fr: 'Secours Humanitaire & Urgences',
    es: 'Socorro Cívico y Emergencias',
    pt: 'Socorro Cívico e Emergências',
    ru: 'Гуманитарная помощь и ЧС',
    hi: 'नागरिक सहायता और आपातकालीन राहत',
    bn: 'জরুরি মানবিক সহায়তা ও ত্রাণ',
    zh: '人道紧急救援与民事援助',
    ja: '人道支援・緊急市民救済',
    ar: 'الإغاثة الإنسانية والمساعدات الطارئة',
  },
  civic_infrastructure: {
    it: 'Infrastrutture Comunitarie',
    en: 'Civic Infrastructure',
    fr: 'Infrastructures Communautaires',
    es: 'Infraestructuras Comunitarias',
    pt: 'Infraestruturas Comunitárias',
    ru: 'Общественная инфраструктура',
    hi: 'सामुदायिक बुनियादी ढांचा',
    bn: 'কমিউনিটি অবকাঠামো উন্নয়ন',
    zh: '社区基础设施与民生保障',
    ja: '市民コミュニティ基盤整備',
    ar: 'البنية التحتية المجتمعية',
  },
};

/**
 * Multilingual project status labels for all 11 portal languages
 */
export const STATUS_LABELS_I18N: Record<ProjectStatus, Record<Language, string>> = {
  active: {
    it: 'Raccolta Fondi Attiva',
    en: 'Fundraiser Active',
    fr: 'Collecte Active',
    es: 'Recaudación Activa',
    pt: 'Campanha Ativa',
    ru: 'Сбор средств активен',
    hi: 'दान संग्रह सक्रिय',
    bn: 'তহবিল সংগ্রহ চলমান',
    zh: '筹款募集中',
    ja: '募金受付中',
    ar: 'جمع التبرعات نشط',
  },
  funded: {
    it: 'Obiettivo Raggiunto (Finanziato)',
    en: 'Target Reached (Funded)',
    fr: 'Objectif Atteint (Financé)',
    es: 'Meta Alcanzada (Financiado)',
    pt: 'Meta Atingida (Financiado)',
    ru: 'Цель достигнута (Профинансировано)',
    hi: 'लक्ष्य पूर्ण (वित्तपोषित)',
    bn: 'লক্ষ্যমাত্রা অর্জিত (অর্থায়িত)',
    zh: '目标已达成（全额筹毕）',
    ja: '目標達成（資金調達完了）',
    ar: 'تم الوصول للهدف (مُمَوَّل)',
  },
  in_progress: {
    it: 'Opere in Esecuzione',
    en: 'Works in Progress',
    fr: 'Travaux en Cours',
    es: 'Obras en Ejecución',
    pt: 'Obras em Execução',
    ru: 'Работы ведутся',
    hi: 'कार्य प्रगति पर है',
    bn: 'নির্মাণ কাজ চলমান',
    zh: '工程施工进行中',
    ja: '工事着工・進行中',
    ar: 'الأعمال قيد التنفيذ',
  },
  completed: {
    it: 'Opera Completata & Rendicontata',
    en: 'Completed & Fully Audited',
    fr: 'Projet Terminé & Justifié',
    es: 'Obra Completada y Auditada',
    pt: 'Obra Concluída e Auditada',
    ru: 'Завершено и проверено аудитом',
    hi: 'कार्य पूर्ण और ऑडिट संपन्न',
    bn: 'কাজ সম্পন্ন ও নিরীক্ষিত',
    zh: '工程竣工并完成最终审计',
    ja: '完工・監査完了',
    ar: 'تم الإنجاز والتدقيق المالي الكامل',
  },
};

/**
 * Localized content for the initial projects across all 11 languages
 */
export const INITIAL_PROJECTS_TRANSLATIONS: Record<string, Record<Language, {
  title: string;
  subtitle: string;
  location: string;
  description: string;
  detailedPlan: string;
  impactSummary: string;
}>> = {
  'proj-water-turkana-01': {
    it: {
      title: "Pozzi d'Acqua Potabile Solari in Africa Sub-Sahariana",
      subtitle: 'Costruzione di pozzi artesiani alimentati a energia solare per le comunità rurali',
      location: 'Regione del Turkana, Kenya (Africa Orientale)',
      description: "Realizzazione di un pozzo artesiano a profondità geologica con pompa sommersa a energia solare, cisterna di stoccaggio da 10.000 litri e 4 fontanelle pubbliche protette. Garantisce acqua pura e sicura per oltre 2.500 abitanti, eliminando malattie trasmesse dall'acqua stagnante e consentendo ai bambini di frequentare la scuola invece di percorrere chilometri per il rifornimento idrico.",
      detailedPlan: "Il progetto si articola in 4 fasi: 1) Rilievo idrogeologico e carotaggio del terreno; 2) Perforazione a 110 metri e tubaggio in acciaio inox alimentare; 3) Installazione dell'impianto fotovoltaico da 3.2 kW con inverter solare e pompa Grundfos; 4) Costruzione della torre piezometrica e delle fontanelle con abbeveratoio per animali.",
      impactSummary: '2.500 persone servite ogni giorno con acqua potabile certificata a costo zero e zero emissioni di CO2.',
    },
    en: {
      title: 'Solar Drinking Water Wells in Sub-Saharan Africa',
      subtitle: 'Construction of deep solar-powered artesian wells for remote rural villages',
      location: 'Turkana County, Kenya (East Africa)',
      description: 'Construction of a geological-depth artesian borehole equipped with a solar submersible pump, a 10,000-liter elevated storage tank, and 4 protected community tap stands. Provides pure, safe drinking water for over 2,500 villagers, eradicating waterborne diseases and freeing children to attend school instead of walking miles for water.',
      detailedPlan: 'The project spans 4 execution phases: 1) Hydrogeological survey and soil core drilling; 2) Drilling to 110 meters with food-grade stainless steel casing; 3) Installation of 3.2 kW photovoltaic array with solar inverter and Grundfos submersible pump; 4) Construction of the elevated water tower and protected distribution taps.',
      impactSummary: '2,500 people supplied daily with certified clean water at zero operating cost and zero CO2 emissions.',
    },
    fr: {
      title: "Puits d'Eau Potable Solaires en Afrique Subsaharienne",
      subtitle: 'Construction de puits artésiens à énergie solaire pour les villages isolés',
      location: 'Comté de Turkana, Kenya (Afrique de l’Est)',
      description: "Forage artésien en profondeur géologique équipé d'une pompe solaire immergée, d'un réservoir surélevé de 10 000 litres et de 4 bornes-fontaines communautaires protégées. Fournit une eau pure et sécurisée à plus de 2 500 habitants, éradiquant les maladies d'origine hydrique et permettant aux enfants d'aller à l'école au lieu de marcher des kilomètres.",
      detailedPlan: "Quatre étapes de réalisation : 1) Étude hydrogéologique et carottage ; 2) Forage à 110 mètres avec tubage en acier inoxydable alimentaire ; 3) Pose du champ photovoltaïque de 3,2 kW avec onduleur solaire et pompe Grundfos ; 4) Édification du château d'eau et des bornes de puisage.",
      impactSummary: '2 500 personnes approvisionnées chaque jour en eau potable certifiée, à zéro émission et sans coût récurrent.',
    },
    es: {
      title: 'Pozos de Agua Potable Solares en África Subsahariana',
      subtitle: 'Construcción de pozos artesianos con energía solar para comunidades rurales',
      location: 'Condado de Turkana, Kenia (África Oriental)',
      description: 'Construcción de un pozo artesiano a profundidad geológica con bomba sumergible solar, tanque de almacenamiento de 10.000 litros y 4 fuentes públicas protegidas. Proporciona agua pura y segura a más de 2.500 habitantes, erradicando enfermedades transmitidas por agua insalubre y permitiendo a los niños asistir a la escuela.',
      detailedPlan: 'El plan consta de 4 fases: 1) Estudio hidrogeológico y sondeos; 2) Perforación a 110 metros y entubado en acero inoxidable apto para uso alimentario; 3) Instalación del sistema fotovoltaico de 3.2 kW con bomba Grundfos; 4) Construcción de torre piezométrica y fuentes públicas.',
      impactSummary: '2.500 personas abastecidas a diario con agua potable certificada, a coste cero y sin emisiones de carbono.',
    },
    pt: {
      title: 'Poços de Água Potável Solares na África Subsaariana',
      subtitle: 'Construção de poços artesianos solares para comunidades rurais remotas',
      location: 'Região de Turkana, Quênia (África Oriental)',
      description: 'Perfuração de poço artesiano profundo com bomba solar submersa, reservatório de 10.000 litros e 4 chafarizes comunitários protegidos. Garante água potável e segura para mais de 2.500 moradores, erradicando doenças hídricas e permitindo que as crianças frequentem a escola.',
      detailedPlan: 'Execução em 4 etapas: 1) Estudo hidrogeológico; 2) Perfuração a 110 metros com revestimento em aço inoxidável alimentício; 3) Instalação de painéis solares de 3,2 kW e bomba Grundfos; 4) Construção da torre elevada e distribuição de água.',
      impactSummary: '2.500 pessoas atendidas diariamente com água pura certificada, a custo zero e com emissão zero de carbono.',
    },
    ru: {
      title: 'Артезианские скважины на солнечной энергии в Африке',
      subtitle: 'Строительство глубоких скважин с солнечными насосами для сельских общин',
      location: 'Округ Туркана, Кения (Восточная Африка)',
      description: 'Бурение артезианской скважины на глубину 110 метров с погружным насосом на солнечных батареях, резервуаром на 10 000 литров и 4 защищенными питьевыми колонками. Обеспечивает чистой питьевой водой более 2 500 жителей, ликвидируя опасные инфекции и давая детям возможность учиться в школе.',
      detailedPlan: 'Проект состоит из 4 этапов: 1) Гидрогеологическая разведка; 2) Бурение скважины на глубину 110 м и обсадка пищевой нержавеющей сталью; 3) Монтаж солнечной электростанции мощностью 3.2 кВт и насоса Grundfos; 4) Строительство водонапорной башни и колонок.',
      impactSummary: '2 500 человек ежедневно получают сертифицированную чистую воду с нулевыми выбросами CO2.',
    },
    hi: {
      title: 'उप-सहारा अफ्रीका में सौर-ऊर्जा संचालित पेयजल कुएं',
      subtitle: 'ग्रामीण समुदायों के लिए सौर ऊर्जा से चलने वाले गहरे नलकूपों का निर्माण',
      location: 'तुर्काना काउंटी, केन्या (पूर्वी अफ्रीका)',
      description: 'सौर सबमर्सिबल पंप, 10,000 लीटर क्षमता वाली पानी की टंकी और 4 सार्वजनिक नलों से युक्त 110 मीटर गहरे नलकूप का निर्माण। यह 2,500 से अधिक ग्रामीणों को शुद्ध और सुरक्षित पेयजल प्रदान करता है, जिससे जलजनित बीमारियां समाप्त होती हैं।',
      detailedPlan: '4 चरणों में कार्यान्वयन: 1) हाइड्रोजियोलॉजिकल सर्वेक्षण; 2) 110 मीटर की गहराई तक ड्रिलिंग और स्टेनलेस स्टील पाइपिंग; 3) 3.2 किलोवाट सोलर पैनल और ग्रंडफॉस पंप स्थापना; 4) वाटर टावर और वितरण नलों का निर्माण।',
      impactSummary: '2,500 लोगों को प्रतिदिन शून्य कार्बन उत्सर्जन और निःशुल्क प्रमाणित पेयजल की आपूर्ति।',
    },
    bn: {
      title: 'সাব-সাহারান আফ্রিকায় সৌরবিদ্যুৎ চালিত সুপেয় পানির কূপ',
      subtitle: 'প্রত্যন্ত গ্রামীণ জনগোষ্ঠীর জন্য গভীর সৌর নলকূপ স্থাপন প্রকল্প',
      location: 'তুর্কানা কাউন্টি, কেনিয়া (পূর্ব আফ্রিকা)',
      description: 'সৌর সাবমার্সিবল পাম্প, ১০,০০০ লিটার ধারণক্ষমতাসম্পন্ন পানির ট্যাংক এবং ৪টি সংরক্ষিত পাবলিক ট্যাপ স্ট্যান্ড সহ ১১০ মিটার গভীর নলকূপ স্থাপন। এটি ২,৫০০ এর বেশি মানুষের জন্য নিরাপদ সুপেয় পানি নিশ্চিত করে পানিবাহিত রোগ দূর করছে।',
      detailedPlan: 'প্রকল্পের ৪টি ধাপ: ১) হাইড্রোজোলজিক্যাল জরিপ; ২) খাদ্য-গ্রেড স্টেইনলেস স্টিল পাইপ দিয়ে ১১০ মিটার গভীর খনন; ৩) ৩.২ কিলোওয়াট সোলার প্যানেল ও পাম্প স্থাপন; ৪) ওভারহেড পানির ট্যাংক ও সরবরাহ পয়েন্ট নির্মাণ।',
      impactSummary: 'প্রতিদিন ২,৫০০ মানুষ শূন্য কার্বন নির্গমনে বিনামূল্যে বিশুদ্ধ পানি পাচ্ছেন।',
    },
    zh: {
      title: '撒哈拉以南非洲太阳能深水井工程',
      subtitle: '为偏远乡村建设利用太阳能驱动的深层清洁水源工程',
      location: '图尔卡纳郡，肯尼亚（东非）',
      description: '开凿深度达110米的地质深井，配备3.2千瓦太阳能光伏潜水泵、10,000升储水塔和4座带防护的社区公用取水龙头。为超过2,500名村民持续供应洁净安全的直饮水，根除水源性疾病，免去儿童每日跋涉取水的艰辛。',
      detailedPlan: '工程分4阶段实施：1) 水文地质勘测与土壤取样；2) 110米深井钻探与食品级不锈钢井管铺设；3) 3.2kW光伏电站与格兰富太阳能专用潜水泵安装；4) 承重蓄水塔与公用水龙头出水端建设。',
      impactSummary: '每日为2,500名村民提供经检验合格的纯净饮用水，全生命周期零碳排放。',
    },
    ja: {
      title: 'サブサハラ・アフリカにおける太陽光発電式深井戸掘削',
      subtitle: '農村コミュニティのための太陽光エネルギー駆動式深井戸建設',
      location: 'トゥルカナ郡、ケニア（東アフリカ）',
      description: '深度110mの深層掘削を実施し、太陽光発電水中ポンプ、10,000リットルの高架貯水タンク、4箇所の保護給水栓を設置。2,500人以上の住民に安全で純粋な飲料水を提供し、水系感染症を根絶するとともに、子どもたちの遠距離水汲み負担を解消します。',
      detailedPlan: '4つのフェーズで進行：1) 水文地質調査および地質ボーリング；2) 深度110m掘削および食品用ステンレス管布設；3) 3.2kW太陽光発電アレイおよびグルンドフォスポンプ設置；4) 高架給水塔および共同給水栓の建設。',
      impactSummary: '毎日2,500人の住民にCO2排出ゼロ、無償で認定飲料水を安定供給。',
    },
    ar: {
      title: 'آبار مياه الشرب بالطاقة الشمسية في إفريقيا جنوب الصحراء',
      subtitle: 'إنشاء آبار ارتوازية عميقة تعمل بالطاقة الشمسية للقرى الريفية النائية',
      location: 'مقاطعة توركانا، كينيا (شرق إفريقيا)',
      description: 'حفر بئر ارتوازية عميقة بعمق 110 أمتار مجهزة بمضخة غاطسة تعمل بالطاقة الشمسية، وخزان مياه علوي بسعة 10,000 لتر، و4 منافذ توزيع عامة محمية. يوفر المشروع مياهاً نقية وصحية لأكثر من 2,500 مواطن، مما يقضي على الأمراض المنقولة بالمياه.',
      detailedPlan: 'خطة التنفيذ على 4 مراحل: 1) المسح الهيدروجيولوجي واختبار التربة؛ 2) الحفر حتى عمق 110 أمتار وتبطين البئر بالفولاذ الغذائي؛ 3) تركيب منظومة ألواح شمسية 3.2 كيلوواط مع مضخة غروندفوس؛ 4) تشييد خزان المياه وأعمدة التوزيع.',
      impactSummary: 'إمداد 2,500 نسمة يومياً بمياه شرب معتمدة وصالحة للشرب بتكلفة تشغيلية منعدمة وصفر انبعاثات كربونية.',
    },
  },

  'proj-clinic-solar-02': {
    it: {
      title: 'Presidio Sanitario Rurale & Catena del Freddo Solare',
      subtitle: "Energia fotovoltaica per la conservazione dei vaccini e pronto soccorso d'emergenza",
      location: 'Distretto di Morogoro, Tanzania',
      description: "Dotazione di un generatore fotovoltaico ad isola (off-grid) con accumulatore al litio LiFePO4 e frigoriferi medicali certificati per garantire la catena del freddo 24/7 di vaccini essenziali, insulina e sieri antiofidici in un dispensario rurale isolato che accoglie madri e neonati.",
      detailedPlan: 'Fornitura e installazione di 8 pannelli solari monocristallini da 450W, inverter 5kVA, 2 batterie al litio da 5.12kWh e due frigoriferi medicali Dometic conformi agli standard OMS.',
      impactSummary: 'Copertura vaccinale garantita per oltre 3.800 neonati e illuminazione notturna sicura per i parti in clinica.',
    },
    en: {
      title: 'Rural Health Clinic & Solar Vaccine Cold Chain',
      subtitle: 'Off-grid solar electricity for 24/7 vaccine storage and emergency maternity care',
      location: 'Morogoro District, Tanzania',
      description: 'Equipping an isolated rural clinic with a reliable off-grid photovoltaic system, LiFePO4 lithium batteries, and WHO-certified medical refrigerators to guarantee a continuous 24/7 cold chain for essential vaccines, insulin, and anti-venoms.',
      detailedPlan: 'Installation of 8 monocrystalline solar panels (450W each), 5kVA pure sine wave inverter, 2 lithium battery banks (5.12kWh each), and dual Dometic WHO-standard medical vaccine refrigerators.',
      impactSummary: 'Guaranteed vaccine cold chain for 3,800+ newborns and reliable solar lighting for emergency night childbirths.',
    },
    fr: {
      title: 'Dispensaire Rural & Chaîne du Froid Vaccinale Solaire',
      subtitle: 'Énergie photovoltaïque pour la conservation des vaccins et maternité d’urgence',
      location: 'District de Morogoro, Tanzanie',
      description: "Installation d'un générateur solaire autonome avec batteries lithium LiFePO4 et réfrigérateurs médicaux certifiés OMS, assurant la chaîne du froid 24h/24 pour vaccins, insuline et sérums dans un dispensaire isolé.",
      detailedPlan: 'Pose de 8 panneaux solaires de 450W, onduleur 5kVA, 2 unités de batteries lithium 5,12kWh et 2 réfrigérateurs homologués OMS.',
      impactSummary: 'Couverture vaccinale assurée pour plus de 3 800 nouveau-nés et éclairage garanti pour les accouchements de nuit.',
    },
    es: {
      title: 'Clínica Médica Rural y Cadena de Frío Solar',
      subtitle: 'Energía solar para conservación de vacunas y partos de emergencia 24/7',
      location: 'Distrito de Morogoro, Tanzania',
      description: 'Dotación de un sistema fotovoltaico aislado con baterías de litio LiFePO4 y refrigeradores médicos certificados por la OMS para garantizar la cadena de frío continua de vacunas esenciales, insulina y sueros.',
      detailedPlan: 'Instalación de 8 paneles solares de 450W, inversor de 5kVA, 2 baterías de litio de 5.12kWh y dos frigoríficos médicos Dometic homologados.',
      impactSummary: 'Vacunación segura garantizada para más de 3.800 recién nacidos y luz ininterrumpida para partos nocturnos.',
    },
    pt: {
      title: 'Posto de Saúde Rural e Cadeia de Frio Solar',
      subtitle: 'Energia solar autônoma para vacinas e atendimento de emergência à maternidade',
      location: 'Distrito de Morogoro, Tanzânia',
      description: 'Instalação de sistema solar isolado com baterias de lítio LiFePO4 e refrigeradores médicos certificados pela OMS, assegurando a conservação contínua de vacinas essenciais, insulina e soros antiofídicos.',
      detailedPlan: 'Montagem de 8 módulos solares de 450W, inversor de 5kVA, 2 bancos de lítio de 5.12kWh e refrigeradores médicos certificados.',
      impactSummary: 'Imunização assegurada para mais de 3.800 recém-nascidos e iluminação confiável para partos noturnos.',
    },
    ru: {
      title: 'Сельская клиника и солнечная холодильная цепь для вакцин',
      subtitle: 'Автономное солнечное энергоснабжение для круглосуточного хранения вакцин и родов',
      location: 'Округ Морогоро, Танзания',
      description: 'Оснащение изолированного сельского медицинского пункта автономной солнечной электростанцией с литиевыми аккумуляторами LiFePO4 и сертифицированными ВОЗ медицинскими холодильниками для бесперебойного хранения вакцин и сывороток.',
      detailedPlan: 'Установка 8 солнечных панелей по 450 Вт, инвертора 5 кВА, 2 литиевых батарей емкостью 5.12 кВт·ч и двух медицинских холодильников.',
      impactSummary: 'Обеспечение вакцинами более 3 800 новорожденных и безопасное круглосуточное освещение для родовспоможения.',
    },
    hi: {
      title: 'ग्रामीण स्वास्थ्य क्लिनिक और सौर वैक्सीन कोल्ड चेन',
      subtitle: 'टीकों के भंडारण और आपातकालीन प्रसूति देखभाल के लिए सौर ऊर्जा',
      location: 'मोरोगोरो जिला, तंजानिया',
      description: 'एक अलग-थलग ग्रामीण स्वास्थ्य केंद्र में 24/7 आवश्यक टीकों, इंसुलिन और जीवनरक्षक दवाओं के भंडारण के लिए लिथियम LiFePO4 बैटरी और डब्ल्यूएचओ-प्रमाणित मेडिकल रेफ्रिजरेटर से लैस ऑफ-ग्रिड सौर प्रणाली की स्थापना।',
      detailedPlan: '8 मोनोक्रिस्टलाइन सोलर पैनल (450W), 5kVA इन्वर्टर, 2 लिथियम बैटरी (5.12kWh) और 2 प्रमाणित मेडिकल रेफ्रिजरेटर।',
      impactSummary: '3,800+ नवजात शिशुओं के लिए टीकों का सुरक्षित संरक्षण और सुरक्षित रात्रि प्रसव हेतु निर्बाध बिजली।',
    },
    bn: {
      title: 'গ্রামীণ স্বাস্থ্য ক্লিনিক ও সৌর ভ্যাকসিন কোল্ড চেইন',
      subtitle: 'টিকা সংরক্ষণ এবং জরুরি প্রসবকালীন সেবার জন্য সৌরবিদ্যুৎ ব্যবস্থা',
      location: 'মরোগোরো জেলা, তানজানিয়া',
      description: 'একটি প্রত্যন্ত গ্রামীণ স্বাস্থ্যকেন্দ্রে ২৪/৭ প্রয়োজনীয় ভ্যাকসিন, ইনসুলিন ও প্রতিষেধক সংরক্ষণের জন্য লিথিয়াম ব্যাটারি ও বিশ্ব স্বাস্থ্য সংস্থা (WHO) অনুমোদিত মেডিকেল রেফ্রিজারেটর সমৃদ্ধ সৌরবিদ্যুৎ ব্যবস্থা স্থাপন।',
      detailedPlan: '৮টি ৪৫০ ওয়াট সোলার প্যানেল, ৫ কেভিএ ইনভার্টার, ২টি ৫.১২ কিলোওয়াট-ঘণ্টার লিথিয়াম ব্যাটারি এবং ২টি মেডিকেল রেফ্রিজারেটর স্থাপন।',
      impactSummary: '৩,৮০০ এর বেশি নবজাতকের জন্য টিকা সংরক্ষণ এবং রাতে নিরাপদ প্রসবের জন্য বিদ্যুৎ সুবিধা।',
    },
    zh: {
      title: '乡村卫生诊所与太阳能疫苗冷链工程',
      subtitle: '为偏远乡村母婴诊所提供24小时离网太阳能电力与医用冷藏疫苗保障',
      location: '莫罗戈罗区，坦桑尼亚',
      description: '为偏远乡村诊所配备离网光伏发电系统、磷酸铁锂（LiFePO4）储能电池组和世界卫生组织（WHO）认证的专用医用冷藏箱，实现针对新生儿基础疫苗、胰岛素和急救血清的24小时不间断冷链存储，并为夜间紧急分娩提供可靠照明。',
      detailedPlan: '配置8块450W高效单晶硅太阳能电池板、5kVA纯正弦波离网逆变器、2组5.12kWh磷酸铁锂电池组以及2台多美达符合WHO标准的医用疫苗专用冰箱。',
      impactSummary: '为3,800余名偏远地区新生儿提供终身免疫冷链守护，并彻底解决夜间接生无照明的危急难题。',
    },
    ja: {
      title: '地方診療所・太陽光駆動式ワクチン保冷チェーン',
      subtitle: 'ワクチンの24時間保冷保管と緊急夜間分娩のための太陽光発電設備',
      location: 'モロゴロ州、タンザニア',
      description: '遠隔地の母子診療所に、リン酸鉄リチウム（LiFePO4）蓄電池とWHO認定の医用冷蔵庫を備えた独立型太陽光発電システムを設置。必須ワクチンやインスリンの24時間保冷チェーンを確立します。',
      detailedPlan: '450W単結晶ソーラーパネル8枚、5kVAインバータ、5.12kWhリチウム電池2系統、WHO基準適合の医用冷蔵庫2台を設置。',
      impactSummary: '3,800人以上の新生児への定期予防接種の実施と、夜間緊急出産の安全な照明を確保。',
    },
    ar: {
      title: 'العيادة الصحية الريفية وسلسلة تبريد اللقاحات الشمسية',
      subtitle: 'طاقة شمسية مستقلة لحفظ اللقاحات ورعاية الطوارئ التوليدية على مدار 24/7',
      location: 'منطقة موروغورو، تنزانيا',
      description: 'تجهيز مستوصف ريفي معزول بنظام كهروضوئي مستقل مع بطاريات ليثيوم LiFePO4 وثلاجات طبية معتمدة من منظمة الصحة العالمية لضمان حفظ اللقاحات الأساسية والأنسولين على مدار الساعة.',
      detailedPlan: 'توريد وتركيب 8 ألواح شمسية بقدرة 450 واط، ومحول 5 كيلو فولت أمبير، ووحدتي بطاريات ليثيوم 5.12 كيلوواط/ساعة، وثلاجتين طبيتين.',
      impactSummary: 'تأمين التطعيمات لأكثر من 3,800 مولود جديد وإضاءة آمنة لعمليات الولادة الليلية.',
    },
  },

  'proj-school-tech-03': {
    it: {
      title: 'Scuola Aperta & Connettività Satellitare Didattica',
      subtitle: 'Fornitura di tablet solari, kit didattici e antenna internet per studenti vulnerabili',
      location: 'Comunità di Kasese, Uganda',
      description: "Allestimento di un'aula didattica aperta con tablet a ricarica solare, libri di testo digitalizzati in lingua locale e connettività internet satellitare gratuita per l'istruzione di base di 180 bambini.",
      detailedPlan: 'Tutte le voci di spesa e le donazioni vengono rendicontate manualmente e verificate con la pubblicazione degli estratti conto bancari.',
      impactSummary: "180 studenti con accesso garantito all'enciclopedia globale e alfabetizzazione digitale.",
    },
    en: {
      title: 'Open School & Satellite Educational Connectivity',
      subtitle: 'Solar digital tablets, localized curricula, and satellite internet for rural pupils',
      location: 'Kasese Community, Uganda',
      description: 'Equipping an open-air community school with solar-charged digital learning tablets, textbooks in local languages, and high-speed satellite internet to empower 180 vulnerable children with modern education.',
      detailedPlan: 'Procurement of 40 ruggedized solar-powered educational tablets, satellite terminal installation, and open digital curriculum software setup.',
      impactSummary: '180 students granted free daily access to global knowledge, interactive lessons, and digital literacy.',
    },
    fr: {
      title: 'École Ouverte & Connectivité Éducative par Satellite',
      subtitle: 'Tablettes solaires et accès internet éducatif pour les élèves vulnérables',
      location: 'Communauté de Kasese, Ouganda',
      description: "Aménagement d'une classe connectée équipée de tablettes à recharge solaire, de manuels numérisés en langue locale et d'un accès internet par satellite pour 180 enfants.",
      detailedPlan: 'Acquisition de 40 tablettes renforcées à recharge solaire, antenne satellite éducative et contenus pédagogiques.',
      impactSummary: '180 élèves bénéficiant d’un accès continu au savoir universel et aux compétences numériques.',
    },
    es: {
      title: 'Escuela Abierta y Conectividad Educativa Satelital',
      subtitle: 'Tabletas solares y conexión satelital para niños de comunidades rurales',
      location: 'Comunidad de Kasese, Uganda',
      description: 'Creación de un aula abierta con tabletas de recarga solar, libros digitales en lengua local y conexión a internet satelital gratuita para la educación de 180 niños.',
      detailedPlan: 'Adquisición de 40 tabletas educativas reforzadas, terminal satelital e instalación de software pedagógico.',
      impactSummary: '180 estudiantes con acceso garantizado a enciclopedias globales y alfabetización digital.',
    },
    pt: {
      title: 'Escola Aberta e Conectividade Educacional via Satélite',
      subtitle: 'Tablets solares e internet banda larga para crianças em comunidades vulneráveis',
      location: 'Comunidade de Kasese, Uganda',
      description: 'Montagem de sala de aula comunitária com tablets carregados por energia solar, livros digitalizados em línguas locais e internet via satélite para 180 crianças.',
      detailedPlan: 'Fornecimento de 40 tablets solares resistentes, antena de internet via satélite e conteúdos pedagógicos livres.',
      impactSummary: '180 alunos com acesso diário à enciclopédia global e alfabetização digital.',
    },
    ru: {
      title: 'Открытая школа и спутниковый интернет для образования',
      subtitle: 'Планшеты на солнечной зарядке и доступ в интернет для 180 сельских школьников',
      location: 'Община Касесе, Уганда',
      description: 'Оснащение сельской школы планшетами с солнечной зарядкой, оцифрованными учебниками на местных языках и спутниковым интернетом для базового образования 180 детей.',
      detailedPlan: 'Закупка 40 ударопрочных планшетов, монтаж спутникового терминала и установка образовательного ПО.',
      impactSummary: '180 школьников получили свободный доступ к мировым знаниям и компьютерной грамотности.',
    },
    hi: {
      title: 'ओपन स्कूल और उपग्रह शैक्षिक कनेक्टिविटी',
      subtitle: 'ग्रामीण बच्चों के लिए सौर टैबलेट और उपग्रह इंटरनेट की व्यवस्था',
      location: 'कासेसे समुदाय, युगांडा',
      description: '180 वंचित बच्चों की बुनियादी शिक्षा के लिए सौर-चार्जिंग टैबलेट, स्थानीय भाषा में डिजिटल पाठ्यपुस्तकों और उपग्रह इंटरनेट से लैस एक डिजिटल कक्षा की स्थापना।',
      detailedPlan: '40 मजबूत सोलर टैबलेट की खरीद, सैटेलाइट इंटरनेट एंटीना की स्थापना और शैक्षिक सॉफ्टवेयर सेटअप।',
      impactSummary: '180 छात्रों को वैश्विक ज्ञान और डिजिटल साक्षरता तक मुफ्त पहुंच की गारंटी।',
    },
    bn: {
      title: 'ওপেন স্কুল ও স্যাটেলাইট শিক্ষা সংযোগ',
      subtitle: 'সুবিধাবঞ্চিত শিশুদের জন্য সৌর ট্যাবলেট এবং স্যাটেলাইট ইন্টারনেট',
      location: 'কাসেসে কমিউনিটি, উগান্ডা',
      description: '১৮০ জন শিশুর মৌলিক শিক্ষার জন্য সৌর-চার্জিং ট্যাবলেট, স্থানীয় ভাষায় ডিজিটাল পাঠ্যবই এবং দ্রুতগতির স্যাটেলাইট ইন্টারনেট সুবিধাযুক্ত একটি ডিজিটাল ক্লাসরুম প্রস্তুতকরণ।',
      detailedPlan: '৪০টি মজবুত সৌর-চালিত ট্যাবলেট সংগ্রহ, স্যাটেলাইট সংযোগ স্থাপন এবং উন্মুক্ত ডিজিটাল শিক্ষণ সফটওয়্যার সেটআপ।',
      impactSummary: '১৮০ জন শিক্ষার্থীকে বিনামূল্যে বিশ্বকোষ ও ডিজিটাল শিক্ষার সুবর্ণ সুযোগ প্রদান।',
    },
    zh: {
      title: '开放希望小学与卫星教育数字互联工程',
      subtitle: '为弱势学童配备太阳能数字平板、本地化数字教材与卫星高速互联网',
      location: '卡塞塞社区，乌干达',
      description: '为180名乡村贫困儿童打造开放式数字教学园地，配备太阳能便携充电平板电脑、本地语言数字化课本以及高速卫星互联网接入，消除偏远地区的数字鸿沟。',
      detailedPlan: '采购40台定制防摔太阳能学习平板、安装卫星地面接收天线、部署开源离线百科全书与教学软件。',
      impactSummary: '180名学童每日免费连通全球知识库，享有高质量互动教学与计算机数字素养。',
    },
    ja: {
      title: 'オープン・スクール＆衛星教育インターネット接続',
      subtitle: '太陽光充電タブレットと衛星回線による遠隔教育支援',
      location: 'カセセ地域、ウガンダ',
      description: '180人の子どもたちの初等教育のため、太陽光充電式学習タブレット、現地語の電子教科書、無料の衛星インターネット回線を備えたオープン教室を開設。',
      detailedPlan: '高耐久型ソーラータブレット40台の導入、衛星アンテナの設置、オフライン学習コンテンツの配備。',
      impactSummary: '180名の児童に世界規模の知識体系とデジタルリテラシーへの無償アクセスを提供。',
    },
    ar: {
      title: 'المدرسة المفتوحة والاتصال التعليمي عبر الأقمار الصناعية',
      subtitle: 'أجهزة لوحية تعمل بالطاقة الشمسية وإنترنت فضائي لطلاب المناطق النائية',
      location: 'مجتمع كاسيسي، أوغندا',
      description: 'تجهيز فصل دراسي مفتوح بأجهزة لوحية تعليمية تشحن بالطاقة الشمسية، وكتب دراسية رقمية باللغات المحلية، وإنترنت فضائي سريع لتمكين 180 طفلاً من التعليم الأساسي.',
      detailedPlan: 'توفير 40 جهازاً لوحياً مقاوماً للصدمات، وتركيب محطة اتصال فضائي، وتثبيت البرمجيات التعليمية الرقمية.',
      impactSummary: 'تمكين 180 طالباً من الوصول اليومي المجاني للمعرفة ومحو الأمية الرقمية.',
    },
  },
};

/**
 * Returns a project object with localized fields (title, subtitle, location, description, detailedPlan, impactSummary)
 * for the given language.
 */
export function getLocalizedProject(project: any, lang: Language): any {
  if (!project) return project;
  
  // 1. Check if the project is in INITIAL_PROJECTS_TRANSLATIONS
  const trans = INITIAL_PROJECTS_TRANSLATIONS[project.id]?.[lang];
  if (trans) {
    return {
      ...project,
      title: trans.title || project.title,
      subtitle: trans.subtitle || project.subtitle,
      location: trans.location || project.location,
      description: trans.description || project.description,
      detailedPlan: trans.detailedPlan || project.detailedPlan,
      impactSummary: trans.impactSummary || project.impactSummary,
    };
  }

  // 2. Check if the project has an inline translations map
  if (project.translations?.[lang]) {
    const inline = project.translations[lang];
    return {
      ...project,
      title: inline.title || project.title,
      subtitle: inline.subtitle || project.subtitle,
      location: inline.location || project.location,
      description: inline.description || project.description,
      detailedPlan: inline.detailedPlan || project.detailedPlan,
      impactSummary: inline.impactSummary || project.impactSummary,
    };
  }

  return project;
}

/**
 * Date formatter adapted to the active language
 */
export function formatProjectDate(dateString: string, lang: Language): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const localeMap: Record<Language, string> = {
      it: 'it-IT',
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-ES',
      pt: 'pt-PT',
      ru: 'ru-RU',
      hi: 'hi-IN',
      bn: 'bn-BD',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ar: 'ar-SA',
    };
    return date.toLocaleDateString(localeMap[lang] || 'it-IT');
  } catch {
    return dateString;
  }
}
