
import React, { useState } from 'react';
import { Project, ProjectCreate, ProjectUpdate } from '../../types';

interface ProjectTableProps {
    projects: Project[];
    onAddProject: (project: ProjectCreate) => void;
    onUpdateProject: (id: number, project: ProjectUpdate) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onAddProject, onUpdateProject }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newProject, setNewProject] = useState<ProjectCreate>({
        job_number: '',
        job_name: '',
        total_labor_hours: 0,
        labor_budget: 0,
        designer: '',
        superintendent: ''
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<ProjectUpdate>({});

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddProject(newProject);
        setNewProject({
            job_number: '',
            job_name: '',
            total_labor_hours: 0,
            labor_budget: 0,
            designer: '',
            superintendent: ''
        });
        setIsAdding(false);
    };

    const startEdit = (project: Project) => {
        setEditingId(project.id);
        setEditForm({
            job_number: project.job_number,
            job_name: project.job_name,
            total_labor_hours: project.total_labor_hours,
            labor_budget: project.labor_budget,
            designer: project.designer || '',
            superintendent: project.superintendent || ''
        });
    };

    const handleEditSubmit = (id: number) => {
        onUpdateProject(id, editForm);
        setEditingId(null);
    };

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Projects</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    {isAdding ? 'Cancel' : 'Add Project'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddSubmit} className="p-4 bg-blue-50 border-b">
                    <div className="grid grid-cols-6 gap-4">
                        <input placeholder="Job #" required className="p-2 border rounded" value={newProject.job_number} onChange={e => setNewProject({ ...newProject, job_number: e.target.value })} />
                        <input placeholder="Job Name" required className="p-2 border rounded col-span-2" value={newProject.job_name} onChange={e => setNewProject({ ...newProject, job_name: e.target.value })} />
                        <input type="number" placeholder="Hours" required className="p-2 border rounded" value={newProject.total_labor_hours} onChange={e => setNewProject({ ...newProject, total_labor_hours: parseInt(e.target.value) || 0 })} />
                        <input type="number" placeholder="Budget ($)" required className="p-2 border rounded" value={newProject.labor_budget} onChange={e => setNewProject({ ...newProject, labor_budget: parseFloat(e.target.value) || 0 })} />
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Superintendent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.map(project => (
                            <tr key={project.id} className={editingId === project.id ? 'bg-yellow-50' : ''}>
                                {editingId === project.id ? (
                                    <>
                                        <td className="px-6 py-4"><input className="w-full border p-1" value={editForm.job_number} onChange={e => setEditForm({ ...editForm, job_number: e.target.value })} /></td>
                                        <td className="px-6 py-4"><input className="w-full border p-1" value={editForm.job_name} onChange={e => setEditForm({ ...editForm, job_name: e.target.value })} /></td>
                                        <td className="px-6 py-4"><input className="w-full border p-1" value={editForm.designer} onChange={e => setEditForm({ ...editForm, designer: e.target.value })} /></td>
                                        <td className="px-6 py-4"><input className="w-full border p-1" value={editForm.superintendent} onChange={e => setEditForm({ ...editForm, superintendent: e.target.value })} /></td>
                                        <td className="px-6 py-4"><input type="number" className="w-full border p-1" value={editForm.total_labor_hours} onChange={e => setEditForm({ ...editForm, total_labor_hours: parseInt(e.target.value) || 0 })} /></td>
                                        <td className="px-6 py-4"><input type="number" className="w-full border p-1" value={editForm.labor_budget} onChange={e => setEditForm({ ...editForm, labor_budget: parseFloat(e.target.value) || 0 })} /></td>
                                        <td className="px-6 py-4 flex gap-2">
                                            <button onClick={() => handleEditSubmit(project.id)} className="text-green-600 hover:text-green-900">Save</button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.job_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.job_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.designer || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.superintendent || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.total_labor_hours}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${project.labor_budget.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => startEdit(project)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectTable;
