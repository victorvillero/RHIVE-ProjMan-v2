import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, Task, User, Comment, Attachment } from '../types';
import { ArrowLeft, Plus, Filter, MoreHorizontal, Calendar, CheckCircle2, Search, X, Flag, AlignLeft, User as UserIcon, Clock, Trash2, AlertTriangle, Edit2, Save, Users, MessageSquare, Send, Paperclip, File as FileIcon } from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  users: User[];
  currentUser: User;
  highlightTaskId?: string | null;
  highlightCommentId?: string | null;
  onBack: () => void;
  onClearHighlight?: () => void;
  onClearCommentHighlight?: () => void;
  onUpdateTaskStatus: (projectId: string, taskId: string, newStatus: Task['status']) => void;
  onUpdateTaskDetails: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  onAddTask: (projectId: string) => void;
  onDeleteTasks: (projectId: string, taskIds: string[]) => void;
  onCommentAdded?: (projectId: string, taskId: string, comment: Comment) => void;
}

const TASK_STATUS_OPTIONS: Task['status'][] = ['Open', 'In Progress', 'On Hold', 'Done'];

// Helper to format timestamps in Mountain Time
const formatTimestamp = (isoString: string) => {
    try {
        return new Date(isoString).toLocaleString('en-US', {
            timeZone: 'America/Denver',
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    } catch (e) {
        return isoString;
    }
};

const formatDueDate = (isoString: string) => {
    try {
        return new Date(isoString).toLocaleDateString('en-US', {
            timeZone: 'America/Denver',
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        return isoString;
    }
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
                    <h3 className="text-xl font-bold text-white">Delete Tasks?</h3>
                </div>
                <p className="text-slate-400 mb-6 leading-relaxed">
                    Are you sure you want to delete <strong className="text-white">{count}</strong> task{count > 1 ? 's' : ''}? 
                    This action cannot be undone.
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

const TaskStatusDropdown: React.FC<{ 
    currentStatus: Task['status']; 
    onSelect: (s: Task['status'], e?: React.MouseEvent) => void 
}> = ({ currentStatus, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleInteraction = () => setIsOpen(false);

        if (isOpen) {
             window.addEventListener('click', handleInteraction);
             window.addEventListener('scroll', handleInteraction, { capture: true });
        }
        return () => {
             window.removeEventListener('click', handleInteraction);
             window.removeEventListener('scroll', handleInteraction, { capture: true });
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
             setIsOpen(false);
             return;
        }

        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            // Calculate available space
            const dropdownHeight = 160; // Estimated height of dropdown (4 items * ~40px)
            const spaceBelow = window.innerHeight - rect.bottom;
            
            let topPos = rect.bottom + 4;
            
            // If space below is insufficient, flip it up
            if (spaceBelow < dropdownHeight) {
                topPos = rect.top - dropdownHeight - 4;
            }

            setPosition({
                top: topPos,
                left: rect.left
            });
            setIsOpen(true);
        }
    }

    const getColor = (status: Task['status']) => {
        switch (status) {
            case 'Open': return 'bg-slate-700 text-slate-300 border-slate-600';
            case 'In Progress': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
            case 'On Hold': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'Done': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    return (
        <>
            <button 
                ref={dropdownRef}
                onClick={handleToggle}
                className={`flex items-center justify-center w-28 px-2 py-1.5 rounded text-xs font-semibold border transition-all ${getColor(currentStatus)}`}
            >
                <span>{currentStatus}</span>
            </button>

            {isOpen && createPortal(
                <div 
                    className="fixed w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: position.top, left: position.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {TASK_STATUS_OPTIONS.map(status => (
                        <button
                            key={status}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(status);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-800 ${currentStatus === status ? 'text-teal-400 bg-slate-800/50' : 'text-slate-300'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};

const TaskDetailModal: React.FC<{
    task: Task;
    users: User[];
    currentUser: User;
    highlightCommentId?: string | null;
    onClose: () => void;
    onUpdate: (updates: Partial<Task>) => void;
    onAddComment?: (comment: Comment) => void;
}> = ({ task, users, currentUser, highlightCommentId, onClose, onUpdate, onAddComment }) => {
    const [name, setName] = useState(task.name);
    const [description, setDescription] = useState(task.description || '');
    const [status, setStatus] = useState(task.status);
    const [priority, setPriority] = useState(task.priority || 'Medium');
    const [dueDate, setDueDate] = useState(task.dueDate || '');
    const [assignees, setAssignees] = useState<string[]>(task.assignees.map(u => u.id));
    const [commentText, setCommentText] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    
    // Attachment State
    const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to comment if needed
    useEffect(() => {
        if (highlightCommentId) {
            const el = document.getElementById(`comment-${highlightCommentId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: add a temporary highlight effect
                el.classList.add('bg-slate-800', 'ring-2', 'ring-teal-500/50');
                setTimeout(() => el.classList.remove('bg-slate-800', 'ring-2', 'ring-teal-500/50'), 2000);
            }
        }
    }, [highlightCommentId, task.comments]);

    const handleSave = () => {
        onUpdate({
            name,
            description,
            status,
            priority,
            dueDate,
            assignees: users.filter(u => assignees.includes(u.id))
        });
        setIsEditingTitle(false);
    };

    const handleAddComment = () => {
        if (!commentText.trim() && pendingAttachments.length === 0) return;
        const newComment: Comment = {
            id: `cmt-${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            text: commentText,
            timestamp: new Date().toISOString(),
            attachments: pendingAttachments
        };
        onUpdate({
            comments: [...(task.comments || []), newComment]
        });
        
        if (onAddComment) {
            onAddComment(newComment);
        }

        setCommentText('');
        setPendingAttachments([]);
    };

    const toggleAssignee = (userId: string) => {
        if (assignees.includes(userId)) {
            setAssignees(assignees.filter(id => id !== userId));
        } else {
            setAssignees([...assignees, userId]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    const type = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
                    setPendingAttachments(prev => [...prev, { type, url: result, name: file.name }]);
                };
                reader.readAsDataURL(file);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target?.result) {
                            setPendingAttachments(prev => [...prev, { 
                                type: 'image', 
                                url: event.target!.result as string, 
                                name: 'pasted-image.png' 
                            }]);
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const removePendingAttachment = (index: number) => {
        setPendingAttachments(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation(); // Prevent bubbling if necessary
                if (viewingImage) {
                    setViewingImage(null);
                } else {
                    handleSave();
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewingImage, name, description, status, priority, dueDate, assignees]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
             {viewingImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200" 
                    onClick={(e) => { e.stopPropagation(); setViewingImage(null); }}
                >
                    <button className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 bg-slate-800/50 rounded-full transition-colors"><X size={24}/></button>
                    <img 
                        src={viewingImage} 
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                        onClick={e => e.stopPropagation()} 
                        alt="Full view"
                    />
                </div>
             )}

             <div 
                className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl p-0 flex flex-col animate-in slide-in-from-right duration-300"
                onClick={e => e.stopPropagation()}
             >
                {/* Header */}
                <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 z-10">
                    <div className="flex items-center gap-3 text-slate-400">
                        <CheckCircle2 size={18} className={status === 'Done' ? 'text-teal-500' : ''}/>
                        <span className="text-xs uppercase font-mono">{task.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => { handleSave(); onClose(); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><X size={20}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {/* Title */}
                    <div className="mb-6 group">
                        {isEditingTitle ? (
                            <div className="flex gap-2">
                                <input 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xl font-bold text-white"
                                    autoFocus
                                />
                                <button onClick={() => { handleSave(); setIsEditingTitle(false); }} className="px-3 bg-teal-600 rounded text-white"><Save size={18}/></button>
                            </div>
                        ) : (
                            <h2 
                                onClick={() => setIsEditingTitle(true)}
                                className="text-2xl font-bold text-slate-100 hover:text-teal-400 cursor-pointer transition-colors flex items-center gap-2"
                            >
                                {name}
                                <Edit2 size={16} className="opacity-0 group-hover:opacity-50" />
                            </h2>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-8 mb-8">
                        <div className="col-span-2 space-y-8">
                             {/* Description */}
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                                     <AlignLeft size={14}/> Description
                                 </label>
                                 <textarea 
                                     value={description}
                                     onChange={e => setDescription(e.target.value)}
                                     onBlur={handleSave}
                                     className="w-full min-h-[150px] bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-slate-300 text-sm focus:border-teal-500 focus:outline-none transition-all placeholder:text-slate-600"
                                     placeholder="Add a detailed description..."
                                 />
                             </div>

                             {/* Comments */}
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
                                     <MessageSquare size={14}/> Comments
                                 </label>
                                 
                                 <div className="space-y-4 mb-6">
                                     {task.comments?.map(comment => (
                                         <div key={comment.id} id={`comment-${comment.id}`} className="flex gap-3 transition-colors duration-1000 rounded p-1">
                                             <img src={comment.userAvatar} className="w-8 h-8 rounded-full border border-slate-700 mt-1" alt="" />
                                             <div className="flex-1">
                                                 <div className="flex items-baseline justify-between mb-1">
                                                     <span className="font-bold text-slate-300 text-sm">{comment.userName}</span>
                                                     <span className="text-[10px] text-slate-600">{formatTimestamp(comment.timestamp)}</span>
                                                 </div>
                                                 <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300 border border-slate-800">
                                                     {comment.text}
                                                     {comment.attachments && comment.attachments.length > 0 && (
                                                         <div className="mt-2 grid grid-cols-2 gap-2">
                                                             {comment.attachments.map((att, idx) => (
                                                                 att.type === 'image' ? (
                                                                     <img 
                                                                        key={idx} 
                                                                        src={att.url} 
                                                                        alt={att.name} 
                                                                        className="rounded-md w-full h-auto max-h-40 object-cover border border-slate-700 cursor-pointer hover:opacity-90 transition-opacity" 
                                                                        onClick={() => setViewingImage(att.url)}
                                                                     />
                                                                 ) : (
                                                                     <div key={idx} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700 text-xs text-slate-400">
                                                                         <FileIcon size={14} />
                                                                         <span className="truncate">{att.name}</span>
                                                                     </div>
                                                                 )
                                                             ))}
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                     {(!task.comments || task.comments.length === 0) && (
                                         <div className="text-center text-slate-600 text-sm py-4 italic">No comments yet.</div>
                                     )}
                                 </div>

                                 <div className="flex gap-3">
                                     <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-slate-700" alt="" />
                                     <div className="flex-1">
                                         <div className="relative bg-slate-950 border border-slate-800 rounded-lg focus-within:border-teal-500 transition-colors">
                                             <input 
                                                 value={commentText}
                                                 onChange={e => setCommentText(e.target.value)}
                                                 onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                                 onPaste={handlePaste}
                                                 placeholder="Write a comment..."
                                                 className="w-full bg-transparent pl-4 pr-10 py-3 text-sm text-white focus:outline-none"
                                             />
                                             <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                                 <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-500 hover:text-white rounded-md transition-colors mr-1">
                                                     <Paperclip size={16}/>
                                                 </button>
                                                 <button 
                                                    onClick={handleAddComment}
                                                    className="p-1.5 text-teal-500 hover:bg-teal-500/10 rounded-md transition-colors"
                                                 >
                                                     <Send size={16}/>
                                                 </button>
                                             </div>
                                             <input 
                                                 type="file" 
                                                 ref={fileInputRef} 
                                                 onChange={handleFileSelect} 
                                                 className="hidden" 
                                                 multiple
                                             />
                                         </div>
                                         {pendingAttachments.length > 0 && (
                                             <div className="mt-2 flex flex-wrap gap-2">
                                                 {pendingAttachments.map((att, idx) => (
                                                     <div key={idx} className="relative group">
                                                         {att.type === 'image' ? (
                                                             <img src={att.url} alt="preview" className="w-16 h-16 object-cover rounded border border-slate-700" />
                                                         ) : (
                                                             <div className="w-16 h-16 bg-slate-800 rounded border border-slate-700 flex flex-col items-center justify-center p-1">
                                                                 <FileIcon size={16} className="text-slate-400 mb-1" />
                                                                 <span className="text-[8px] text-slate-500 w-full truncate text-center">{att.name}</span>
                                                             </div>
                                                         )}
                                                         <button 
                                                             onClick={() => removePendingAttachment(idx)}
                                                             className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                         >
                                                             <X size={10}/>
                                                         </button>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* Sidebar Props */}
                        <div className="space-y-6">
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status</label>
                                 <select 
                                     value={status} 
                                     onChange={e => { setStatus(e.target.value as any); onUpdate({ status: e.target.value as any }); }}
                                     className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                                 >
                                     {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Priority</label>
                                 <select 
                                     value={priority} 
                                     onChange={e => { setPriority(e.target.value as any); onUpdate({ priority: e.target.value as any }); }}
                                     className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                                 >
                                     <option value="Low">Low</option>
                                     <option value="Medium">Medium</option>
                                     <option value="High">High</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Due Date</label>
                                 <input 
                                     type="date"
                                     value={dueDate} 
                                     onChange={e => { setDueDate(e.target.value); onUpdate({ dueDate: e.target.value }); }}
                                     className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:border-teal-500 outline-none"
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex justify-between">
                                     <span>Assignees</span>
                                     <span className="text-slate-600">{assignees.length}</span>
                                 </label>
                                 <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                                     {users.map(u => (
                                         <div 
                                            key={u.id} 
                                            onClick={() => { toggleAssignee(u.id); handleSave(); }} // simplified immediate save for assignees
                                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-slate-800 ${assignees.includes(u.id) ? 'bg-slate-800/50' : ''}`}
                                         >
                                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${assignees.includes(u.id) ? 'bg-teal-500 border-teal-500' : 'border-slate-600'}`}>
                                                 {assignees.includes(u.id) && <div className="w-1.5 h-1.5 bg-slate-900 rounded-sm"></div>}
                                             </div>
                                             <img src={u.avatar} className="w-5 h-5 rounded-full" alt=""/>
                                             <span className="text-xs text-slate-300 truncate">{u.name}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ 
    project, 
    users, 
    currentUser, 
    highlightTaskId,
    highlightCommentId,
    onBack, 
    onClearHighlight,
    onClearCommentHighlight,
    onUpdateTaskStatus, 
    onUpdateTaskDetails,
    onAddTask,
    onDeleteTasks,
    onCommentAdded
}) => {
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initial highlight logic
    useEffect(() => {
        if (highlightTaskId && project.tasks) {
            const task = project.tasks.find(t => t.id === highlightTaskId);
            if (task) {
                setEditingTask(task);
                onClearHighlight?.();
            }
        }
    }, [highlightTaskId, project.tasks, onClearHighlight]);

    const filteredTasks = (project.tasks || []).filter(t => {
        const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const toggleSelectAll = () => {
        if (selectedTasks.size === filteredTasks.length) {
            setSelectedTasks(new Set());
        } else {
            setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedTasks);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTasks(newSet);
    };

    const handleTaskUpdate = (updates: Partial<Task>) => {
        if (editingTask) {
            onUpdateTaskDetails(project.id, editingTask.id, updates);
            // Update local editing state to reflect changes immediately
            setEditingTask({ ...editingTask, ...updates });
        }
    };

    const handleDeleteConfirm = () => {
        onDeleteTasks(project.id, Array.from(selectedTasks));
        setSelectedTasks(new Set());
        setShowDeleteConfirm(false);
    };

    return (
        <div className="flex flex-col h-full bg-transparent relative">
            {showDeleteConfirm && (
                <ConfirmDeleteModal 
                    count={selectedTasks.size}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            {editingTask && (
                <TaskDetailModal 
                    task={editingTask}
                    users={users}
                    currentUser={currentUser}
                    highlightCommentId={highlightCommentId}
                    onClose={() => { setEditingTask(null); onClearCommentHighlight?.(); }}
                    onUpdate={handleTaskUpdate}
                    onAddComment={(comment) => onCommentAdded && onCommentAdded(project.id, editingTask.id, comment)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-white">{project.name}</h1>
                                <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{project.projectId}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <UserIcon size={12}/>
                                    <span>{project.owner.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={12}/>
                                    <span>Due {formatDueDate(project.endDate === 'Ongoing' ? new Date().toISOString() : project.endDate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         {selectedTasks.size > 0 && (
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-rose-500 hover:text-white transition-all mr-2"
                            >
                                <Trash2 size={16} />
                                <span>Delete ({selectedTasks.size})</span>
                            </button>
                        )}
                        <button 
                            onClick={() => onAddTask(project.id)}
                            className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20"
                        >
                            <Plus size={16} /> New Task
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-2 flex items-center gap-4 overflow-x-auto">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:border-teal-500 outline-none w-48"
                        />
                    </div>
                    <div className="h-6 w-[1px] bg-slate-800"></div>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                         {['All', ...TASK_STATUS_OPTIONS].map(status => (
                             <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterStatus === status ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                 {status}
                             </button>
                         ))}
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4 w-10 border-b border-slate-800">
                                    <input 
                                        type="checkbox"
                                        checked={filteredTasks.length > 0 && selectedTasks.size === filteredTasks.length}
                                        onChange={toggleSelectAll}
                                        className="rounded bg-slate-800 border-slate-600 accent-teal-500 w-4 h-4"
                                    />
                                </th>
                                <th className="p-4 border-b border-slate-800">Task Name</th>
                                <th className="p-4 border-b border-slate-800 w-32">Status</th>
                                <th className="p-4 border-b border-slate-800 w-24">Priority</th>
                                <th className="p-4 border-b border-slate-800 w-32">Assignees</th>
                                <th className="p-4 border-b border-slate-800 w-32 text-right">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                        No tasks found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(task => (
                                    <tr 
                                        key={task.id} 
                                        className={`group hover:bg-slate-800/40 transition-colors ${selectedTasks.has(task.id) ? 'bg-slate-800/60' : ''}`}
                                    >
                                        <td className="p-4">
                                            <input 
                                                type="checkbox"
                                                checked={selectedTasks.has(task.id)}
                                                onChange={() => toggleSelect(task.id)}
                                                className="rounded bg-slate-800 border-slate-600 accent-teal-500 w-4 h-4"
                                            />
                                        </td>
                                        <td className="p-4 cursor-pointer" onClick={() => setEditingTask(task)}>
                                            <div className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors">{task.name}</div>
                                            {task.description && <div className="text-xs text-slate-500 truncate max-w-xs">{task.description}</div>}
                                        </td>
                                        <td className="p-4">
                                            <TaskStatusDropdown 
                                                currentStatus={task.status}
                                                onSelect={(newStatus) => onUpdateTaskStatus(project.id, task.id, newStatus)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded border ${
                                                task.priority === 'High' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                                                task.priority === 'Medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                                'text-slate-400 border-slate-600 bg-slate-800'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex -space-x-2">
                                                {task.assignees.map((u, i) => (
                                                    <img 
                                                        key={u.id}
                                                        src={u.avatar} 
                                                        className="w-6 h-6 rounded-full border border-slate-900" 
                                                        title={u.name}
                                                        alt={u.name}
                                                        style={{ zIndex: task.assignees.length - i }}
                                                    />
                                                ))}
                                                {task.assignees.length === 0 && <span className="text-xs text-slate-600 italic">Unassigned</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`text-xs ${new Date(task.dueDate || '') < new Date() && task.status !== 'Done' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                                                {task.dueDate ? formatDueDate(task.dueDate) : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};