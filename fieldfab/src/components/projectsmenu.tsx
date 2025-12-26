import React from 'react';
import type { Project } from '../types';

interface ProjectsMenuProps {
  projects: Project[];
  onSelect: (project: Project) => void;
}

const ProjectsMenu: React.FC<ProjectsMenuProps> = ({ projects, onSelect }) => {
  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Select Project</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {projects.map((p: Project) => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <button onClick={() => onSelect(p)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: '#fafafa', width: '100%', textAlign: 'left' }}>
              <b>{p.companyName}</b><br />
              <span style={{ fontSize: 13, color: '#555' }}>{p.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectsMenu;
