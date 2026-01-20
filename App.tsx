import React, { useState, useEffect, useRef } from 'react';
import { ProjectTable } from './components/ProjectTable';
import { ProjectDetail } from './components/ProjectDetail';
import { ChatOverlay } from './components/ChatOverlay';
import { VideoConference } from './components/VideoConference';
import { Confetti, ConfettiRef } from './components/Confetti';
import { Project, User, Task, ChatSession, ChatMessage, TimeLog, Notification } from './types';
import { Search, Bell, Settings, LogOut, LayoutGrid, Folder, Globe, Archive, Lock, User as UserIcon, Shield, Trash2, RefreshCw, X, Image as ImageIcon, Plus, AlignLeft, Flag, Upload, CheckCircle2, ChevronLeft, ChevronRight, ArrowRight, MessageCircle, FileText, Play, Square, Clock, Calendar, Edit2, StopCircle, DollarSign, PieChart, ChevronDown, Check, Activity } from 'lucide-react';

// --- BACKEND SIMULATION & MOCK DATA ---

const DEFAULT_PASSWORD = 'RHive12345';

const INITIAL_USERS: User[] = [
  { id: 'admin', username: 'admin', email: 'admin@rhiveconstruction.com', name: 'Administrator', avatar: 'https://picsum.photos/200/200?random=99', password: 'admin123', isFirstLogin: false, role: 'admin' },
  { id: 'u1', username: 'michael.r', email: 'michael.r@rhiveconstruction.com', name: 'Michael Rob', avatar: 'https://picsum.photos/200/200?random=1', password: DEFAULT_PASSWORD, isFirstLogin: true, role: 'user' },
  { id: 'u2', username: 'kara.r', email: 'kara.r@rhiveconstruction.com', name: 'Kara Robins', avatar: 'https://picsum.photos/200/200?random=2', password: DEFAULT_PASSWORD, isFirstLogin: true, role: 'user' },
  { id: 'u3', username: 'victor.v', email: 'victor.v@rhiveconstruction.com', name: 'Victor Viller', avatar: 'https://picsum.photos/200/200?random=3', password: DEFAULT_PASSWORD, isFirstLogin: true, role: 'user' },
  { id: 'u4', username: 'van.v', email: 'van.v@rhiveconstruction.com', name: 'Vanessa Pol', avatar: 'https://picsum.photos/200/200?random=4', password: DEFAULT_PASSWORD, isFirstLogin: true, role: 'user' },
  { id: 'u5', username: 'sheena.l', email: 'sheena.l@rhiveconstruction.com', name: 'Sheena Les', avatar: 'https://picsum.photos/200/200?random=5', password: DEFAULT_PASSWORD, isFirstLogin: true, role: 'user' },
  { id: 'u6', username: 'james.g', email: 'james.g@rhiveconstruction.com', name: 'James Gime', avatar: 'https://picsum.photos/200/200?random=6', password: DEFAULT_PASSWORD, isFirstLogin: true, role: 'user' },
  { id: 'u7', username: 'maureen.g', email: 'maureen.g@rhiveconstruction.com', name: 'Maureen G', avatar: 'https://picsum.photos/200/200?random=7', password: DEFAULT_PASSWORD, isFirstLogin: true, role: 'user' },
];

// Helper to generate random tasks
const generateTasks = (count: number, assignee: User): Task[] => {
    const statuses: Task['status'][] = ['Open', 'In Progress', 'On Hold', 'Done'];
    const priorities: Task['priority'][] = ['Low', 'Medium', 'High'];
    const tasks: Task[] = [];
    const taskNames = [
        "Review Q3 Requirements", "Update User Flow", "Fix Mobile Padding", 
        "Database Schema Sync", "Client Meeting Prep", "Deploy to Staging", 
        "Write Integration Tests", "Accessibility Audit", "Update API Docs", 
        "Email Automation Setup"
    ];
    
    for (let i = 0; i < count; i++) {
        tasks.push({
            id: `t-${Math.random().toString(36).substr(2, 9)}`,
            name: taskNames[Math.floor(Math.random() * taskNames.length)],
            description: "Detailed description of the task requirements and acceptance criteria should go here.",
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            assignees: [assignee], 
            status: statuses[Math.floor(Math.random() * statuses.length)],
            startDate: '2025-02-12',
            dueDate: '2025-02-28',
            comments: []
        });
    }
    return tasks;
};

// Initial Mock Projects if LocalStorage is empty
const getInitialProjects = (users: User[]): Project[] => {
    // Helper to find user by partial name or default to first
    const findUser = (namePart: string) => users.find(u => u.username.includes(namePart)) || users[1]; // default to non-admin

    const projects: Project[] = [
        {
            id: '1', projectId: 'PRO-01', name: 'Event Planner App', percent: 0, owner: findUser('kara'), status: 'Active', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-06-01', endDate: '2024-09-01', tasks: generateTasks(5, findUser('kara'))
        },
        {
            id: '2', projectId: 'PRO-02', name: 'Website Redesign', percent: 0, owner: findUser('van'), status: 'In Testing', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-08-15', endDate: '2024-10-30', isTemplate: true, tasks: generateTasks(3, findUser('van'))
        },
        {
            id: '3', projectId: 'PRO-03', name: "Q4 Marketing Strategy", percent: 0, owner: findUser('victor'), status: 'On Track', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-07-01', endDate: '2024-12-31', tasks: generateTasks(8, findUser('victor'))
        },
        {
            id: '4', projectId: 'PRO-04', name: "Mobile API Integration", percent: 0, owner: findUser('james'), status: 'In Testing', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-05-10', endDate: '2024-06-20', tasks: generateTasks(2, findUser('james'))
        },
        {
            id: '5', projectId: 'PRO-05', name: "Customer Feedback Loop", percent: 0, owner: findUser('van'), status: 'Delayed', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-06-15', endDate: '2024-08-15', tasks: generateTasks(4, findUser('van'))
        },
        {
            id: '6', projectId: 'PRO-06', name: "Internal Audit", percent: 0, owner: findUser('sheena'), status: 'Active', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-09-01', endDate: '2024-11-01', tasks: generateTasks(6, findUser('sheena'))
        },
        {
            id: '7', projectId: 'PRO-07', name: "New Hire Onboarding", percent: 0, owner: findUser('michael'), status: 'On Track', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-01-01', endDate: '2024-12-31', tasks: generateTasks(3, findUser('michael'))
        },
        {
            id: '8', projectId: 'PRO-08', name: "AI Research Phase 1", percent: 0, owner: findUser('kara'), status: 'In Progress', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-08-01', endDate: '2025-02-01', tasks: generateTasks(5, findUser('kara'))
        },
        {
            id: '9', projectId: 'PRO-09', name: "Database Migration", percent: 0, owner: findUser('maureen'), status: 'Delayed', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-03-01', endDate: '2024-07-30', tasks: generateTasks(7, findUser('maureen'))
        },
        {
            id: '10', projectId: 'PRO-10', name: "Security Compliance", percent: 0, owner: findUser('maureen'), status: 'On Track', tasksCompleted: 0, tasksTotal: 0, startDate: '2024-02-01', endDate: '2024-10-01', tasks: generateTasks(4, findUser('maureen'))
        },
    ];

    return projects.map(p => {
        // Initial Calculation
        if (!p.tasks) return p;
        const completed = p.tasks.filter(t => t.status === 'Done').length;
        const percent = Math.round((completed / p.tasks.length) * 100);
        return {
            ...p,
            tasksCompleted: completed,
            tasksTotal: p.tasks.length,
            percent: percent,
            status: percent === 100 ? 'Completed' : p.status
        };
    });
};

const getInitialChats = (users: User[]): ChatSession[] => {
     return [
        {
            id: 'c1',
            name: 'Project Alpha Team',
            type: 'group',
            participants: [users[1], users[2]],
            unread: 3,
            messages: [
                { id: '1', senderId: users[1].id, senderName: users[1].name, text: 'Hey everyone, check the latest designs.', timestamp: new Date().toISOString() },
                { id: '2', senderId: users[2].id, senderName: users[2].name, text: 'Looks great! Approved.', timestamp: new Date().toISOString() }
            ]
        }
    ];
};

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '1', recipientId: 'u2', text: "Kara Robins commented on Project Alpha Team", time: "2 min ago", unread: true, type: 'chat', targetId: 'c1' },
    { id: '2', recipientId: 'u2', text: "Task 'Database Migration' (Delayed) is due soon", time: "1 hour ago", unread: true, type: 'task', targetId: '9', secondaryId: 't-db-mig' },
    { id: '3', recipientId: 'u2', text: "New team member added: James Gime", time: "5 hours ago", unread: false, type: 'project', targetId: '7' },
    { id: '4', recipientId: 'u2', text: "Project 'Website Redesign' marked as In Testing", time: "1 day ago", unread: false, type: 'project', targetId: '2' },
];

const MOCK_TIME_LOGS: TimeLog[] = [
    { id: 'tl1', userId: 'u1', startTime: new Date(Date.now() - 86400000 * 2 + 3600000 * 9).toISOString(), endTime: new Date(Date.now() - 86400000 * 2 + 3600000 * 17).toISOString() }, // 2 days ago, 9am-5pm
    { id: 'tl2', userId: 'u2', startTime: new Date(Date.now() - 86400000 + 3600000 * 10).toISOString(), endTime: new Date(Date.now() - 86400000 + 3600000 * 14).toISOString() }, // Yesterday 10am-2pm
    { id: 'tl3', userId: 'u3', startTime: new Date(Date.now() - 3600000 * 3).toISOString() }, // Currently active 3 hours ago
];

// --- COMPONENTS ---

// Helper for Active User Timer Display
const ActiveUserTimer = ({ startTime }: { startTime: number }) => {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const diff = Math.max(0, now - startTime);
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return <span className="font-mono text-teal-400 font-bold text-xs">{elapsed}</span>;
};

// Custom Date Time Input to replace datetime-local
const DateTimeInput = ({ value, onChange }: { value: string | undefined, onChange: (val: string) => void }) => {
    // Parse ISO to Mountain Time parts for display
    const getParts = (iso?: string) => {
        const d = iso ? new Date(iso) : new Date();
        // Extract parts in US Mountain Time
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Denver',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: 'numeric', minute: '2-digit', hour12: true
        }).formatToParts(d);
        
        const get = (t: string) => parts.find(p => p.type === t)?.value || '';
        
        // Convert to input-friendly format
        return {
            date: `${get('year')}-${get('month')}-${get('day')}`,
            h: get('hour'),
            m: get('minute'),
            ampm: get('dayPeriod') as 'AM' | 'PM'
        };
    };

    const [state, setState] = useState(getParts(value));

    // Update internal state when external value changes
    useEffect(() => {
        setState(getParts(value));
    }, [value]);

    const handleChange = (field: keyof typeof state, val: string) => {
        const newState = { ...state, [field]: val };
        setState(newState);
        
        // Reconstruct ISO string when fields change
        // Logic: 
        // 1. Convert 12h format back to 24h
        let h = parseInt(newState.h || '0');
        if (newState.ampm === 'PM' && h !== 12) h += 12;
        if (newState.ampm === 'AM' && h === 12) h = 0;
        
        const hStr = h.toString().padStart(2, '0');
        const mStr = (newState.m || '00').padStart(2, '0');
        
        // 2. Create ISO-like string for MST/MDT
        // Note: Simplification used here. Appends -07:00 (MST) as a fixed offset 
        // because determining exact DST offset for arbitrary dates without a library is complex.
        const isoStub = `${newState.date}T${hStr}:${mStr}:00`;
        const d = new Date(isoStub + '-07:00'); 
        onChange(d.toISOString());
    };

    return (
        <div className="flex gap-2 items-center bg-slate-950 border border-slate-700 rounded-lg p-2 shadow-sm focus-within:border-teal-500 transition-colors">
            <input 
                type="date" 
                value={state.date}
                onChange={e => handleChange('date', e.target.value)}
                className="bg-transparent text-white text-xs outline-none w-28 font-mono"
            />
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-1">
                <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={state.h}
                    onChange={e => {
                        const v = parseInt(e.target.value);
                        if ((!isNaN(v) && v >= 0 && v <= 12) || e.target.value === '') handleChange('h', e.target.value);
                    }}
                    onBlur={() => {
                        let v = parseInt(state.h || '12');
                        if (v < 1) v = 1; if (v > 12) v = 12;
                        handleChange('h', v.toString());
                    }}
                    className="bg-transparent text-white text-xs outline-none w-6 text-center font-mono placeholder:text-slate-600"
                    placeholder="HH"
                />
                <span className="text-slate-500 font-bold">:</span>
                <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={state.m}
                    onChange={e => {
                        const v = parseInt(e.target.value);
                        if ((!isNaN(v) && v >= 0 && v <= 59) || e.target.value === '') handleChange('m', e.target.value);
                    }}
                    onBlur={() => {
                        const v = (state.m || '00').padStart(2, '0');
                        handleChange('m', v);
                    }}
                    className="bg-transparent text-white text-xs outline-none w-6 text-center font-mono placeholder:text-slate-600"
                    placeholder="MM"
                />
            </div>
            <select 
                value={state.ampm}
                onChange={e => handleChange('ampm', e.target.value as 'AM' | 'PM')}
                className="bg-slate-900 text-teal-400 text-xs font-bold outline-none cursor-pointer border border-slate-700 rounded px-1 py-0.5"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    )
};

const ChangePasswordModal: React.FC<{ onSave: (newPass: string) => void; onSkip: () => void }> = ({ onSave, onSkip }) => {
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (newPass.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPass !== confirmPass) {
            setError('Passwords do not match.');
            return;
        }
        onSave(newPass);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
             <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-amber-500/10 p-4 rounded-full mb-3 text-amber-400">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Change Password</h2>
                    <p className="text-slate-400 text-center text-sm mt-2">
                        For security reasons, you must change your default password before continuing.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                        <input 
                            type="password" 
                            value={newPass} 
                            onChange={e => setNewPass(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                        <input 
                            type="password" 
                            value={confirmPass} 
                            onChange={e => setConfirmPass(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500" 
                        />
                    </div>
                    {error && <p className="text-rose-500 text-sm">{error}</p>}
                    <button onClick={handleSubmit} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg transition-colors mt-2 shadow-lg shadow-amber-500/20">
                        Update Password & Login
                    </button>
                    <button onClick={onSkip} className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 flex items-center justify-center gap-1 transition-colors">
                        <span>Skip for now</span>
                        <ArrowRight size={14} />
                    </button>
                </div>
             </div>
        </div>
    );
};

const ProfileSettingsModal: React.FC<{ 
    user: User; 
    onClose: () => void; 
    onUpdate: (updatedUser: Partial<User> & { newPassword?: string }) => void;
}> = ({ user, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) setAvatar(ev.target.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (newPassword && newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        onUpdate({ 
            name, 
            avatar,
            newPassword: newPassword || undefined 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
             <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20}/> Edit Profile</h2>
                     <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                 </div>
                 
                 <div className="space-y-6">
                     <div className="flex flex-col items-center gap-4">
                         <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                             <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-800 object-cover group-hover:opacity-70 transition-opacity" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                 <Upload size={24} className="text-white drop-shadow-md"/>
                             </div>
                         </div>
                         <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                         <p className="text-xs text-slate-500">Click to upload new avatar</p>
                     </div>

                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                         <input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-teal-500"
                         />
                     </div>

                     <div className="pt-4 border-t border-slate-800">
                         <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><Lock size={14}/> Change Password</h3>
                         <div className="space-y-3">
                             <input 
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-teal-500"
                             />
                             <input 
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-teal-500"
                             />
                         </div>
                     </div>

                     <div className="flex justify-end gap-3 pt-2">
                         <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                         <button onClick={handleSave} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-500/20">Save Changes</button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const BeeBackground = ({ className = "fixed", opacity = "opacity-30", scale = "scale-100" }: { className?: string, opacity?: string, scale?: string }) => (
    <div className={`${className} inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden`} aria-hidden="true">
        {/* Background Image from Supabase */}
        <div className={`${opacity} transform ${scale} flex items-center justify-center transition-all duration-700 ease-in-out w-full h-full`}>
             <img 
                src="https://tdjocnhwyqmnhwhgcwhy.supabase.co/storage/v1/object/public/bee/BEE.png"
                alt="Background"
                className="max-w-[80%] max-h-[80%] object-contain"
                style={{ filter: 'grayscale(100%) invert(1)' }}
             />
        </div>
        {/* Subtle patterned background behind the main bee */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
    </div>
);

const LoginPage: React.FC<{ onLogin: (u: string, p: string) => void; error: string }> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onLogin(username, password);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <BeeBackground className="fixed" opacity="opacity-20" scale="scale-[1.45]" />
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

            <div className="bg-slate-900/20 border border-slate-800/50 p-8 rounded-2xl shadow-2xl backdrop-blur-xl w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-purple-600 rounded-xl mx-auto mb-4 shadow-lg flex items-center justify-center">
                        <LayoutGrid className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-400">Enter your username to access the workspace.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                        <div className="relative">
                            <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="michael.r" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <div className="relative">
                             <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors" 
                            />
                        </div>
                    </div>
                    {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
                    <button onClick={() => onLogin(username, password)} className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-teal-500/20">
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

const GlobalSearch: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void;
    projects: Project[];
    chats: ChatSession[];
    onNavigate: (type: 'project' | 'task' | 'chat', id: string, subId?: string) => void;
}> = ({ isOpen, onClose, projects, chats, onNavigate }) => {
    // ... (Keep existing implementation) ...
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if(!isOpen) setQuery('');
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const results = React.useMemo(() => {
        if (!query.trim()) return [];
        const lowerQ = query.toLowerCase();
        const res: { type: 'project' | 'task' | 'chat', id: string, subId?: string, title: string, subtitle: string, icon: React.FC<any> }[] = [];

        projects.forEach(p => {
            if (p.name.toLowerCase().includes(lowerQ) || p.projectId.toLowerCase().includes(lowerQ)) {
                res.push({ type: 'project', id: p.id, title: p.name, subtitle: `Project • ${p.projectId}`, icon: LayoutGrid });
            }
            p.tasks?.forEach(t => {
                const nameMatch = t.name.toLowerCase().includes(lowerQ);
                const descMatch = t.description?.toLowerCase().includes(lowerQ);
                if (nameMatch || descMatch) {
                    res.push({ 
                        type: 'task', 
                        id: p.id, 
                        subId: t.id, 
                        title: t.name, 
                        subtitle: descMatch ? `Matches description in ${p.name}` : `Task in ${p.name}`, 
                        icon: CheckCircle2 
                    });
                }
            });
        });

        chats.forEach(c => {
            c.messages.forEach(m => {
                if (m.text?.toLowerCase().includes(lowerQ)) {
                    res.push({ type: 'chat', id: c.id, title: c.name, subtitle: `${m.senderName}: ${m.text}`, icon: MessageCircle });
                }
            });
        });

        return res.slice(0, 15);
    }, [query, projects, chats]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-32" onClick={onClose}>
            <div 
                className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-4 border-b border-slate-800">
                    <Search className="text-slate-400 mr-3" size={20} />
                    <input 
                        ref={inputRef}
                        className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-slate-500"
                        placeholder="Search projects, tasks, comments, or messages..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-white"><X size={20}/></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="py-2">
                            {results.map((r, i) => (
                                <button 
                                    key={i}
                                    onClick={() => { onNavigate(r.type, r.id, r.subId); onClose(); }}
                                    className="w-full flex items-center px-4 py-3 hover:bg-slate-800 transition-colors text-left group"
                                >
                                    <div className="p-2 bg-slate-800 group-hover:bg-slate-700 rounded-lg text-slate-400 group-hover:text-teal-400 mr-4 transition-colors">
                                        <r.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-slate-200 font-medium truncate">{r.title}</div>
                                        <div className="text-slate-500 text-xs truncate">{r.subtitle}</div>
                                    </div>
                                    <div className="ml-4 text-xs text-slate-600 group-hover:text-slate-400 capitalize bg-slate-950 px-2 py-1 rounded">{r.type}</div>
                                </button>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="p-8 text-center text-slate-500">
                            <p>No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            <p>Type to search across projects, tasks, descriptions, and conversations.</p>
                        </div>
                    )}
                </div>
                <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-right">
                    <span className="text-xs text-slate-600">Press <kbd className="bg-slate-800 px-1 rounded border border-slate-700 text-slate-400">Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
};

const AdminUserManagement: React.FC<{ 
    users: User[]; 
    logs: TimeLog[];
    onClose: () => void; 
    onAddUser: (u: User) => void; 
    onRemoveUser: (id: string) => void; 
    onResetPassword: (id: string) => void;
    onUpdateRole: (id: string, newRole: 'admin' | 'user') => void;
    onUpdateLog: (log: TimeLog) => void;
    onDeleteLog: (id: string) => void;
}> = ({ users, logs, onClose, onAddUser, onRemoveUser, onResetPassword, onUpdateRole, onUpdateLog, onDeleteLog }) => {
    // ... (Keep existing implementation) ...
    const [activeTab, setActiveTab] = useState<'users' | 'time' | 'payroll'>('users');
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', name: '', password: '', role: 'user' as 'admin' | 'user' });

    // Time Log Filters & Edit
    const [filterUser, setFilterUser] = useState<string>('All');
    const [editingLog, setEditingLog] = useState<TimeLog | null>(null);

    // Payroll Tab State
    const [billableUser, setBillableUser] = useState<string>('');
    const [billableStart, setBillableStart] = useState('');
    const [billableEnd, setBillableEnd] = useState('');
    const [billableTotal, setBillableTotal] = useState<number>(0);
    
    // Ref for auto-opening end date
    const endDateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Automatic calculation when inputs change
    useEffect(() => {
        if (activeTab === 'payroll' && billableUser && billableStart && billableEnd) {
            // Using local YYYY-MM-DD comparison to match user selection properly
            const userLogs = logs.filter(l => l.userId === billableUser);
            
            const totalMs = userLogs.reduce((acc, log) => {
                // Manually construct local YYYY-MM-DD from log timestamp for accurate day matching in Mountain Time
                const logDateStr = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD
                    timeZone: 'America/Denver',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(new Date(log.startTime));
                
                // Check if start time falls within range (inclusive)
                if (logDateStr >= billableStart && logDateStr <= billableEnd) {
                    const start = new Date(log.startTime).getTime();
                    const end = log.endTime ? new Date(log.endTime).getTime() : Date.now();
                    return acc + (end - start);
                }
                return acc;
            }, 0);
            
            setBillableTotal(totalMs / (1000 * 60 * 60)); // Convert ms to hours
        } else {
            setBillableTotal(0);
        }
    }, [activeTab, billableUser, billableStart, billableEnd, logs]);

    const handleCreateUser = () => {
        if (!newUser.username || !newUser.email || !newUser.name || !newUser.password) return;
        const u: User = { id: `u-${Date.now()}`, username: newUser.username, email: newUser.email, name: newUser.name, avatar: `https://picsum.photos/200/200?random=${Date.now()}`, password: newUser.password, isFirstLogin: true, role: newUser.role };
        onAddUser(u);
        setNewUser({ username: '', email: '', name: '', password: '', role: 'user' });
        setIsAdding(false);
    };

    // Helper to calculate duration in HH:MM:SS
    const getDuration = (start: string, end?: string) => {
        if (!end) return 'Running...';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hrs}h ${mins}m ${secs}s`;
    };

    const formatMountainTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-US', {
            timeZone: 'America/Denver',
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown User';
    const getSelectedUser = () => users.find(u => u.id === billableUser);

    const filteredLogs = logs.filter(l => filterUser === 'All' || l.userId === filterUser).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
                
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Shield className="text-teal-500"/> Admin Panel</h2>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                
                {/* Tabs */}
                <div className="px-6 pt-4 border-b border-slate-800 flex gap-6">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'text-teal-400 border-teal-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                    >
                        User Management
                    </button>
                    <button 
                        onClick={() => setActiveTab('time')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'time' ? 'text-teal-400 border-teal-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                    >
                        Time Logs
                    </button>
                    <button 
                        onClick={() => setActiveTab('payroll')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'payroll' ? 'text-teal-400 border-teal-500' : 'text-slate-500 border-transparent hover:text-white'}`}
                    >
                        Payroll Reporting
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-auto">
                    {activeTab === 'users' ? (
                        <>
                             {isAdding ? (
                                 <div className="bg-slate-800/50 p-6 rounded-xl mb-6 border border-slate-700">
                                     {/* Inputs */}
                                     <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label><input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white" /></div>
                                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Username</label><input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white" /></div>
                                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Email</label><input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white" /></div>
                                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Password</label><input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white" /></div>
                                        <div>
                                             <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                                             <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as 'admin'|'user'})} className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white"><option value="user">User</option><option value="admin">Admin</option></select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                                        <button onClick={handleCreateUser} className="px-6 py-2 bg-teal-600 rounded-lg text-white font-bold hover:bg-teal-500">Create User</button>
                                    </div>
                                 </div>
                            ) : (
                                <div className="flex justify-end mb-4"><button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-teal-500 text-slate-950 px-4 py-2 rounded-lg font-bold hover:bg-teal-400"><Plus size={18}/> Add User</button></div>
                            )}
                            {/* User Table */}
                            <div className="overflow-hidden rounded-xl border border-slate-800">
                                <table className="w-full text-left text-sm bg-slate-900/50">
                                    <thead className="bg-slate-800 text-slate-300 font-semibold uppercase text-xs tracking-wider"><tr><th className="p-4">User</th><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4 text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-800/30">
                                                <td className="p-4 flex items-center gap-3"><img src={u.avatar} className="w-9 h-9 rounded-full object-cover border border-slate-700" alt=""/><div><div className="text-white font-medium">{u.name}</div><div className="text-slate-500 text-xs">{u.email}</div></div></td>
                                                <td className="p-4 text-slate-400">{u.username}</td>
                                                <td className="p-4">
                                                    <button 
                                                        onClick={() => onUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors uppercase ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-600/50 hover:bg-slate-700'}`}
                                                    >
                                                        {u.role || 'USER'}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {u.role !== 'admin' || users.filter(user => user.role === 'admin').length > 1 ? (
                                                        <div className="flex justify-end gap-2"><button onClick={() => onResetPassword(u.id)} className="p-2 hover:bg-slate-800 rounded-lg text-amber-500"><RefreshCw size={16}/></button><button onClick={() => onRemoveUser(u.id)} className="p-2 hover:bg-slate-800 rounded-lg text-rose-500"><Trash2 size={16}/></button></div>
                                                    ) : <span className="text-xs text-slate-600 italic">Last Admin</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : activeTab === 'time' ? (
                        // TIME LOGS TAB
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">Filter User:</span>
                                    <select 
                                        value={filterUser}
                                        onChange={e => setFilterUser(e.target.value)}
                                        className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm"
                                    >
                                        <option value="All">All Users</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {editingLog && (
                                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-4 animate-in slide-in-from-top-2">
                                    <h4 className="text-sm font-bold text-white mb-3">Edit Time Log</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <label className="text-xs text-slate-500">Start Time</label>
                                            <div className="mt-1">
                                                <DateTimeInput 
                                                    value={editingLog.startTime}
                                                    onChange={val => setEditingLog({...editingLog, startTime: val})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500">End Time</label>
                                            <div className="mt-1">
                                                <DateTimeInput 
                                                    value={editingLog.endTime}
                                                    onChange={val => setEditingLog({...editingLog, endTime: val})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingLog(null)} className="px-3 py-1 text-sm text-slate-400">Cancel</button>
                                        <button onClick={() => { onUpdateLog(editingLog); setEditingLog(null); }} className="px-3 py-1 text-sm bg-teal-600 rounded text-white hover:bg-teal-500">Save</button>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-hidden rounded-xl border border-slate-800">
                                <table className="w-full text-left text-sm bg-slate-900/50">
                                    <thead className="bg-slate-800 text-slate-300 font-semibold uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Start / End (MST)</th>
                                            <th className="p-4">Duration</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {filteredLogs.length === 0 ? (
                                            <tr><td colSpan={5} className="p-6 text-center text-slate-500 italic">No time logs found.</td></tr>
                                        ) : filteredLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-800/30">
                                                <td className="p-4 text-white font-medium">{getUserName(log.userId)}</td>
                                                <td className="p-4 text-slate-400">
                                                    {new Date(log.startTime).toLocaleDateString('en-US', { timeZone: 'America/Denver' })}
                                                </td>
                                                <td className="p-4 text-slate-300 text-xs">
                                                    <div>{formatMountainTime(log.startTime)}</div>
                                                    <div className="text-slate-500">
                                                        {log.endTime ? formatMountainTime(log.endTime) : 'Active'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${log.endTime ? 'bg-slate-800 text-slate-300' : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'}`}>
                                                        {getDuration(log.startTime, log.endTime)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingLog(log)} className="p-2 hover:bg-slate-800 rounded-lg text-indigo-400"><Edit2 size={16}/></button>
                                                        <button onClick={() => onDeleteLog(log.id)} className="p-2 hover:bg-slate-800 rounded-lg text-rose-500"><Trash2 size={16}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        // PAYROLL REPORTING TAB
                        <div className="flex flex-col h-full animate-in fade-in">
                            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50 mb-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select User</label>
                                        <div className="relative">
                                            <select 
                                                value={billableUser}
                                                onChange={e => setBillableUser(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white appearance-none outline-none focus:border-teal-500"
                                            >
                                                <option value="" disabled>Choose an employee...</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Start Date</label>
                                        <input 
                                            type="date"
                                            value={billableStart}
                                            onChange={e => {
                                                setBillableStart(e.target.value);
                                                // Auto open/focus end date after selection
                                                setTimeout(() => {
                                                    try {
                                                        endDateInputRef.current?.showPicker?.(); // Try modern showPicker if available
                                                    } catch (err) {
                                                        console.debug("Auto-picker blocked:", err);
                                                    }
                                                    endDateInputRef.current?.focus();
                                                }, 100);
                                            }}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">End Date</label>
                                        <input 
                                            ref={endDateInputRef}
                                            type="date"
                                            value={billableEnd}
                                            onChange={e => setBillableEnd(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-teal-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 border-dashed p-8">
                                {billableUser && billableStart && billableEnd ? (
                                    <div className="text-center animate-in zoom-in-95 duration-300">
                                        <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
                                            <Clock size={32} className="text-teal-400" />
                                        </div>
                                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Total Billable Hours</h3>
                                        <div className="text-6xl font-bold text-white mb-2 tracking-tight">
                                            {billableTotal.toFixed(2)}
                                        </div>
                                        <p className="text-slate-500 text-sm">
                                            for <span className="text-slate-300 font-semibold">{getSelectedUser()?.name}</span>
                                            <br/>
                                            <span className="text-xs mt-1 block opacity-70">
                                                {new Date(billableStart).toLocaleDateString()} — {new Date(billableEnd).toLocaleDateString()}
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-500">
                                        <PieChart size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>Select a user and date range to generate report.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

export const App: React.FC = () => {
    // State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [projects, setProjects] = useState<Project[]>([]); // Init with useEffect
    const [chats, setChats] = useState<ChatSession[]>([]); // Init with useEffect
    const [view, setView] = useState<'dashboard' | 'project'>('dashboard');
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
    const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
    const [externalChatId, setExternalChatId] = useState<string | null>(null);
    
    // UI State
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [videoParticipants, setVideoParticipants] = useState<User[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showChangePass, setShowChangePass] = useState(false);
    const [showProfileSettings, setShowProfileSettings] = useState(false);

    // Dropdowns
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    
    // Notification & Time
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>(MOCK_TIME_LOGS);

    // Time Tracking State
    const [timerStart, setTimerStart] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const timerIntervalRef = useRef<number | null>(null);
    
    const isTracking = !!timerStart; // Derived state

    // Global Active Timers State
    const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
    const [showActiveUsers, setShowActiveUsers] = useState(false);
    const activeUsersRef = useRef<HTMLDivElement>(null);

    const confettiRef = useRef<ConfettiRef>(null);

    // Click outside handler for dropdowns
    const navRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
                setShowProfileMenu(false);
            }
            // Active Users Dropdown
            if (activeUsersRef.current && !activeUsersRef.current.contains(event.target as Node)) {
                setShowActiveUsers(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load timer state on user change
    useEffect(() => {
        if (currentUser) {
            const savedStart = localStorage.getItem(`rhive_timer_${currentUser.id}`);
            if (savedStart) {
                const start = parseInt(savedStart, 10);
                setTimerStart(start);
                // Immediately calculate elapsed
                const diff = Date.now() - start;
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            } else {
                setTimerStart(null);
                setElapsedTime('00:00:00');
            }
        } else {
            setTimerStart(null);
            setElapsedTime('00:00:00');
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }
    }, [currentUser]);

    // Timer Interval Logic
    useEffect(() => {
        if (timerStart) {
            // Clear existing if any (safety)
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            
            const updateTimer = () => {
                const now = Date.now();
                const diff = now - timerStart;
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            };
            
            // Initial call
            updateTimer();
            timerIntervalRef.current = window.setInterval(updateTimer, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            setElapsedTime('00:00:00');
        }
        return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
    }, [timerStart]);

    // Poll active timers from localStorage
    useEffect(() => {
        const checkActiveTimers = () => {
            const active: Record<string, number> = {};
            users.forEach(u => {
                const startStr = localStorage.getItem(`rhive_timer_${u.id}`);
                if (startStr) {
                    active[u.id] = parseInt(startStr, 10);
                }
            });
            setActiveTimers(active);
        };
        
        checkActiveTimers();
        const interval = setInterval(checkActiveTimers, 2000); // Poll every 2s to catch updates from other tabs/users
        return () => clearInterval(interval);
    }, [users]);

    const handleToggleTimer = () => {
        if (!currentUser) return;

        if (timerStart) {
             // Stop
             const newLog: TimeLog = {
                 id: `tl-${Date.now()}`,
                 userId: currentUser.id,
                 startTime: new Date(timerStart).toISOString(),
                 endTime: new Date().toISOString()
             };
             setTimeLogs([newLog, ...timeLogs]);
             
             localStorage.removeItem(`rhive_timer_${currentUser.id}`);
             setTimerStart(null);

             // Update activeTimers locally
             const newActive = { ...activeTimers };
             delete newActive[currentUser.id];
             setActiveTimers(newActive);
        } else {
            // Start
            const start = Date.now();
            setTimerStart(start);
            localStorage.setItem(`rhive_timer_${currentUser.id}`, start.toString());

            // Update activeTimers locally
            setActiveTimers({ ...activeTimers, [currentUser.id]: start });
        }
    };

    const handleStopUserTimer = (targetUserId: string) => {
        const startTime = activeTimers[targetUserId];
        if (!startTime) return;

        // Create log entry for the forced stop
        const newLog: TimeLog = {
            id: `tl-${Date.now()}`,
            userId: targetUserId,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date().toISOString()
        };
        
        setTimeLogs(prev => [newLog, ...prev]);

        // Clear local storage for that user
        localStorage.removeItem(`rhive_timer_${targetUserId}`);

        // Update active timers state immediately
        const newActive = { ...activeTimers };
        delete newActive[targetUserId];
        setActiveTimers(newActive);

        // If stopping self (admin stopping their own timer via this menu), update local state
        if (currentUser && targetUserId === currentUser.id) {
            setTimerStart(null);
            setElapsedTime('00:00:00');
        }
    };

    // Helper for generating notifications based on @mentions
    const checkAndNotifyTags = (text: string, source: 'chat' | 'task', targetId: string, currentUserId: string, taskContext?: { name: string, status: string }) => {
        users.forEach(u => {
            if (u.id !== currentUserId && text.includes(`@${u.name}`)) {
                let notifText = `${currentUser?.name} mentioned you in a ${source}`;
                if (source === 'task' && taskContext) {
                    notifText = `${currentUser?.name} mentioned you in task "${taskContext.name}" (${taskContext.status})`;
                }

                const newNotif: Notification = {
                    id: `n-${Date.now()}-${Math.random()}`,
                    recipientId: u.id,
                    text: notifText,
                    time: "Just now",
                    unread: true,
                    type: source,
                    targetId: targetId
                };
                setNotifications(prev => [newNotif, ...prev]);
            }
        });
    };

    // Initialization
    useEffect(() => {
        // Load from local storage or mocks
        const savedProjects = localStorage.getItem('rh_projects');
        if (savedProjects) {
            setProjects(JSON.parse(savedProjects));
        } else {
            setProjects(getInitialProjects(INITIAL_USERS));
        }
        setChats(getInitialChats(INITIAL_USERS));
    }, []);

    // Login Handler
    const handleLogin = (u: string, p: string) => {
        const user = users.find(usr => usr.username === u && usr.password === p);
        if (user) {
            setCurrentUser(user);
            if (user.isFirstLogin) setShowChangePass(true);
            // Removed confetti on login as per implication to fix it for task done
        } else {
            // Error handling (simple alert or state)
            alert("Invalid credentials");
        }
    };

    // Logout
    const handleLogout = () => {
        setCurrentUser(null);
        setView('dashboard');
        setActiveProject(null);
    };

    const handleNotificationClick = (n: Notification) => {
        // 1. Mark as read
        const newNotifs = notifications.map(notif => 
            notif.id === n.id ? { ...notif, unread: false } : notif
        );
        setNotifications(newNotifs);
        setShowNotifications(false);

        // 2. Navigation
        if (n.type === 'chat') {
            // Reset to allow re-triggering if same chat is clicked
            setExternalChatId(null);
            setTimeout(() => setExternalChatId(n.targetId), 50);
        } else {
            // Project or Task
            const projectId = n.targetId; // Assuming targetId is project ID for tasks too
            
            const p = projects.find(proj => proj.id === projectId);
            if (p) {
                setActiveProject(p);
                setView('project');
                if (n.type === 'task' && n.secondaryId) {
                    setHighlightedTaskId(null);
                    // Also set comment highlight if present
                    if (n.commentId) {
                        setHighlightedCommentId(null);
                        setTimeout(() => setHighlightedCommentId(n.commentId!), 50);
                    }
                    setTimeout(() => setHighlightedTaskId(n.secondaryId!), 50);
                } else {
                    setHighlightedTaskId(null);
                }
            }
        }
    };

    // Render logic
    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} error="" />;
    }

    // Filter notifications for the current user
    const userNotifications = notifications.filter(n => n.recipientId === currentUser.id);
    const unreadCount = userNotifications.filter(n => n.unread).length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 relative">
            <Confetti ref={confettiRef} />
            <BeeBackground opacity="opacity-10" scale="scale-125" />
            
            {showChangePass && (
                <ChangePasswordModal 
                    onSave={(newPass) => {
                        // Update user password mock
                        const updated = users.map(u => u.id === currentUser.id ? {...u, password: newPass, isFirstLogin: false} : u);
                        setUsers(updated);
                        setCurrentUser({...currentUser, password: newPass, isFirstLogin: false});
                        setShowChangePass(false);
                    }} 
                    onSkip={() => setShowChangePass(false)} 
                />
            )}
            
            {showProfileSettings && (
                <ProfileSettingsModal 
                    user={currentUser}
                    onClose={() => setShowProfileSettings(false)}
                    onUpdate={(updates) => {
                        // 1. Update Users Array
                        const updatedUsers = users.map(u => {
                            if (u.id === currentUser.id) {
                                return { 
                                    ...u, 
                                    name: updates.name || u.name,
                                    avatar: updates.avatar || u.avatar,
                                    password: updates.newPassword || u.password 
                                };
                            }
                            return u;
                        });
                        setUsers(updatedUsers);
                        
                        // 2. Update Current User State
                        const updatedCurrentUser = {
                            ...currentUser,
                            name: updates.name || currentUser.name,
                            avatar: updates.avatar || currentUser.avatar,
                            password: updates.newPassword || currentUser.password
                        };
                        setCurrentUser(updatedCurrentUser);

                        // 3. Propagate changes to Projects (Owner, Assignees, Comments)
                        setProjects(prevProjects => prevProjects.map(p => ({
                            ...p,
                            owner: p.owner.id === currentUser.id ? updatedCurrentUser : p.owner,
                            tasks: p.tasks?.map(t => ({
                                ...t,
                                assignees: t.assignees.map(a => a.id === currentUser.id ? updatedCurrentUser : a),
                                comments: t.comments?.map(c => c.userId === currentUser.id ? { ...c, userName: updatedCurrentUser.name, userAvatar: updatedCurrentUser.avatar } : c)
                            }))
                        })));

                        // 4. Propagate changes to Chats (Participants)
                        setChats(prevChats => prevChats.map(c => ({
                            ...c,
                            participants: c.participants.map(p => p.id === currentUser.id ? updatedCurrentUser : p)
                        })));
                    }}
                />
            )}

            {showVideoCall && (
                <VideoConference 
                    currentUserAvatar={currentUser.avatar}
                    participants={videoParticipants}
                    onClose={() => setShowVideoCall(false)}
                />
            )}

            {showAdmin && (
                 <AdminUserManagement 
                    users={users}
                    logs={timeLogs}
                    onClose={() => setShowAdmin(false)}
                    onAddUser={(u) => setUsers([...users, u])}
                    onRemoveUser={(id) => setUsers(users.filter(u => u.id !== id))}
                    onResetPassword={(id) => alert(`Reset password for user ${id}`)}
                    onUpdateRole={(id, role) => setUsers(users.map(u => u.id === id ? {...u, role} : u))}
                    onUpdateLog={(log) => setTimeLogs(timeLogs.map(l => l.id === log.id ? log : l))}
                    onDeleteLog={(id) => setTimeLogs(timeLogs.filter(l => l.id !== id))}
                 />
            )}

            <GlobalSearch 
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                projects={projects}
                chats={chats}
                onNavigate={(type, id, subId) => {
                    if (type === 'project') {
                        const p = projects.find(proj => proj.id === id);
                        if (p) {
                            setActiveProject(p);
                            setView('project');
                        }
                    }
                    // Handle other nav types...
                }}
            />
            
            {/* Top Bar */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="flex items-center gap-4" ref={activeUsersRef}>
                    <div className="relative">
                        <button 
                            onClick={() => setShowActiveUsers(!showActiveUsers)}
                            className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/10 hover:brightness-110 transition-all active:scale-95"
                        >
                            <LayoutGrid className="text-white" size={20} />
                            {Object.keys(activeTimers).length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                                    {Object.keys(activeTimers).length}
                                </span>
                            )}
                        </button>
                        {showActiveUsers && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                <div className="p-3 border-b border-slate-800 bg-slate-900/50">
                                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                        <Activity size={14} className="text-teal-400"/>
                                        Team Activity
                                    </h4>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {Object.keys(activeTimers).length === 0 ? (
                                        <div className="p-6 text-center text-slate-500 text-xs italic">
                                            No active timers running.
                                        </div>
                                    ) : (
                                        users.filter(u => activeTimers[u.id]).map(u => (
                                            <div key={u.id} className="p-3 border-b border-slate-800 last:border-0 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img src={u.avatar} className="w-8 h-8 rounded-full border border-slate-700" alt={u.name} />
                                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-teal-500 border-2 border-slate-900 rounded-full"></div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-white font-medium truncate max-w-[100px]">{u.name}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase">{u.role || 'Member'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <ActiveUserTimer startTime={activeTimers[u.id]} />
                                                    {currentUser.role === 'admin' && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStopUserTimer(u.id);
                                                            }}
                                                            className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                                                            title="Force Stop Timer"
                                                        >
                                                            <Square size={10} fill="currentColor" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight hidden md:block">RHive<span className="text-teal-500">.</span></span>
                </div>

                <div className="flex items-center gap-4" ref={navRef}>
                     {/* Time Tracker Toggle */}
                    <button 
                        onClick={handleToggleTimer}
                        className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg font-bold transition-all text-sm mr-2 ${isTracking ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse' : 'bg-slate-800 text-teal-400 border border-slate-700 hover:bg-slate-700'}`}
                    >
                        {isTracking ? <StopCircle size={16} /> : <Play size={16} />}
                        <span className="font-mono">{isTracking ? elapsedTime : 'Start Timer'}</span>
                    </button>

                    <button onClick={() => setShowSearch(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <Search size={20} />
                    </button>
                    
                    {/* Notification Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 hover:bg-slate-800 rounded-lg transition-colors ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                                    <h4 className="font-bold text-white text-sm">Notifications</h4>
                                    <button onClick={() => setNotifications(notifications.map(n => n.recipientId === currentUser.id ? ({...n, unread: false}) : n))} className="text-[10px] text-teal-400 hover:underline">Mark all read</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {userNotifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-500 text-xs">No new notifications</div>
                                    ) : (
                                        userNotifications.map(n => (
                                            <div 
                                                key={n.id} 
                                                onClick={() => handleNotificationClick(n)}
                                                className={`p-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors cursor-pointer ${n.unread ? 'bg-slate-800/30' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.unread ? 'bg-teal-500' : 'bg-transparent'}`}></div>
                                                    <div>
                                                        <p className="text-xs text-slate-300 mb-1 leading-relaxed">{n.text}</p>
                                                        <span className="text-[10px] text-slate-500 block">{n.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="h-6 w-[1px] bg-slate-800 mx-2"></div>
                    
                    {currentUser.role === 'admin' && (
                        <button onClick={() => setShowAdmin(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-teal-400 border border-teal-500/20 transition-all">
                            <Shield size={14} />
                            <span>Admin</span>
                        </button>
                    )}

                    {/* Profile Menu */}
                    <div className="relative pl-2">
                        <button 
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 hover:bg-slate-800 p-1.5 rounded-lg transition-colors group"
                        >
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{currentUser.name}</div>
                                <div className="text-xs text-slate-500 text-right capitalize">{currentUser.role === 'admin' ? 'Administrator' : 'Team Member'}</div>
                            </div>
                            <img src={currentUser.avatar} className="w-9 h-9 rounded-full border border-slate-700 bg-slate-800" alt="Avatar"/>
                        </button>

                        {showProfileMenu && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                                    <img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-slate-700" alt=""/>
                                    <div className="overflow-hidden">
                                        <div className="font-bold text-white truncate">{currentUser.name}</div>
                                        <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                                    </div>
                                </div>
                                <div className="p-1">
                                    <button 
                                        onClick={() => { setShowProfileMenu(false); setShowProfileSettings(true); }}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                                    >
                                        <UserIcon size={16} /> My Profile
                                    </button>
                                    <div className="h-[1px] bg-slate-800 my-1"></div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="h-[calc(100vh-64px)] relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                     {/* Background Pattern */}
                     <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
                </div>

                {view === 'dashboard' ? (
                    <ProjectTable 
                        projects={projects}
                        onUpdateStatus={(id, status) => {
                             setProjects(projects.map(p => p.id === id ? {...p, status} : p));
                        }}
                        onUpdateProject={(id, updates) => {
                             setProjects(projects.map(p => p.id === id ? {...p, ...updates} : p));
                        }}
                        onProjectClick={(p) => {
                            setActiveProject(p);
                            setView('project');
                        }}
                        onAddProject={() => {
                             const newProj: Project = {
                                 id: Date.now().toString(),
                                 projectId: `PRO-${projects.length + 1}`,
                                 name: 'New Project',
                                 percent: 0,
                                 owner: currentUser,
                                 status: 'Active',
                                 tasksCompleted: 0,
                                 tasksTotal: 0,
                                 startDate: new Date().toISOString(),
                                 endDate: 'Ongoing',
                                 tasks: []
                             };
                             setProjects([...projects, newProj]);
                        }}
                        onDeleteProjects={(ids) => {
                             setProjects(projects.filter(p => !ids.includes(p.id)));
                        }}
                    />
                ) : (
                    activeProject && (
                        <ProjectDetail 
                            project={activeProject}
                            users={users}
                            currentUser={currentUser}
                            highlightTaskId={highlightedTaskId}
                            highlightCommentId={highlightedCommentId}
                            onBack={() => {
                                setView('dashboard');
                                setActiveProject(null);
                                setHighlightedTaskId(null);
                                setHighlightedCommentId(null);
                            }}
                            onClearHighlight={() => setHighlightedTaskId(null)}
                            onClearCommentHighlight={() => setHighlightedCommentId(null)}
                            onUpdateTaskStatus={(pid, tid, status) => {
                                const updatedProjects = projects.map(p => {
                                    if(p.id === pid && p.tasks) {
                                        const newTasks = p.tasks.map(t => t.id === tid ? {...t, status} : t);
                                        
                                        // Recalculate Progress
                                        const completed = newTasks.filter(t => t.status === 'Done').length;
                                        const total = newTasks.length;
                                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                                        
                                        // Auto-update Project Status
                                        let newProjectStatus = p.status;
                                        if (percent === 100) {
                                            newProjectStatus = 'Completed';
                                        } else if (p.status === 'Completed' && percent < 100) {
                                            newProjectStatus = 'In Progress';
                                        }

                                        return { 
                                            ...p, 
                                            tasks: newTasks, 
                                            tasksCompleted: completed,
                                            tasksTotal: total,
                                            percent: percent,
                                            status: newProjectStatus
                                        };
                                    }
                                    return p;
                                });
                                setProjects(updatedProjects);
                                setActiveProject(updatedProjects.find(p => p.id === pid) || null);
                                
                                // Fire confetti if task is done
                                if (status === 'Done') {
                                    confettiRef.current?.fire();
                                }
                            }}
                            onUpdateTaskDetails={(pid, tid, updates) => {
                                 const updatedProjects = projects.map(p => {
                                    if(p.id === pid && p.tasks) {
                                        const newTasks = p.tasks.map(t => t.id === tid ? {...t, ...updates} : t);
                                        return { ...p, tasks: newTasks };
                                    }
                                    return p;
                                });
                                setProjects(updatedProjects);
                                setActiveProject(updatedProjects.find(p => p.id === pid) || null);
                            }}
                            onAddTask={(pid) => {
                                const updatedProjects = projects.map(p => {
                                    if(p.id === pid) {
                                        const newTask: Task = {
                                            id: `t-${Date.now()}`,
                                            name: 'New Task',
                                            status: 'Open',
                                            assignees: [],
                                            comments: []
                                        };
                                        const newTasks = [...(p.tasks || []), newTask];
                                        
                                        // Recalculate Progress
                                        const completed = newTasks.filter(t => t.status === 'Done').length;
                                        const total = newTasks.length;
                                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                                        
                                        let newProjectStatus = p.status;
                                        if (p.status === 'Completed' && percent < 100) {
                                            newProjectStatus = 'In Progress';
                                        }

                                        return { 
                                            ...p, 
                                            tasks: newTasks, 
                                            tasksCompleted: completed,
                                            tasksTotal: total,
                                            percent: percent,
                                            status: newProjectStatus
                                        };
                                    }
                                    return p;
                                });
                                setProjects(updatedProjects);
                                setActiveProject(updatedProjects.find(p => p.id === pid) || null);
                            }}
                            onDeleteTasks={(pid, tids) => {
                                 const updatedProjects = projects.map(p => {
                                    if(p.id === pid && p.tasks) {
                                        const newTasks = p.tasks.filter(t => !tids.includes(t.id));
                                        
                                        // Recalculate Progress
                                        const completed = newTasks.filter(t => t.status === 'Done').length;
                                        const total = newTasks.length;
                                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                                        
                                        let newProjectStatus = p.status;
                                        if (percent === 100 && total > 0) {
                                            newProjectStatus = 'Completed';
                                        }

                                        return { 
                                            ...p, 
                                            tasks: newTasks,
                                            tasksCompleted: completed,
                                            tasksTotal: total,
                                            percent: percent,
                                            status: newProjectStatus
                                        };
                                    }
                                    return p;
                                });
                                setProjects(updatedProjects);
                                setActiveProject(updatedProjects.find(p => p.id === pid) || null);
                            }}
                            onCommentAdded={(pid, tid, comment) => {
                                const project = projects.find(p => p.id === pid);
                                const task = project?.tasks?.find(t => t.id === tid);
                                if (!task) return;
                                
                                // Notify Assignees (existing logic)
                                task.assignees.forEach(assignee => {
                                    if (assignee.id !== currentUser.id) {
                                         const newNotif: Notification = {
                                            id: `n-${Date.now()}-${Math.random()}`,
                                            recipientId: assignee.id,
                                            text: `${currentUser.name} commented on task "${task.name}" (${task.status})`,
                                            time: "Just now",
                                            unread: true,
                                            type: 'task',
                                            targetId: pid,
                                            secondaryId: tid,
                                            commentId: comment.id
                                        };
                                        setNotifications(prev => [newNotif, ...prev]);
                                    }
                                });
                                
                                // Notify Tagged Users
                                checkAndNotifyTags(comment.text, 'task', pid, currentUser.id, { name: task.name, status: task.status });
                            }}
                        />
                    )
                )}
            </main>

            <ChatOverlay 
                currentUser={currentUser}
                users={users}
                sessions={chats}
                externalActiveChatId={externalChatId}
                onSendMessage={(sessionId, content) => {
                    // Update chat logic
                    const updatedChats = chats.map(c => {
                        if (c.id === sessionId) {
                            const newMsg: ChatMessage = {
                                id: Date.now().toString(),
                                senderId: currentUser.id,
                                senderName: currentUser.name,
                                text: content.text,
                                image: content.image,
                                video: content.video,
                                timestamp: new Date().toISOString()
                            };
                            return { ...c, messages: [...c.messages, newMsg] };
                        }
                        return c;
                    });
                    setChats(updatedChats);
                    
                    // Create notifications for other participants
                    const chatSession = chats.find(c => c.id === sessionId);
                    if (chatSession) {
                        chatSession.participants.forEach(p => {
                            if (p.id !== currentUser.id) {
                                 const newNotif: Notification = {
                                    id: `n-${Date.now()}-${Math.random()}`,
                                    recipientId: p.id,
                                    text: `${currentUser.name} sent a message in ${chatSession.type === 'group' ? chatSession.name : 'chat'}`,
                                    time: "Just now",
                                    unread: true,
                                    type: 'chat',
                                    targetId: sessionId
                                };
                                setNotifications(prev => [newNotif, ...prev]);
                            }
                        });
                    }

                    // Check for @mentions in chat text
                    if (content.text) {
                        checkAndNotifyTags(content.text, 'chat', sessionId, currentUser.id);
                    }
                }}
                onDeleteMessage={(sessionId, messageId) => {
                     const updatedChats = chats.map(c => {
                        if (c.id === sessionId) {
                            return { ...c, messages: c.messages.filter(m => m.id !== messageId) };
                        }
                        return c;
                    });
                    setChats(updatedChats);
                }}
                onStartVideoCall={(participants) => {
                    setVideoParticipants(participants);
                    setShowVideoCall(true);
                }}
                onCreateChat={(participantIds, name) => {
                    const newChat: ChatSession = {
                        id: `c-${Date.now()}`,
                        name: name || 'New Chat',
                        type: participantIds.length > 1 ? 'group' : 'direct',
                        participants: users.filter(u => participantIds.includes(u.id) || u.id === currentUser.id),
                        messages: [],
                        unread: 0
                    };
                    setChats([...chats, newChat]);
                }}
                onUpdateGroup={(sessionId, pIds, action) => {
                    const updatedChats = chats.map(c => {
                        if (c.id === sessionId) {
                            let newParticipants = [...c.participants];
                            if (action === 'add') {
                                const toAdd = users.filter(u => pIds.includes(u.id));
                                newParticipants = [...newParticipants, ...toAdd];
                            } else {
                                newParticipants = newParticipants.filter(p => !pIds.includes(p.id));
                            }
                            return { ...c, participants: newParticipants };
                        }
                        return c;
                    });
                    setChats(updatedChats);
                }}
            />
        </div>
    );
};