import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, authApi, DashboardData, AuditLog } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userData, setUserData] = useState<DashboardData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, logsRes] = await Promise.all([
          userApi.getDashboard(),
          userApi.getAuditLog(),
        ]);
        setUserData(dashRes.data);
        setAuditLogs(logsRes.data.logs);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          navigate('/login');
        } else {
          setError('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [logout, navigate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
    }
    logout();
    navigate('/login');
  };

  const formatAction = (action: string) => {
    const map: Record<string, string> = {
      REGISTER: '✅ Registered',
      LOGIN_SUCCESS: '✅ Login Success',
      LOGIN_FAIL: '❌ Login Failed',
      '2FA_SUCCESS': '✅ 2FA Verified',
      '2FA_FAIL': '❌ 2FA Failed',
      '2FA_ENABLED': '🔒 2FA Enabled',
      LOGOUT: '👋 Logged Out',
    };
    return map[action] || action;
  };

  if (loading) {
    return (
      <div className="auth-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>SecureAuth Dashboard</h1>
        <button className="btn-secondary" onClick={handleLogout}>
          Sign Out
        </button>
      </header>

      {error && <div className="error-box">{error}</div>}

      {userData && (
        <div className="dashboard-content">
          <section className="card">
            <h2>Account Information</h2>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Member since:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>
            <p>
              <strong>2FA Status:</strong>{' '}
              {userData.is2faEnabled ? (
                <span className="badge badge-success">Active</span>
              ) : (
                <span className="badge badge-warning">Not configured</span>
              )}
            </p>

            {!userData.is2faEnabled && (
              <div className="banner-warning">
                <strong>⚠ Secure your account!</strong>
                <p>Two-factor authentication is not enabled. Enable it now to protect your account.</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate('/setup-totp')}
                >
                  Enable 2FA
                </button>
              </div>
            )}

            {userData.is2faEnabled && (
              <button
                className="btn-secondary"
                onClick={() => navigate('/setup-totp')}
                style={{ marginTop: '12px' }}
              >
                Reconfigure 2FA
              </button>
            )}
          </section>

          <section className="card">
            <h2>Login History</h2>
            {auditLogs.length === 0 ? (
              <p>No activity recorded yet.</p>
            ) : (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>IP Address</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr key={index}>
                      <td>{formatAction(log.action)}</td>
                      <td>{log.ipAddress || '—'}</td>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
