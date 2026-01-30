import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types';
import { addProject, updateProject } from '../data/db';
import type { LooseMaterial } from '../types';

export function useProjectData() {
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [pieces, setPieces] = useState<any[]>([]);
    const [looseMaterials, setLooseMaterials] = useState<LooseMaterial[]>([]);
    const [showPicker, setShowPicker] = useState(false);

    // Load project on mount
    useEffect(() => {
        (async () => {
            const id = localStorage.getItem('fieldfab:currentProjectId');
            if (!id) {
                setShowPicker(true);
                return;
            }
            try {
                // const p = await loadProject(id); // Stubbed in original
                const p = null as unknown as Project | null;
                if (p) {
                    setCurrentProject(p);
                    setPieces(p.pieces || []);
                    setLooseMaterials(p.looseMaterials || []);
                } else {
                    setShowPicker(true);
                }
            } catch {
                setShowPicker(true);
            }
        })();
    }, []);

    const createProject = useCallback((projectData: {
        companyName: string;
        jobName: string;
        streetNumber: string;
        streetName: string;
        city: string;
        zipcode: string;
    }) => {
        const newProject: Project = {
            id: Date.now().toString(),
            name: projectData.jobName,
            companyName: projectData.companyName,
            streetNumber: projectData.streetNumber,
            streetName: projectData.streetName,
            city: projectData.city,
            zipcode: projectData.zipcode,
            pieces: [],
            looseMaterials: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            schemaVersion: 1,
        };
        addProject(newProject);
        setCurrentProject(newProject);
        setPieces([]);
        setLooseMaterials([]);
        localStorage.setItem('fieldfab:currentProjectId', newProject.id);
        setShowPicker(false);
    }, []);

    const updatePieces = useCallback((newPiecesOrUpdater: any[] | ((prev: any[]) => any[])) => {
        setPieces(prev => {
            const newPieces = typeof newPiecesOrUpdater === 'function'
                ? newPiecesOrUpdater(prev)
                : newPiecesOrUpdater;

            if (currentProject) {
                updateProject(currentProject.id, { pieces: newPieces });
                setCurrentProject(p => p ? { ...p, pieces: newPieces } : null);
            }
            return newPieces;
        });
    }, [currentProject]);

    const updateLooseMaterials = useCallback((newMaterialsOrUpdater: LooseMaterial[] | ((prev: LooseMaterial[]) => LooseMaterial[])) => {
        setLooseMaterials(prev => {
            const newMaterials = typeof newMaterialsOrUpdater === 'function'
                ? newMaterialsOrUpdater(prev)
                : newMaterialsOrUpdater;

            if (currentProject) {
                updateProject(currentProject.id, { looseMaterials: newMaterials });
                setCurrentProject(p => p ? { ...p, looseMaterials: newMaterials } : null);
            }
            return newMaterials;
        });
    }, [currentProject]);

    const switchProject = useCallback((p: Project) => {
        setCurrentProject(p);
        setPieces(p.pieces || []);
        setLooseMaterials(p.looseMaterials || []);
        localStorage.setItem('fieldfab:currentProjectId', p.id);
        setShowPicker(false);
    }, []);

    return {
        currentProject,
        setCurrentProject,
        pieces,
        setPieces: updatePieces,
        looseMaterials,
        setLooseMaterials: updateLooseMaterials,
        showPicker,
        setShowPicker,
        createProject,
        switchProject,
    };
}
