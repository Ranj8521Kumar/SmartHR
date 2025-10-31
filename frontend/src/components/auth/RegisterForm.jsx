import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle, Linkedin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function RegisterForm({ onSuccess, expectedRole }) {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: expectedRole || 'employee',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) clearError();
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!formData.firstName || !formData.email || !formData.password) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      setLocalError('Please enter a valid phone number');
      return;
    }

    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      
      // Show success toast
      toast.success('Account created successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      console.log('Registration error message:', errorMessage); // Debug log
      setLocalError(errorMessage);
      
      // Show error toast for better visibility
      if (errorMessage.toLowerCase().includes('already exists') || 
          errorMessage.toLowerCase().includes('user already exists')) {
        toast.error('User already exists with this email!');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formData.role === 'employee' && (
        <div className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border rounded-lg bg-white py-2 text-base font-medium shadow-sm"
              onClick={() => { 
                let oauthUrl = `${API_URL}/auth/google`;
                if (expectedRole) {
                  oauthUrl += `?expectedRole=${encodeURIComponent(expectedRole)}`;
                }
                window.location.href = oauthUrl;
              }}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 11.989v3.822h5.453c-.222 1.266-1.65 3.709-5.453 3.709-3.283 0-5.961-2.715-5.961-6.065S8.717 7.39 12 7.39c1.87 0 3.124.797 3.839 1.483l2.616-2.523C16.95 4.73 14.702 3.75 12 3.75 6.902 3.75 2.75 7.902 2.75 12.999S6.902 22.25 12 22.25c6.938 0 9.25-4.854 9.25-7.354 0-.494-.054-.784-.122-1.125H12z"/>
              </svg>
              <span>Sign up with Google</span>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
        </div>
      )}
      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1"
            
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+1234567890"
          value={formData.phone}
          onChange={handleChange}
          disabled={isLoading}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          className="mt-1"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isLoading}
          className="mt-1"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
}
