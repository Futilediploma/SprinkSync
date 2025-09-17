
import fieldfabLogo from './assets/field_fab.jpg';
import './App.css';
import PipeSpecForm from './components/PipeSpecForm';


function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e3f0ff 60%, #f0e3ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 0,
      }}
    >
      <div
        style={{
          marginTop: 40,
          marginBottom: 32,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 20,
          boxShadow: '0 4px 32px 0 #0002',
          padding: '32px 40px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 420,
        }}
      >
        <img
          src={fieldfabLogo}
          alt="FieldFab logo"
          style={{ height: 96, width: 96, borderRadius: 16, marginBottom: 12, boxShadow: '0 2px 12px #0001' }}
        />
        <h1 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: '#1a2233', letterSpacing: 1 }}>FieldFab</h1>
      </div>
      <div style={{ width: '100%', maxWidth: 480, flex: 1, display: 'flex', justifyContent: 'center' }}>
        <PipeSpecForm />
      </div>
    </div>
  );
}

export default App
