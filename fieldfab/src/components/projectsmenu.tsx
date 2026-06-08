import React from 'react';
import type { Project } from '../types';
import './projectsmenu.css';

interface ProjectsMenuProps {
  projects: Project[];
  onSelect: (project: Project) => void;
  onAddProject?: () => void;
}

const ProjectsMenu: React.FC<ProjectsMenuProps> = ({ projects, onSelect, onAddProject }) => {
  return (
    <div className="projects-menu">
      <div className="projects-menu-kicker">Project List</div>
      <h3>Select Project</h3>
      {projects.length === 0 && (
        <div className="projects-menu-empty">No projects yet. Add a project to get started.</div>
      )}
      <ul>
        {projects.map((p: Project) => (
          <li key={p.id}>
            <button onClick={() => onSelect(p)} className="projects-menu-item">
              <b>{p.companyName || 'Unnamed Company'}</b>
              <span>{p.name || 'Untitled Job'}</span>
            </button>
          </li>
        ))}
      </ul>
      {onAddProject && (
        <button
          onClick={onAddProject}
          className="projects-menu-add"
        >
          + Add Project
        </button>
      )}
    </div>
  );
};

export default ProjectsMenu;
