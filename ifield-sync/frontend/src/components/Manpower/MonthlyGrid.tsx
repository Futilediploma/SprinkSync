
import React, { useMemo } from 'react';
import { Project, Forecast } from '../../types';

interface MonthlyGridProps {
    projects: Project[];
    forecasts: Forecast[];
}

const MonthlyGrid: React.FC<MonthlyGridProps> = ({ projects, forecasts }) => {
    // Generate next 18 months
    const months = useMemo(() => {
        const list = [];
        const now = new Date();
        // Start from current month
        let current = new Date(now.getFullYear(), now.getMonth(), 1);

        for (let i = 0; i < 18; i++) {
            const y = current.getFullYear();
            const m = current.getMonth() + 1;
            list.push(`${y}-${m.toString().padStart(2, '0')}`);
            current.setMonth(current.getMonth() + 1);
        }
        return list;
    }, []);

    const getCellData = (projectId: number, month: string) => {
        const forecast = forecasts.find(f => f.project_id === projectId);
        if (!forecast) return 0;
        const alloc = forecast.allocations.find(a => a.month === month);
        return alloc ? alloc.forecast_hours : 0;
    };

    const getMonthTotal = (month: string) => {
        let total = 0;
        projects.forEach(p => {
            total += getCellData(p.id, month);
        });
        return total;
    };

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Monthly Forecast Grid</h2>
            </div>

            <div className="overflow-x-auto pb-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-64 shadow-r">
                                Project
                            </th>
                            {months.map(m => (
                                <th key={m} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                                    {m}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">

                        {projects.map(project => {
                            // Only show rows that have allocations or are relevant?

                            // Spec says "Rows per project".
                            // If forecast doesn't exist, all 0.

                            // Skip projects with no remaining hours and no recent activity?
                            // Keeping it simple: show all projects or maybe only those with forecasts?
                            // Let's show all projects for now to match "Excel-like" feel where you expect to see everything.
                            return (
                                <tr key={project.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r">
                                        {project.job_number} <span className="text-gray-500 font-normal truncate max-w-[150px] inline-block align-bottom ml-1">{project.job_name}</span>
                                    </td>
                                    {months.map(m => {
                                        const val = getCellData(project.id, m);
                                        return (
                                            <td key={m} className={`px-2 py-2 text-center text-sm ${val > 0 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-300'}`}>
                                                {val > 0 ? val.toFixed(1) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}

                        {/* Total Row */}
                        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-gray-100 z-10 border-r">
                                TOTAL
                            </td>
                            {months.map(m => (
                                <td key={m} className="px-2 py-3 text-center text-sm text-gray-900">
                                    {getMonthTotal(m).toFixed(1)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MonthlyGrid;
