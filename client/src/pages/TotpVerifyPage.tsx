import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CodeInput from '../components/CodeInput';
import axios from 'axios';

export default function TotpVerifyPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  const tempToken = sessionStorage.getItem('tempToken');

  useEffect(() => {
    if (!tempToken) {
      navigate('/login');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem('tempToken');
          navigate('/login');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tempToken, navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleComplete = async (code: string) => {
    if (!tempToken || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await authApi.verifyTotp(code, tempToken);
      sessionStorage.removeItem('tempToken');
      login(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 429) {
          setError('Too many attempts. Please wait a minute and try again.');
        } else {
          setError('Invalid code. Please try again.');
        }
      } else {
        setError('Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Two-Factor Authentication</h1>
        <p className="subtitle">Enter the 6-digit code from your authenticator app</p>

        <div className="timer">
          Token expires in: <strong>{formatTime(timeLeft)}</strong>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div style={{ margin: '24px 0' }}>
          <CodeInput onComplete={handleComplete} disabled={loading} />
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#666' }}>Verifying...</p>}

        <button
          className="btn-secondary"
          onClick={() => {
            sessionStorage.removeItem('tempToken');
            navigate('/login');
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
