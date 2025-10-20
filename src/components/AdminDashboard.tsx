import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

interface AdminDashboardProps {
  token: string;
  admin: any;
  onLogout: () => void;
}

interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  totalFeedback: number;
  activeSessions: number;
}

interface User {
  _id: string;
  userId: string;
  username: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  totalSessions: number;
}

interface Feedback {
  _id: string;
  feedbackId: string;
  email?: string;
  message: string;
  status: string;
  submittedAt: string;
}

interface Session {
  _id: string;
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: string;
  conversationData: {
    messages: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, admin, onLogout }) => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'users' | 'feedback'>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSessions, setUserSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('http://localhost:5001/api/admin/dashboard');
      setDashboardStats(data.dashboard.stats);
    } catch (error) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('http://localhost:5001/api/admin/users');
      setUsers(data.users);
    } catch (error) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('http://localhost:5001/api/admin/feedback');
      setFeedback(data.feedback);
    } catch (error) {
      setError('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSessions = async (userId: string) => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(`http://localhost:5001/api/admin/user/${userId}/sessions`);
      setUserSessions(data.sessions);
    } catch (error) {
      setError('Failed to fetch user sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPage === 'dashboard') {
      fetchDashboardData();
    } else if (currentPage === 'users') {
      fetchUsers();
    } else if (currentPage === 'feedback') {
      fetchFeedback();
    }
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <h2>📊 Dashboard Overview</h2>
      
      {dashboardStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{dashboardStats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>{dashboardStats.totalSessions}</h3>
              <p>Total Sessions</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{dashboardStats.totalFeedback}</h3>
              <p>Total Feedback</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎤</div>
            <div className="stat-content">
              <h3>{dashboardStats.activeSessions}</h3>
              <p>Active Sessions</p>
            </div>
          </div>
        </div>
      )}

      <div className="welcome-message">
        <h3>Welcome back, {admin.username}! 👋</h3>
        <p>Last login: {formatDate(admin.lastLoginAt)}</p>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-content">
      <h2>👥 User Management</h2>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>IP Address</th>
              <th>Created</th>
              <th>Last Active</th>
              <th>Sessions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.ipAddress}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{formatDate(user.lastActiveAt)}</td>
                <td>{user.totalSessions}</td>
                <td>
                  <button 
                    className="action-button"
                    onClick={() => {
                      setSelectedUser(user);
                      fetchUserSessions(user.userId);
                    }}
                  >
                    View Sessions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="user-sessions-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Sessions for {selectedUser.username}</h3>
              <button onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            
            <div className="sessions-list">
              {userSessions.map(session => (
                <div key={session._id} className="session-card">
                  <div className="session-header">
                    <span className="session-id">{session.sessionId}</span>
                    <span className={`status-badge ${session.status}`}>{session.status}</span>
                  </div>
                  
                  <div className="session-details">
                    <p><strong>Start:</strong> {formatDate(session.startTime)}</p>
                    {session.endTime && <p><strong>End:</strong> {formatDate(session.endTime)}</p>}
                    {session.duration && <p><strong>Duration:</strong> {formatDuration(session.duration)}</p>}
                    <p><strong>Messages:</strong> {session.conversationData.messages.length}</p>
                  </div>
                  
                  <div className="session-messages">
                    <h4>Messages: {session.conversationData.messages.length}</h4>
                    <button 
                      className="action-button"
                      onClick={() => setSelectedSession(session)}
                    >
                      View Full Conversation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conversation Popup Modal */}
      {selectedSession && (
        <div className="conversation-modal">
          <div className="modal-content conversation-modal-content">
            <div className="modal-header">
              <h3>Full Conversation</h3>
              <button onClick={() => setSelectedSession(null)}>✕</button>
            </div>
            
            <div className="session-info">
              <p><strong>Session ID:</strong> {selectedSession.sessionId}</p>
              <p><strong>Start:</strong> {formatDate(selectedSession.startTime)}</p>
              {selectedSession.endTime && <p><strong>End:</strong> {formatDate(selectedSession.endTime)}</p>}
              {selectedSession.duration && <p><strong>Duration:</strong> {formatDuration(selectedSession.duration)}</p>}
              <p><strong>Status:</strong> {selectedSession.status}</p>
            </div>
            
            <div className="full-conversation">
              <h4>Complete Conversation ({selectedSession.conversationData.messages.length} messages):</h4>
              <div className="messages-container">
                {selectedSession.conversationData.messages.map((message, index) => (
                  <div key={index} className={`message-full ${message.role}`}>
                    <div className="message-header">
                      <span className="message-role-badge">{message.role === 'user' ? '👤 User' : '🤖 AI'}</span>
                      <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="message-content-full">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="feedback-content">
      <h2>📝 Feedback Management</h2>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {feedback.map(fb => (
              <tr key={fb._id}>
                
                <td>{fb.email || 'N/A'}</td>
                
                <td>
                  <select 
                    className="status-select"
                    value={fb.status}
                    onChange={async (e) => {
                      try {
                        await fetchWithAuth(`http://localhost:5001/api/admin/feedback/${fb.feedbackId}/status`, {
                          method: 'PUT',
                          body: JSON.stringify({ status: e.target.value })
                        });
                        fetchFeedback(); // Refresh feedback list
                      } catch (error) {
                        setError('Failed to update feedback status');
                      }
                    }}
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
                <td>{formatDate(fb.submittedAt)}</td>
                <td className="message-cell">{fb.message.substring(0, 100)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );


  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>🔐 Aito Admin Panel</h1>
          <div className="admin-user-info">
            <span>Welcome, {admin.username}</span>
            <button onClick={onLogout} className="logout-button">Logout</button>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <button 
          className={currentPage === 'dashboard' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentPage('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={currentPage === 'users' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentPage('users')}
        >
          👥 Users
        </button>
        <button 
          className={currentPage === 'feedback' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentPage('feedback')}
        >
          📝 Feedback
        </button>
      </nav>

      <main className="admin-main">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        
        {currentPage === 'dashboard' && renderDashboard()}
        {currentPage === 'users' && renderUsers()}
        {currentPage === 'feedback' && renderFeedback()}
      </main>
    </div>
  );
};

export default AdminDashboard;
