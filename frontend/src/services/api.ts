import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, clear token if expired
      const isAuthRoute = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  registerPatient: async (data: any) => {
    const res = await apiClient.post('/auth/register/patient', data);
    return res.data;
  },
  registerDoctor: async (data: any) => {
    const res = await apiClient.post('/auth/register/doctor', data);
    return res.data;
  },
  login: async (data: any) => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },
  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  }
};

// Doctor APIs
export const doctorApi = {
  listDoctors: async (params?: any) => {
    const res = await apiClient.get('/doctors', { params });
    return res.data.data;
  },
  getDoctorById: async (id: string) => {
    const res = await apiClient.get(`/doctors/${id}`);
    return res.data.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.patch('/doctor/profile', data);
    return res.data.data;
  },
  updateStatus: async (status: string, delayMinutes: number = 0) => {
    const res = await apiClient.patch('/doctor/status', { status, delayMinutes });
    return res.data.data;
  },
  getAnalytics: async () => {
    const res = await apiClient.get('/doctor/analytics/overview');
    return res.data.data;
  }
};

// Patient APIs
export const patientApi = {
  getProfile: async () => {
    const res = await apiClient.get('/patient/profile');
    return res.data.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.patch('/patient/profile', data);
    return res.data.data;
  },
  getAppointments: async (tab?: string) => {
    const res = await apiClient.get('/patient/appointments', { params: { tab } });
    return res.data.data;
  },
  getNotifications: async () => {
    const res = await apiClient.get('/patient/notifications');
    return res.data.data;
  },
  markNotificationRead: async (id: string) => {
    const res = await apiClient.patch(`/patient/notifications/${id}/read`);
    return res.data.data;
  }
};

// Schedule APIs
export const scheduleApi = {
  getDoctorSchedule: async () => {
    const res = await apiClient.get('/doctor/schedule');
    return res.data.data;
  },
  getPublicSchedule: async (doctorId: string) => {
    const res = await apiClient.get(`/doctor/schedule/public/${doctorId}`);
    return res.data.data;
  },
  saveSchedule: async (schedules: any[]) => {
    const res = await apiClient.post('/doctor/schedule', { schedules });
    return res.data.data;
  },
  deleteScheduleDay: async (id: string) => {
    const res = await apiClient.delete(`/doctor/schedule/${id}`);
    return res.data.data;
  }
};

// Slot APIs
export const slotApi = {
  getDoctorSlots: async (doctorId: string, date?: string, status?: string) => {
    const res = await apiClient.get(`/doctors/${doctorId}/slots`, { params: { date, status } });
    return res.data.data;
  },
  generateSlots: async (startDate: string, endDate: string) => {
    const res = await apiClient.post('/doctor/slots/generate', { startDate, endDate });
    return res.data.data;
  },
  blockSlot: async (slotId: string, reason: string) => {
    const res = await apiClient.patch(`/doctor/slots/${slotId}/block`, { reason });
    return res.data.data;
  },
  unblockSlot: async (slotId: string) => {
    const res = await apiClient.patch(`/doctor/slots/${slotId}/unblock`);
    return res.data.data;
  }
};

// Appointment APIs
export const appointmentApi = {
  book: async (doctorId: string, slotId: string, reason?: string) => {
    const res = await apiClient.post('/appointments', { doctorId, slotId, reason });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/appointments/${id}`);
    return res.data.data;
  },
  getLiveQueue: async (id: string) => {
    const res = await apiClient.get(`/appointments/${id}/live-queue`);
    return res.data.data;
  },
  cancel: async (id: string, reason?: string) => {
    const res = await apiClient.patch(`/appointments/${id}/cancel`, { reason });
    return res.data.data;
  },
  reschedule: async (id: string, newSlotId: string) => {
    const res = await apiClient.patch(`/appointments/${id}/reschedule`, { newSlotId });
    return res.data.data;
  },
  checkIn: async (id: string) => {
    const res = await apiClient.patch(`/appointments/${id}/check-in`);
    return res.data.data;
  },
  startConsultation: async (id: string) => {
    const res = await apiClient.patch(`/appointments/${id}/start`);
    return res.data.data;
  },
  completeConsultation: async (id: string) => {
    const res = await apiClient.patch(`/appointments/${id}/complete`);
    return res.data.data;
  },
  markNoShow: async (id: string) => {
    const res = await apiClient.patch(`/appointments/${id}/no-show`);
    return res.data.data;
  },
  getDoctorQueue: async (date?: string) => {
    const res = await apiClient.get('/doctor/queue', { params: { date } });
    return res.data.data;
  }
};
