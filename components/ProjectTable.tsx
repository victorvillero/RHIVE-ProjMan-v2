import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../types';
import { MoreHorizontal, ChevronDown, Filter, Plus, Calendar, Trash2, AlertTriangle, X, Edit, ArrowDownUp, Check } from 'lucide-react';

interface ProjectTableProps {
  projects: Project[];
  onUpdateStatus: (id: string, newStatus: Project['status']) => void;
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
  onProjectClick: (project: Project) => void;
  onAddProject: () => void;
  onDeleteProjects: (ids: string[]) => void;
}

const STATUS_OPTIONS: Project['status'][] = ['Active', 'In Progress', 'On Track', 'Delayed', 'In Testing', 'Completed'];

// Helper for date formatting MM/DD/YY in Mountain Time
const formatDate = (dateString: string) => {
    if (dateString === 'Ongoing') return 'Ongoing';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            timeZone: 'America/Denver'
        }).format(date);
    } catch (e) {
        return dateString;
    }
};

// Edit Project Modal
const EditProjectModal: React.FC<{
    project: Project;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Project>) => void;
}> = ({ project, onClose, onSave }) => {
    const [name, setName] = useState(project.name);
    const [status, setStatus] = useState(project.status);
    const [startDate, setStartDate] = useState(project.startDate);
    const [endDate, setEndDate] = useState(project.endDate);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSave = () => {
        onSave(project.id, {
            name,
            status,
            startDate,
            endDate
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Edit Project</h2>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase">Project Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white mt-1" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as Project['status'])} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white mt-1">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white mt-1" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">End Date</label>
                            <input 
                                type={endDate === 'Ongoing' ? 'text' : 'date'} 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white mt-1" 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded hover:bg-teal-400">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Confirmation Modal Component
const ConfirmDeleteModal: React.FC<{ 
    count: number; 
    onConfirm: () => void; 
    onCancel: () => void 
}> = ({ count, onConfirm, onCancel }) => {
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md scale-100">
                <div className="flex items-center gap-4 mb-4 text-rose-500">
                    <div className="bg-rose-500/10 p-3 rounded-full">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Delete Projects?</h3>
                </div>
                <p className="text-slate-400 mb-6 leading-relaxed">
                    Are you sure you want to delete <strong className="text-white">{count}</strong> project{count > 1 ? 's' : ''}? 
                    This action cannot be undone and will remove all associated tasks.
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white font-medium">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-lg shadow-rose-600/20 transition-all">
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusDropdown: React.FC<{ 
    currentStatus: Project['status']; 
    onSelect: (s: Project['status']) => void;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onClose: () => void;
}> = ({ currentStatus, onSelect, isOpen, onToggle, onClose }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Update position whenever opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownHeight = 200; // Approx max height
            const spaceBelow = window.innerHeight - rect.bottom;
            
            let topPos = rect.bottom + 6;
            
            // If not enough space below, flip to top
            if (spaceBelow < dropdownHeight) {
                topPos = rect.top - 180; 
            }

            setPosition({
                top: topPos,
                left: rect.left
            });
        }
    }, [isOpen]);

    const getColor = (status: Project['status']) => {
        switch (status) {
            case 'Active': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
            case 'In Progress': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
            case 'On Track': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Delayed': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case 'In Testing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'Completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    return (
        <>
            <button 
                ref={buttonRef}
                onClick={onToggle}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:brightness-110 ${getColor(currentStatus)}`}
            >
                <span>{currentStatus}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(
                <div 
                    className="fixed w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: position.top, left: position.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-1 space-y-0.5">
                        {STATUS_OPTIONS.map(status => (
                            <button
                                key={status}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(status);
                                    onClose();
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between group hover:bg-slate-800 ${currentStatus === status ? 'text-white bg-slate-800' : 'text-slate-400'}`}
                            >
                                <span>{status}</span>
                                {currentStatus === status && <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onUpdateStatus, onUpdateProject, onProjectClick, onAddProject, onDeleteProjects }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Shared state for the active dropdown to ensure only one is open at a time
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Filtering State
  const [showFilter, setShowFilter] = useState(false);
  const [filterOwner, setFilterOwner] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortDeadline, setSortDeadline] = useState<'None' | 'Asc' | 'Desc'>('None');
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (openDropdownId) {
            setOpenDropdownId(null);
        }
        if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
            setShowFilter(false);
        }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  const toggleSelectAll = () => {
      if (selectedIds.size === projects.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(projects.map(p => p.id)));
      }
  };

  const toggleSelect = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const handleDeleteConfirm = () => {
      onDeleteProjects(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
  };

  // Get unique owners for filter dropdown
  const uniqueOwners = Array.from(new Set(projects.map(p => p.owner.id))).map(id => {
      return projects.find(p => p.owner.id === id)?.owner;
  }).filter(Boolean);

  // Filter Logic
  const filteredProjects = projects.filter(p => {
      const ownerMatch = filterOwner === 'All' || p.owner.id === filterOwner;
      const statusMatch = filterStatus === 'All' || p.status === filterStatus;
      return ownerMatch && statusMatch;
  }).sort((a, b) => {
      if (sortDeadline === 'None') return 0;
      
      // Handle 'Ongoing' dates - Treat as far future
      const dateAVal = a.endDate === 'Ongoing' ? 9999999999999 : new Date(a.endDate).getTime();
      const dateBVal = b.endDate === 'Ongoing' ? 9999999999999 : new Date(b.endDate).getTime();
      
      return sortDeadline === 'Asc' ? dateAVal - dateBVal : dateBVal - dateAVal;
  });

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {showDeleteConfirm && (
          <ConfirmDeleteModal 
            count={selectedIds.size} 
            onConfirm={handleDeleteConfirm} 
            onCancel={() => setShowDeleteConfirm(false)} 
          />
      )}

      {projectToEdit && onUpdateProject && (
          <EditProjectModal 
            project={projectToEdit} 
            onClose={() => setProjectToEdit(null)}
            onSave={onUpdateProject}
          />
      )}

      {/* Sub Header / Filters */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
                <div className="flex items-center animate-in slide-in-from-left-4 fade-in duration-200">
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-4 py-2 rounded-lg font-bold hover:bg-rose-500 hover:text-white transition-all"
                    >
                        <Trash2 size={18} />
                        <span>Delete ({selectedIds.size})</span>
                    </button>
                </div>
            )}
        </div>
        <div className="flex items-center space-x-3">
             {/* Layout icons removed as per request */}
            
            <div className="relative" ref={filterRef}>
                <button 
                    onClick={() => setShowFilter(!showFilter)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border ${showFilter ? 'bg-slate-800 border-slate-700 text-white' : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-900'}`}
                >
                    <Filter size={18} />
                    <span className="text-sm font-medium">Filter</span>
                    {(filterOwner !== 'All' || filterStatus !== 'All' || sortDeadline !== 'None') && (
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    )}
                </button>

                {showFilter && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Project Owner</label>
                                <select 
                                    value={filterOwner} 
                                    onChange={e => setFilterOwner(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-teal-500"
                                >
                                    <option value="All">All Owners</option>
                                    {uniqueOwners.map(u => (
                                        <option key={u!.id} value={u!.id}>{u!.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Status</label>
                                <select 
                                    value={filterStatus} 
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-teal-500"
                                >
                                    <option value="All">All Statuses</option>
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Sort By Deadline</label>
                                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                                    <button 
                                        onClick={() => setSortDeadline('None')}
                                        className={`flex-1 py-1 text-xs rounded ${sortDeadline === 'None' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >None</button>
                                    <button 
                                        onClick={() => setSortDeadline('Asc')}
                                        className={`flex-1 py-1 text-xs rounded ${sortDeadline === 'Asc' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >Oldest</button>
                                    <button 
                                        onClick={() => setSortDeadline('Desc')}
                                        className={`flex-1 py-1 text-xs rounded ${sortDeadline === 'Desc' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >Newest</button>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 border-t border-slate-800 bg-slate-800/50 flex justify-between items-center">
                            <button 
                                onClick={() => { setFilterOwner('All'); setFilterStatus('All'); setSortDeadline('None'); }}
                                className="text-xs text-rose-400 hover:text-rose-300"
                            >Reset Filters</button>
                            <button onClick={() => setShowFilter(false)} className="px-3 py-1 bg-teal-500 text-slate-950 text-xs font-bold rounded hover:bg-teal-400">Done</button>
                        </div>
                    </div>
                )}
            </div>

            <button 
                onClick={onAddProject}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-teal-500/20 flex items-center space-x-2 transition-all transform hover:scale-105"
            >
                <Plus size={18} />
                <span>New Project</span>
            </button>
        </div>
      </div>

      {/* Table Area - Added Extra Bottom Padding for Dropdowns */}
      <div className="flex-1 overflow-auto px-6 pb-20">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-visible backdrop-blur-sm mb-12">
            <table className="min-w-full text-left">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                <th className="px-6 py-4 w-10">
                    <input 
                        type="checkbox" 
                        className="rounded bg-slate-800 border-slate-600 accent-teal-500 w-4 h-4"
                        checked={filteredProjects.length > 0 && selectedIds.size === filteredProjects.length}
                        onChange={toggleSelectAll}
                    />
                </th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider w-[40%]">Project</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider w-[20%]">Owner</th>
                <th className="px-6 py-4 pl-12 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 pl-12 font-semibold text-xs uppercase tracking-wider w-32">Progress</th>
                <th className="px-6 py-4 pl-12 font-semibold text-xs uppercase tracking-wider w-40 text-right">Deadline</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider w-10"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
                {filteredProjects.map((project) => (
                <tr 
                    key={project.id} 
                    onClick={() => onProjectClick(project)}
                    className={`group transition-colors cursor-pointer ${selectedIds.has(project.id) ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'}`}
                >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                            type="checkbox" 
                            className="rounded bg-slate-800 border-slate-600 accent-teal-500 w-4 h-4"
                            checked={selectedIds.has(project.id)}
                            onChange={() => toggleSelect(project.id)}
                        />
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-200 text-sm group-hover:text-teal-400 transition-colors">{project.name}</span>
                            <span className="text-xs text-slate-500 font-mono mt-0.5">{project.projectId}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <img src={project.owner.avatar} alt={project.owner.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                            </div>
                            <span className="text-sm text-slate-300">{project.owner.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 pl-12" onClick={(e) => e.stopPropagation()}>
                        <StatusDropdown 
                            currentStatus={project.status} 
                            onSelect={(newStatus) => onUpdateStatus(project.id, newStatus)}
                            isOpen={openDropdownId === project.id}
                            onToggle={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === project.id ? null : project.id);
                            }}
                            onClose={() => setOpenDropdownId(null)}
                        />
                    </td>
                    <td className="px-6 py-4 pl-12">
                        <div className="w-16">
                            <div className="flex justify-end items-end mb-1">
                                <span className="text-xs font-bold text-slate-200">{project.percent}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        project.status === 'Delayed' ? 'bg-rose-500' :
                                        project.percent === 100 ? 'bg-teal-500' : 
                                        'bg-indigo-500'
                                    }`} 
                                    style={{ width: `${project.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 pl-12 text-right">
                         <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${project.status === 'Delayed' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 bg-slate-800'}`}>
                            <Calendar size={12} />
                            <span>{formatDate(project.endDate)}</span>
                         </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                         <button 
                            onClick={() => setProjectToEdit(project)}
                            className="text-slate-600 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded"
                            title="Edit Project"
                         >
                             <Edit size={16} />
                         </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            {filteredProjects.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                    <Filter size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No projects match your filters.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};