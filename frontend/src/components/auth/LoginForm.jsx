import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

import authService from '../../services/authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function LoginForm({ onSuccess, expectedRole }) {
  const { login, logout, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [localError, setLocalError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Load saved email if "Remember me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        rememberMe: true
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear errors when user starts typing
    if (error) clearError();
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!formData.email || !formData.password) {
      const errorMsg = 'Please enter both email and password';
      setLocalError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      const errorMsg = 'Please enter a valid email address';
      setLocalError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const response = await login(formData.email, formData.password);

      // Validate role if expectedRole is provided
      if (expectedRole && response.user) {
        const userRole = response.user.role.toLowerCase();
        const expected = expectedRole.toLowerCase();

        // Check if roles match (also handle hr_recruiter vs hr-manager)
        const roleMatches = userRole === expected ||
                           (userRole === 'hr_recruiter' && expected === 'hr_recruiter') ||
                           (userRole === 'hr_recruiter' && expected === 'hr-manager') ||
                           (userRole === 'hr-manager' && expected === 'hr_recruiter');

        if (!roleMatches) {
          // Logout the user immediately since role doesn't match
          await logout();
          const errorMsg = `Access denied. These credentials are for a ${getRoleDisplayName(userRole)}, not a ${getRoleDisplayName(expectedRole)}.`;
          setLocalError(errorMsg);
          toast.error(errorMsg);
          // Don't proceed with onSuccess
          return;
        }
      }

      // Check for redirect URL from localStorage (AI interview access)
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
      if (redirectAfterLogin) {
        // Clear the redirect URL from localStorage
        localStorage.removeItem('redirectAfterLogin');
        // Navigate to the stored URL
        navigate(redirectAfterLogin);
        return;
      }

      // Check for redirect URL from location state
      if (location.state?.returnUrl) {
        navigate(location.state.returnUrl);
        return;
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      console.log('Login error message:', errorMessage); // Debug log
      setLocalError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Admin',
      hr_recruiter: 'HR Manager',
      'hr-manager': 'HR Manager',
      manager: 'Manager',
      employee: 'Employee'
    };
    return roleNames[role.toLowerCase()] || role;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!resetEmail) {
      const errorMsg = 'Please enter your email address';
      setLocalError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      const errorMsg = 'Please enter a valid email address';
      setLocalError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsResetting(true);
  const response = await authService.forgotPassword(resetEmail);
      
      // Check if email service is configured
      if (response.data && response.data.includes('not configured')) {
        toast.success('Password reset requested! (Email service not configured in development)', {
          duration: 5000,
        });
      } else {
        toast.success('Password reset link sent to your email!');
      }
      
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err) {
      const errorMessage = err.message || 'Failed to send reset email. Please try again.';
      setLocalError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const handleOAuthSignIn = (provider) => {
    // Only allow OAuth for employee role
    if (expectedRole && expectedRole.toLowerCase() !== 'employee') {
      toast.error('OAuth sign-in is only available for employee accounts.');
      return;
    }

    // Redirect to OAuth provider with expectedRole parameter
    let oauthUrl = `${API_URL}/auth/${provider}`;
    if (expectedRole) {
      oauthUrl += `?expectedRole=${encodeURIComponent(expectedRole)}`;
    }
    window.location.href = oauthUrl;
  };

  const displayError = localError || error;

  // If showing forgot password form
  if (showForgotPassword) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
          <p className="text-sm text-gray-600 mt-1">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {displayError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <Label htmlFor="resetEmail">Email Address</Label>
            <Input
              id="resetEmail"
              name="resetEmail"
              type="email"
              placeholder="you@company.com"
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                if (localError) setLocalError('');
              }}
              disabled={isResetting}
              className="mt-1"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setLocalError('');
              }}
              disabled={isResetting}
            >
              Back to Login
            </Button>
            <Button type="submit" className="flex-1" disabled={isResetting}>
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Regular login form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="email">Email Address</Label>
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
        <Label htmlFor="password">Password</Label>
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
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, rememberMe: checked }))
            }
            disabled={isLoading}
          />
          <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
            Remember me
          </Label>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(true);
            setResetEmail(formData.email); // Pre-fill with current email
            setLocalError('');
          }}
          className="text-sm text-blue-600 hover:underline"
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      {/* OAuth Sign In - Only for Employee Role */}
      {(!expectedRole || expectedRole.toLowerCase() === 'employee') && (
        <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="flex items-center justify-center mb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
