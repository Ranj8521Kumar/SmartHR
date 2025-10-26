import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginForm({ onSuccess, expectedRole }) {
  const { login, logout, forgotPassword, isLoading, error, clearError } = useAuth();
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
      
      // Handle "Remember me" functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
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
      
      // Show success toast
      const userName = response.user ? `${response.user.firstName} ${response.user.lastName}` : 'User';
      toast.success(`Welcome back, ${userName}!`);
      
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
      const response = await forgotPassword(resetEmail);
      
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
    </form>
  );
}
