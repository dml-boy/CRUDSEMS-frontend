import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  staffPoints: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
  loading: boolean;
}

// Helpers
const saveAuthToLocalStorage = (user: User, token: string) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

const clearAuthFromLocalStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Initial State
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  error: null,
  loading: false,
};

// Async Thunks
export const registerUser = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string; role: string },
  { rejectValue: string }
>('auth/registerUser', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post<AuthResponse>('/auth/register', data);
    saveAuthToLocalStorage(res.data.user, res.data.accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>('auth/loginUser', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post<AuthResponse>('/auth/login', data);
    saveAuthToLocalStorage(res.data.user, res.data.accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Invalid credentials');
  }
});

export const getMe = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<User>('/auth/me');
      saveAuthToLocalStorage(res.data, localStorage.getItem('token') || '');
      return res.data;
    } catch (err: any) {
      clearAuthFromLocalStorage();
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch user');
    }
  }
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.get('/auth/logout');
      clearAuthFromLocalStorage();
      delete api.defaults.headers.common['Authorization'];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Logout failed');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload || 'Registration failed';
        state.loading = false;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload || 'Login failed';
        state.loading = false;
      })

      // Get Me
      .addCase(getMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.loading = false;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload || 'Failed to fetch user';
        state.loading = false;
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || 'Logout failed';
        state.loading = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;