import fieldfabLogo from '../assets/field_fab.jpg';
import { useEffect, useState } from 'react';
import ProjectsMenu from './projectsmenu';
import type { Project } from '../types';

interface PickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fields: {
    companyName: string;
    jobName: string;
    streetNumber: string;
    streetName: string;
    city: string;
    zipcode: string;
  }) => void | Promise<void>;
  onShowProjects?: () => void;
  projects?: Project[];
  onSelectProject?: (project: Project) => void;
}

const fieldLabelStyle: React.CSSProperties = {
  color: '#1f2937',
  fontWeight: 600,
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  textAlign: 'left',
};

const PickerModal = ({ isOpen, onClose, onSubmit, projects = [], onSelectProject }: PickerModalProps) => {
  const [showProjectList, setShowProjectList] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [jobName, setJobName] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCompact, setIsCompact] = useState(window.innerWidth <= 600);
  const [isSaving, setIsSaving] = useState(false);

  function validate() {
    const newErrors: { [key: string]: string } = {};
    if (!companyName.trim()) newErrors.companyName = 'Company name is required.';
    if (!jobName.trim()) newErrors.jobName = 'Job name is required.';
    if (!streetNumber.trim()) newErrors.streetNumber = 'Street number is required.';
    if (!streetName.trim()) newErrors.streetName = 'Street name is required.';
    if (!city.trim()) newErrors.city = 'City is required.';
    if (!zipcode.trim()) newErrors.zipcode = 'Zipcode is required.';
    else if (!/^[0-9]{5}(-[0-9]{4})?$/.test(zipcode)) newErrors.zipcode = 'Zipcode must be 5 digits or 5+4 format.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const inputStyle = (value: string): React.CSSProperties => ({
    width: '100%',
    padding: isCompact ? '8px 10px' : '9px 11px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: value ? '#ffffff' : '#fff3e0',
    color: '#1f2937',
    fontSize: 14,
    boxSizing: 'border-box',
  });

  return (
    <div
      className="fieldfab-dialog-backdrop"
      role="presentation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.42)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isCompact ? 10 : 16,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="fieldfab-dialog-panel fieldfab-picker-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fieldfab-project-form-title"
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: isCompact ? 12 : 16,
          width: '100%',
          maxWidth: 430,
          boxShadow: '0 4px 32px #0003',
          position: 'relative',
        }}
      >
        <button
          className="fieldfab-dialog-close"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'transparent',
            color: '#222',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            fontSize: 22,
            cursor: 'pointer',
          }}
          aria-label="Close"
          onClick={onClose}
        >
          x
        </button>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img
            src={fieldfabLogo}
            alt="FieldFab logo"
            style={{ height: 58, width: 58, borderRadius: 8, boxShadow: '0 2px 12px #0001' }}
          />
          <h1 id="fieldfab-project-form-title" style={{ fontWeight: 800, fontSize: isCompact ? '1.6rem' : '1.75rem', margin: '4px 0 0', color: '#1a2233', letterSpacing: 1 }}>
            FieldFab
          </h1>
          <div style={{ marginTop: 2, fontWeight: 500, fontSize: 13, color: '#222' }}>Please Fill Out Form.</div>
          <button
            type="button"
            style={{
              marginTop: 6,
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
            onClick={() => setShowProjectList(true)}
          >
            Project List
          </button>
        </div>

        {showProjectList && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
              zIndex: 1002,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              border: '1px solid #d7e3f2',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.24)',
              overflow: 'hidden',
            }}
          >
            <ProjectsMenu
              projects={projects}
              onSelect={(p) => {
                setShowProjectList(false);
                if (onSelectProject) onSelectProject(p);
              }}
            />
            <button
              style={{
                margin: '0 18px 18px',
                padding: '11px 18px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: '#eef3fb',
                color: '#24344d',
                fontWeight: 800,
                cursor: 'pointer',
              }}
              onClick={() => setShowProjectList(false)}
            >
              Cancel
            </button>
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validate() || isSaving) return;
            setIsSaving(true);
            try {
              await onSubmit({
                companyName,
                jobName,
                streetNumber,
                streetName,
                city,
                zipcode,
              });
            } finally {
              setIsSaving(false);
            }
          }}
          style={{ width: '100%' }}
        >
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="project-company" style={fieldLabelStyle}>Company Name</label>
            <input id="project-company" type="text" autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle(companyName)} aria-invalid={Boolean(errors.companyName)} />
            {errors.companyName && <div role="alert" style={{ color: '#b91c1c', fontSize: 12, marginTop: 2 }}>{errors.companyName}</div>}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label htmlFor="project-job" style={fieldLabelStyle}>Job Name</label>
            <input id="project-job" type="text" value={jobName} onChange={(e) => setJobName(e.target.value)} style={inputStyle(jobName)} aria-invalid={Boolean(errors.jobName)} />
            {errors.jobName && <div role="alert" style={{ color: '#b91c1c', fontSize: 12, marginTop: 2 }}>{errors.jobName}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr 1fr' : '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label htmlFor="project-street-number" style={fieldLabelStyle}>Street Number</label>
              <input id="project-street-number" type="text" inputMode="numeric" autoComplete="address-line1" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} style={inputStyle(streetNumber)} aria-invalid={Boolean(errors.streetNumber)} />
              {errors.streetNumber && <div style={{ color: 'red', fontSize: 12, marginTop: 2 }}>{errors.streetNumber}</div>}
            </div>
            <div style={{ gridColumn: isCompact ? '2 / 3' : '2 / 4' }}>
              <label htmlFor="project-street-name" style={fieldLabelStyle}>Street Name</label>
              <input id="project-street-name" type="text" autoComplete="address-line2" value={streetName} onChange={(e) => setStreetName(e.target.value)} style={inputStyle(streetName)} aria-invalid={Boolean(errors.streetName)} />
              {errors.streetName && <div style={{ color: 'red', fontSize: 12, marginTop: 2 }}>{errors.streetName}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8, marginBottom: 10 }}>
            <div>
              <label htmlFor="project-city" style={fieldLabelStyle}>City</label>
              <input id="project-city" type="text" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle(city)} aria-invalid={Boolean(errors.city)} />
              {errors.city && <div style={{ color: 'red', fontSize: 12, marginTop: 2 }}>{errors.city}</div>}
            </div>
            <div>
              <label htmlFor="project-zipcode" style={fieldLabelStyle}>Zipcode</label>
              <input id="project-zipcode" type="text" inputMode="numeric" autoComplete="postal-code" value={zipcode} onChange={(e) => setZipcode(e.target.value)} style={inputStyle(zipcode)} aria-invalid={Boolean(errors.zipcode)} />
              {errors.zipcode && <div style={{ color: 'red', fontSize: 12, marginTop: 2 }}>{errors.zipcode}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #eee', paddingTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '10px 18px',
                borderRadius: 6,
                border: 'none',
                background: '#6c757d',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: isSaving ? 'default' : 'pointer',
                opacity: isSaving ? 0.72 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '10px 18px',
                borderRadius: 6,
                border: 'none',
                background: '#1976d2',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: isSaving ? 'default' : 'pointer',
                opacity: isSaving ? 0.72 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PickerModal;
