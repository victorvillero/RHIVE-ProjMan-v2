import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Users, Phone, Video, Search, X, Send, Paperclip, Smile, Plus, UserPlus, Trash2, Info, Image as ImageIcon, Sticker, Film } from 'lucide-react';
import { User, ChatSession } from '../types';

interface ChatOverlayProps {
    currentUser: User;
    users: User[];
    sessions: ChatSession[];
    onSendMessage: (sessionId: string, content: { text?: string, image?: string, video?: string }) => void;
    onDeleteMessage: (sessionId: string, messageId: string) => void;
    onStartVideoCall: (participants: User[]) => void;
    onCreateChat: (participantIds: string[], name?: string) => void;
    onUpdateGroup: (sessionId: string, participantIds: string[], action: 'add' | 'remove') => void;
    externalActiveChatId?: string | null;
}

const EMOJI_LIST = [
    { char: '👍', keywords: 'thumbs up like yes' },
    { char: '👋', keywords: 'wave hello hi' },
    { char: '🎉', keywords: 'party celebrate tada' },
    { char: '🔥', keywords: 'fire hot lit' },
    { char: '😂', keywords: 'laugh lol haha' },
    { char: '😊', keywords: 'smile happy' },
    { char: '🚀', keywords: 'rocket launch' },
    { char: '❤️', keywords: 'heart love' },
    { char: '✅', keywords: 'check done success' },
    { char: '🤔', keywords: 'think hmm' },
    { char: '👀', keywords: 'eyes look' },
    { char: '🙌', keywords: 'hands celebrate praise' },
    { char: '😭', keywords: 'cry sad' },
    { char: '😎', keywords: 'cool sunglasses' },
    { char: '😡', keywords: 'angry mad' },
    { char: '🙏', keywords: 'pray please thanks' },
    { char: '🤷', keywords: 'shrug idk' },
    { char: '🤦', keywords: 'facepalm' },
    { char: '✨', keywords: 'sparkles magic' },
    { char: '💯', keywords: '100 perfect' },
];

const GIF_LIST = [
    { url: 'https://media.giphy.com/media/l0amJbHuX8zggJuHo5/giphy.gif', keywords: 'high five success' },
    { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', keywords: 'yes nod agree' },
    { url: 'https://media.giphy.com/media/l41Yh18f5TbiWHE08/giphy.gif', keywords: 'thumbs up good' },
    { url: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif', keywords: 'typing work busy' },
    { url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif', keywords: 'cat typing funny' },
    { url: 'https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif', keywords: 'cool sunglasses deal with it' },
    { url: 'https://media.giphy.com/media/3o7TKr3nzbh5WgCFxe/giphy.gif', keywords: 'party dance' },
    { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', keywords: 'scared fear' },
    { url: 'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif', keywords: 'nope no' },
    { url: 'https://media.giphy.com/media/Is1O1TWV0LEJi/giphy.gif', keywords: 'coffee tired' },
];

// Helper to format timestamps in Mountain Time
const formatChatTime = (isoString: string) => {
    try {
        return new Date(isoString).toLocaleTimeString('en-US', {
            timeZone: 'America/Denver',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return '';
    }
};

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ currentUser, users, sessions, onSendMessage, onDeleteMessage, onStartVideoCall, onCreateChat, onUpdateGroup, externalActiveChatId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    
    // Watch for external chat ID changes
    useEffect(() => {
        if (externalActiveChatId) {
            setActiveSessionId(externalActiveChatId);
            setIsOpen(true);
        }
    }, [externalActiveChatId]);
    
    // Dragging State - Initialize to 0, will set to center in useEffect
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const chatWindowRef = useRef<HTMLDivElement>(null);

    // New Chat State
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [newChatName, setNewChatName] = useState('');

    // Group Details State
    const [showGroupDetails, setShowGroupDetails] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);

    // Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerTab, setPickerTab] = useState<'emoji' | 'gif'>('emoji');
    const [pickerSearch, setPickerSearch] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tagging State
    const [showTagList, setShowTagList] = useState(false);
    const [tagQuery, setTagQuery] = useState('');

    // Filter sessions to only show those the user is part of
    const visibleSessions = sessions.filter(s => s.participants.some(p => p.id === currentUser.id));
    const activeSession = visibleSessions.find(s => s.id === activeSessionId);

    // ESC Key Handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (!isOpen) return;
                
                // Priority 1: Close full screen image
                if (viewingImage) {
                    setViewingImage(null);
                    return;
                }
                
                // Priority 2: Close popups (pickers, tag lists)
                if (showPicker) {
                    setShowPicker(false);
                    return;
                }
                if (showTagList) {
                    setShowTagList(false);
                    return;
                }
                
                // Priority 3: Close sub-views
                if (showGroupDetails) {
                    setShowGroupDetails(false);
                    return;
                }
                if (isCreatingChat) {
                    setIsCreatingChat(false);
                    return;
                }

                // Priority 4: Close the chat window
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, viewingImage, showPicker, showTagList, showGroupDetails, isCreatingChat]);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Dragging Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (chatWindowRef.current && chatWindowRef.current.contains(e.target as Node)) {
            // Only allow dragging from header
            const header = chatWindowRef.current.querySelector('.chat-header');
            if (header && header.contains(e.target as Node)) {
                setIsDragging(true);
                setDragOffset({
                    x: e.clientX - position.x,
                    y: e.clientY - position.y
                });
            }
        }
    };

    // Initialize position when opening - CENTERED
    useEffect(() => {
        if (isOpen) {
            const width = window.innerWidth >= 768 ? 800 : 350; // md:w-[800px] else w-[350px]
            const height = 500; // h-[500px]
            // Only reset position if it's currently at 0,0 (first open)
            if (position.x === 0 && position.y === 0) {
                setPosition({
                    x: Math.max(0, (window.innerWidth - width) / 2),
                    y: Math.max(0, (window.innerHeight - height) / 2)
                });
            }
        }
    }, [isOpen]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setIsCreatingChat(false);
        setShowGroupDetails(false);
        setShowPicker(false);
    }

    const handleSendText = () => {
        if (!inputText.trim() || !activeSessionId) return;
        onSendMessage(activeSessionId, { text: inputText });
        setInputText('');
        setShowTagList(false);
    };

    const handleSendGif = (url: string) => {
        if (!activeSessionId) return;
        onSendMessage(activeSessionId, { image: url });
        setShowPicker(false);
        setPickerSearch('');
    };

    const addEmoji = (emoji: string) => {
        setInputText(prev => prev + emoji);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputText(val);

        // Check for tag trigger '@'
        const lastWord = val.split(' ').pop();
        if (lastWord && lastWord.startsWith('@')) {
            setShowTagList(true);
            setTagQuery(lastWord.substring(1));
        } else {
            setShowTagList(false);
        }
    };

    const insertTag = (username: string) => {
        const words = inputText.split(' ');
        words.pop(); // Remove the partial tag
        const newText = [...words, `@${username} `].join(' ');
        setInputText(newText);
        setShowTagList(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeSessionId) {
            const reader = new FileReader();
            reader.onload = (e) => {
                 const result = e.target?.result as string;
                 const isVideo = file.type.startsWith('video/');
                 onSendMessage(activeSessionId, { 
                     image: isVideo ? undefined : result, 
                     video: isVideo ? result : undefined 
                 });
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (!activeSessionId) return;
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target?.result) {
                            onSendMessage(activeSessionId, { image: event.target.result as string });
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const toggleUserSelection = (id: string) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedUsers(newSet);
    };

    const handleCreateSession = () => {
        if (selectedUsers.size === 0) return;
        onCreateChat(Array.from(selectedUsers), newChatName);
        setIsCreatingChat(false);
        setSelectedUsers(new Set());
        setNewChatName('');
        // After creating, find the new session (or existing) and open it. 
        // For simplicity in this mock, we just reset to list view.
        setActiveSessionId(null); 
    };

    const getOtherParticipant = (session: ChatSession) => {
        return session.participants.find(p => p.id !== currentUser.id) || session.participants[0];
    };

    // Filtered Picker Lists
    const filteredEmojis = EMOJI_LIST.filter(e => e.keywords.includes(pickerSearch.toLowerCase()) || e.char.includes(pickerSearch));
    const filteredGifs = GIF_LIST.filter(g => g.keywords.includes(pickerSearch.toLowerCase()));

    // Filtered Users for Tagging
    const filteredTagUsers = users.filter(u => u.name.toLowerCase().includes(tagQuery.toLowerCase()));

    // Process text for tags
    const renderMessageText = (text: string) => {
        const parts = text.split(/(@\w+(?: \w+)?)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return <span key={i} className="text-teal-400 font-bold bg-teal-500/10 px-1 rounded">{part}</span>;
            }
            return part;
        });
    };

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*,video/*"
            />

            {/* Full Screen Image Modal */}
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

            {/* The Main Chat Window */}
            {isOpen && (
                <div 
                    ref={chatWindowRef}
                    onMouseDown={handleMouseDown}
                    style={{ left: position.x, top: position.y }}
                    className="fixed w-[350px] md:w-[800px] h-[500px] max-h-[80vh] bg-slate-900 shadow-2xl rounded-2xl border border-slate-700 z-40 flex overflow-hidden font-sans ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-200"
                >
                    {/* Sidebar List */}
                    <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900">
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0 cursor-move chat-header">
                            <h3 className="font-semibold text-slate-100">Messages</h3>
                            <div className="flex gap-2">
                                <button onClick={() => { setIsCreatingChat(true); setActiveSessionId(null); }} className="text-teal-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"><Plus size={18}/></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {visibleSessions.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-500">
                                    No conversations yet. Start a new chat!
                                </div>
                            ) : (
                                visibleSessions.map(session => {
                                    const isGroup = session.type === 'group';
                                    const other = getOtherParticipant(session);
                                    const displayName = isGroup ? session.name : other?.name || 'User';
                                    const displayAvatar = isGroup ? null : other?.avatar;
                                    const lastMsg = session.messages[session.messages.length - 1];
                                    let previewText = 'No messages';
                                    if (lastMsg) {
                                        if (lastMsg.text) previewText = lastMsg.text;
                                        else if (lastMsg.image) previewText = '[Image]';
                                        else if (lastMsg.video) previewText = '[Video]';
                                    }

                                    return (
                                        <div 
                                            key={session.id}
                                            onClick={() => { setActiveSessionId(session.id); setIsCreatingChat(false); setShowGroupDetails(false); }}
                                            className={`p-4 flex items-center cursor-pointer hover:bg-slate-800/50 transition-colors border-l-2 ${activeSessionId === session.id ? 'bg-slate-800 border-teal-500' : 'border-transparent'}`}
                                        >
                                            <div className="relative">
                                                {isGroup ? (
                                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                                        <Users size={18} />
                                                    </div>
                                                ) : (
                                                    <img src={displayAvatar} className="w-10 h-10 rounded-full border border-slate-700" alt="avatar" />
                                                )}
                                                {session.unread > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                                        {session.unread}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="ml-3 flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <span className="text-sm font-medium text-slate-200 truncate">{displayName}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{previewText}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Active Content Area */}
                    <div className="flex-1 flex flex-col bg-slate-950/50 relative overflow-hidden">
                        {/* Chat Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                        
                        {/* Bee Background - 20% Opacity */}
                        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-20">
                             <img 
                                src="https://tdjocnhwyqmnhwhgcwhy.supabase.co/storage/v1/object/public/bee/BEE.png"
                                alt="Background"
                                className="max-w-[80%] max-h-[80%] object-contain"
                                style={{ filter: 'grayscale(100%) invert(1)' }}
                             />
                        </div>

                        {isCreatingChat ? (
                            <div className="flex-1 p-6 flex flex-col min-h-0 animate-in fade-in z-10 cursor-default">
                                <h3 className="text-lg font-bold text-white mb-4 flex-shrink-0">New Message</h3>
                                <div className="flex-1 overflow-y-auto min-h-0 mb-4 border border-slate-800 rounded-xl bg-slate-900/80 backdrop-blur-sm p-2">
                                    {users.filter(u => u.id !== currentUser.id).map(user => (
                                        <div key={user.id} onClick={() => toggleUserSelection(user.id)} className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg cursor-pointer">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedUsers.has(user.id) ? 'bg-teal-500 border-teal-500' : 'border-slate-600'}`}>
                                                {selectedUsers.has(user.id) && <div className="w-2 h-2 bg-slate-900 rounded-sm" />}
                                            </div>
                                            <img src={user.avatar} className="w-8 h-8 rounded-full" alt=""/>
                                            <span className="text-slate-200 text-sm">{user.name}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex-shrink-0">
                                    {selectedUsers.size > 1 && (
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Group Name</label>
                                            <input 
                                                value={newChatName} 
                                                onChange={e => setNewChatName(e.target.value)}
                                                placeholder="e.g. Design Team" 
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-teal-500 outline-none" 
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsCreatingChat(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                                        <button 
                                            onClick={handleCreateSession} 
                                            disabled={selectedUsers.size === 0}
                                            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {selectedUsers.size > 1 ? 'Create Group' : 'Start Chat'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : activeSession ? (
                            showGroupDetails ? (
                                <div className="flex-1 flex flex-col p-6 animate-in fade-in min-h-0 z-10 bg-slate-950/80 backdrop-blur-sm cursor-default">
                                    <div className="flex items-center justify-between mb-6 flex-shrink-0">
                                        <h3 className="text-lg font-bold text-white">Group Details</h3>
                                        <button onClick={() => setShowGroupDetails(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded"><X size={20}/></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Participants ({activeSession.participants.length})</h4>
                                        {activeSession.participants.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <img src={p.avatar} className="w-8 h-8 rounded-full" alt=""/>
                                                    <span className="text-slate-200 text-sm">{p.name} {p.id === currentUser.id && '(You)'}</span>
                                                </div>
                                                {p.id !== currentUser.id && activeSession.type === 'group' && (
                                                    <button onClick={() => onUpdateGroup(activeSession.id, [p.id], 'remove')} className="text-rose-500 p-2 hover:bg-slate-700 rounded"><Trash2 size={16}/></button>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {showAddMember ? (
                                            <div className="mt-4 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Add People</h4>
                                                <div className="space-y-1">
                                                    {users.filter(u => !activeSession.participants.some(p => p.id === u.id)).map(u => (
                                                        <div key={u.id} onClick={() => { onUpdateGroup(activeSession.id, [u.id], 'add'); setShowAddMember(false); }} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer">
                                                            <Plus size={16} className="text-teal-400"/>
                                                            <img src={u.avatar} className="w-6 h-6 rounded-full" alt=""/>
                                                            <span className="text-slate-300 text-sm">{u.name}</span>
                                                        </div>
                                                    ))}
                                                    {users.filter(u => !activeSession.participants.some(p => p.id === u.id)).length === 0 && <p className="text-xs text-slate-500 italic">No more users to add.</p>}
                                                </div>
                                                <button onClick={() => setShowAddMember(false)} className="mt-2 text-xs text-slate-500 hover:text-white">Cancel</button>
                                            </div>
                                        ) : activeSession.type === 'group' && (
                                            <button onClick={() => setShowAddMember(true)} className="w-full py-3 mt-2 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center gap-2 transition-colors">
                                                <UserPlus size={18}/> Add Participants
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/90 backdrop-blur-sm z-10 flex-shrink-0 cursor-move chat-header">
                                        <div className="flex items-center space-x-3">
                                            <div>
                                                <span className="font-semibold text-slate-100 block">
                                                    {activeSession.type === 'group' ? activeSession.name : getOtherParticipant(activeSession).name}
                                                </span>
                                                {activeSession.type === 'group' && <span className="text-[10px] text-teal-400 uppercase tracking-wider font-bold">Team Channel</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4 text-slate-400" onMouseDown={e => e.stopPropagation()}>
                                            {activeSession.type === 'group' && (
                                                <button onClick={() => setShowGroupDetails(true)} className="hover:text-teal-400 hover:bg-slate-800 p-2 rounded-full transition-colors"><Info size={18} /></button>
                                            )}
                                            {/* Pass specific participants to video call */}
                                            <button className="hover:text-teal-400 hover:bg-slate-800 p-2 rounded-full transition-colors" onClick={() => onStartVideoCall(activeSession.participants)}><Video size={18} /></button>
                                            <button className="hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors" onClick={() => setIsOpen(false)}><X size={18} /></button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 relative cursor-default">
                                        {activeSession.messages.map(msg => {
                                            const isMe = msg.senderId === currentUser.id;
                                            const senderUser = users.find(u => u.id === msg.senderId);
                                            const avatarUrl = senderUser ? senderUser.avatar : `https://picsum.photos/40/40?random=${msg.senderId}`;

                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                                    {!isMe && <div className="w-8 h-8 rounded-full bg-slate-700 mr-3 overflow-hidden mt-1 flex-shrink-0"><img src={avatarUrl} alt="" className="w-full h-full object-cover"/></div>}
                                                    
                                                    <div className="flex items-end gap-2 max-w-[75%]">
                                                        {isMe && (
                                                            <button 
                                                                onClick={() => onDeleteMessage(activeSession.id, msg.id)}
                                                                className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                                title="Delete message"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                        <div className={`p-4 rounded-2xl text-sm shadow-md ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'} overflow-hidden`}>
                                                            {!isMe && <div className="text-[10px] font-bold text-slate-500 mb-1">{msg.senderName}</div>}
                                                            
                                                            {msg.image && (
                                                                <img 
                                                                    src={msg.image} 
                                                                    alt="Attachment" 
                                                                    className="rounded-lg max-w-full h-auto mb-1 border border-black/20 cursor-pointer hover:opacity-90 transition-opacity" 
                                                                    onClick={() => setViewingImage(msg.image!)}
                                                                />
                                                            )}
                                                            {msg.video && (
                                                                <video src={msg.video} controls className="rounded-lg max-w-full h-auto mb-1 border border-black/20" />
                                                            )}
                                                            
                                                            {msg.text && <p className="whitespace-pre-wrap">{renderMessageText(msg.text)}</p>}
                                                            
                                                            <div className={`text-[9px] text-right mt-1 ${isMe ? 'text-teal-200' : 'text-slate-500'}`}>
                                                                {formatChatTime(msg.timestamp)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="p-4 border-t border-slate-800 bg-slate-900 relative flex-shrink-0 z-20 cursor-default">
                                        {/* Tagging User List */}
                                        {showTagList && (
                                            <div className="absolute bottom-20 left-10 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                                <div className="p-2 text-xs font-bold text-slate-500 uppercase bg-slate-800/50 border-b border-slate-700">Mention User</div>
                                                <div className="max-h-40 overflow-y-auto">
                                                    {filteredTagUsers.map(u => (
                                                        <button 
                                                            key={u.id}
                                                            onClick={() => insertTag(u.name)}
                                                            className="w-full flex items-center gap-2 p-2 hover:bg-slate-700 text-left transition-colors"
                                                        >
                                                            <img src={u.avatar} className="w-5 h-5 rounded-full" alt=""/>
                                                            <span className="text-sm text-slate-200">{u.name}</span>
                                                        </button>
                                                    ))}
                                                    {filteredTagUsers.length === 0 && <div className="p-2 text-xs text-slate-500">No users found</div>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Emoji/GIF Picker Popover */}
                                        {showPicker && (
                                            <div ref={pickerRef} className="absolute bottom-20 left-4 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                                <div className="flex border-b border-slate-700">
                                                    <button 
                                                        onClick={() => { setPickerTab('emoji'); setPickerSearch(''); }}
                                                        className={`flex-1 py-2 text-xs font-bold ${pickerTab === 'emoji' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                                    >
                                                        Emojis
                                                    </button>
                                                    <button 
                                                        onClick={() => { setPickerTab('gif'); setPickerSearch(''); }}
                                                        className={`flex-1 py-2 text-xs font-bold ${pickerTab === 'gif' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                                    >
                                                        GIFs
                                                    </button>
                                                </div>
                                                <div className="p-2 border-b border-slate-700 bg-slate-800">
                                                    <div className="flex items-center bg-slate-900 rounded-lg px-2 py-1.5 border border-slate-700">
                                                        <Search size={14} className="text-slate-500 mr-2"/>
                                                        <input 
                                                            autoFocus
                                                            className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-slate-500"
                                                            placeholder={`Search ${pickerTab === 'emoji' ? 'emojis' : 'GIFs'}...`}
                                                            value={pickerSearch}
                                                            onChange={e => setPickerSearch(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="p-3 h-48 overflow-y-auto">
                                                    {pickerTab === 'emoji' ? (
                                                        filteredEmojis.length > 0 ? (
                                                            <div className="grid grid-cols-6 gap-2">
                                                                {filteredEmojis.map((e, idx) => (
                                                                    <button key={idx} onClick={() => addEmoji(e.char)} className="text-xl hover:bg-slate-700 rounded p-1 transition-colors" title={e.keywords}>{e.char}</button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-xs text-slate-500 mt-10">No emojis found</div>
                                                        )
                                                    ) : (
                                                        filteredGifs.length > 0 ? (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {filteredGifs.map((g, idx) => (
                                                                    <button key={idx} onClick={() => handleSendGif(g.url)} className="hover:opacity-80 transition-opacity">
                                                                        <img src={g.url} alt="GIF" className="w-full h-20 object-cover rounded-md" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-xs text-slate-500 mt-10">No GIFs found</div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center bg-slate-950 rounded-xl px-4 py-2 border border-slate-800 focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/50 transition-all">
                                            <button onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-white mr-3" title="Attach image or video">
                                                <Paperclip size={18} />
                                            </button>
                                            <input 
                                                type="text" 
                                                value={inputText}
                                                onChange={handleInputChange}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                                                onPaste={handlePaste}
                                                placeholder="Type a message... (Use @ to tag)" 
                                                className="flex-1 bg-transparent outline-none text-sm text-slate-200 placeholder-slate-600"
                                            />
                                            <button 
                                                onClick={() => { setShowPicker(!showPicker); setPickerTab('emoji'); setPickerSearch(''); }}
                                                className={`mr-3 transition-colors ${showPicker ? 'text-teal-500' : 'text-slate-500 hover:text-white'}`}
                                            >
                                                <Smile size={18} />
                                            </button>
                                            <button onClick={handleSendText} className="text-teal-500 hover:text-teal-400 ml-3 bg-teal-500/10 p-2 rounded-lg"><Send size={16} /></button>
                                        </div>
                                    </div>
                                </>
                            )
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 z-10 cursor-move chat-header">
                                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800 shadow-xl">
                                     <MessageCircle size={32} className="opacity-50" />
                                </div>
                                <p className="font-medium text-slate-400">Your Messages</p>
                                <p className="text-xs mt-2 opacity-70">Select a conversation or start a new one</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Bar Floating Pill */}
            <div className="fixed bottom-6 right-6 z-50">
               <button 
                    onClick={toggleChat}
                    className="h-14 w-14 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
               >
                   {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                   {!isOpen && <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-slate-900 rounded-full"></span>}
               </button>
            </div>
        </>
    );
};