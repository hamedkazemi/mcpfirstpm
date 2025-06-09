import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import type {
  ApiResponse,
  AuthResponse,
  User,
  Project,
  ProjectStats,
  Item,
  ItemHistory,
  Comment,
  Tag,
  TagUsage,
  Mention,
} from '@/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7585';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { tokens } = response.data.data;
          Cookies.set('accessToken', tokens.accessToken, { expires: 1 }); // 1 day

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed, redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API methods
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials),

  register: (userData: { 
    name: string; 
    email: string; 
    password: string; 
    role?: string 
  }) => {
    const [firstName, ...lastNameParts] = userData.name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    return api.post<ApiResponse<AuthResponse>>('/api/auth/register', {
      username: userData.email.split('@')[0], // Use email prefix as username
      email: userData.email,
      password: userData.password,
      firstName,
      lastName,
      role: userData.role
    });
  },

  logout: () =>
    api.post<ApiResponse>('/api/auth/logout'),

  getProfile: () =>
    api.get<ApiResponse<User>>('/api/auth/profile'),

  updateProfile: (data: { firstName?: string; lastName?: string; avatar?: string }) =>
    api.put<ApiResponse<User>>('/api/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse>('/api/auth/change-password', data),
};

// Projects API methods
export const projectsApi = {
  getProjects: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Project[]>>('/api/projects', { params }),

  getProject: (id: string) =>
    api.get<ApiResponse<Project>>(`/api/projects/${id}`),

  createProject: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<Project>>('/api/projects', data),

  updateProject: (id: string, data: { name?: string; description?: string }) =>
    api.put<ApiResponse<Project>>(`/api/projects/${id}`, data),

  deleteProject: (id: string) =>
    api.delete<ApiResponse>(`/api/projects/${id}`),

  getProjectMembers: (id: string) =>
    api.get<ApiResponse<User[]>>(`/api/projects/${id}/members`),

  addMember: (id: string, data: { email: string; role: string }) =>
    api.post<ApiResponse>(`/api/projects/${id}/members`, data),

  removeMember: (id: string, userId: string) =>
    api.delete<ApiResponse>(`/api/projects/${id}/members/${userId}`),

  updateMemberRole: (id: string, userId: string, data: { role: string }) =>
    api.put<ApiResponse>(`/api/projects/${id}/members/${userId}`, data),

  getProjectStats: (id: string) =>
    api.get<ApiResponse<ProjectStats>>(`/api/projects/${id}/stats`),
};

// Items API methods
export const itemsApi = {
  getProjectItems: (projectId: string, params?: { page?: number; limit?: number; status?: string; assignee?: string }) =>
    api.get<ApiResponse<Item[]>>(`/api/projects/${projectId}/items`, { params }),

  getItem: (id: string) =>
    api.get<ApiResponse<Item>>(`/api/items/${id}`),

  createItem: (projectId: string, data: { title: string; description?: string; type: string; priority?: string }) =>
    api.post<ApiResponse<Item>>(`/api/projects/${projectId}/items`, data),

  updateItem: (id: string, data: { title?: string; description?: string; type?: string; priority?: string }) =>
    api.put<ApiResponse<Item>>(`/api/items/${id}`, data),

  deleteItem: (id: string) =>
    api.delete<ApiResponse>(`/api/items/${id}`),

  updateItemStatus: (id: string, data: { status: string }) =>
    api.put<ApiResponse<Item>>(`/api/items/${id}/status`, data),

  assignItem: (id: string, data: { assigneeId: string }) =>
    api.put<ApiResponse<Item>>(`/api/items/${id}/assign`, data),

  getItemComments: (id: string) =>
    api.get<ApiResponse<Comment[]>>(`/api/items/${id}/comments`),

  addComment: (itemId: string, data: { content: string; mentions?: string[] }) =>
    api.post<ApiResponse<Comment>>(`/api/items/${itemId}/comments`, data),

  getItemHistory: (id: string) =>
    api.get<ApiResponse<ItemHistory[]>>(`/api/items/${id}/history`),
};

// Comments API methods
export const commentsApi = {
  updateComment: (id: string, data: { content: string }) =>
    api.put<ApiResponse<Comment>>(`/api/comments/${id}`, data),

  deleteComment: (id: string) =>
    api.delete<ApiResponse>(`/api/comments/${id}`),
};

// Tags API methods
export const tagsApi = {
  getProjectTags: (projectId: string) =>
    api.get<ApiResponse<Tag[]>>(`/api/projects/${projectId}/tags`),

  createTag: (projectId: string, data: { name: string; color: string }) =>
    api.post<ApiResponse<Tag>>(`/api/projects/${projectId}/tags`, data),

  updateTag: (id: string, data: { name?: string; color?: string }) =>
    api.put<ApiResponse<Tag>>(`/api/tags/${id}`, data),

  deleteTag: (id: string) =>
    api.delete<ApiResponse>(`/api/tags/${id}`),

  getTagUsage: (id: string) =>
    api.get<ApiResponse<TagUsage>>(`/api/tags/${id}/usage`),
};

// Users API methods
export const usersApi = {
  getUsers: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<User[]>>('/api/users', { params }),

  searchUsers: (params: { q: string; limit?: number }) =>
    api.get<ApiResponse<User[]>>('/api/users/search', { params }),

  getUser: (id: string) =>
    api.get<ApiResponse<User>>(`/api/users/${id}`),

  getUserMentions: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Mention[]>>(`/api/users/${userId}/mentions`, { params }),

  markMentionsAsRead: (userId: string) =>
    api.put<ApiResponse>(`/api/users/${userId}/mentions/read`),
};
