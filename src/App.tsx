
import fieldfabLogo from './assets/field_fab.jpg';
import './App.css';
import PipeSpecForm from './components/PipeSpecForm';

function App() {
  // Removed unused state

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', margin: 0, padding: 0 }}>
           <img src={fieldfabLogo} alt="FieldFab logo" style={{ height: 100, width: 100, borderRadius: 8, margin: 2, padding: 0 }} />
      </div>
      <main style={{ background: 'linear-gradient(to bottom, #e3f0ff, #f8fafc)', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', margin: 0, padding: 0 }}>
        <PipeSpecForm />
      </main>
    </>
  );
}

export default App
