import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SwappableSlot extends Event {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SwapRequest {
  id: string;
  mySlotId: string;
  theirSlotId: string;
  requesterId: string;
  responderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  mySlot: Event;
  theirSlot: Event;
  requester?: User;
  responder?: User;
}

// Auth API
export const authAPI = {
  signup: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/signup', { email, password, name });
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get('/events');
    return response.data;
  },
  create: async (title: string, startTime: string, endTime: string, status?: string) => {
    const response = await api.post('/events', { title, startTime, endTime, status });
    return response.data;
  },
  update: async (id: string, data: Partial<Event>) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/events/${id}`);
  },
};

// Swaps API
export const swapsAPI = {
  getSwappableSlots: async (): Promise<SwappableSlot[]> => {
    const response = await api.get('/swappable-slots');
    return response.data;
  },
  getSwapRequests: async (): Promise<{ incoming: SwapRequest[]; outgoing: SwapRequest[] }> => {
    const response = await api.get('/swap-requests');
    return response.data;
  },
  createSwapRequest: async (mySlotId: string, theirSlotId: string) => {
    const response = await api.post('/swap-request', { mySlotId, theirSlotId });
    return response.data;
  },
  respondToSwapRequest: async (requestId: string, accepted: boolean) => {
    const response = await api.post(`/swap-response/${requestId}`, { accepted });
    return response.data;
  },
};

export default api;

