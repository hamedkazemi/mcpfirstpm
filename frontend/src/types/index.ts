// User types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'developer' | 'viewer';
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

// Project types
export interface Project {
  _id: string;
  name: string;
  description?: string;
  owner: string | User;
  members: ProjectMember[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  user: string | User;
  role: 'owner' | 'manager' | 'developer' | 'viewer';
  joinedAt: string;
}

export interface ProjectStats {
  totalItems: number;
  itemsByStatus: Record<string, number>;
  itemsByType: Record<string, number>;
  totalMembers: number;
  recentActivity: ActivityItem[];
}

// Item types
export interface Item {
  _id: string;
  title: string;
  description?: string;
  type: 'feature' | 'bug' | 'task' | 'improvement';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project: string | Project;
  assignee?: string | User;
  reporter: string | User;
  tags: (string | Tag)[];
  comments: Comment[];
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemHistory {
  _id: string;
  item: string;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented';
  field?: string;
  oldValue?: string;
  newValue?: string;
  user: string | User;
  timestamp: string;
}

// Comment types
export interface Comment {
  _id: string;
  content: string;
  item: string | Item;
  author: string | User;
  mentions: (string | User)[];
  isEdited: boolean;
  editHistory?: CommentEdit[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentEdit {
  content: string;
  editedAt: string;
}

export interface Mention {
  _id: string;
  user: string | User;
  mentionedBy: string | User;
  comment: string | Comment;
  item: string | Item;
  project: string | Project;
  isRead: boolean;
  createdAt: string;
}

// Tag types
export interface Tag {
  _id: string;
  name: string;
  color: string;
  project: string | Project;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagUsage {
  tag: Tag;
  items: Item[];
  totalUsage: number;
  usageByMonth: Array<{
    month: string;
    count: number;
  }>;
}

// Activity types
export interface ActivityItem {
  _id: string;
  action: string;
  user: User;
  item?: Item;
  project: Project;
  details?: Record<string, unknown>;
  timestamp: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: User['role'];
}

export interface ProjectForm {
  name: string;
  description?: string;
}

export interface ItemForm {
  title: string;
  description?: string;
  type: Item['type'];
  priority?: Item['priority'];
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  tagIds?: string[];
}

export interface CommentForm {
  content: string;
  mentions?: string[];
}

export interface TagForm {
  name: string;
  color: string;
}

// Filter and search types
export interface ItemFilters {
  status?: Item['status'];
  type?: Item['type'];
  priority?: Item['priority'];
  assignee?: string;
  reporter?: string;
  tags?: string[];
  search?: string;
  dueDate?: {
    start?: string;
    end?: string;
  };
}

export interface UserFilters {
  role?: User['role'];
  isActive?: boolean;
  search?: string;
}

export interface ProjectFilters {
  search?: string;
  isActive?: boolean;
}

// UI State types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// Theme types
export interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  createdAt: number;
}

// Sidebar and navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavigationItem[];
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: Record<string, unknown>;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
