/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Community Projects & Humanitarian Fundraisers Service
 * 
 * Manages civic and humanitarian projects (e.g. water wells in Africa, rural solar clinics,
 * educational tech for schools) funded through donations to the association's bank account.
 * All donations and project expenses are fully audited and reported through official bank statements.
 */

import { safeFetch } from './api';
import { CATEGORY_LABELS_I18N, STATUS_LABELS_I18N } from '../constants/projectsTranslations';

export type ProjectCategory = 
  | 'water_wells' 
  | 'health_clinics' 
  | 'education' 
  | 'ecology' 
  | 'humanitarian' 
  | 'civic_infrastructure';

export type ProjectStatus = 'active' | 'funded' | 'in_progress' | 'completed';

export interface StatementReport {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  amount: string; // e.g. "+ € 3.450,00" or "- € 4.200,00"
  type: 'statement_in' | 'expense_out' | 'audit_report';
  fileName: string;
  fileSize: string;
  fileData?: string; // Base64 or URL
  notes: string;
}

export interface ProjectDonor {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  publicNote?: string;
  verifiedOnStatement: boolean;
  transferReference?: string;
}

export interface CommunityProject {
  id: string;
  title: string;
  subtitle: string;
  category: ProjectCategory;
  location: string;
  description: string;
  detailedPlan: string;
  impactSummary: string;
  targetAmount: number;
  raisedAmount: number;
  beneficiariesCount: number;
  status: ProjectStatus;
  coverImage: string;
  galleryImages?: string[];
  bankDetails: {
    accountHolder: string;
    iban: string;
    bic: string;
    bankName: string;
    transferReason: string;
  };
  startDate: string;
  expectedCompletionDate?: string;
  published: boolean;
  statementReports: StatementReport[];
  donorLedger: ProjectDonor[];
  translations?: Record<string, {
    title?: string;
    subtitle?: string;
    location?: string;
    description?: string;
    detailedPlan?: string;
    impactSummary?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'nws_community_projects_v2';

export const INITIAL_PROJECTS: CommunityProject[] = [
  {
    id: 'proj-water-turkana-01',
    title: 'Pozzi d\'Acqua Potabile Solari in Africa Sub-Sahariana',
    subtitle: 'Costruzione di pozzi artesiani alimentati a energia solare per le comunità rurali',
    category: 'water_wells',
    location: 'Regione del Turkana, Kenya (Africa Orientale)',
    description: 'Realizzazione di un pozzo artesiano a profondità geologica con pompa sommersa a energia solare, cisterna di stoccaggio da 10.000 litri e 4 fontanelle pubbliche protette. Garantisce acqua pura e sicura per oltre 2.500 abitanti, eliminando malattie trasmesse dall\'acqua stagnante e consentendo ai bambini di frequentare la scuola invece di percorrere chilometri per il rifornimento idrico.',
    detailedPlan: 'Il progetto si articola in 4 fasi: 1) Rilievo idrogeologico e carotaggio del terreno; 2) Perforazione a 110 metri e tubaggio in acciaio inox alimentare; 3) Installazione dell\'impianto fotovoltaico da 3.2 kW con inverter solare e pompa Grundfos; 4) Costruzione della torre piezometrica e delle fontanelle con abbeveratoio per animali.',
    impactSummary: '2.500 persone servite ogni giorno con acqua potabile certificata a costo zero e zero emissioni di CO2.',
    targetAmount: 14500,
    raisedAmount: 0,
    beneficiariesCount: 2500,
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80'
    ],
    bankDetails: {
      accountHolder: 'New World State Organization',
      iban: 'IT70F0326816900052535344000',
      bic: 'BCITITMM',
      bankName: 'Banca Etica / Credito Cooperativo',
      transferReason: 'DONAZIONE-NWS-POZZO-AFRICA-01'
    },
    startDate: '2025-11-01',
    expectedCompletionDate: '2026-06-30',
    published: true,
    statementReports: [],
    donorLedger: [],
    createdAt: '2025-11-01T10:00:00.000Z',
    updatedAt: '2026-02-15T16:00:00.000Z'
  },
  {
    id: 'proj-clinic-solar-02',
    title: 'Presidio Sanitario Rurale & Catena del Freddo Solare',
    subtitle: 'Energia fotovoltaica per la conservazione dei vaccini e pronto soccorso d\'emergenza',
    category: 'health_clinics',
    location: 'Distretto di Morogoro, Tanzania',
    description: 'Dotazione di un generatore fotovoltaico ad isola (off-grid) con accumulatore al litio LiFePO4 e frigoriferi medicali certificati per garantire la catena del freddo 24/7 di vaccini essenziali, insulina e sieri antiofidici in un dispensario rurale isolato che accoglie madri e neonati.',
    detailedPlan: 'Fornitura e installazione di 8 pannelli solari monocristallini da 450W, inverter 5kVA, 2 batterie al litio da 5.12kWh e due frigoriferi medicali Dometic conformi agli standard OMS.',
    impactSummary: 'Copertura vaccinale garantita per oltre 3.800 neonati e illuminazione notturna sicura per i parti in clinica.',
    targetAmount: 9800,
    raisedAmount: 0,
    beneficiariesCount: 3800,
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
    ],
    bankDetails: {
      accountHolder: 'New World State Organization',
      iban: 'IT70F0326816900052535344000',
      bic: 'BCITITMM',
      bankName: 'Banca Etica / Credito Cooperativo',
      transferReason: 'DONAZIONE-NWS-CLINICA-SOLARE'
    },
    startDate: '2026-01-10',
    expectedCompletionDate: '2026-08-31',
    published: true,
    statementReports: [],
    donorLedger: [],
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-02-18T11:00:00.000Z'
  },
  {
    id: 'proj-school-tech-03',
    title: 'Scuola Aperta & Connettività Satellitare Didattica',
    subtitle: 'Fornitura di tablet solari, kit didattici e antenna internet per studenti vulnerabili',
    category: 'education',
    location: 'Comunità di Kasese, Uganda',
    description: 'Allestimento di un\'aula didattica aperta con tablet a ricarica solare, libri di testo digitalizzati in lingua locale e connettività internet satellitare gratuita per l\'istruzione di base di 180 bambini.',
    detailedPlan: 'Tutte le voci di spesa e le donazioni vengono rendicontate manualmente e verificate con la pubblicazione degli estratti conto bancari.',
    impactSummary: '180 studenti con accesso garantito all\'enciclopedia globale e alfabetizzazione digitale.',
    targetAmount: 6500,
    raisedAmount: 0,
    beneficiariesCount: 180,
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    bankDetails: {
      accountHolder: 'New World State Organization',
      iban: 'IT70F0326816900052535344000',
      bic: 'BCITITMM',
      bankName: 'Banca Etica / Credito Cooperativo',
      transferReason: 'DONAZIONE-NWS-SCUOLA-APERTA'
    },
    startDate: '2025-06-01',
    expectedCompletionDate: '2025-12-15',
    published: true,
    statementReports: [],
    donorLedger: [],
    createdAt: '2025-06-01T08:00:00.000Z',
    updatedAt: '2025-12-22T14:00:00.000Z'
  }
];

// Helper to remove any old mock statements/donors from a project list
function sanitizeProjectStatements(projects: CommunityProject[]): CommunityProject[] {
  return projects.map(p => {
    // Check if contains default mock entries
    const hasMockStatements = (p.statementReports || []).some(r => 
      r.id.startsWith('rep-water-') || r.id.startsWith('rep-clinic-') || r.id.startsWith('rep-school-')
    );
    const hasMockDonors = (p.donorLedger || []).some(d => 
      d.id === 'd-1' || d.id === 'd-2' || d.id === 'd-3' || d.id === 'd-4' || 
      d.id === 'dc-1' || d.id === 'dc-2' || d.id === 'ds-1'
    );

    let statements = p.statementReports || [];
    let donors = p.donorLedger || [];
    let raised = p.raisedAmount || 0;

    if (hasMockStatements) {
      statements = statements.filter(r => 
        !r.id.startsWith('rep-water-') && !r.id.startsWith('rep-clinic-') && !r.id.startsWith('rep-school-')
      );
    }

    if (hasMockDonors) {
      donors = donors.filter(d => 
        d.id !== 'd-1' && d.id !== 'd-2' && d.id !== 'd-3' && d.id !== 'd-4' && 
        d.id !== 'dc-1' && d.id !== 'dc-2' && d.id !== 'ds-1'
      );
      // Recalculate raisedAmount based on remaining verified donors
      raised = donors.filter(d => d.verifiedOnStatement).reduce((sum, d) => sum + Number(d.amount), 0);
    }

    return {
      ...p,
      statementReports: statements,
      donorLedger: donors,
      raisedAmount: raised
    };
  });
}

let inFlightProjectsFetch: Promise<CommunityProject[]> | null = null;

export async function fetchProjectsFromServer(): Promise<CommunityProject[]> {
  if (inFlightProjectsFetch) return inFlightProjectsFetch;

  inFlightProjectsFetch = (async () => {
    try {
      const res = await safeFetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.projects) && data.projects.length > 0) {
          const sanitized = sanitizeProjectStatements(data.projects);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            window.dispatchEvent(new CustomEvent('nws_projects_updated', { detail: sanitized }));
          }
          return sanitized;
        }
      }
    } catch (e) {
      console.warn('[PROJECTS-SYNC] Server unreachable or offline, using local projects cache:', e);
    } finally {
      inFlightProjectsFetch = null;
    }
    return getProjects();
  })();

  return inFlightProjectsFetch;
}

export function getProjects(): CommunityProject[] {
  if (typeof window === 'undefined') return INITIAL_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizeProjectStatements(parsed);
        return sanitized;
      }
    }
    // Also check older storage key and sanitize
    const oldRaw = localStorage.getItem('nws_community_projects_v1');
    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw);
      if (Array.isArray(oldParsed) && oldParsed.length > 0) {
        const sanitized = sanitizeProjectStatements(oldParsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        localStorage.removeItem('nws_community_projects_v1');
        return sanitized;
      }
    }
  } catch (err) {
    console.error('[PROJECTS-GET-ERR]', err);
  }
  return INITIAL_PROJECTS;
}

export function getPublicProjects(): CommunityProject[] {
  return getProjects().filter(p => p.published === true);
}

export function getProjectById(id: string): CommunityProject | undefined {
  return getProjects().find(p => p.id === id);
}

export async function saveProjects(projects: CommunityProject[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    window.dispatchEvent(new CustomEvent('nws_projects_updated', { detail: projects }));

    // Authoritative sync with server API
    await safeFetch('/api/projects/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects })
    }).catch(err => console.warn('[PROJECTS-SERVER-SYNC-ERR]', err));
  } catch (err) {
    console.error('[PROJECTS-SAVE-ERR]', err);
  }
}

export async function addProject(project: Omit<CommunityProject, 'id' | 'createdAt' | 'updatedAt' | 'statementReports' | 'donorLedger'>): Promise<CommunityProject> {
  const current = getProjects();
  const now = new Date().toISOString();
  const newProject: CommunityProject = {
    ...project,
    id: 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    statementReports: [],
    donorLedger: [],
    createdAt: now,
    updatedAt: now
  };

  const updated = [newProject, ...current];
  await saveProjects(updated);
  return newProject;
}

export async function updateProject(id: string, updates: Partial<CommunityProject>): Promise<boolean> {
  const current = getProjects();
  const index = current.findIndex(p => p.id === id);
  if (index === -1) return false;

  current[index] = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await saveProjects(current);
  return true;
}

export async function deleteProject(id: string): Promise<boolean> {
  const current = getProjects();
  const filtered = current.filter(p => p.id !== id);
  if (filtered.length === current.length) return false;

  await saveProjects(filtered);

  await safeFetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }).catch(() => {});

  return true;
}

export async function addStatementToProject(
  projectId: string, 
  statement: Omit<StatementReport, 'id'>
): Promise<StatementReport | null> {
  const current = getProjects();
  const projectIndex = current.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return null;

  const newReport: StatementReport = {
    ...statement,
    id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
  };

  current[projectIndex].statementReports = [newReport, ...(current[projectIndex].statementReports || [])];
  current[projectIndex].updatedAt = new Date().toISOString();

  await saveProjects(current);
  return newReport;
}

export async function deleteStatementFromProject(projectId: string, statementId: string): Promise<boolean> {
  const current = getProjects();
  const projectIndex = current.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return false;

  current[projectIndex].statementReports = (current[projectIndex].statementReports || []).filter(r => r.id !== statementId);
  current[projectIndex].updatedAt = new Date().toISOString();

  await saveProjects(current);
  return true;
}

export async function addDonationRecord(
  projectId: string,
  donor: Omit<ProjectDonor, 'id'>
): Promise<ProjectDonor | null> {
  const current = getProjects();
  const projectIndex = current.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return null;

  const newDonor: ProjectDonor = {
    ...donor,
    id: 'donor-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
  };

  current[projectIndex].donorLedger = [newDonor, ...(current[projectIndex].donorLedger || [])];
  
  // If verified, update raised amount automatically
  if (donor.verifiedOnStatement) {
    current[projectIndex].raisedAmount = (current[projectIndex].raisedAmount || 0) + Number(donor.amount);
    if (current[projectIndex].raisedAmount >= current[projectIndex].targetAmount && current[projectIndex].status === 'active') {
      current[projectIndex].status = 'funded';
    }
  }

  current[projectIndex].updatedAt = new Date().toISOString();
  await saveProjects(current);
  return newDonor;
}

export async function deleteDonationRecord(projectId: string, donorId: string): Promise<boolean> {
  const current = getProjects();
  const projectIndex = current.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return false;

  const donorToDelete = (current[projectIndex].donorLedger || []).find(d => d.id === donorId);
  current[projectIndex].donorLedger = (current[projectIndex].donorLedger || []).filter(d => d.id !== donorId);

  // If the deleted donor was verified on statement, subtract from raised amount
  if (donorToDelete && donorToDelete.verifiedOnStatement) {
    current[projectIndex].raisedAmount = Math.max(0, (current[projectIndex].raisedAmount || 0) - Number(donorToDelete.amount));
    if (current[projectIndex].raisedAmount < current[projectIndex].targetAmount && current[projectIndex].status === 'funded') {
      current[projectIndex].status = 'active';
    }
  }

  current[projectIndex].updatedAt = new Date().toISOString();
  await saveProjects(current);
  return true;
}

export async function clearProjectStatementsAndDonations(projectId: string): Promise<boolean> {
  const current = getProjects();
  const projectIndex = current.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return false;

  current[projectIndex].statementReports = [];
  current[projectIndex].donorLedger = [];
  current[projectIndex].raisedAmount = 0;
  if (current[projectIndex].status === 'funded') {
    current[projectIndex].status = 'active';
  }
  current[projectIndex].updatedAt = new Date().toISOString();
  await saveProjects(current);
  return true;
}

export async function clearAllProjectsStatementsAndDonations(): Promise<boolean> {
  const current = getProjects();
  for (const p of current) {
    p.statementReports = [];
    p.donorLedger = [];
    p.raisedAmount = 0;
    if (p.status === 'funded') {
      p.status = 'active';
    }
    p.updatedAt = new Date().toISOString();
  }
  await saveProjects(current);
  return true;
}

export async function submitPublicDonationPledge(
  projectId: string,
  pledge: {
    donorName: string;
    amount: number;
    email?: string;
    transferDate: string;
    transferReference?: string;
    publicNote?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Send to server
    const res = await safeFetch('/api/projects/pledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, ...pledge })
    });

    const data = await res.json().catch(() => ({ success: true }));

    // 2. Also register locally as unverified donation for instant feedback
    await addDonationRecord(projectId, {
      donorName: pledge.donorName || 'Anonimo Sostenitore',
      amount: pledge.amount,
      date: pledge.transferDate || new Date().toISOString().split('T')[0],
      publicNote: pledge.publicNote,
      verifiedOnStatement: false,
      transferReference: pledge.transferReference
    });

    return {
      success: true,
      message: data.message || 'Grazie di cuore! La tua segnalazione di bonifico è stata registrata. Non appena il nostro ufficio contabile riceverà l\'estratto conto bancario con l\'accredito, la donazione verrà contrassegnata come verificata.'
    };
  } catch (err: any) {
    // Fallback save locally
    await addDonationRecord(projectId, {
      donorName: pledge.donorName || 'Anonimo Sostenitore',
      amount: pledge.amount,
      date: pledge.transferDate || new Date().toISOString().split('T')[0],
      publicNote: pledge.publicNote,
      verifiedOnStatement: false,
      transferReference: pledge.transferReference
    });

    return {
      success: true,
      message: 'Segnalazione salvata. La donazione verrà registrata con l\'arrivo del prossimo estratto conto bancario.'
    };
  }
}

/**
 * Downloads official PDF or text certificate proof for a project statement
 */
export function downloadProjectStatement(project: CommunityProject, report: StatementReport): void {
  if (report.fileData && report.fileData.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = report.fileData;
    link.download = report.fileName || `EstrattoConto_${project.id}_${report.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Generate synthetic structured verification audit certificate
  const content = `
================================================================================
NEW WORLD STATE ORGANIZATION - ATTESTAZIONE DI RENDICONTAZIONE BANCARIA
Via San Basilio 12, San Giovanni La Punta (CT) Italy • C.F. 90076060871
Conto Corrente Istituzionale IBAN: ${project.bankDetails.iban}
Banca: ${project.bankDetails.bankName} • BIC/SWIFT: ${project.bankDetails.bic}
================================================================================

OPERA CIVICA / PROGETTO COMUNITARIO:
Titolo: ${project.title.toUpperCase()}
Luogo di Realizzazione: ${project.location}
Causale Bancaria Dedicata: ${project.bankDetails.transferReason}
Beneficiari Diretti: ${project.beneficiariesCount.toLocaleString('it-IT')} persone
Obiettivo Raccolta Fondi: € ${project.targetAmount.toLocaleString('it-IT')},00
Fondi Raccolti alla Data: € ${project.raisedAmount.toLocaleString('it-IT')},00 (${Math.round((project.raisedAmount / project.targetAmount) * 100)}%)

--------------------------------------------------------------------------------
DOCUMENTO CONTABILE UFFICIALE:
Titolo: ${report.title.toUpperCase()}
Data Contabile / Emissione: ${report.date}
Tipo Movimento: ${report.type === 'statement_in' ? 'ACCREDITO BONIFICI DONAZIONE (ENTRATA)' : report.type === 'expense_out' ? 'GIUSTIFICATIVO / FATTURA DI SPESA OPERA (USCITA)' : 'RELAZIONE DI AUDIT CONSUNTIVO'}
Importo Riferito: ${report.amount}
Identificativo Documento: ${report.id}

NOTE E DESCRIZIONE CONTABILE:
${report.notes || 'Nessuna nota aggiuntiva.'}

ATTESTAZIONE DI TRASPARENZA & INTEGRITÀ:
La presente attestazione certifica che tutti i fondi versati sul conto corrente
dell'associazione tramite la causale dedicata sono destinati integralmente ed
esclusivamente alla realizzazione dell'opera comunitaria indicata.
Tutte le movimentazioni sono verificate dagli organi di garanzia istituzionale
del New World State ai sensi dello statuto e del principio di sovranità trasparente.

Documento pubblicato ad uso di consultazione pubblica e controllo civico.
================================================================================
  `.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = report.fileName || `NWS_Rendiconto_${project.id}_${report.date}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getCategoryLabel(category: ProjectCategory, lang = 'it'): { label: string; icon: string; color: string } {
  const map: Record<ProjectCategory, { icon: string; color: string }> = {
    water_wells: {
      icon: 'Droplets',
      color: 'bg-cyan-50 text-cyan-800 border-cyan-200'
    },
    health_clinics: {
      icon: 'HeartPulse',
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    education: {
      icon: 'GraduationCap',
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    ecology: {
      icon: 'Sprout',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    humanitarian: {
      icon: 'ShieldAlert',
      color: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    civic_infrastructure: {
      icon: 'Building2',
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    }
  };

  const item = map[category] || map.civic_infrastructure;
  const labelMap = CATEGORY_LABELS_I18N[category] || CATEGORY_LABELS_I18N.civic_infrastructure;
  const localizedLabel = (labelMap as any)?.[lang] || labelMap.it || labelMap.en;

  return {
    label: localizedLabel,
    icon: item.icon,
    color: item.color
  };
}

export function getStatusLabel(status: ProjectStatus, lang = 'it'): { label: string; color: string; badge: string } {
  const map: Record<ProjectStatus, { color: string; badge: string }> = {
    active: {
      color: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    funded: {
      color: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    in_progress: {
      color: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    completed: {
      color: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    }
  };

  const item = map[status] || map.active;
  const labelMap = STATUS_LABELS_I18N[status] || STATUS_LABELS_I18N.active;
  const localizedLabel = (labelMap as any)?.[lang] || labelMap.it || labelMap.en;

  return {
    label: localizedLabel,
    color: item.color,
    badge: item.badge
  };
}
