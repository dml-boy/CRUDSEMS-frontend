import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

// Types
export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
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
};

// Async Thunks

// Register
export const registerUser = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string; role: string },
  { rejectValue: string }
>('auth/registerUser', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post<AuthResponse>('/auth/register', data);
    
    // ✅ Save to localStorage immediately
    saveAuthToLocalStorage(res.data.user, res.data.accessToken);
    
    // ✅ Set default Authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
    
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});



// Login
export const loginUser = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>('auth/loginUser', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post<AuthResponse>('/auth/login', data);
    saveAuthToLocalStorage(res.data.user, res.data.accessToken);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Invalid credentials');
  }
});

// Get Me
export const getMe = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<User>('/auth/me');
      localStorage.setItem('user', JSON.stringify(res.data));
      return res.data;
    } catch (err: any) {
      clearAuthFromLocalStorage();
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch user');
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.get('/auth/logout');
      clearAuthFromLocalStorage();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Logout failed');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Register
   .addCase(registerUser.fulfilled, (state, action) => {
  state.user = action.payload.user;
  state.token = action.payload.accessToken;
  state.isAuthenticated = true;
  state.error = null;
  saveAuthToLocalStorage(action.payload.user, action.payload.accessToken);
})

      // Login
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        Object.assign(state, {
          user: null,
          token: null,
          isAuthenticated: false,
          error: action.payload || 'Login failed',
        });
      })

      // Get Me
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getMe.rejected, (state, action) => {
        Object.assign(state, {
          user: null,
          token: null,
          isAuthenticated: false,
          error: action.payload || 'Failed to fetch user',
        });
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, {
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || 'Logout failed';
      });
  },
});

export default authSlice.reducer;
