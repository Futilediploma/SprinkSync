
import React, { useState } from 'react';
import { Project, Forecast, ForecastCreate } from '../../types';

interface ForecastSetupProps {
    projects: Project[];
    forecasts: Forecast[];
    onSaveForecast: (forecast: ForecastCreate) => void;
}

const ForecastSetup: React.FC<ForecastSetupProps> = ({ projects, forecasts, onSaveForecast }) => {
    const [loadingIds, setLoadingIds] = useState<number[]>([]);

    const getForecast = (projectId: number) => forecasts.find(f => f.project_id === projectId);

    const handleSave = async (projectId: number, data: Partial<ForecastCreate>) => {
        // Basic validation
        if (!data.start_month || !data.end_month) return;
        if (data.start_month > data.end_month) {
            alert("End month cannot be before start month");
            return;
        }

        setLoadingIds(prev => [...prev, projectId]);
        await onSaveForecast({
            project_id: projectId,
            hours_completed: data.hours_completed || 0,
            start_month: data.start_month,
            end_month: data.end_month
        });
        setLoadingIds(prev => prev.filter(id => id !== projectId));
    };

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Forecast Setup</h2>
                <p className="text-gray-500 text-sm">Update hours complete and timelines to generate allocations.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Completed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.map(project => {
                            const forecast = getForecast(project.id);
                            // Local state for inputs to allow editing before saving?
                            // Ideally for "Excel-like behavior" each row is its own little form component
                            return (
                                <ForecastRow
                                    key={project.id}
                                    project={project}
                                    forecast={forecast}
                                    onSave={(data) => handleSave(project.id, data)}
                                    loading={loadingIds.includes(project.id)}
                                />
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ForecastRow: React.FC<{
    project: Project;
    forecast?: Forecast;
    onSave: (data: Partial<ForecastCreate>) => void;
    loading: boolean;
}> = ({ project, forecast, onSave, loading }) => {
    const [hoursCompleted, setHoursCompleted] = useState(forecast?.hours_completed || 0);
    const [startMonth, setStartMonth] = useState(forecast?.start_month || '');
    const [endMonth, setEndMonth] = useState(forecast?.end_month || '');

    // Update local state when prop changes (api reload)
    React.useEffect(() => {
        if (forecast) {
            setHoursCompleted(forecast.hours_completed);
            setStartMonth(forecast.start_month);
            setEndMonth(forecast.end_month);
        }
    }, [forecast]);

    const remaining = Math.max(0, project.total_labor_hours - hoursCompleted);
    const isDirty = forecast
        ? (hoursCompleted !== forecast.hours_completed || startMonth !== forecast.start_month || endMonth !== forecast.end_month)
        : (hoursCompleted > 0 || startMonth !== '' || endMonth !== '');

    // Highlight if remaining > 0 (as per spec "Highlight projects with remaining hours > 0")
    // Use a subtle background if active
    const rowClass = remaining > 0 ? "bg-white" : "bg-gray-50 opacity-75";

    return (
        <tr className={rowClass}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {project.job_number} - {project.job_name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {project.total_labor_hours}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <input
                    type="number"
                    className="border rounded p-1 w-24"
                    value={hoursCompleted}
                    onChange={(e) => setHoursCompleted(parseInt(e.target.value) || 0)}
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                {remaining}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <input
                    type="month"
                    className="border rounded p-1"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <input
                    type="month"
                    className="border rounded p-1"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {loading ? (
                    <span className="text-gray-400">Saving...</span>
                ) : (
                    isDirty && (
                        <button
                            onClick={() => onSave({ hours_completed: hoursCompleted, start_month: startMonth, end_month: endMonth })}
                            className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-xs"
                        >
                            Update
                        </button>
                    )
                )}
            </td>
        </tr>
    );
};

export default ForecastSetup;
