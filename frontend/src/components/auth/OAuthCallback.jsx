import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('OAuth authentication failed. Please try again.');
        navigate('/');
        return;
      }

      if (token) {
        try {
          // Store the token
          localStorage.setItem('token', token);
          
          // Update auth context
          if (setToken) {
            setToken(token);
          }

          toast.success('Successfully signed in!');
          
          // Redirect to home - the App will render the correct dashboard
          navigate('/');
        } catch (err) {
          console.error('OAuth callback error:', err);
          toast.error('Authentication failed. Please try again.');
          navigate('/');
        }
      } else {
        toast.error('No authentication token received.');
        navigate('/');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
