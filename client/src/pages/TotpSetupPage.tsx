import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CodeInput from '../components/CodeInput';
import axios from 'axios';

export default function TotpSetupPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [step, setStep] = useState<'generate' | 'confirm'>('generate');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleGenerateQr = async () => {
    if (!token) return;
    setLoadingQr(true);
    setError('');

    try {
      const res = await authApi.setupTotp(token);
      setQrCode(res.data.qrCode);
      setStep('confirm');
    } catch {
      setError('Failed to generate QR code');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleConfirm = async (code: string) => {
    if (!token || loading) return;
    setError('');
    setLoading(true);

    try {
      await authApi.confirmTotp(code, token);
      setSuccess('2FA has been activated successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Invalid code');
      } else {
        setError('Confirmation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <h1>Set Up Two-Factor Authentication</h1>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        {step === 'generate' && (
          <div>
            <p>Protect your account with TOTP-based 2FA. You will need an authenticator app like Google Authenticator or Authy.</p>
            <button
              className="btn-primary"
              onClick={handleGenerateQr}
              disabled={loadingQr}
            >
              {loadingQr ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        )}

        {step === 'confirm' && qrCode && (
          <div>
            <p><strong>Step 1:</strong> Scan this QR code with your authenticator app:</p>
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <img src={qrCode} alt="TOTP QR Code" style={{ width: '200px', height: '200px' }} />
            </div>
            <p><strong>Step 2:</strong> Enter the 6-digit code from your app to confirm:</p>
            <div style={{ margin: '16px 0' }}>
              <CodeInput onComplete={handleConfirm} disabled={loading} />
            </div>
            {loading && <p style={{ textAlign: 'center', color: '#666' }}>Confirming...</p>}
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: '16px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
