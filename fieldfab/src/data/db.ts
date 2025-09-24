// Simple in-memory project DB (mock)
export interface Project {
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
}


const LS_KEY = 'fieldfab:projects';

function loadProjects(): Project[] {
	const raw = localStorage.getItem(LS_KEY);
	if (raw) {
		try {
			return JSON.parse(raw);
		} catch {
			// fallback to empty if corrupted
		}
	}
	return [];
}

function saveProjects(projects: Project[]) {
	localStorage.setItem(LS_KEY, JSON.stringify(projects));
}


let projects: Project[] = loadProjects();

export function getProjects(): Project[] {
	return projects;
}

export function addProject(project: Project) {
	projects.push(project);
	saveProjects(projects);
}

export function updateProject(id: string, data: Partial<Project>) {
	projects = projects.map(p => p.id === id ? { ...p, ...data } : p);
	saveProjects(projects);
}

export function getProjectById(id: string) {
	return projects.find(p => p.id === id);
}

