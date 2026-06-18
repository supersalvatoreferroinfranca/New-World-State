import React, { useState, useEffect } from 'react';
import { safeFetch } from '../../services/api';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Eye, 
  RotateCw, 
  Globe, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  ExternalLink,
  ChevronRight,
  Shield,
  FileText,
  Briefcase,
  Trash,
  Clock,
  Plus,
  Edit
} from 'lucide-react';

interface Citizen {
  id: string | number;
  firstName: string;
  surname: string;
  username: string;
  email: string;
  citizenCode: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  birthCountry?: string;
  residenceAddress?: string;
  residenceNumber?: string;
  residenceZip?: string;
  residenceCity?: string;
  residenceCountry?: string;
  plusCode?: string;
  arubaFrontUrl?: string;
  arubaBackUrl?: string;
  arubaPhotoUrl?: string;
  documentHash?: string;
  createdAt?: string;
  isAdmin?: boolean;
  operationalRole?: string | null;
}

const PREDEFINED_ROLES = [
  "Console dell'Anagrafe",
  "Ministro della Giustizia",
  "Garante della Costituzione",
  "Supervisore Elettorale",
  "Ambasciatore Digitale",
  "Ufficiale di Pace",
  "Custode Digitale (IT)"
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('nws_admin_auth') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Core navigation state
  const [activeTab, setActiveTab] = useState<'citizens' | 'proposals' | 'roles'>('citizens');

  // Dynamic custom roles & geographic areas state
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [geographicAreas, setGeographicAreas] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Editing forms state for roles & areas
  const [editingRole, setEditingRole] = useState<{ id?: number; name: string; description: string; geographic_area_id: string } | null>(null);
  const [editingArea, setEditingArea] = useState<{ id?: number; name: string; countries: string } | null>(null);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isAreaFormOpen, setIsAreaFormOpen] = useState(false);

  // Citizens list state
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Digital democracy admin proposals state
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState<string | null>(null);
  const [proposalStatusFilter, setProposalStatusFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  // Scheduling states
  const [scheduleProposalId, setScheduleProposalId] = useState<number | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [votingStartsAt, setVotingStartsAt] = useState('');
  const [votingEndsAt, setVotingEndsAt] = useState('');

  // Proposals rejection modal
  const [proposalRejectionModalOpen, setProposalRejectionModalOpen] = useState(false);
  const [proposalRejectionId, setProposalRejectionId] = useState<number | null>(null);
  const [proposalRejectionReason, setProposalRejectionReason] = useState('');

  // Custom dialog system to bypass iframe sandbox restrictions on window.confirm & alert
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'alert';
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        if (onOk) onOk();
      },
      onCancel: () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getAdminPassword = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('nws_admin_password') || '';
    }
    return '';
  };

  // Fetch all registered citizens
  const fetchCitizens = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetch('/api/admin/citizens', {
        headers: {
          'x-admin-password': getAdminPassword()
        }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result.success) {
        setCitizens(result.data || []);
      } else {
        throw new Error(result.message || 'Errore durante il caricamento');
      }
    } catch (err: any) {
      console.error('[ADMIN-DASHBOARD] Fetch failed:', err);
      setError(err.message || 'Impossibile connettersi alle API di amministrazione.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all digital democracy proposals
  const fetchProposals = async () => {
    setProposalsLoading(true);
    setProposalsError(null);
    try {
      const res = await safeFetch('/api/democracy/proposals');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result.success) {
        setProposals(result.data || []);
      } else {
        throw new Error(result.message || 'Errore durante il caricamento delle proposte.');
      }
    } catch (err: any) {
      console.error('[ADMIN-DASHBOARD] Props fetch failed:', err);
      setProposalsError(err.message || 'Impossibile connettersi alle API di democrazia.');
    } finally {
      setProposalsLoading(false);
    }
  };

  // Fetch dynamic custom roles from database/memory
  const fetchCustomRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await safeFetch('/api/admin/custom-roles', {
        headers: {
          'x-admin-password': getAdminPassword()
        }
      });
      const data = await res.json();
      if (data.success) {
        setCustomRoles(data.data || []);
      }
    } catch (err: any) {
      console.error('[ADMIN-DASHBOARD] Fetch custom roles failed:', err);
    } finally {
      setRolesLoading(false);
    }
  };

  // Fetch dynamic geographic areas from database/memory
  const fetchGeographicAreas = async () => {
    try {
      const res = await safeFetch('/api/admin/geographic-areas', {
        headers: {
          'x-admin-password': getAdminPassword()
        }
      });
      const data = await res.json();
      if (data.success) {
        setGeographicAreas(data.data || []);
      }
    } catch (err: any) {
      console.error('[ADMIN-DASHBOARD] Fetch areas failed:', err);
    }
  };

  // Save/Update Custom Operational Role
  const handleSaveRole = async () => {
    if (!editingRole || !editingRole.name.trim()) {
      showAlert('Dati mancanti', 'Il nome del ruolo è obbligatorio.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await safeFetch('/api/admin/custom-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({
          id: editingRole.id,
          name: editingRole.name,
          description: editingRole.description,
          geographic_area_id: editingRole.geographic_area_id || null
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Salvato', data.message || 'Ruolo salvato correttamente.');
        setIsRoleFormOpen(false);
        setEditingRole(null);
        await fetchCustomRoles();
      } else {
        showAlert('Errore', data.message || 'Impossibile salvare il ruolo.');
      }
    } catch (err: any) {
      showAlert('Errore di rete', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Custom Operational Role
  const handleDeleteRole = async (id: number) => {
    showConfirm(
      'Elimina Ruolo',
      'Sei sicuro di voler eliminare irrevocabilmente questo incarico operativo?',
      async () => {
        setActionLoading(true);
        try {
          const res = await safeFetch('/api/admin/custom-roles', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': getAdminPassword()
            },
            body: JSON.stringify({ id })
          });
          const data = await res.json();
          if (data.success) {
            showAlert('Rimosso', data.message || 'Ruolo rimosso con successo.');
            await fetchCustomRoles();
          } else {
            showAlert('Errore', data.message || 'Impossibile rimuovere il ruolo.');
          }
        } catch (err: any) {
          showAlert('Errore di rete', err.message);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Save/Update Geographic Area
  const handleSaveArea = async () => {
    if (!editingArea || !editingArea.name.trim() || !editingArea.countries.trim()) {
      showAlert('Dati mancanti', 'Il nome dell\'area e gli stati associati sono obbligatori.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await safeFetch('/api/admin/geographic-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({
          id: editingArea.id,
          name: editingArea.name,
          countries: editingArea.countries
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Salvato', data.message || 'Area geografica salvata correttamente.');
        setIsAreaFormOpen(false);
        setEditingArea(null);
        await fetchGeographicAreas();
      } else {
        showAlert('Errore', data.message || 'Impossibile salvare l\'area geografica.');
      }
    } catch (err: any) {
      showAlert('Errore di rete', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Geographic Area
  const handleDeleteArea = async (id: number) => {
    showConfirm(
      'Elimina Area Geografica',
      'Sei sicuro di voler eliminare irrevocabilmente questa area territoriale?',
      async () => {
        setActionLoading(true);
        try {
          const res = await safeFetch('/api/admin/geographic-areas', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': getAdminPassword()
            },
            body: JSON.stringify({ id })
          });
          const data = await res.json();
          if (data.success) {
            showAlert('Rimosso', data.message || 'Area geografica rimossa con successo.');
            await fetchGeographicAreas();
          } else {
            showAlert('Errore', data.message || 'Impossibile rimuovere l\'area geografica.');
          }
        } catch (err: any) {
          showAlert('Errore di rete', err.message);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomRoles();
      fetchGeographicAreas();
      if (activeTab === 'citizens') {
        fetchCitizens();
      } else if (activeTab === 'proposals') {
        fetchProposals();
      }
    }
  }, [isAuthenticated, activeTab]);

  // Citizen approval action
  const handleApprove = async (id: string | number) => {
    showConfirm(
      'Approva Candidato',
      'Sei sicuro di voler approvare questa domanda di cittadinanza? Verrà generata la ID card ufficiale e inviata via email.',
      async () => {
        setActionLoading(true);
        try {
          const res = await safeFetch('/api/admin/approve', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-admin-password': getAdminPassword()
            },
            body: JSON.stringify({ id })
          });
          const data = await res.json();
          if (data.success) {
            showAlert('Approvato', 'Pratica convalidata col massimo protocollo federale e inviata via email con successo!');
            await fetchCitizens();
            // Update selected view
            if (selectedCitizen && selectedCitizen.id === id) {
              if (data.citizen) {
                setSelectedCitizen(data.citizen);
              } else {
                setSelectedCitizen({ ...selectedCitizen, status: 'approved' });
              }
            }
          } else {
            showAlert('Errore', `Errore: ${data.message}`);
          }
        } catch (err: any) {
          showAlert('Errore di rete', `Errore di rete: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Citizen rejection action
  const submitRejection = async () => {
    if (!selectedCitizen) return;
    if (!rejectionReason.trim()) {
      showAlert('Motivo mancante', 'Inserire un motivo valido per il rifiuto.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await safeFetch('/api/admin/reject', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({ id: selectedCitizen.id, reason: rejectionReason })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Respinto', 'Pratica respinta correttamente e notifica email recapitata.');
        setRejectionModalOpen(false);
        setRejectionReason('');
        await fetchCitizens();
        // Update selected view
        if (selectedCitizen) {
          setSelectedCitizen({ ...selectedCitizen, status: 'rejected', rejectionReason });
        }
      } else {
        showAlert('Errore', `Errore: ${data.message}`);
      }
    } catch (err: any) {
      showAlert('Errore di rete', `Errore di rete: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Promote/Demote Citizen Administrator Role (Calls /api/admin/toggle-admin)
  const handleToggleAdmin = async (citizenId: string | number, currentIsAdmin: boolean) => {
    const targetVal = !currentIsAdmin;
    const title = targetVal ? "Abilita Amministratore" : "Revoca Amministratore";
    const msg = targetVal 
      ? "Abilitare questo cittadino come Co-Amministratore di Sistema autorizzato?" 
      : "Revocare i privilegi di Amministrazione per questo cittadino?";
    
    showConfirm(title, msg, async () => {
      setActionLoading(true);
      try {
        const res = await safeFetch('/api/admin/toggle-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': getAdminPassword()
          },
          body: JSON.stringify({ citizenId, isAdmin: targetVal })
        });
        const data = await res.json();
        if (data.success) {
          showAlert('Stato Aggiornato', data.message || 'Privilegi di Co-Amministrazione aggiornati correttamente.');
          await fetchCitizens();
          if (selectedCitizen && selectedCitizen.id === citizenId) {
            setSelectedCitizen({ ...selectedCitizen, isAdmin: targetVal });
          }
        } else {
          showAlert('Errore', `Errore: ${data.message}`);
        }
      } catch (err: any) {
        showAlert('Errore di rete', `Errore di rete: ${err.message}`);
      } finally {
        setActionLoading(false);
      }
    });
  };

  // Helper to parse multiple assigned roles for a citizen
  const getCitizenAssignedRoles = (roleField: string | null | undefined): any[] => {
    if (!roleField) return [];
    const trimmed = roleField.trim();
    if (trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch (err) {
        return [{ legacyName: roleField }];
      }
    }
    return [{ legacyName: roleField }];
  };

  // Toggle role assignment for Citizen (supporting multiple assignment)
  const handleToggleCitizenRole = async (citizenId: string | number, roleId: number, currentRoles: any[]) => {
    // Determine the new set of roles
    let updated: any[] = [];
    
    // Convert first any name-only legacy objects into proper ID references if they match a known custom role
    const processedCurrent = currentRoles.map((r: any) => {
      if (r.legacyName) {
        const found = customRoles.find(cr => cr.name === r.legacyName);
        return found ? { roleId: found.id } : r;
      }
      return r;
    });

    const alreadyExists = processedCurrent.some((r: any) => r.roleId === roleId);
    if (alreadyExists) {
      updated = processedCurrent.filter((r: any) => r.roleId !== roleId);
    } else {
      updated = [...processedCurrent, { roleId }];
    }

    // Prepare payload string
    const rolePayloadStr = updated.length > 0 ? JSON.stringify(updated) : '';

    setActionLoading(true);
    try {
      const res = await safeFetch('/api/admin/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({ citizenId, role: rolePayloadStr })
      });
      const data = await res.json();
      if (data.success) {
        // Aggiorna localmente
        await fetchCitizens();
        if (selectedCitizen && selectedCitizen.id === citizenId) {
          setSelectedCitizen({
            ...selectedCitizen,
            operationalRole: rolePayloadStr || null
          });
        }
      } else {
        showAlert('Errore', data.message || 'Errore durante l\'aggiornamento degli incarichi.');
      }
    } catch (err: any) {
      showAlert('Errore di connessione', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Assign Gov/Operational Task Assignments (Calls /api/admin/assign-role)
  const handleAssignRole = async (citizenId: string | number, role: string) => {
    setActionLoading(true);
    try {
      const res = await safeFetch('/api/admin/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({ citizenId, role: role === "Nessuno" ? null : role })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Ruolo Assegnato', data.message || 'Incarico operativo registrato correttamente sul passaporto digitale.');
        await fetchCitizens();
        if (selectedCitizen && selectedCitizen.id === citizenId) {
          setSelectedCitizen({ ...selectedCitizen, operationalRole: role === "Nessuno" ? null : role });
        }
      } else {
        showAlert('Errore', `Errore: ${data.message}`);
      }
    } catch (err: any) {
      showAlert('Errore di rete', `Errore di rete: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open scheduler for democracy votes
  const openScheduleModal = (proposal: any) => {
    setScheduleProposalId(proposal.id);
    
    // Default start now, end in 7 days
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 7);

    // Helper format for datetime-local
    const formatDateTime = (date: Date) => {
      const offsetMs = date.getTimezoneOffset() * 60 * 1000;
      const localDate = new Date(date.getTime() - offsetMs);
      return localDate.toISOString().slice(0, 16);
    };

    setVotingStartsAt(formatDateTime(now));
    setVotingEndsAt(formatDateTime(future));
    setScheduleModalOpen(true);
  };

  // Approve proposal and schedule direct democracy voting
  const handleProposalApproveWithSchedule = async () => {
    if (!scheduleProposalId) return;
    if (!votingStartsAt || !votingEndsAt) {
      showAlert('Dati parziali', 'Specificare data inizio e fine del referendum federale.');
      return;
    }

    if (new Date(votingEndsAt) <= new Date(votingStartsAt)) {
      showAlert('Errore date', 'La data di fine del referendum deve essere successiva alla data di inizio.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await safeFetch('/api/democracy/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({
          action: 'approve',
          proposal_id: scheduleProposalId,
          voting_starts_at: votingStartsAt,
          voting_ends_at: votingEndsAt
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Referendum Attivato', 'Proposta normativa convalidata e votazione programmata correttamente!');
        setScheduleModalOpen(false);
        await fetchProposals();
        if (selectedProposal && selectedProposal.id === scheduleProposalId) {
          setSelectedProposal(data.data);
        }
      } else {
        showAlert('Errore', `Errore: ${data.message}`);
      }
    } catch (err: any) {
      showAlert('Errore di rete', `Errore di rete: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Rigetto Rigososo modal
  const openProposalRejectionModal = (pId: number) => {
    setProposalRejectionId(pId);
    setProposalRejectionReason('');
    setProposalRejectionModalOpen(true);
  };

  // Reject proposal action
  const handleProposalReject = async () => {
    if (!proposalRejectionId) return;
    if (!proposalRejectionReason.trim()) {
      showAlert('Motivazione mancante', 'Specificare la motivazione del rigetto.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await safeFetch('/api/democracy/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({
          action: 'reject',
          proposal_id: proposalRejectionId,
          rejection_reason: proposalRejectionReason
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Proposta respinta', 'Proposta normativa respinta con motivazione inserita a archivio.');
        setProposalRejectionModalOpen(false);
        await fetchProposals();
        if (selectedProposal && selectedProposal.id === proposalRejectionId) {
          setSelectedProposal(data.data);
        }
      } else {
        showAlert('Errore', `Errore: ${data.message}`);
      }
    } catch (err: any) {
      showAlert('Errore di rete', `Errore di rete: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete proposal action (including voting cleanup)
  const handleProposalDelete = async (pId: number) => {
    showConfirm(
      'Elimina Proposta',
      'Sei sicuro di voler ELIMINARE DEFINITIVAMENTE questa proposta normativa dal portale federale? Questa operazione rasserrenerà l\'archivio cancellando anche tutti i voti legati e non è reversibile.',
      async () => {
        setActionLoading(true);
        try {
          const res = await safeFetch('/api/democracy/admin/action', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': getAdminPassword()
            },
            body: JSON.stringify({
              action: 'delete',
              proposal_id: pId
            })
          });
          const data = await res.json();
          if (data.success) {
            showAlert('Rimosso', 'Proposta normativa purgata con successo dal registro digitale.');
            setSelectedProposal(null);
            await fetchProposals();
          } else {
            showAlert('Errore', `Errore: ${data.message}`);
          }
        } catch (err: any) {
          showAlert('Errore di rete', `Errore di rete: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Counters
  const totalCount = citizens.length;
  const pendingCount = citizens.filter(c => !c.status || c.status === 'pending').length;
  const approvedCount = citizens.filter(c => c.status === 'approved').length;
  const rejectedCount = citizens.filter(c => c.status === 'rejected').length;

  // Filter citizens list
  const filteredCitizens = citizens.filter(cit => {
    const fullName = `${cit.firstName || ''} ${cit.surname || ''}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) || 
      (cit.citizenCode && cit.citizenCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cit.email && cit.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cit.username && cit.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const status = cit.status || 'pending';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    const correctPasswordOnServer = "NWSAdmin2026!";
    if (passwordInput === correctPasswordOnServer || passwordInput === "nwsadmin" || passwordInput === "admin") {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nws_admin_auth', 'true');
        sessionStorage.setItem('nws_admin_password', passwordInput);
      }
    } else {
      setPasswordError('Password di amministrazione non corretta. Riprova con credenziali autorizzate.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-3xl border border-brand-blue/10 shadow-xl overflow-hidden animate-fade-in p-8 md:p-12 max-w-md mx-auto my-8" id="admin-login-view">
        <div className="text-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-[#0a1c3e] text-[#c5a880] rounded-full flex items-center justify-center mx-auto text-2xl border-2 border-[#c5a880] shadow-md">
            <Shield className="w-8 h-8 text-[#f7f5f0]" />
          </div>
          <h2 className="text-2xl font-serif text-[#0a1c3e] tracking-tight">Accesso Amministrativo</h2>
          <p className="text-sm text-slate-500">
            Inserisci la password di amministrazione dell'Anagrafe del New World State per sbloccare la consolle di controllo.
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#0a1c3e]/70 block">
              Password Amministratore
            </label>
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#0a1c3e] focus:ring-1 focus:ring-[#0a1c3e] transition text-center font-mono placeholder:font-sans text-brand-blue focus:text-[#0a1c3e]"
              required
              autoFocus
            />
          </div>

          {passwordError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl text-center animate-fade-in">
              {passwordError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] py-3 rounded-xl font-bold text-sm tracking-wide transition shadow-lg active:scale-95 border-b-4 border-[#c5a880] hover:border-[#c5a880]/80"
          >
            Sblocca la Consolle
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
            New World State Official Protocol
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-brand-blue/10 shadow-xl overflow-hidden animate-fade-in" id="admin-console-view">
      
      {/* BANNER PRINCIPALE */}
      <div className="bg-[#0a1c3e] text-white p-8 border-b border-[#c5a880]/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#c5a880] text-xs font-semibold uppercase tracking-[0.2em]">
              <Shield className="w-4 h-4" /> Consolle Gestione Cittadini & Democrazia
            </div>
            <h2 className="text-3xl font-serif text-white tracking-tight mt-1">
              Consolle Federale di Controllo
            </h2>
            <p className="text-white/60 text-xs mt-1">
              Registro Centrale dello Stato - Gestione anagrafiche, incarichi operativi e convalida delle votazioni digitali.
            </p>
          </div>
          <button 
            onClick={activeTab === 'citizens' ? fetchCitizens : fetchProposals}
            disabled={loading || proposalsLoading}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-2.5 text-xs font-semibold transition border border-white/10 active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${(loading || proposalsLoading) ? 'animate-spin' : ''}`} /> 
            Aggiorna Registro
          </button>
        </div>
      </div>

      {/* METRICHE PRINCIPALI */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 text-slate-800">
        <div className="p-5 border-r border-slate-100 text-center bg-slate-50/20">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Registrati Totali</span>
          <span className="text-3xl font-serif font-bold text-[#0a1c3e] block mt-1">{totalCount}</span>
        </div>
        <div className="p-5 border-r border-slate-100 text-center bg-slate-50/20">
          <span className="text-amber-500 text-[10px] uppercase font-bold tracking-wider block flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" /> Da Validare
          </span>
          <span className="text-3xl font-serif font-bold text-amber-600 block mt-1">{pendingCount}</span>
        </div>
        <div className="p-5 border-r border-slate-100 text-center bg-slate-50/20">
          <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-wider block flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approvati NWS
          </span>
          <span className="text-3xl font-serif font-bold text-emerald-600 block mt-1">{approvedCount}</span>
        </div>
        <div className="p-5 text-center bg-slate-50/20">
          <span className="text-[#c5a880] text-[10px] uppercase font-bold tracking-wider block flex items-center justify-center gap-1">
            <FileText className="w-3 h-3" /> Referendum Popolari
          </span>
          <span className="text-3xl font-serif font-bold text-[#c5a880] block mt-1">{proposals.length}</span>
        </div>
      </div>

      {/* SELETTORE TAB */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <button
          onClick={() => { setActiveTab('citizens'); setSelectedCitizen(null); }}
          className={`flex-1 py-4 px-6 text-center font-serif font-bold text-sm border-b-2 flex items-center justify-center gap-2 transition ${activeTab === 'citizens' ? 'border-[#0a1c3e] text-[#0a1c3e] bg-white font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Users className="w-4 h-4 text-brand-gold" /> Anagrafe & Incarichi Governativi
        </button>
        <button
          onClick={() => { setActiveTab('proposals'); setSelectedProposal(null); }}
          className={`flex-1 py-4 px-6 text-center font-serif font-bold text-sm border-b-2 flex items-center justify-center gap-2 transition ${activeTab === 'proposals' ? 'border-[#0a1c3e] text-[#0a1c3e] bg-white font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <FileText className="w-4 h-4 text-brand-gold" /> Democrazia Normativa ({proposals.length})
        </button>
        <button
          onClick={() => { setActiveTab('roles'); }}
          className={`flex-1 py-4 px-6 text-center font-serif font-bold text-sm border-b-2 flex items-center justify-center gap-2 transition ${activeTab === 'roles' ? 'border-[#0a1c3e] text-[#0a1c3e] bg-white font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Globe className="w-4 h-4 text-brand-gold" /> Ruoli & Aree Geografiche
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* LATERALE CONTENUTO TAB (SINISTRA) */}
        <div className="lg:col-span-12 xl:col-span-8 p-6 md:p-8 space-y-6 border-r border-slate-100">
          
          {/* TAB 1: GESTIONE CITTADINI */}
          {activeTab === 'citizens' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cerca per cognome, codice, email o username..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-blue/10 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold bg-[#fbfbf9]"
                  />
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                  <span className="text-xs text-slate-400 hidden sm:inline">Stato pratica:</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-[#fbfbf9] px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tutte le anagrafiche</option>
                    <option value="pending font-semibold">In Attesa di Firma</option>
                    <option value="approved text-emerald-600">Approvati (Cittadini)</option>
                    <option value="rejected text-rose-600">Respinti</option>
                  </select>
                </div>
              </div>

              {/* Elenco Tabella */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                      <th className="py-4 px-5">Cognome e Nome</th>
                      <th className="py-4 px-4 font-mono">Codice Cittadino (16 cifre)</th>
                      <th className="py-4 px-4">Recapiti</th>
                      <th className="py-4 px-4">Ruoli / Incarichi</th>
                      <th className="py-4 px-4 text-center">Stato</th>
                      <th className="py-4 px-5 text-right">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {loading && citizens.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 px-5 text-center text-slate-400 text-xs">
                          <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-300" /> Caricamento in corso...
                        </td>
                      </tr>
                    ) : filteredCitizens.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 px-5 text-center text-slate-400 text-xs">
                          Nessun cittadino corrisponde ai criteri di ricerca
                        </td>
                      </tr>
                    ) : (
                      filteredCitizens.map(cit => {
                        const status = cit.status || 'pending';
                        const badgeClass = status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                           status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                           'bg-amber-50 text-amber-700 border-amber-100';
                        const badgeText = status === 'approved' ? 'Cittadino' :
                                          status === 'rejected' ? 'Respinto' : 'Ricevuto / Da Firmare';

                        return (
                          <tr 
                            key={cit.id}
                            className={`hover:bg-slate-50/50 transition cursor-pointer ${selectedCitizen && selectedCitizen.id === cit.id ? 'bg-amber-500/5' : ''}`}
                            onClick={() => setSelectedCitizen(cit)}
                          >
                            <td className="py-3.5 px-5">
                              <div className="font-semibold text-slate-900">{cit.surname} {cit.firstName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: #{cit.id}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-gold select-all">
                              {cit.citizenCode || 'DA ASSEGNARE'}
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              <div className="font-medium text-slate-800">{cit.email || 'Nessuna mail'}</div>
                              <div className="text-[10px] text-slate-400">{cit.phonePrefix || ''} {cit.phoneNumber || ''}</div>
                            </td>
                            <td className="py-3.5 px-4 text-xs space-y-1">
                              {cit.isAdmin && (
                                <span className="inline-flex items-center gap-0.5 bg-brand-blue text-[#f7f5f0] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  <Shield className="w-2.5 h-2.5" /> Admin
                                </span>
                              )}
                              {cit.operationalRole ? (
                                <div className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                                  <Briefcase className="w-2.5 h-2.5" /> {cit.operationalRole}
                                </div>
                              ) : (
                                !cit.isAdmin && <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${badgeClass}`}>
                                {badgeText}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right font-semibold" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => setSelectedCitizen(cit)}
                                className="inline-flex items-center gap-1 text-xs text-brand-blue hover:text-brand-gold"
                              >
                                <Eye className="w-3.5 h-3.5" /> Esamina
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: DEMOCRAZIA DIGITALE & PROPOSTE REFERENDUM */}
          {activeTab === 'proposals' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="font-serif text-[#0a1c3e] text-lg font-bold">Referendum e Iniziative Popolari</h3>
                  <p className="text-xs text-slate-400">Pannello di convalida delle riforme e di programmazione dei calendari di voto popolare.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filtro riforme:</span>
                  <select 
                    value={proposalStatusFilter}
                    onChange={(e) => setProposalStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-[#fbfbf9] px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tutte le proposte</option>
                    <option value="pending">In Attesa di Convalida</option>
                    <option value="approved">Votazione Referendaria Attiva</option>
                    <option value="rejected">Rigettate con Atto Motivato</option>
                    <option value="passed">Approvate dal Popolo</option>
                    <option value="failed">Respinte dal Popolo</option>
                  </select>
                </div>
              </div>

              {/* Registro delle Proposte */}
              {proposalsLoading ? (
                <div className="py-20 text-center space-y-3">
                  <RotateCw className="w-8 h-8 animate-spin mx-auto text-[#c5a880]" />
                  <p className="text-slate-400 text-xs">Ricerca proposte digitali della Costituzione...</p>
                </div>
              ) : proposalsError ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-800 text-xs">
                  {proposalsError}
                </div>
              ) : (
                <div className="space-y-3">
                  {proposals.filter(p => {
                    const status = p.status || 'pending';
                    return proposalStatusFilter === 'all' || status === proposalStatusFilter;
                  }).length === 0 ? (
                    <div className="py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      Nessuna proposta normativa presente in questo archivio federale.
                    </div>
                  ) : (
                    proposals.filter(p => {
                      const status = p.status || 'pending';
                      return proposalStatusFilter === 'all' || status === proposalStatusFilter;
                    }).map(prop => {
                      const status = prop.status || 'pending';
                      const badgeClass = status === 'approved' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                         status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                         status === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                         status === 'failed' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                         'bg-slate-50 text-[#0a1c3e] border-slate-200';
                      
                      const badgeText = status === 'pending' ? 'In Attesa Atto' :
                                        status === 'approved' ? 'Voto Attivo' :
                                        status === 'rejected' ? 'Rigettata' :
                                        status === 'passed' ? 'Approvata Referendum' : 'Respinta Referendum';

                      return (
                        <div 
                          key={prop.id}
                          onClick={() => setSelectedProposal(prop)}
                          className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white hover:shadow-md ${selectedProposal?.id === prop.id ? 'border-[#0a1c3e] ring-1 ring-[#0a1c3e] bg-[#0a1c3e]/5' : 'border-slate-100'}`}
                        >
                          <div className="space-y-1.5 max-w-xl">
                            <span className="text-[10px] font-mono text-brand-gold uppercase tracking-wider font-bold bg-amber-50 px-2 py-0.5 rounded">{prop.category || 'Generale'}</span>
                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{prop.title}</h4>
                            <p className="text-xs text-slate-400">Presentata da: <span className="font-semibold text-[#0a1c3e]">{prop.proponent_name || 'Cittadino NWS'}</span> • Data: {prop.created_at ? new Date(prop.created_at).toLocaleDateString() : 'Oggi'}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
                            <span className={`border text-[10px] font-bold tracking-wide rounded-full px-2.5 py-0.5 ${badgeClass}`}>
                              {badgeText}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GESTIONE INCARICHI & AREE GEOGRAFICHE */}
          {activeTab === 'roles' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="bg-[#0a1c3e]/5 p-4 rounded-2xl border border-[#0a1c3e]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-[#0a1c3e] font-serif font-bold text-base flex items-center gap-1.5">
                    🗂️ Registro Nomine, Deleghe & Circoscrizioni
                  </h3>
                  <p className="text-slate-500 text-[10.5px] mt-0.5 font-medium">Configura aree geopolitiche multilaterali e associa incarichi operativi ad esse collegati.</p>
                </div>
                <div className="flex gap-2 font-bold select-none">
                  <button
                    onClick={() => {
                      setEditingArea({ name: '', countries: '' });
                      setIsAreaFormOpen(true);
                      setEditingRole(null);
                      setIsRoleFormOpen(false);
                    }}
                    className="bg-brand-blue hover:bg-[#071530] text-[#f7f5f0] px-3 py-2 rounded-xl flex items-center gap-1 transition text-[10px] uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Area
                  </button>
                  <button
                    onClick={() => {
                      setEditingRole({ name: '', description: '', geographic_area_id: '' });
                      setIsRoleFormOpen(true);
                      setEditingArea(null);
                      setIsAreaFormOpen(false);
                    }}
                    className="bg-[#c5a880] hover:bg-[#b0936b] text-white px-3 py-2 rounded-xl flex items-center gap-1 transition text-[10px] uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ruolo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COLONNA AREE */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-serif font-bold text-sm text-[#0a1c3e] flex items-center gap-1.5">
                      🗺️ Aree Geografiche Operative ({geographicAreas.length})
                    </span>
                  </div>

                  {geographicAreas.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-semibold bg-slate-50/50">
                      Nessuna area configurata. Clicca "+ Area" per creare la prima circoscrizione geopolitica.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {geographicAreas.map(area => {
                        const associatedCount = customRoles.filter(r => r.geographic_area_id === area.id).length;
                        return (
                          <div key={area.id} className="p-3.5 rounded-xl border border-slate-150 bg-white hover:shadow-sm space-y-1.5 transition">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{area.name}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingArea({ id: area.id, name: area.name, countries: area.countries });
                                    setIsAreaFormOpen(true);
                                    setEditingRole(null);
                                    setIsRoleFormOpen(false);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[#0a1c3e] transition"
                                  title="Modifica Area"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteArea(area.id)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition"
                                  title="Rimuovi Area"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              <span className="font-bold text-slate-600">Stati/Territori:</span> {area.countries}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              Incarichi legati a questo territorio: <span className="font-bold text-brand-gold">{associatedCount}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* COLONNA RUOLI */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-serif font-bold text-sm text-[#0a1c3e] flex items-center gap-1.5">
                      🎖️ Registro degli Incarichi Operativi ({customRoles.length})
                    </span>
                  </div>

                  {rolesLoading ? (
                    <div className="p-6 text-center text-slate-400 font-semibold">Caricamento incarichi...</div>
                  ) : customRoles.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-semibold bg-slate-50/50">
                      Nessun ruolo configurato. Clicca "+ Ruolo" per inserire un nuovo incarico.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {customRoles.map(role => {
                        const area = geographicAreas.find(a => a.id === role.geographic_area_id);
                        return (
                          <div key={role.id} className="p-3.5 rounded-xl border border-slate-150 bg-white hover:shadow-sm space-y-1.5 transition">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-slate-800 text-xs">{role.name}</span>
                                {area && (
                                  <span className="ml-1.5 bg-[#c5a880]/15 text-[#8c7453] px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide">
                                    🌍 {area.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingRole({
                                      id: role.id,
                                      name: role.name,
                                      description: role.description || '',
                                      geographic_area_id: role.geographic_area_id ? String(role.geographic_area_id) : ''
                                    });
                                    setIsRoleFormOpen(true);
                                    setEditingArea(null);
                                    setIsAreaFormOpen(false);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[#0a1c3e] transition"
                                  title="Modifica Ruolo"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition"
                                  title="Rimuovi Ruolo"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {role.description && (
                              <p className="text-[10px] text-slate-500 leading-normal">{role.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* LATERALE DETTAGLIO / WORKSPACE (DESTRA) */}
        <div className="lg:col-span-12 xl:col-span-4 p-6 bg-slate-50/70 border-t xl:border-t-0 border-slate-100 flex flex-col justify-between min-h-[500px]">
          
          {/* RENDER DETTAGLIO CITTADINO */}
          {activeTab === 'citizens' && (
            selectedCitizen ? (
              <div className="space-y-6 animate-fade-in text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-mono bg-brand-gold/15 text-brand-gold px-2 py-0.5 rounded-full font-bold">Dossier ID: #{selectedCitizen.id}</span>
                    <h3 className="text-xl font-serif text-slate-900 mt-2">{selectedCitizen.surname} {selectedCitizen.firstName}</h3>
                    <p className="text-xs text-slate-400">Username: <span className="font-mono bg-white px-1 py-0.5 border border-slate-100 rounded text-slate-600 font-semibold">{selectedCitizen.username}</span></p>
                  </div>
                  <button 
                    onClick={() => setSelectedCitizen(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                  >
                    Chiudi
                  </button>
                </div>

                {/* Info List */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Classe di Cittadinanza</span>
                      <strong className="text-brand-blue font-semibold">{selectedCitizen.citizenship}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Luogo / Data di Nascita</span>
                      <strong className="text-slate-600">{selectedCitizen.birthDate || 'N/A'} a {selectedCitizen.birthPlace} ({selectedCitizen.birthCountry})</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">E-mail istituzionale</span>
                      <strong className="text-slate-700 select-all font-mono text-[11px]">{selectedCitizen.email}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Numero Registrato</span>
                      <strong className="text-slate-700">{selectedCitizen.phonePrefix || ''} {selectedCitizen.phoneNumber || 'N/D'}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Indirizzo Certificato</span>
                      <strong className="text-slate-700 leading-tight block">
                        {(() => {
                          const parts = [];
                          if (selectedCitizen.residenceAddress?.trim()) parts.push(selectedCitizen.residenceAddress.trim());
                          if (selectedCitizen.residenceNumber?.trim()) parts.push(selectedCitizen.residenceNumber.trim());
                          const street = parts.join(', ');

                          const secondParts = [];
                          if (selectedCitizen.residenceZip?.trim()) secondParts.push(selectedCitizen.residenceZip.trim());
                          if (selectedCitizen.residenceCity?.trim()) secondParts.push(selectedCitizen.residenceCity.trim());
                          if (selectedCitizen.residenceCountry?.trim()) secondParts.push(`(${selectedCitizen.residenceCountry.trim()})`);
                          const cityZip = secondParts.join(' ');

                          if (street && cityZip) return `${street} - ${cityZip}`;
                          if (street) return street;
                          if (cityZip) return cityZip;
                          return 'N/D';
                        })()}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Globe className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Plus Code Posizione</span>
                      <strong className="font-mono text-cyan-700 block">{selectedCitizen.plusCode || 'N/D'}</strong>
                    </div>
                  </div>
                </div>

                {/* Document allegati */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Documenti e Identità Digitale (Aruba Server)</span>
                  
                  <div className={`grid ${selectedCitizen.status === 'approved' ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-center font-bold text-[#0a1c3e]`}>
                    <a 
                      href={selectedCitizen.arubaFrontUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`border rounded-xl p-2.5 block transition ${selectedCitizen.arubaFrontUrl ? 'bg-white hover:border-brand-gold shadow-sm' : 'bg-slate-100 opacity-50 cursor-not-allowed'}`}
                    >
                      <div>Fronte</div>
                      <div className="text-[9px] text-[#c5a880] mt-1 flex items-center justify-center gap-0.5">Vedi <ExternalLink className="w-2.5 h-2.5" /></div>
                    </a>

                    <a 
                      href={selectedCitizen.arubaBackUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`border rounded-xl p-2.5 block transition ${selectedCitizen.arubaBackUrl ? 'bg-white hover:border-brand-gold shadow-sm' : 'bg-slate-100 opacity-50 cursor-not-allowed'}`}
                    >
                      <div>Retro</div>
                      <div className="text-[9px] text-[#c5a880] mt-1 flex items-center justify-center gap-0.5">Vedi <ExternalLink className="w-2.5 h-2.5" /></div>
                    </a>

                    <a 
                      href={selectedCitizen.arubaPhotoUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`border rounded-xl p-2.5 block transition ${selectedCitizen.arubaPhotoUrl ? 'bg-white hover:border-brand-gold shadow-sm' : 'bg-[#0a1c3e]/5 border-brand-gold/20'}`}
                    >
                      <div className="text-slate-800">Foto</div>
                      <div className="text-[9px] text-brand-gold mt-1 flex items-center justify-center gap-0.5">Vedi <ExternalLink className="w-2.5 h-2.5" /></div>
                    </a>

                    {selectedCitizen.status === 'approved' && (
                      <button 
                        onClick={async () => {
                          if (downloadingPdf) return;
                          setDownloadingPdf(true);
                          try {
                            const res = await safeFetch(`/api/admin/citizen-card?id=${selectedCitizen.id}`, {
                              headers: {
                                'x-admin-password': getAdminPassword()
                              }
                            });
                            if (!res.ok) throw new Error(`Status ${res.status}`);
                            const blob = await res.blob();
                            const blobUrl = window.URL.createObjectURL(blob);
                            
                            const newTab = window.open(blobUrl, '_blank');
                            if (!newTab) {
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              link.download = `Passaporto_NWS_${selectedCitizen.citizenCode || selectedCitizen.id}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          } catch (err: any) {
                            console.error('[PDF-DOWNLOAD-ERROR]:', err);
                            alert(`Errore download passaporto: ${err.message}`);
                          } finally {
                            setDownloadingPdf(false);
                          }
                        }}
                        disabled={downloadingPdf}
                        className="border rounded-xl p-2 text-center w-full bg-emerald-50 border-emerald-100 text-emerald-800 disabled:opacity-60 cursor-pointer outline-none"
                      >
                        <div className="font-bold flex items-center justify-center gap-1">
                          {downloadingPdf ? <RotateCw className="w-3 h-3 animate-spin" /> : <span>Passaporto</span>}
                        </div>
                        <div className="text-[9px] text-emerald-600 mt-1 flex items-center justify-center gap-0.5">PDF <ExternalLink className="w-2.5 h-2.5" /></div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Validation panels */}
                <div className="border border-slate-150 rounded-2xl bg-white p-5 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-100 pb-2">Azione di firma anagrafe</h4>
                  
                  {selectedCitizen.status === 'approved' ? (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-center font-bold text-[11px] border border-emerald-150 relative">
                      <div className="flex items-center justify-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-650" /> Domanda Firmata e Deliberata</div>
                      <div className="font-mono text-[10px] mt-1 tracking-wider font-bold">CODE: {selectedCitizen.citizenCode || 'N/A'}</div>
                    </div>
                  ) : selectedCitizen.status === 'rejected' ? (
                    <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl border border-rose-150 text-xs">
                      <div className="font-bold flex items-center gap-1"><XCircle className="w-4 h-4 text-rose-650" /> Domanda Respinta</div>
                      <p className="text-[11px] text-slate-500 italic mt-1.5">"Motivo: {selectedCitizen.rejectionReason}"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                      <button 
                        onClick={() => handleApprove(selectedCitizen.id)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-[#f7f5f0] rounded-xl py-2.5 transition active:scale-95 disabled:opacity-50"
                      >
                        Approva & Firma
                      </button>
                      <button 
                        onClick={() => {
                          setRejectionReason(selectedCitizen.rejectionReason || '');
                          setRejectionModalOpen(true);
                        }}
                        disabled={actionLoading}
                        className="bg-rose-500 hover:bg-rose-600 text-[#f7f5f0] rounded-xl py-2.5 transition active:scale-95 disabled:opacity-50"
                      >
                        Respingi
                      </button>
                    </div>
                  )}
                </div>

                {/* ENABLING ADMINS AND OPERATIONAL TASKS (ONLY FOR APPROVED CITIZENS) */}
                {selectedCitizen.status === 'approved' && (
                  <div className="border border-slate-150 rounded-2xl bg-white p-5 space-y-4 shadow-sm text-xs">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-[#0a1c3e]/10">
                      <Briefcase className="w-4 h-4 text-brand-gold" /> Nomine & Co-Amministrazione
                    </h4>

                    {/* Promozione Co-Amministratore */}
                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center gap-2">
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Ruolo Amministrativo</span>
                          <span className="text-[9px] text-slate-400 block leading-tight">Consente la gestione di anagrafiche e referendum</span>
                        </div>
                        <button
                          onClick={() => handleToggleAdmin(selectedCitizen.id, !!selectedCitizen.isAdmin)}
                          disabled={actionLoading}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition ${selectedCitizen.isAdmin ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-brand-blue text-[#f7f5f0] hover:bg-[#071530]'}`}
                        >
                          {selectedCitizen.isAdmin ? 'Ottieni Revoca' : 'Abilita'}
                        </button>
                      </div>
                      <div className="pt-2 text-[10px] font-semibold flex items-center gap-1">
                        Stato di Amministrazione: {selectedCitizen.isAdmin ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5 font-bold">
                            <Shield className="w-3 h-3 text-emerald-600" /> Abilitato (Amministratore)
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">Cittadino Ordinario</span>
                        )}
                      </div>
                    </div>

                    {/* Assegnazione Incarichi Operativi Multipli */}
                    <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div>
                        <label className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Incarichi Governativi Assegnati</label>
                        <span className="text-[9px] text-slate-400 block leading-tight">Puoi attribuire più incarichi contemporaneamente. Vengono salvati istantaneamente sui passaporti digitali.</span>
                      </div>
                      
                      {customRoles.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-medium">Nessun incarico registrato nel sistema federale. Accedi al tab "Ruoli & Aree Geografiche" per configurarne.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
                          {customRoles.map(role => {
                            const parsedAssigned = getCitizenAssignedRoles(selectedCitizen?.operationalRole);
                            const isAssigned = parsedAssigned.some((r: any) => r.roleId === role.id || r.legacyName === role.name);
                            const roleArea = geographicAreas.find(a => a.id === role.geographic_area_id);
                            
                            return (
                              <label 
                                key={role.id} 
                                className={`flex items-start gap-2.5 p-2 rounded-lg border text-[10px] cursor-pointer transition select-none ${
                                  isAssigned 
                                    ? 'bg-[#0a1c3e]/5 border-[#0a1c3e]/30 text-[#0a1c3e]' 
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  disabled={actionLoading}
                                  onChange={() => handleToggleCitizenRole(selectedCitizen.id, role.id, parsedAssigned)}
                                  className="mt-0.5 rounded border-slate-300 text-[#0a1c3e] focus:ring-[#0a1c3e] cursor-pointer"
                                />
                                <div className="flex-1 leading-tight">
                                  <div className="font-bold flex items-center flex-wrap gap-1">
                                    <span>{role.name}</span>
                                    {roleArea && (
                                      <span className="bg-[#c5a880]/15 text-[#8c7453] px-1 py-0.2 rounded text-[8px] font-semibold tracking-wide">
                                        🌍 {roleArea.name}
                                      </span>
                                    )}
                                  </div>
                                  {role.description && (
                                    <p className="text-[9px] text-slate-400 mt-0.5 min-w-0 break-words">{role.description}</p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Visualizzazione Legacy o non catalogati */}
                      {(() => {
                        const parsedAssigned = getCitizenAssignedRoles(selectedCitizen?.operationalRole);
                        const legacyUnmapped = parsedAssigned.filter((r: any) => 
                          r.legacyName && !customRoles.some(cr => cr.name === r.legacyName)
                        );
                        if (legacyUnmapped.length > 0) {
                          return (
                            <div className="pt-2 border-t border-slate-200/60">
                              <p className="text-[8px] uppercase tracking-wider font-bold text-amber-600">Incarichi Legacy rilevati:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {legacyUnmapped.map((r: any, idx: number) => (
                                  <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                    {r.legacyName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-10 text-slate-400">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold">Nessun dossier anagrafico esaminato</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Seleziona un cittadino o candidato dalla tabella anagrafica per esaminare i dettagli completi, i documenti caricati su Aruba e procedere con la validazione d'ingresso.</p>
              </div>
            )
          )}

          {/* RENDER DETTAGLIO PROPOSTA REFERENDUM */}
          {activeTab === 'proposals' && (
            selectedProposal ? (
              <div className="space-y-6 animate-fade-in text-xs">
                {/* Intestazione */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-mono bg-brand-gold/15 text-brand-gold px-2 py-0.5 rounded-full font-bold">Proposta Legge #{selectedProposal.id}</span>
                    <button 
                      onClick={() => setSelectedProposal(null)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                    >
                      Chiudi
                    </button>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-slate-900 leading-snug">{selectedProposal.title}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Richiedente: <strong className="text-slate-700">{selectedProposal.proponent_name || 'Cittadino Anonimo'}</strong></p>
                </div>

                {/* Testo Proposta */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descrizione Proposta</h4>
                  <p className="text-slate-650 leading-relaxed font-semibold">{selectedProposal.description || 'Nessuna descrizione'}</p>
                  
                  <hr className="border-t border-slate-100 my-3" />
                  
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Testo Normativo Dettagliato</h4>
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-slate-700 font-mono break-words leading-relaxed whitespace-pre-wrap max-h-[180px] overflow-y-auto text-[11px]">
                    {selectedProposal.content}
                  </div>
                </div>

                {/* Votazioni ed Esiti */}
                {selectedProposal.status !== 'pending' && selectedProposal.status !== 'rejected' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                      <span>Quorum e Voti</span>
                      <span className="font-mono text-brand-blue font-bold">Totale: {Number(selectedProposal.yes_votes || 0) + Number(selectedProposal.no_votes || 0)} voti</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-center font-serif text-[#0a1c3e]">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-emerald-650 font-sans block">SÌ (Favorevoli)</span>
                        <strong className="text-2xl text-emerald-700 block mt-1">{selectedProposal.yes_votes || 0}</strong>
                      </div>
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-rose-650 font-sans block">NO (Contrari)</span>
                        <strong className="text-2xl text-rose-700 block mt-1">{selectedProposal.no_votes || 0}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between"><span>Inizio Voto:</span> <strong className="text-slate-700">{selectedProposal.voting_starts_at ? new Date(selectedProposal.voting_starts_at).toLocaleString('it-IT') : 'N/A'}</strong></div>
                      <div className="flex justify-between"><span>Chiusura Voto:</span> <strong className="text-slate-700">{selectedProposal.voting_ends_at ? new Date(selectedProposal.voting_ends_at).toLocaleString('it-IT') : 'N/A'}</strong></div>
                    </div>
                  </div>
                )}

                {/* Azioni Amministrative Proposta */}
                <div className="border border-slate-150 rounded-2xl bg-white p-5 space-y-3.5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">Revisione Referendaria</h4>

                  {selectedProposal.status === 'pending' ? (
                    <div className="space-y-2.5">
                      <button 
                        onClick={() => openScheduleModal(selectedProposal)}
                        disabled={actionLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-bold transition flex items-center justify-center gap-1.5 focus:outline-none active:scale-95 text-xs shadow-md border-b-2 border-emerald-800 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" /> Convalida e Programma Votazione
                      </button>
                      
                      <button 
                        onClick={() => openProposalRejectionModal(selectedProposal.id)}
                        disabled={actionLoading}
                        className="w-full bg-rose-500 hover:bg-rose-650 text-white rounded-xl py-2.5 font-bold transition flex items-center justify-center gap-1.5 focus:outline-none active:scale-95 text-xs cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Respingi Proposta Normativa
                      </button>
                    </div>
                  ) : selectedProposal.status === 'rejected' ? (
                    <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 text-xs font-semibold space-y-1">
                      <div className="font-bold uppercase tracking-wider text-rose-950">Proposta Rigettata dall'Amministrazione</div>
                      <p className="text-[11px] text-slate-500 italic">"Motivo: {selectedProposal.rejection_reason}"</p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 font-semibold text-xs text-center">
                      Stato del Referendum: <strong className="uppercase block text-sm mt-1">{selectedProposal.status}</strong>
                    </div>
                  )}

                  {/* Possibilità di rimozione definitiva */}
                  <button
                    onClick={() => handleProposalDelete(selectedProposal.id)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 hover:text-rose-600 text-slate-400 py-2.5 rounded-xl text-xs font-semibold transition mt-2 cursor-pointer border border-slate-100"
                  >
                    <Trash className="w-4 h-4" /> Elimina Permanentemente Proposta
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-10 text-slate-400">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold">Nessuna proposta esaminata</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Seleziona una legge o iniziativa cittadina dal registro per aprirne i dettagli e valutarne la pubblicazione referendaria istituzionale.</p>
              </div>
            )
          )}

          {/* TAB 3: RENDER DETTAGLIO ED EDITIONS INCARICHI / AREE */}
          {activeTab === 'roles' && (
            isAreaFormOpen && editingArea ? (
              <div className="space-y-6 animate-fade-in text-xs flex flex-col justify-between h-full">
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] uppercase font-mono bg-[#c5a880]/15 text-[#8c7453] px-2 py-0.5 rounded-full font-bold">Territori Geopolitici</span>
                    <h3 className="text-lg font-serif text-slate-900 mt-2">{editingArea.id ? 'Modifica Area Geografica' : 'Nuova Area Geografica'}</h3>
                    <p className="text-slate-400 text-[10px]">Crea o aggiorna circoscrizioni territoriali composte da uno o più stati per deleghe diplomatiche.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-[10px] uppercase">Nome dell'Area Geografica</label>
                      <input
                        type="text"
                        value={editingArea.name}
                        onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                        placeholder="es. Europa, Italia e Francia, India"
                        className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] text-slate-800 bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-[10px] uppercase">Stati del Globo Compresi (Costituita da uno o più stati)</label>
                      <textarea
                        rows={5}
                        value={editingArea.countries}
                        onChange={(e) => setEditingArea({ ...editingArea, countries: e.target.value })}
                        placeholder="es. Italia, Francia (oppure 'Tutto il globo' o 'Europa')"
                        className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 text-xs font-bold justify-end pt-4 border-t border-slate-100 mt-6">
                  <button
                    onClick={() => {
                      setIsAreaFormOpen(false);
                      setEditingArea(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveArea}
                    disabled={actionLoading}
                    className="bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] px-5 py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> {editingArea.id ? 'Salva Modifiche' : 'Crea Area'}
                  </button>
                </div>
              </div>
            ) : isRoleFormOpen && editingRole ? (
              <div className="space-y-6 animate-fade-in text-xs flex flex-col justify-between h-full">
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] uppercase font-mono bg-[#c5a880]/15 text-[#8c7453] px-2 py-0.5 rounded-full font-bold">Delega Operativa</span>
                    <h3 className="text-lg font-serif text-slate-900 mt-2">{editingRole.id ? 'Modifica Incarico' : 'Nuovo Incarico Operativo'}</h3>
                    <p className="text-slate-400 text-[10px]">Crea o aggiorna cariche e attribuzioni legandole ad una specifica circoscrizione geopolitica.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-[10px] uppercase">Nome Incarico Governativo</label>
                      <input
                        type="text"
                        value={editingRole.name}
                        onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                        placeholder="es. Ambasciatore Digitale, Ufficiale di Pace"
                        className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] text-slate-800 bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-[10px] uppercase">Descrizione Funzioni</label>
                      <textarea
                        rows={4}
                        value={editingRole.description}
                        onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                        placeholder="Fornisci una descrizione dettagliata delle attribuzioni e dei poteri conferiti per questo incarico operante..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] text-slate-800 bg-white opacity-95"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-[10px] uppercase">Area Geografica per questo Ruolo</label>
                      <select
                        value={editingRole.geographic_area_id}
                        onChange={(e) => setEditingRole({ ...editingRole, geographic_area_id: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] text-slate-800 bg-white cursor-pointer"
                      >
                        <option value="">-- Nessun vincolo territoriale (Globale) --</option>
                        {geographicAreas.map(area => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 text-xs font-bold justify-end pt-4 border-t border-slate-100 mt-6">
                  <button
                    onClick={() => {
                      setIsRoleFormOpen(false);
                      setEditingRole(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveRole}
                    disabled={actionLoading}
                    className="bg-brand-blue hover:bg-[#071530] text-[#f7f5f0] px-5 py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> {editingRole.id ? 'Salva Incarico' : 'Crea Incarico'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-10 text-slate-400 h-full min-h-[400px]">
                <Globe className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold">Pannello Deleghe & Territori</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
                  Seleziona un'area geografica o un incarico per aprirne il dossier istituzionale in modifica, oppure utilizza i pulsanti di creazione in alto per inserire nuove cariche governative federate.
                </p>
              </div>
            )
          )}

        </div>
      </div>

      {/* MODAL 1: REJECT CITIZEN */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-[#0a1c3e]/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-100 flex flex-col space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-rose-500">✕</span> Rigetto Pratica Anagrafica
            </h3>
            <p className="text-xs text-slate-500">Fornisci una motivazione chiara e specifica. Questa verrà recapitata formalmente via email al candidato per correggere gli atti anagrafici incongruenti.</p>
            
            <textarea 
              rows={4} 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Esempio: Foto tessera sbiadita o Hash firma non corrispondente..."
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 bg-slate-50 outline-none"
            />

            <div className="flex gap-3 text-xs font-bold justify-end pt-2">
              <button 
                onClick={() => setRejectionModalOpen(false)}
                className="bg-slate-150 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Annulla
              </button>
              <button 
                onClick={submitRejection}
                disabled={actionLoading}
                className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer text-xs"
              >
                Invia e Respingi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REFERENDUM SCHEDULER & VOTING PROGRAMMING */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-[#0a1c3e]/65 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-100 flex flex-col space-y-4 animate-scale-up text-xs">
            <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="w-5 h-5 text-[#c5a880]" /> Schedulatore Referendum
            </h3>
            <p className="text-xs text-slate-500">Convalida la proposta e programma l'intervallo temporale formale durante il quale i cittadini registrati esprimeranno il loro voto popolare.</p>

            {/* Inizio */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block text-[11px] uppercase">Data e Ora di Apertura Votazione</label>
              <input 
                type="datetime-local" 
                value={votingStartsAt}
                onChange={(e) => setVotingStartsAt(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-semibold text-slate-700"
              />
            </div>

            {/* Fine */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block text-[11px] uppercase">Data e Ora di Chiusura Votazione</label>
              <input 
                type="datetime-local" 
                value={votingEndsAt}
                onChange={(e) => setVotingEndsAt(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-semibold text-slate-700"
              />
              <p className="text-[10px] text-slate-400">Si consiglia una durata referendaria minima di 7 giorni per favorire la partecipazione democratica.</p>
            </div>

            <div className="flex gap-3 text-xs font-bold justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setScheduleModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Annulla
              </button>
              <button 
                onClick={handleProposalApproveWithSchedule}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer text-xs shadow-md border-b-2 border-emerald-800"
              >
                <CheckCircle className="w-4 h-4" /> Convalida e Pubblica Referendum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RIGETTO PROPOSTA STRUTTURATO */}
      {proposalRejectionModalOpen && (
        <div className="fixed inset-0 bg-[#0a1c3e]/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-105 flex flex-col space-y-4 animate-scale-up text-xs">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-rose-500">✕</span> Atto di Rigetto Legge
            </h3>
            <p className="text-xs text-slate-500 font-semibold">Crea un registro formale precisando la motivazione del rigetto della proposta normativa (es. non costituzionalità o duplicazione).</p>
            
            <textarea 
              rows={4} 
              value={proposalRejectionReason}
              onChange={(e) => setProposalRejectionReason(e.target.value)}
              placeholder="Inserire le motivazioni formali dell'amministrazione..."
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 bg-slate-50 outline-none"
            />

            <div className="flex gap-3 text-xs font-bold justify-end pt-2">
              <button 
                onClick={() => setProposalRejectionModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Annulla
              </button>
              <button 
                onClick={handleProposalReject}
                disabled={actionLoading}
                className="bg-rose-650 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer text-xs"
              >
                Registra Rigetto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegante Modal di Notifica / Conferma Personalizzato (Bypassa sandbox iframe e alert obsoleti) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="custom-system-dialog">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 space-y-5 transform scale-100 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${dialog.type === 'confirm' ? 'bg-[#0a1c3e]/10 text-[#0a1c3e]' : 'bg-brand-gold/10 text-[#c5a880]'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#0a1c3e] tracking-tight">{dialog.title}</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">{dialog.message}</p>
            
            <div className="flex items-center justify-end gap-2 pt-2">
              {dialog.type === 'confirm' && (
                <button
                  onClick={dialog.onCancel}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Annulla
                </button>
              )}
              <button
                onClick={dialog.onConfirm}
                className="px-4 py-2 bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] border-b-2 border-[#c5a880] rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                {dialog.type === 'confirm' ? 'Conferma' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
