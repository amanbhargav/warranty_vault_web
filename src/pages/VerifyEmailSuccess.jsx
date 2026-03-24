import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function VerifyEmailSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, setToken } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');
  const verified = searchParams.get('verified') === 'true';
  const errorMessage = searchParams.get('error');
  
  useEffect(() => {
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
      setVerificationResult({
        success: false,
        message: decodeURIComponent(errorMessage)
      });
      setIsVerifying(false);
    } else if (token && verified) {
      verifyAndLogin();
    } else {
      setError('Invalid verification link');
      setIsVerifying(false);
    }
  }, [token, verified, errorMessage]);
  
  const verifyAndLogin = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      // The backend has already verified the email and generated a JWT token
      // We just need to set the token and authenticate the user
      setToken(token);
      
      // Verify the token by calling /me endpoint
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Update auth store with user data
        login({ token, user: userData });
        
        setVerificationResult({
          success: true,
          message: 'Your email has been successfully verified! You are now logged in.'
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('Token validation failed');
      }
    } catch (err) {
      setError('Verification failed. Please try logging in manually.');
      setVerificationResult({
        success: false,
        message: 'Verification failed. Please try logging in manually.'
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md flex flex-col items-center text-center mb-8">
        <div className={`p-3 rounded-xl mb-6 ${
          verificationResult?.success 
            ? 'bg-green-100' 
            : error || !verificationResult?.success 
              ? 'bg-red-100' 
              : 'bg-blue-100'
        }`}>
          <span className={`material-symbols-outlined text-4xl ${
            verificationResult?.success 
              ? 'text-green-600' 
              : error || !verificationResult?.success 
                ? 'text-red-600' 
                : 'text-blue-600'
          }`}>
            {verificationResult?.success 
              ? 'check_circle' 
              : error || !verificationResult?.success 
                ? 'error' 
                : 'email'
            }
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {isVerifying ? 'Verifying...' : 
           verificationResult?.success ? 'Email Verified!' :
           error || !verificationResult?.success ? 'Verification Failed' : 'Email Verification'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {isVerifying 
            ? 'Please wait while we verify your email...'
            : verificationResult?.success 
              ? 'Your account is now active and you can log in.'
              : error || !verificationResult?.success
                ? 'There was an issue verifying your email.'
                : 'Checking your verification status...'
          }
        </p>
      </div>
      
      {/* Result Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900/50 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="space-y-4">
          {/* Loading State */}
          {isVerifying && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                Verifying your email address...
              </p>
            </div>
          )}
          
          {/* Success State */}
          {verificationResult?.success && !isVerifying && (
            <div className="text-center py-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                  <span className="font-medium">Verification Successful!</span>
                </div>
                <p className="text-sm mt-2 text-green-700 dark:text-green-300">
                  Your email has been verified and you are now logged in.
                </p>
                <p className="text-xs mt-2 text-green-600 dark:text-green-400">
                  Redirecting to dashboard...
                </p>
              </div>
              
              <div className="space-y-3">
                <Button onClick={handleGoToDashboard} className="w-full">
                  <span className="material-symbols-outlined text-lg mr-2">dashboard</span>
                  Go to Dashboard Now
                </Button>
                <Button 
                  onClick={handleGoToLogin}
                  variant="outline"
                  className="w-full"
                >
                  <span className="material-symbols-outlined text-lg mr-2">login</span>
                  Back to Login
                </Button>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {(!verificationResult?.success && error) && !isVerifying && (
            <div className="text-center py-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                  <span className="material-symbols-outlined text-2xl">error</span>
                  <span className="font-medium">Verification Failed</span>
                </div>
                <p className="text-sm mt-2 text-red-700 dark:text-red-300">
                  {error || 'The verification link is invalid or has expired.'}
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/verify-email')}
                  variant="outline"
                  className="w-full"
                >
                  <span className="material-symbols-outlined text-lg mr-2">email</span>
                  Request New Verification Email
                </Button>
                
                <Button 
                  onClick={handleGoToLogin}
                  variant="ghost"
                  className="w-full"
                >
                  <span className="material-symbols-outlined text-lg mr-2">arrow_back</span>
                  Back to Login
                </Button>
              </div>
            </div>
          )}
          
          {/* Help Section */}
          {(!verificationResult?.success && error) && !isVerifying && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg mt-0.5">
                    help
                  </span>
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Troubleshooting Tips:
                    </p>
                    <ul className="text-amber-700 dark:text-amber-300 space-y-1 text-xs">
                      <li>• Make sure you clicked the complete link</li>
                      <li>• Verification links expire after 24 hours</li>
                      <li>• Request a new verification email if needed</li>
                      <li>• Contact support if issues persist</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Additional Info */}
      {!isVerifying && (
        <div className="w-full max-w-md mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            If you continue to experience issues, please contact our support team.
          </p>
        </div>
      )}
    </div>
  );
}
