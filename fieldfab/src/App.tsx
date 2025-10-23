import { exportMultiPiecePdf } from './components/exportPdf';
// App.tsx
import { useEffect, useState } from 'react';
import fieldfabLogo from './assets/field_fab.jpg';
import './App.css';
import { PipeSpecForm } from './components/PipeSpecForm';
import PickerModal from './components/PickerModal';
import ProjectsMenu from './components/projectsmenu';
import { getProjects, addProject, updateProject } from './data/db';
import WeldedOutletForm from './components/WeldedOutletForm';
import PipeSketch from './components/PipeSketch';

// import { loadProject } from './db';                 // ← uncomment when you have db.ts
// import ProjectPickerModal from './components/ProjectPickerModal'; // ← add later

type Project = {
  id: string;
  name: string;
  companyName: string;
  streetNumber: string;
  streetName: string;
  city: string;
  zipcode: string;
  pieces: unknown[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
};

function App() {
  // Removed unused isProcessingPiece
  // Track if a piece is pending addition
  // Export all pieces to PDF (3 per page, job info header)
  const handleExportAllPdf = async () => {
    if (!currentProject || pieces.length === 0) return;
    await exportMultiPiecePdf(currentProject, pieces);
  };
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showProjectsMenu, setShowProjectsMenu] = useState(false);
  const [pieces, setPieces] = useState<any[]>([]);
  const [showPieceForm, setShowPieceForm] = useState(false);
  const [editPieceIndex, setEditPieceIndex] = useState<number | null>(null);
  const [showOutletForm, setShowOutletForm] = useState(false);
  const [editOutletIndex, setEditOutletIndex] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const id = localStorage.getItem('fieldfab:currentProjectId');
      if (!id) {
        setShowPicker(true);
        return;
      }
      try {
        // const p = await loadProject(id);           // ← real load
        const p = null as unknown as Project | null; // ← temp stub so this compiles
        if (p) {
          setCurrentProject(p);
        } else {
          setShowPicker(true); // ID existed but data missing
        }
      } catch {
        setShowPicker(true);
      }
    })();
  }, []);

  // Handler when user submits the modal
  const handleModalSubmit = ({
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
    const newProject: Project = {
      id: Date.now().toString(),
      name: jobName,
      companyName,
      streetNumber,
      streetName,
      city,
      zipcode,
      pieces: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    };
    addProject(newProject);
    setCurrentProject(newProject);
    setPieces([]);
    localStorage.setItem('fieldfab:currentProjectId', newProject.id);
    setShowPicker(false);
  };

  // Handler for creating a new piece
  const handleCreatePiece = (piece: any) => {
    setPieces(prev => {
      let newArr;
      if (editPieceIndex !== null) {
        // Edit existing piece
        newArr = prev.map((p, i) => (i === editPieceIndex ? piece : p));
      } else {
        // Add new piece
        newArr = [...prev, piece];
      }
      // Persist to current project
      if (currentProject) {
        updateProject(currentProject.id, { pieces: newArr });
      }
      return newArr;
    });
    setCurrentProject(prev => {
      if (!prev) return prev;
      let newPieces;
      if (editPieceIndex !== null) {
        newPieces = prev.pieces.map((p: any, i: number) => (i === editPieceIndex ? piece : p));
      } else {
        newPieces = [...(prev.pieces || []), piece];
      }
      return { ...prev, pieces: newPieces };
    });
    setEditPieceIndex(null);
  };

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e3f0ff 60%, #f0e3ff 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            marginTop: 20,
            marginBottom: 20,
            background: 'rgba(255,255,255,0.85)',
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
            style={{ height: 75, width: 75, borderRadius: 10, marginBottom: 8, boxShadow: '0 2px 12px #0001' }}
          />
          <h1 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: '#1a2233', letterSpacing: 1 }}>FieldFab</h1>

          {/* Optional: show current project name */}
          {currentProject && (
            <div style={{ marginTop: 8, color: '#3b4458', fontSize: 14, display: 'flex', alignItems: 'center' }}>
              Project: <strong>{currentProject.name}</strong>
              <button
                style={{ marginLeft: 12, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowProjectsMenu(true)}
              >
                Project List
              </button>
            </div>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: '95vw', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, padding: '0 8px' }}>
          <PipeSketch
            length={pieces.length > 0 ? (Number(pieces[pieces.length-1].feet) * 12 + (parseFloat(pieces[pieces.length-1].inches) || 0)) : 0}
            pipeType={pieces.length > 0 ? pieces[pieces.length-1].pipeType : ''}
            pipetag={pieces.length > 0 ? pieces[pieces.length-1].pipeTag : ''}
            diameter={pieces.length > 0 ? pieces[pieces.length-1].diameter : ''}
            fittingsEndPipeLabel1={pieces.length > 0 ? pieces[pieces.length-1].fittingsEnd1 : ''}
            fittingsEndPipeLabel2={pieces.length > 0 ? pieces[pieces.length-1].fittingsEnd2 : ''}
            outlets={pieces.length > 0 && pieces[pieces.length-1].outlets ? pieces[pieces.length-1].outlets : []}
            showExportButton={false}
          />
          <button
            style={{
              marginTop: 12,
              marginBottom: 24, // more space below Pipe Specification button
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
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
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
                  onClick={() => { setShowPieceForm(false); setEditPieceIndex(null); }}
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
                <PipeSpecForm
                  onCreatePiece={(piece: any) => {
                    handleCreatePiece(piece);
                    setShowPieceForm(false);
                  }}
                  onCancel={() => { setShowPieceForm(false); setEditPieceIndex(null); }}
                  {...(editPieceIndex !== null ? { initialValues: pieces[editPieceIndex] } : {})}
                />
              </div>
            </div>
          )}
          <button
            style={{
              marginTop: 0, // no extra space above
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
            onClick={() => setShowOutletForm(true)}
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
                  onAdd={outlet => {
                    setPieces(prev => {
                      if (prev.length === 0) return prev;
                      const lastIdx = prev.length - 1;
                      const lastPiece = prev[lastIdx];
                      let updatedOutlets;
                      if (editOutletIndex !== null) {
                        // Edit existing outlet
                        updatedOutlets = (lastPiece.outlets || []).map((o: any, i: number) => 
                          i === editOutletIndex ? outlet : o
                        );
                      } else {
                        // Add new outlet
                        updatedOutlets = [...(lastPiece.outlets || []), outlet];
                      }
                      const updatedPiece = {
                        ...lastPiece,
                        outlets: updatedOutlets,
                      };
                      const newPieces = [...prev.slice(0, lastIdx), updatedPiece];
                      if (currentProject) {
                        updateProject(currentProject.id, { pieces: newPieces });
                      }
                      return newPieces;
                    });
                    setShowOutletForm(false);
                    setEditOutletIndex(null);
                  }}
                  maxFeet={pieces.length > 0 ? Number(pieces[pieces.length-1].feet) : 10}
                  initialValues={editOutletIndex !== null && pieces.length > 0 && pieces[pieces.length-1].outlets?.[editOutletIndex] ? pieces[pieces.length-1].outlets[editOutletIndex] : undefined}
                  isEditing={editOutletIndex !== null}
                />
              </div>
            </div>
          )}

          {/* Outlet List for Current Piece */}
          {pieces.length > 0 && pieces[pieces.length-1].outlets && pieces[pieces.length-1].outlets.length > 0 && (
            <div style={{ 
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
                {pieces[pieces.length-1].outlets.map((outlet: any, idx: number) => {
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
                          setPieces(prev => {
                            if (prev.length === 0) return prev;
                            const lastIdx = prev.length - 1;
                            const lastPiece = prev[lastIdx];
                            const updatedOutlets = (lastPiece.outlets || []).filter((_: any, i: number) => i !== idx);
                            const updatedPiece = {
                              ...lastPiece,
                              outlets: updatedOutlets,
                            };
                            const newPieces = [...prev.slice(0, lastIdx), updatedPiece];
                            if (currentProject) {
                              updateProject(currentProject.id, { pieces: newPieces });
                            }
                            return newPieces;
                          });
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

        {/* List of created pieces (always show, even if empty) */}
  <div style={{ maxWidth: '95vw', 
                margin: '20px auto', 
                background: '#fff', 
                borderRadius: 8, 
                boxShadow: '0 2px 8px #0001', 
                padding: '12px', color: '#222', 
                minHeight: 60 }}>
          <h3 style={{ color: '#222' }}>Created Pieces</h3>
          {pieces.length === 0 ? (
            <div style={{ color:   '#888', fontSize: 15 }}>No pieces created yet.</div>
          ) : (
            <ul style={{ paddingLeft: 16 }}>
              {pieces.map((piece, idx) => (
                <li key={idx} style={{ marginBottom: 8, fontSize: '0.875rem', color: '#222', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {piece.pipeTag ? <b>{piece.pipeTag}</b> : `Piece #${idx + 1}`}: {piece.feet}' {piece.inches}'' {piece.diameter}in {piece.pipeType}
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
                    onClick={() => {
                      const newArr = pieces.filter((_, i) => i !== idx);
                      setPieces(newArr);
                      if (currentProject) {
                        updateProject(currentProject.id, { pieces: newArr });
                      }
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* Export PDF and Create New Piece button group - now directly below Created Pieces */}
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
      </div>
      {/* Project picker modal (show when no current project) */}
      {showPicker && (
        <PickerModal
          isOpen={showPicker}
          onSubmit={handleModalSubmit}
          onClose={() => setShowPicker(false)}
          projects={getProjects()}
          onSelectProject={p => {
            setCurrentProject(p);
            setPieces(p.pieces || []);
            localStorage.setItem('fieldfab:currentProjectId', p.id);
            setShowPicker(false);
          }}
        />
      )}

      {/* Projects menu modal */}
      {showProjectsMenu && (
        <div style={{
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
          <div style={{ background: '#fff', borderRadius: 12, minWidth: 340, boxShadow: '0 4px 32px #0003', position: 'relative' }}>
            <button
              style={{ position: 'absolute', top: 12, right: 12, background: '#222', color: '#fff', border: 'none', borderRadius: 6, width: 28, height: 28, fontSize: 18, cursor: 'pointer' }}
              onClick={() => setShowProjectsMenu(false)}
            >
              ×
            </button>
            <ProjectsMenu
              projects={getProjects()}
              onSelect={p => {
                setCurrentProject(p);
                setPieces(p.pieces || []);
                localStorage.setItem('fieldfab:currentProjectId', p.id);
                setShowProjectsMenu(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default App;

