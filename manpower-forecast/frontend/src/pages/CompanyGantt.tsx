import { useState, useEffect, useMemo } from 'react'
import { projectsApi } from '../api'
import type { Project } from '../types'
import { format, eachMonthOfInterval, differenceInDays, addMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export default function CompanyGantt() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>('all') // all, active, prospective
    const [filterType, setFilterType] = useState<string>('all') // all, mechanical, electrical, vesda
    const [awsFilter, setAwsFilter] = useState<'all' | 'aws' | 'standard'>('standard')

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            setLoading(true)
            const response = await projectsApi.list()
            setProjects(response.data)
        } catch (error) {
            console.error('Failed to load projects:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            // Filter out projects with no dates
            if (!p.start_date || !p.end_date) return false

            if (filterStatus !== 'all' && p.status !== filterStatus) return false

            // Filter by type
            if (filterType === 'mechanical' && !p.is_mechanical) return false
            if (filterType === 'electrical' && !p.is_electrical) return false
            if (filterType === 'vesda' && !p.is_vesda) return false

            // Filter by AWS
            if (awsFilter === 'aws' && !p.is_aws) return false
            if (awsFilter === 'standard' && p.is_aws) return false

            return true
        })
    }, [projects, filterStatus, filterType, awsFilter])

    // Calculate timeline range
    const { minDate, maxDate, months } = useMemo(() => {
        if (filteredProjects.length === 0) {
            const now = new Date()
            return {
                minDate: startOfMonth(now),
                maxDate: endOfMonth(addMonths(now, 6)),
                months: eachMonthOfInterval({ start: startOfMonth(now), end: endOfMonth(addMonths(now, 6)) })
            }
        }

        let min = parseISO(filteredProjects[0].start_date!)
        let max = parseISO(filteredProjects[0].end_date!)

        filteredProjects.forEach(p => {
            const start = parseISO(p.start_date!)
            const end = parseISO(p.end_date!)
            if (start < min) min = start
            if (end > max) max = end
        })

        // Add some buffer
        min = startOfMonth(min)
        max = endOfMonth(max)

        const monthsArr = eachMonthOfInterval({ start: min, end: max })
        return { minDate: min, maxDate: max, months: monthsArr }
    }, [filteredProjects])

    // Chart Dimensions
    const MONTH_WIDTH = 100 // px
    void (months.length * MONTH_WIDTH) // totalWidth reserved for future use

    const getPositionStyle = (start: string, end: string) => {
        const startDate = parseISO(start)
        const endDate = parseISO(end)
        const totalDays = differenceInDays(maxDate, minDate) + 1
        const startOffsetDays = differenceInDays(startDate, minDate)
        const durationDays = differenceInDays(endDate, startDate) + 1

        const left = (startOffsetDays / totalDays) * 100
        const width = (durationDays / totalDays) * 100

        return {
            left: `${left}%`,
            width: `${width}%`
        }
    }

    if (loading) return <div className="text-center py-12">Loading chart...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {awsFilter === 'all' ? 'All Projects Gantt' : awsFilter === 'aws' ? 'AWS Projects Gantt' : 'Gantt Chart'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">Timeline view of all active and prospective projects</p>
                    {/* Main View Tabs */}
                    <div className="flex space-x-1 mt-2">
                        <button
                            onClick={() => setAwsFilter('standard')}
                            className={`text-xs px-2 py-1 rounded ${awsFilter === 'standard' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => setAwsFilter('aws')}
                            className={`text-xs px-2 py-1 rounded ${awsFilter === 'aws' ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'}`}
                        >
                            AWS Projects
                        </button>
                        <button
                            onClick={() => setAwsFilter('all')}
                            className={`text-xs px-2 py-1 rounded ${awsFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex bg-gray-200 rounded-lg p-1">
                    {['all', 'active', 'prospective'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === status
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Type Filter Controls */}
                <div className="flex bg-gray-200 rounded-lg p-1 ml-4">
                    {['all', 'mechanical', 'electrical', 'vesda'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === type
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card p-0 overflow-hidden border border-gray-200 flex flex-col h-[700px]">
                {/* Header Row */}
                <div className="flex border-b border-gray-200 bg-gray-50 flex-none z-10">
                    <div className="w-64 flex-none p-4 font-semibold text-gray-700 border-r border-gray-200 bg-gray-50 z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                        Project Name
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <div className="flex h-full">
                            {months.map(month => (
                                <div
                                    key={month.toString()}
                                    className="flex-none border-r border-gray-200 p-2 text-center text-sm font-medium text-gray-600"
                                    style={{ width: `${100 / months.length}%` }}
                                >
                                    {format(month, 'MMM yyyy')}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                    {filteredProjects.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No projects found for the selected filter with valid dates.</div>
                    ) : (
                        filteredProjects.map((project, index) => (
                            <div key={project.id} className={`flex border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                {/* Left Column (Stickyish visual effect handled by structure) */}
                                <div className="w-64 flex-none p-4 border-r border-gray-200 bg-inherit flex flex-col justify-center relative z-10">
                                    <div className="font-medium text-gray-900 truncate" title={project.name}>{project.name}</div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs text-gray-500 font-mono">{project.project_number || 'No #'}</span>
                                        <div className="flex space-x-1">
                                            {project.is_aws && <span className="text-[10px] uppercase bg-purple-100 text-purple-800 px-1 rounded border border-purple-200">AWS</span>}
                                            {project.is_mechanical && <span className="text-[10px] uppercase bg-orange-100 text-orange-800 px-1 rounded">M</span>}
                                            {project.is_electrical && <span className="text-[10px] uppercase bg-yellow-100 text-yellow-800 px-1 rounded">E</span>}
                                            {project.is_vesda && <span className="text-[10px] uppercase bg-pink-100 text-pink-800 px-1 rounded">VESDA</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Gantt Bar Area */}
                                <div className="flex-1 relative h-16 bg-inherit">
                                    {/* Grid Lines Overlay */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {months.map(month => (
                                            <div
                                                key={`grid-${month.toString()}`}
                                                className="flex-none border-r border-gray-100 h-full"
                                                style={{ width: `${100 / months.length}%` }}
                                            />
                                        ))}
                                    </div>

                                    {/* The Bar */}
                                    <div className="absolute inset-x-0 h-full flex items-center px-2 pointer-events-none">
                                        {project.start_date && project.end_date && (
                                            <div
                                                className={`h-8 rounded-lg shadow-sm border border-opacity-20 flex items-center px-3 relative group transition-all hover:h-10 hover:shadow-md cursor-pointer pointer-events-auto ${project.status === 'active'
                                                    ? 'bg-blue-100 border-blue-300'
                                                    : 'bg-purple-100 border-purple-300'
                                                    }`}
                                                style={getPositionStyle(project.start_date, project.end_date)}
                                                title={`${project.name}: ${project.start_date} to ${project.end_date}`}
                                            >
                                                <div className={`h-full absolute left-0 top-0 rounded-l-lg ${project.status === 'active' ? 'bg-blue-500 w-1.5' : 'bg-purple-500 w-1.5'
                                                    }`}
                                                />
                                                <span className={`text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis ml-2 ${project.status === 'active' ? 'text-blue-800' : 'text-purple-800'
                                                    }`}>
                                                    {project.name} ({differenceInDays(parseISO(project.end_date), parseISO(project.start_date))} days)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
