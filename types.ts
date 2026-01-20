export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  password?: string; // In a real app, this would be hashed.
  isFirstLogin?: boolean;
  role?: 'admin' | 'user';
}

export interface Attachment {
  type: 'image' | 'video' | 'file';
  url: string; // Base64 or URL
  name: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  attachments?: Attachment[];
}

export interface Task {
    id: string;
    name: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High';
    assignees: User[];
    status: 'Open' | 'In Progress' | 'On Hold' | 'Done';
    startDate?: string;
    dueDate?: string;
    comments?: Comment[];
}

export interface Project {
  id: string;
  projectId: string; // e.g., RH-28
  name: string;
  percent: number;
  owner: User;
  status: 'Active' | 'In Progress' | 'On Track' | 'Delayed' | 'In Testing' | 'Completed';
  tasksCompleted: number;
  tasksTotal: number;
  startDate: string;
  endDate: string;
  tags?: string[];
  isTemplate?: boolean;
  tasks?: Task[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  image?: string; // For GIFs or images
  video?: string; // For video attachments
  timestamp: string;
  isAi?: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: User[];
  messages: ChatMessage[];
  unread: number;
}

export interface TimeLog {
  id: string;
  userId: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String
}

export interface Notification {
    id: string;
    recipientId: string; // User who receives the notification
    text: string;
    time: string;
    unread: boolean;
    type: 'chat' | 'project' | 'task';
    targetId: string; // Project ID or Chat ID
    secondaryId?: string; // Task ID if applicable
    commentId?: string; // Specific comment ID to scroll to
}