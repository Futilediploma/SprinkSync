
import React, { useState, useEffect } from 'react';
import { Project, ProjectCreate, ProjectUpdate, Forecast, ForecastCreate } from '../types';
import * as api from '../api';
import ProjectTable from './Manpower/ProjectTable';
import ForecastSetup from './Manpower/ForecastSetup';
import MonthlyGrid from './Manpower/MonthlyGrid';

const ManpowerForecastPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsData, forecastsData] = await Promise.all([
                api.listProjectsForManpower(),
                api.listForecasts()
            ]);
            setProjects(projectsData);
            setForecasts(forecastsData);
            setError(null);
        } catch (err) {
            setError('Failed to load data. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddProject = async (project: ProjectCreate) => {
        try {
            await api.createProject(project);
            fetchData(); // Reload all to stay in sync
        } catch (err) {
            alert("Failed to create project");
        }
    };

    const handleUpdateProject = async (id: number, project: ProjectUpdate) => {
        try {
            await api.updateProject(id, project);
            fetchData();
        } catch (err) {
            alert("Failed to update project");
        }
    };

    const handleSaveForecast = async (forecast: ForecastCreate) => {
        try {
            await api.saveForecast(forecast);
            const forecastsData = await api.listForecasts();
            setForecasts(forecastsData);
        } catch (err) {
            alert("Failed to save forecast");
        }
    };

    if (loading && projects.length === 0) {
        return <div className="p-8 text-center text-gray-500">Loading specific data...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-[1400px] mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">StartSync Manpower Forecast</h1>
                    <p className="text-gray-600 mt-2">Manage project labor hours and monthly allocations.</p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded mb-8 border border-red-200">
                        {error}
                    </div>
                )}

                <ProjectTable
                    projects={projects}
                    onAddProject={handleAddProject}
                    onUpdateProject={handleUpdateProject}
                />

                <ForecastSetup
                    projects={projects}
                    forecasts={forecasts}
                    onSaveForecast={handleSaveForecast}
                />

                <MonthlyGrid
                    projects={projects}
                    forecasts={forecasts}
                />
            </div>
        </div>
    );
};

export default ManpowerForecastPage;
