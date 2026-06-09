import { exportMultiPiecePdf } from './components/exportPdf';
// App.tsx
import { useCallback, useEffect, useState } from 'react';
import fieldfabLogo from './assets/field_fab.jpg';
import './App.css';
import { PipeSpecForm } from './components/PipeSpecForm';
import PickerModal from './components/PickerModal';
import ProjectsMenu from './components/projectsmenu';
import WeldedOutletForm from './components/WeldedOutletForm';
import PipeSketch from './components/PipeSketch';
import LooseMaterialForm from './components/LooseMaterialForm';
import type { MaterialItem } from './components/LooseMaterialForm';
import MarketingLanding from './components/MarketingLanding';
import type { Project, Piece, Outlet } from './types';
import { exportToCSV, exportToExcel, exportToPDF } from './utils/looseMaterialExport';
import { isLoggedIn } from './api/client';
import { fetchMe, logout } from './api/auth';
import type { AuthUser } from './api/auth';
import { ApiError } from './api/client';
import { fetchProjects, createProject } from './api/projects';
import type { ApiProject } from './api/projects';
import { fetchPieces, createPiece, updatePiece, deletePiece } from './api/pieces';
import type { PiecePayload, ApiPiece } from './api/pieces';
import {
  fetchLooseMaterials,
  createLooseMaterial,
  updateLooseMaterial,
  deleteLooseMaterial,
} from './api/looseMaterials';
import type { LooseMaterialPayload, ApiLooseMaterial } from './api/looseMaterials';

// ── Conversion helpers ────────────────────────────────────────────────────────

function apiProjectToProject(api: ApiProject): Project {
  return {
    id: api.id,
    name: api.name,
    companyName: api.company_name ?? '',
    streetNumber: api.street_number ?? '',
    streetName: api.street_name ?? '',
    city: api.city ?? '',
    zipcode: api.zipcode ?? '',
    pieces: [],
    looseMaterials: [],
    createdAt: api.created_at,
    updatedAt: api.created_at,
    schemaVersion: 1,
  };
}

function pieceToPiecePayload(piece: Piece, orderIndex: number): PiecePayload {
  return {
    order_index: orderIndex,
    qty: Number(piece.qty ?? 1),
    feet: piece.feet ?? '',
    inches: piece.inches ?? '',
    pipe_type: piece.pipeType ?? '',
    pipe_tag: piece.pipeTag ?? '',
    diameter: piece.diameter ?? '',
    fittings_end1: piece.fittingsEnd1 ?? '',
    fittings_end2: piece.fittingsEnd2 ?? '',
    outlets: piece.outlets ?? [],
  };
}

function apiPieceToFrontend(api: ApiPiece): Piece {
  return {
    id: api.id,
    qty: api.qty,
    feet: api.feet,
    inches: api.inches,
    pipeType: api.pipe_type,
    pipeTag: api.pipe_tag,
    diameter: api.diameter,
    fittingsEnd1: api.fittings_end1,
    fittingsEnd2: api.fittings_end2,
    outlets: api.outlets ?? [],
  };
}

function materialToPayload(material: MaterialItem, orderIndex: number): LooseMaterialPayload {
  return {
    order_index: orderIndex,
    qty: material.qty,
    part: material.part,
    size: material.size,
    description: material.description,
    mat_type: material.type,
    options: material.options ?? [],
    sizes: material.sizes ?? [],
  };
}

function apiMatToMaterialItem(api: ApiLooseMaterial): MaterialItem {
  return {
    id: String(api.id),
    qty: api.qty,
    part: api.part,
    size: api.size,
    description: api.description,
    type: api.mat_type,
    options: api.options ?? [],
    sizes: api.sizes ?? [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseInches(val: string): number {
  const cleaned = String(val ?? '').replace(/"/g, '').trim();
  if (!cleaned) return 0;
  if (/^\d+(\.\d+)?$/.test(cleaned)) return parseFloat(cleaned);
  if (/^\d+\/\d+$/.test(cleaned)) {
    const [num, denom] = cleaned.split('/').map(Number);
    return denom ? num / denom : 0;
  }
  if (/^\d+ \d+\/\d+$/.test(cleaned)) {
    const [whole, frac] = cleaned.split(' ');
    const [num, denom] = frac.split('/').map(Number);
    return parseInt(whole) + (denom ? num / denom : 0);
  }
  return 0;
}

function parseFeet(val: string): number {
  const parsed = Number(String(val ?? '').replace(/'/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

function lengthToPieceFields(totalInches: number): Pick<Piece, 'feet' | 'inches'> {
  const eighths = Math.max(0, Math.round(totalInches * 8));
  const feet = Math.floor(eighths / 96);
  const remainingEighths = eighths - feet * 96;
  const wholeInches = Math.floor(remainingEighths / 8);
  const fracNum = remainingEighths % 8;

  if (fracNum === 0) {
    return { feet: String(feet), inches: String(wholeInches) };
  }

  const divisor = gcd(fracNum, 8);
  const num = fracNum / divisor;
  const den = 8 / divisor;
  const inches = wholeInches === 0 ? `${num}/${den}` : `${wholeInches} ${num}/${den}`;

  return { feet: String(feet), inches };
}

const FREE_PLAN_PROJECT_LIMIT = 3;
const STRIPE_UPGRADE_URL = import.meta.env.VITE_STRIPE_UPGRADE_URL as string | undefined;
const BILLING_EMAIL = import.meta.env.VITE_BILLING_EMAIL ?? 'billing@fieldfab.app';

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showProjectsMenu, setShowProjectsMenu] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [showPieceForm, setShowPieceForm] = useState(false);
  const [editPieceIndex, setEditPieceIndex] = useState<number | null>(null);
  const [showOutletForm, setShowOutletForm] = useState(false);
  const [editOutletIndex, setEditOutletIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'fabrication' | 'loosematerial'>('fabrication');
  const [looseMaterials, setLooseMaterials] = useState<MaterialItem[]>([]);
  const [editMaterialIndex, setEditMaterialIndex] = useState<number | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [previewOutlets, setPreviewOutlets] = useState<Outlet[] | null>(null);
  const [previewPipeLength, setPreviewPipeLength] = useState<number | null>(null);

  const handleAuthExpired = useCallback(() => {
    logout();
    setIsAuthenticated(false);
    setCurrentProject(null);
    setPieces([]);
    setLooseMaterials([]);
    setApiProjects([]);
    setCurrentUser(null);
    setShowPicker(false);
    setShowProjectsMenu(false);
    setShowUpgradePrompt(false);
    setPreviewOutlets(null);
    setPreviewPipeLength(null);
  }, []);

  // Remove legacy browser-cache data from pre-auth architecture.
  useEffect(() => {
    localStorage.removeItem('fieldfab:projects');
  }, []);

  const handleUpgradeClick = () => {
    if (STRIPE_UPGRADE_URL) {
      window.open(STRIPE_UPGRADE_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.href = `mailto:${BILLING_EMAIL}?subject=FieldFab Pro Upgrade`;
  };

  // Export all pieces to PDF (3 per page, job info header)
  const handleExportAllPdf = async () => {
    if (!currentProject || pieces.length === 0) return;
    await exportMultiPiecePdf(currentProject, pieces);
  };

  // Load project list when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProjects()
      .then(setApiProjects)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          handleAuthExpired();
          return;
        }
        console.error(err);
      });
  }, [handleAuthExpired, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMe()
      .then(setCurrentUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          handleAuthExpired();
          return;
        }
        console.error(err);
      });
  }, [handleAuthExpired, isAuthenticated]);

  // Select project from server state on each session start.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (apiProjects.length === 0) {
      setCurrentProject(null);
      setPieces([]);
      setLooseMaterials([]);
      setShowPicker(true);
      return;
    }

    setShowPicker(false);

    const selected = currentProject
      ? apiProjects.find((p) => p.id === currentProject.id)
      : undefined;
    const projectToLoad = selected ?? apiProjects[0];

    if (currentProject?.id === projectToLoad.id) return;

    setCurrentProject(apiProjectToProject(projectToLoad));
    loadProjectData(projectToLoad.id).catch(console.error);
  }, [isAuthenticated, apiProjects, currentProject]);

  const loadProjectData = async (projectId: number) => {
    const [piecesData, matsData] = await Promise.all([
      fetchPieces(projectId),
      fetchLooseMaterials(projectId),
    ]);
    setPreviewOutlets(null);
    setPreviewPipeLength(null);
    setPieces(piecesData.map(apiPieceToFrontend));
    setLooseMaterials(matsData.map(apiMatToMaterialItem));
  };

  // ── Project creation ────────────────────────────────────────────────────────

  const handleModalSubmit = async ({
    companyName,
    jobName,
    streetNumber,
    streetName,
    city,
    zipcode,
  }: {
    companyName: string;
    jobName: string;
    streetNumber: string;
    streetName: string;
    city: string;
    zipcode: string;
  }) => {
    try {
      const created = await createProject({
        name: jobName,
        company_name: companyName,
        street_number: streetNumber,
        street_name: streetName,
        city,
        zipcode,
      });
      setApiProjects((prev) => [...prev, created]);
      setCurrentProject(apiProjectToProject(created));
      setPieces([]);
      setLooseMaterials([]);
      setPreviewPipeLength(null);
      setShowPicker(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          handleAuthExpired();
          return;
        }
        if (err.status === 403) {
          setShowUpgradePrompt(true);
        }
        alert(err.message);
      }
    }
  };

  // ── Select existing project ─────────────────────────────────────────────────

  const handleSelectProject = async (p: Project) => {
    setCurrentProject(p);
    setPieces([]);
    setLooseMaterials([]);
    setShowPicker(false);
    setShowProjectsMenu(false);
    await loadProjectData(p.id);
  };

  // ── Pieces ──────────────────────────────────────────────────────────────────

  const handleCreatePiece = async (piece: Piece) => {
    if (!currentProject) return false;
    try {
      if (editPieceIndex !== null) {
        const existing = pieces[editPieceIndex];
        if (!existing || existing.id == null) {
          alert('Unable to update piece: missing piece ID.');
          return false;
        }
        const payload = pieceToPiecePayload(
          { ...piece, id: existing.id, outlets: existing.outlets ?? [] },
          editPieceIndex,
        );
        const updated = await updatePiece(currentProject.id, existing.id, payload);
        setPieces((prev) => prev.map((p, i) => (i === editPieceIndex ? apiPieceToFrontend(updated) : p)));
        setPreviewOutlets(null);
        setPreviewPipeLength(null);
      } else {
        const payload = pieceToPiecePayload(piece, pieces.length);
        const created = await createPiece(currentProject.id, payload);
        setPieces((prev) => [...prev, apiPieceToFrontend(created)]);
        setPreviewOutlets(null);
        setPreviewPipeLength(null);
      }
      setEditPieceIndex(null);
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          handleAuthExpired();
          return false;
        }
        alert(err.message);
      }
      return false;
    }
  };

  const handleDeletePiece = async (idx: number) => {
    if (!currentProject) return;
    const piece = pieces[idx];
    if (!piece || piece.id == null) {
      alert('Unable to delete piece: missing piece ID.');
      return;
    }
    try {
      await deletePiece(currentProject.id, piece.id);
      setPieces((prev) => prev.filter((_, i) => i !== idx));
      setPreviewOutlets(null);
      setPreviewPipeLength(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          handleAuthExpired();
          return;
        }
        alert(err.message);
      }
    }
  };

  // ── Outlets (stored inside the last piece) ──────────────────────────────────

  const handleOutletChange = async (newOutlets: Outlet[]) => {
    if (!currentProject || pieces.length === 0) return false;
    const lastIdx = pieces.length - 1;
    const lastPiece = pieces[lastIdx];
    if (!lastPiece || lastPiece.id == null) {
      alert('Unable to update outlets: missing piece ID.');
      return false;
    }
    const payload = pieceToPiecePayload({ ...lastPiece, outlets: newOutlets }, lastIdx);
    try {
      const updated = await updatePiece(currentProject.id, lastPiece.id, payload);
      setPieces((prev) => prev.map((p, i) => (i === lastIdx ? apiPieceToFrontend(updated) : p)));
      setPreviewOutlets(null);
      setPreviewPipeLength(null);
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          handleAuthExpired();
          return false;
        }
        alert(err.message);
      }
      setPreviewOutlets(null);
      return false;
    }
  };

  const handleOutletLocationPreview = (index: number, location: number) => {
    const lastPiece = pieces[pieces.length - 1];
    const savedOutlets = lastPiece?.outlets ?? [];
    if (!savedOutlets[index]) return;

    setPreviewOutlets(
      savedOutlets.map((outlet, outletIndex) =>
        outletIndex === index ? { ...outlet, location } : outlet,
      ),
    );
  };

  const handleOutletLocationCommit = async (index: number, location: number) => {
    const lastPiece = pieces[pieces.length - 1];
    const savedOutlets = lastPiece?.outlets ?? [];
    if (!savedOutlets[index]) {
      setPreviewOutlets(null);
      return;
    }

    const nextOutlets = savedOutlets.map((outlet, outletIndex) =>
      outletIndex === index ? { ...outlet, location } : outlet,
    );

    const saved = await handleOutletChange(nextOutlets);
    if (!saved) setPreviewOutlets(null);
  };

  const handlePipeLengthPreview = (nextLength: number) => {
    setPreviewPipeLength(nextLength);
  };

  const handlePipeLengthCommit = async (nextLength: number) => {
    if (!currentProject || pieces.length === 0) {
      setPreviewPipeLength(null);
      return;
    }

    const lastIdx = pieces.length - 1;
    const lastPiece = pieces[lastIdx];
    if (!lastPiece || lastPiece.id == null) {
      alert('Unable to update pipe length: missing piece ID.');
      setPreviewPipeLength(null);
      return;
    }

    const minLength = Math.max(1, ...(lastPiece.outlets ?? []).map((outlet) => Number(outlet.location) || 0));
    const clampedLength = Math.max(minLength, Math.round(nextLength * 8) / 8);
    const lengthFields = lengthToPieceFields(clampedLength);
    const payload = pieceToPiecePayload({ ...lastPiece, ...lengthFields }, lastIdx);

    try {
      const updated = await updatePiece(currentProject.id, lastPiece.id, payload);
      setPieces((prev) => prev.map((p, i) => (i === lastIdx ? apiPieceToFrontend(updated) : p)));
      setPreviewPipeLength(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          handleAuthExpired();
          return;
        }
        alert(err.message);
      }
      setPreviewPipeLength(null);
    }
  };

  // ── Loose Materials ─────────────────────────────────────────────────────────

  const handleAddMaterial = async (material: MaterialItem) => {
    if (!currentProject) return;
    try {
      const payload = materialToPayload(material, looseMaterials.length);
      const created = await createLooseMaterial(currentProject.id, payload);
      setLooseMaterials((prev) => [...prev, apiMatToMaterialItem(created)]);
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    }
  };

  const handleUpdateMaterial = async (material: MaterialItem) => {
    if (!currentProject || editMaterialIndex === null) return;
    const existing = looseMaterials[editMaterialIndex];
    try {
      const payload = materialToPayload(material, editMaterialIndex);
      const updated = await updateLooseMaterial(
        currentProject.id,
        parseInt(existing.id, 10),
        payload,
      );
      setLooseMaterials((prev) =>
        prev.map((m, i) => (i === editMaterialIndex ? apiMatToMaterialItem(updated) : m)),
      );
      setEditMaterialIndex(null);
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    }
  };

  const handleDeleteMaterial = async (material: MaterialItem) => {
    if (!currentProject) return;
    try {
      await deleteLooseMaterial(currentProject.id, parseInt(material.id, 10));
      setLooseMaterials((prev) => prev.filter((m) => m.id !== material.id));
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    }
  };

  // ── Auth ────────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setCurrentProject(null);
    setPieces([]);
    setLooseMaterials([]);
    setApiProjects([]);
    setCurrentUser(null);
    setShowUpgradePrompt(false);
  };

  if (!isAuthenticated) {
    return <MarketingLanding onAuth={() => setIsAuthenticated(true)} />;
  }

  const projectList = apiProjects.map(apiProjectToProject);
  const currentPiece = pieces.length > 0 ? pieces[pieces.length - 1] : undefined;
  const currentPieceFeet = currentPiece ? parseFeet(currentPiece.feet) : 0;
  const savedCurrentPieceLength = currentPiece ? (currentPieceFeet * 12 + parseInches(currentPiece.inches)) : 0;
  const currentPieceLength = previewPipeLength ?? savedCurrentPieceLength;
  const currentOutlets = previewOutlets ?? currentPiece?.outlets ?? [];
  const currentMinPipeLength = Math.max(1, ...currentOutlets.map((outlet) => Number(outlet.location) || 0));
  const isProPlan = currentUser?.plan_type === 'pro';

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(1200px 700px at 95% -10%, rgba(72, 149, 255, 0.26), transparent 60%), radial-gradient(700px 400px at -10% 90%, rgba(245, 124, 0, 0.18), transparent 60%), linear-gradient(180deg, #0f172a 0%, #13233f 55%, #1b2f52 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: 0,
          width: '100%',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <div
          className="fieldfab-header-card"
          style={{
            marginTop: 20,
            marginBottom: 20,
            background: 'rgba(243, 248, 255, 0.92)',
            borderRadius: 20,
            boxShadow: '0 4px 32px 0 #0002',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '95vw',
            width: '100%',
          }}
        >
          <img
            src={fieldfabLogo}
            alt="FieldFab logo"
            className="fieldfab-header-logo"
            style={{ height: 75, width: 75, borderRadius: 10, marginBottom: 8, boxShadow: '0 2px 12px #0001' }}
          />
          <h1 className="fieldfab-header-title" style={{ fontWeight: 800, fontSize: 32, margin: 0, color: '#1a2233', letterSpacing: 1 }}>FieldFab</h1>

          {/* Current project + nav */}
          {currentProject && (
            <div style={{ marginTop: 8, color: '#3b4458', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              Project: <strong>{currentProject.name}</strong>
              <button
                style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowProjectsMenu(true)}
              >
                Project List
              </button>
              <button
                style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#757575', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
          {!currentProject && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button
              style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setShowProjectsMenu(true)}
            >
              Project List
            </button>
            <button
              style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#757575', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              onClick={handleLogout}
            >
              Log Out
            </button>
            </div>
          )}

          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 13,
              color: '#3b4458',
            }}
          >
            <span
              style={{
                background: isProPlan ? '#2e7d32' : '#f57c00',
                color: '#fff',
                borderRadius: 999,
                padding: '2px 10px',
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
                fontSize: 11,
              }}
            >
              {isProPlan ? 'Pro Plan' : 'Beta'}
            </span>
            {isProPlan ? (
              <span>Unlimited active projects</span>
            ) : (
              <span>Unlimited projects during beta</span>
            )}
            {!isProPlan && (
              <button
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#1a2233',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={handleUpgradeClick}
              >
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* Tab selector */}
          <div className="fieldfab-tabs" style={{
            marginTop: 16,
            display: 'flex',
            gap: 8,
            borderBottom: '2px solid #e0e0e0',
            paddingBottom: 0
          }}>
            <button
              style={{
                padding: '10px 24px',
                border: 'none',
                background: activeTab === 'fabrication' ? '#1976d2' : 'transparent',
                color: activeTab === 'fabrication' ? '#fff' : '#666',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                transition: 'all 0.2s',
              }}
              onClick={() => setActiveTab('fabrication')}
            >
              Fabrication
            </button>
            <button
              className="fieldfab-tab-disabled"
              style={{
                padding: '10px 24px',
                border: 'none',
                background: '#d9dee8',
                color: '#6b7280',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'not-allowed',
                borderRadius: '6px 6px 0 0',
                transition: 'all 0.2s',
                position: 'relative',
                opacity: 0.72,
              }}
              disabled
              title="Loose Material is under development"
            >
              Loose Material
              <span className="fieldfab-tab-watermark">Under Development</span>
            </button>
          </div>
        </div>

        {activeTab === 'fabrication' && (
          <>
            {/* Beta Watermark Banner */}
            <div className="fieldfab-beta-banner" style={{
              width: '100%',
              maxWidth: '95vw',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
              border: '1px solid rgba(25, 118, 210, 0.15)',
              borderRadius: 8,
              padding: '10px 16px',
              marginTop: 16,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              <span style={{
                color: '#1976d2',
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}>
                Beta Version — Feature in Development
              </span>
            </div>
        <div className="fieldfab-fab-workspace" style={{ width: '100%', maxWidth: '95vw', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, padding: '0 8px' }}>
          <PipeSketch
            qty={currentPiece?.qty ?? 1}
            length={currentPieceLength}
            pipeType={currentPiece?.pipeType ?? ''}
            pipetag={currentPiece?.pipeTag ?? ''}
            diameter={currentPiece?.diameter ?? ''}
            fittingsEndPipeLabel1={currentPiece?.fittingsEnd1 ?? ''}
            fittingsEndPipeLabel2={currentPiece?.fittingsEnd2 ?? ''}
            outlets={currentOutlets}
            showExportButton={false}
            editableOutlets={currentOutlets.length > 0}
            editableLength={Boolean(currentPiece)}
            minLength={currentMinPipeLength}
            onOutletLocationPreview={handleOutletLocationPreview}
            onOutletLocationCommit={handleOutletLocationCommit}
            onLengthPreview={handlePipeLengthPreview}
            onLengthCommit={handlePipeLengthCommit}
          />
          {currentPiece && (
            <div
              style={{
                marginTop: -2,
                marginBottom: 14,
                color: 'rgba(226, 232, 240, 0.78)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0,
                textAlign: 'center',
              }}
            >
              Drag outlets to reposition. Drag pipe ends to adjust length.
            </div>
          )}
          <button
            className="fieldfab-primary-action"
            style={{
              marginTop: 12,
              marginBottom: 24,
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 1px 4px #0001',
              transition: 'background 0.2s',
              margin: '0 auto',
              display: 'block',
              minHeight: '44px',
            }}
            onClick={() => setShowPieceForm(true)}
          >
            Pipe Specification
          </button>
          {showPieceForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(7, 14, 28, 0.55)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              padding: '16px',
              boxSizing: 'border-box',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties}>
              <div style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
                border: '1px solid #d8e5f7',
                borderRadius: 16,
                padding: '22px',
                width: '100%',
                maxWidth: '620px',
                margin: '0 auto',
                minHeight: 'fit-content',
                boxShadow: '0 22px 60px rgba(7, 14, 28, 0.32)',
                position: 'relative',
                marginBottom: '40px',
              }}>
                <button
                  onClick={() => { setShowPieceForm(false); setEditPieceIndex(null); }}
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    background: '#eef3fb',
                    border: '1px solid #d2ddec',
                    borderRadius: '50%',
                    width: 34,
                    height: 34,
                    fontSize: 20,
                    color: '#4b5b75',
                    cursor: 'pointer',
                    zIndex: 1001,
                    lineHeight: 1,
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
                <PipeSpecForm
                  onCreatePiece={async (piece: Piece) => {
                    const saved = await handleCreatePiece(piece);
                    if (saved) setShowPieceForm(false);
                  }}
                  onCancel={() => { setShowPieceForm(false); setEditPieceIndex(null); }}
                  {...(editPieceIndex !== null ? { initialValues: pieces[editPieceIndex] } : {})}
                />
              </div>
            </div>
          )}
          <button
            style={{
              marginTop: 0,
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 1px 4px #0001',
              transition: 'background 0.2s',
              margin: '20px auto',
              display: 'block',
              minHeight: '44px',
            }}
            onClick={() => {
              setEditOutletIndex(null);
              setShowOutletForm(true);
            }}
          >
            Add Welded Outlet
          </button>
          {showOutletForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(6px)',
              zIndex: 2000,
              padding: '20px',
              boxSizing: 'border-box',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties}>
              <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: '20px',
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto',
                minHeight: 'fit-content',
                boxShadow: '0 4px 32px #0003',
                position: 'relative',
                marginBottom: '40px',
              }}>
                <button
                  onClick={() => { setShowOutletForm(false); setEditOutletIndex(null); }}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'none',
                    border: 'none',
                    fontSize: 26,
                    color: '#888',
                    cursor: 'pointer',
                    zIndex: 1001,
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
                <WeldedOutletForm
                  onAdd={async outlet => {
                    if (pieces.length === 0) { setShowOutletForm(false); return; }
                    let newOutlets;
                    if (editOutletIndex !== null) {
                      newOutlets = currentOutlets.map((o: Outlet, i: number) =>
                        i === editOutletIndex ? outlet : o
                      );
                    } else {
                      newOutlets = [...currentOutlets, outlet];
                    }
                    const saved = await handleOutletChange(newOutlets);
                    if (saved) {
                      setShowOutletForm(false);
                      setEditOutletIndex(null);
                    }
                  }}
                  maxFeet={currentPiece ? currentPieceFeet : 10}
                  maxLocationInches={currentPieceLength}
                  initialValues={editOutletIndex !== null ? currentOutlets[editOutletIndex] : undefined}
                  isEditing={editOutletIndex !== null}
                />
              </div>
            </div>
          )}

          {/* Outlet List for Current Piece */}
          {currentOutlets.length > 0 && (
            <div className="fieldfab-list-card" style={{
              maxWidth: '95vw',
              margin: '20px auto 0',
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 8px #0001',
              padding: '16px',
              color: '#222'
            }}>
              <h3 style={{ color: '#222', marginTop: 0, marginBottom: 12, fontSize: '1.1rem' }}>Welded Outlets on Current Piece</h3>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {currentOutlets.map((outlet: Outlet, idx: number) => {
                  const feet = Math.floor(outlet.location / 12);
                  const inches = (outlet.location % 12).toFixed(2);
                  return (
                    <li key={idx} style={{
                      marginBottom: 12,
                      fontSize: '0.875rem',
                      color: '#222',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}>
                      <span>
                        <strong>Location:</strong> {feet}' {inches}" |
                        <strong> Size:</strong> {outlet.size}" |
                        <strong> Type:</strong> {outlet.type} |
                        <strong> Direction:</strong> {outlet.direction}
                      </span>
                      <button
                        style={{
                          background: '#ffa726',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          minHeight: '28px',
                          touchAction: 'manipulation',
                        }}
                        title="Edit outlet"
                        onClick={() => {
                          setEditOutletIndex(idx);
                          setShowOutletForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          background: '#d32f2f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          minHeight: '28px',
                          touchAction: 'manipulation',
                        }}
                        title="Delete outlet"
                        onClick={() => {
                          if (pieces.length === 0) return;
                          const lastPiece = pieces[pieces.length - 1];
                          const newOutlets = (lastPiece.outlets || []).filter((_: Outlet, i: number) => i !== idx);
                          handleOutletChange(newOutlets);
                        }}
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* List of created pieces */}
  <div className="fieldfab-list-card fieldfab-created-card" style={{ maxWidth: '95vw',
                margin: '20px auto',
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 2px 8px #0001',
                padding: '12px', color: '#222',
                minHeight: 60 }}>
          <h3 style={{ color: '#222' }}>Created Pieces</h3>
          {pieces.length === 0 ? (
            <div style={{ color: '#888', fontSize: 15 }}>No pieces created yet.</div>
          ) : (
            <ul style={{ paddingLeft: 16 }}>
              {pieces.map((piece, idx) => (
                <li key={piece.id ?? idx} style={{ marginBottom: 8, fontSize: '0.875rem', color: '#222', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {piece.pipeTag ? <b>{piece.pipeTag}</b> : `Piece #${idx + 1}`}: {piece.feet}' {piece.inches}'' {piece.diameter}in {piece.pipeType}
                  <span style={{ fontWeight: 700 }}>Qty: {piece.qty}</span>
                  <button
                    style={{
                      marginLeft: 8,
                      background: '#ffa726',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      minHeight: '32px',
                      touchAction: 'manipulation',
                    }}
                    title="Edit piece"
                    onClick={() => {
                      setEditPieceIndex(idx);
                      setShowPieceForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      marginLeft: 4,
                      background: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      minHeight: '32px',
                      touchAction: 'manipulation',
                    }}
                    title="Delete piece"
                    onClick={() => handleDeletePiece(idx)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* Export PDF and Create New Piece button group */}
          <div style={{ width: '100%', margin: '10px 0 0 0', display: 'flex', flexDirection: window.innerWidth < 480 ? 'column' : 'row', justifyContent: 'center', gap: 12 }}>
            <button
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 28px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: pieces.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 4px #0001',
                transition: 'background 0.2s',
                minHeight: '44px',
                flex: window.innerWidth < 480 ? 'none' : '1',
                maxWidth: window.innerWidth < 480 ? 'none' : '200px',
              }}
              onClick={handleExportAllPdf}
              disabled={pieces.length === 0}
            >
              Export PDF
            </button>
            <button
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 28px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 1px 4px #0001',
                transition: 'background 0.2s',
                minHeight: '44px',
                flex: window.innerWidth < 480 ? 'none' : '1',
                maxWidth: window.innerWidth < 480 ? 'none' : '200px',
              }}
              onClick={() => setShowPieceForm(true)}
            >
              Create New Piece
            </button>
          </div>
        </div>
          </>
        )}

        {activeTab === 'loosematerial' && (
          <div style={{ width: '100%', maxWidth: '95vw', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, padding: '0 8px' }}>
            {/* Beta Watermark Banner */}
            <div style={{
              width: '100%',
              maxWidth: '800px',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
              border: '1px solid rgba(25, 118, 210, 0.15)',
              borderRadius: 8,
              padding: '10px 16px',
              marginTop: 1,
              marginBottom: 1,
              textAlign: 'center',
            }}>
              <span style={{
                color: '#1976d2',
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}>
                Beta Version — Feature in Development
              </span>
            </div>

            <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ color: '#1a2233', textAlign: 'center' }}>Loose Material List</h2>
              <p style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>
                Add loose materials for your project using the form below. You can export the complete list to PDF, Excel, or CSV formats.
              </p>

              <LooseMaterialForm
                onAdd={handleAddMaterial}
              />

              {/* Material List Display */}
              <div style={{
                marginTop: 24,
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 16,
              }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1a2233' }}>
                  Materials ({looseMaterials.length})
                </h3>

                {looseMaterials.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>
                    No materials added yet. Use the form above to add materials.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.9rem',
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                          <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, width: '50px', color: '#222' }}>#</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, width: '60px', color: '#222' }}>Qty</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, width: '120px', color: '#222' }}>Size</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, minWidth: '200px', color: '#222' }}>Product Name</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, minWidth: '250px', color: '#222' }}>Description</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, width: '100px', color: '#222' }}>Type</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, width: '200px', color: '#222' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {looseMaterials.map((material, idx) => (
                          <tr key={material.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#222' }}>{idx + 1}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#222' }}>{material.qty}</td>
                            <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', color: '#222' }}>
                              {material.sizes && material.sizes.length > 0
                                ? material.sizes.join(', ')
                                : material.size || '-'}
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 500, color: '#222' }}>{material.part}</td>
                            <td style={{ padding: '12px 8px', color: '#222' }}>
                              {material.description}
                              {material.options && material.options.length > 0 && (
                                <div style={{ marginTop: 4, fontSize: '0.8rem', color: '#1976d2' }}>
                                  <strong>Options:</strong> {material.options.join(', ')}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 8px', color: '#222' }}>{material.type}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                                <button
                                  style={{
                                    background: '#ffa726',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    width: '80px',
                                  }}
                                  onClick={() => setEditMaterialIndex(idx)}
                                >
                                  Edit
                                </button>
                                <button
                                  style={{
                                    background: '#d32f2f',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    width: '80px',
                                  }}
                                  onClick={() => handleDeleteMaterial(material)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {looseMaterials.length > 0 && (
                  <div style={{
                    marginTop: 16,
                    display: 'flex',
                    flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                    justifyContent: 'center',
                    gap: 12,
                    flexWrap: 'wrap'
                  }}>
                    <button
                      style={{
                        background: '#1976d2',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 28px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        flex: window.innerWidth < 480 ? 'none' : '1',
                        maxWidth: window.innerWidth < 480 ? 'none' : '200px',
                        minHeight: '44px',
                      }}
                      onClick={() => exportToCSV(looseMaterials, currentProject)}
                    >
                      Export CSV
                    </button>
                    <button
                      style={{
                        background: '#2e7d32',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 28px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        flex: window.innerWidth < 480 ? 'none' : '1',
                        maxWidth: window.innerWidth < 480 ? 'none' : '200px',
                        minHeight: '44px',
                      }}
                      onClick={() => exportToExcel(looseMaterials, currentProject)}
                    >
                      Export Excel
                    </button>
                    <button
                      style={{
                        background: '#d32f2f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 28px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        flex: window.innerWidth < 480 ? 'none' : '1',
                        maxWidth: window.innerWidth < 480 ? 'none' : '200px',
                        minHeight: '44px',
                      }}
                      onClick={() => exportToPDF(looseMaterials, currentProject)}
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Material Modal */}
              {editMaterialIndex !== null && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(6px)',
                  zIndex: 2000,
                  padding: '20px',
                  boxSizing: 'border-box',
                  overflow: 'auto',
                  WebkitOverflowScrolling: 'touch',
                } as React.CSSProperties}>
                  <div style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '20px',
                    width: '100%',
                    maxWidth: '800px',
                    margin: '0 auto',
                    minHeight: 'fit-content',
                    boxShadow: '0 4px 32px #0003',
                    position: 'relative',
                    marginBottom: '40px',
                  }}>
                    <button
                      onClick={() => setEditMaterialIndex(null)}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'none',
                        border: 'none',
                        fontSize: 26,
                        color: '#888',
                        cursor: 'pointer',
                        zIndex: 1001,
                      }}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h3 style={{ marginTop: 0, marginBottom: 20, color: '#1a2233' }}>Edit Material</h3>
                    <LooseMaterialForm
                      onAdd={handleUpdateMaterial}
                      initialValues={looseMaterials[editMaterialIndex]}
                      isEditing={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Project picker modal */}
      {showPicker && (
        <PickerModal
          isOpen={showPicker}
          onSubmit={handleModalSubmit}
          onClose={() => setShowPicker(false)}
          projects={projectList}
          onSelectProject={handleSelectProject}
        />
      )}

      {/* Projects menu modal */}
      {showProjectsMenu && (
        <div className="fieldfab-modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className="fieldfab-projects-modal" style={{ background: '#fff', borderRadius: 12, minWidth: 340, boxShadow: '0 4px 32px #0003', position: 'relative' }}>
            <button
              className="fieldfab-modal-close"
              style={{ position: 'absolute', top: 12, right: 12, background: '#222', color: '#fff', border: 'none', borderRadius: 6, width: 28, height: 28, fontSize: 18, cursor: 'pointer' }}
              onClick={() => setShowProjectsMenu(false)}
            >
              ×
            </button>
            <ProjectsMenu
              projects={projectList}
              onSelect={handleSelectProject}
              onAddProject={() => { setShowProjectsMenu(false); setShowPicker(true); }}
            />
          </div>
        </div>
      )}

      {showUpgradePrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.42)',
            zIndex: 2500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '100%',
              maxWidth: 460,
              boxShadow: '0 8px 34px #0004',
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: '#1a2233' }}>Free plan limit reached</h3>
            <p style={{ margin: '0 0 14px', color: '#445', fontSize: 14, lineHeight: 1.5 }}>
              You have reached {FREE_PLAN_PROJECT_LIMIT} active projects. Upgrade to Pro for unlimited projects.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                style={{
                  background: '#e0e0e0',
                  color: '#222',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setShowUpgradePrompt(false)}
              >
                Not now
              </button>
              <button
                style={{
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setShowUpgradePrompt(false);
                  handleUpgradeClick();
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div style={{
        width: '100%',
        maxWidth: '95vw',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: 12,
        padding: '12px 16px',
        marginTop: 16,
        marginBottom: 20,
        color: '#666',
        fontSize: '0.75rem',
        lineHeight: 1.5,
        boxShadow: '0 2px 12px rgba(25, 118, 210, 0.06)',
        border: '1px solid rgba(25, 118, 210, 0.1)',
        position: 'relative',
        zIndex: 0,
      }}>
        <p style={{ margin: '0', color: '#555', fontSize: '0.78rem' }}>
          <strong style={{ color: '#1976d2' }}>Quick heads up:</strong> Get a licensed fire protection engineer to review your specs before you build or install anything. This app helps with planning and organizing, but you're responsible for verifying everything matches your project needs and code requirements.
        </p>

        <p style={{ margin: '0', color: '#777', fontSize: '0.72rem', lineHeight: 1.4 }}>
          Product info can change, so double-check with manufacturers before ordering. I built this tool to make your job easier, but use it at your own risk—I can't guarantee everything's perfect. Always verify against current NFPA standards and local requirements.
        </p>

        <p style={{ margin: '0', color: '#777', fontSize: '0.72rem', lineHeight: 1.4 }}>
          Have a licensed fire protection engineer or proper NICET level review all specs before fabrication. This tool helps with planning, but always double-check measurements, materials, and code requirements (NFPA, local AHJ) before ordering or installing.
        </p>

        <p style={{ margin: '0', color: '#666', fontSize: '0.72rem', lineHeight: 1.4 }}>
          Billing and plan changes: {BILLING_EMAIL}
        </p>
      </div>
    </>
  );
}

export default App;
