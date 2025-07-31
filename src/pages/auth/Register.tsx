import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks';
import { registerUser, AuthResponse } from '../../features/auth/authSlice';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  role: yup.string().oneOf(['ADMIN', 'EMPLOYEE'], 'Please select a valid role').required('Role is required'),
});

type RegisterFormData = yup.InferType<typeof schema>;

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: yupResolver(schema) });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword((prev) => !prev);

const onSubmit = async (data: RegisterFormData) => {
  try {
    const resultAction = await dispatch(registerUser(data));

    if (registerUser.fulfilled.match(resultAction)) {
      const { user, accessToken } = resultAction.payload as AuthResponse;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Registration successful!');

      // Redirect by role
      if (user.role === 'ADMIN') {
        navigate('/dashboard/admin');
      } else if (user.role === 'EMPLOYEE') {
        navigate('/dashboard/employee');
      } else {
        navigate('/dashboard');
      }

    } else if (registerUser.rejected.match(resultAction)) {
      const error = resultAction.payload || 'Registration failed';
      toast.error(error);
    }

  } catch (err) {
    console.error('Unexpected registration error:', err);
    toast.error('Unexpected error occurred');
  }
};


  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow p-4" style={{ maxWidth: 500, width: '100%' }}>
        <h3 className="text-center mb-4">Register</h3>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Name */}
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              {...register('name')}
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              placeholder="John Doe"
            />
            {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              {...register('email')}
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="you@example.com"
            />
            {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={togglePassword}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <div className="invalid-feedback d-block">{errors.password.message}</div>}
          </div>

          {/* Role */}
          <div className="mb-4">
            <label className="form-label">Role</label>
            <select
              {...register('role')}
              className={`form-select ${errors.role ? 'is-invalid' : ''}`}
            >
              <option value="">Select role</option>
              <option value="ADMIN">Admin</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
            {errors.role && <div className="invalid-feedback">{errors.role.message}</div>}
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
