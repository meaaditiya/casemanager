import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Component imports
import AdvocateRegistration from './Components/AdvocateRegistration';
import AdvocateLogin from './Components/AdvocateLogin';
import Advocatedashboard from './Dashboard/Advocatedashboard';
import LitigantRegister from './Components/LitigantRegister';
import LitigantLogin from './Components/LitigantLogin';
import LitigantDashboard from './Dashboard/LitigantDashboard';
import AdminDashboard from './Dashboard/AdminDashboard';
import Welcome from './Components/Welcome';
import Advocate from './Components/Advocate';
import Admin from './Components/Admin'
import Litigant from './Components/Litigant';
import ClerkRegister from './Components/ClerkRegister';
import ClerkLogin from './Components/ClerkLogin';
import Clerkdashboard from './Dashboard/Clerkdashboard';
import Clerk from './Components/Clerk';
import NoticeForm from './Components/NoticeForm';
import NoticeBoard from './Components/NoticeBoard';
import NoticeList from './Components/NoticeList';
import UserCalendarPanel from './Components/UserCalendar';
import Videoplead from './Components/Videoplead';
import UploadVideoplead from './Components/UploadVideo';
import Litigantmeeting from './Components/Litigantmeeting';
import Litigantcaseassign from './Components/litigantcaseassign';
import Advocatecaseassign from './Components/Advocatecaseassign';
import Advocatefilecase from './Components/Advocatefilecase';
import Advocatemeeting from './Components/Advocatemeeting';
import LegalAssistantChatbot from './Components/LegalAssistantChatbot';
import AdminLogin from './Components/AdminLogin';

// Navigation Header Component
const NavigationHeader = () => {
  const navigate = useNavigate();

  const styles = {
    headerContainer: {
      width: '100%',
      height: '50px',
      backgroundColor: '#0f172a',
      borderBottom: '2px solid #fbbf24',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logoText: {
      color: '#fbbf24',
      fontSize: '18px',
      fontWeight: '600',
      letterSpacing: '-0.01em',
      margin: 0
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    navButton: {
      backgroundColor: 'transparent',
      border: '1px solid #9c8a70',
      color: '#f5f3f0',
      padding: '6px 12px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      borderRadius: '2px'
    },
    homeButton: {
      backgroundColor: '#fbbf24',
      color: '#0f172a',
      border: '1px solid #fbbf24',
      fontWeight: '600'
    },
    icon: {
      width: '14px',
      height: '14px'
    }
  };

  return (
    <div style={styles.headerContainer}>
      <div style={styles.leftSection}>
        <h1 style={styles.logoText}>e-Court Portal</h1>
      </div>
      
      <div style={styles.rightSection}>
        <button 
          style={styles.navButton}
          onClick={() => navigate(-1)}
          title="Go Back"
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1e293b'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <button 
          style={styles.navButton}
          onClick={() => navigate(1)}
          title="Go Forward"
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1e293b'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Forward
          <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button 
          style={styles.navButton}
          onClick={() => window.location.reload()}
          title="Refresh Page"
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1e293b'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>

        <button 
          style={{...styles.navButton, ...styles.homeButton}}
          onClick={() => navigate('/')}
          title="Go to Home"
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f59e0b'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#fbbf24'}
        >
          <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>
      </div>
    </div>
  );
};

// Layout wrapper that conditionally shows the header
const LayoutWrapper = ({ children, showHeader }) => {
  return (
    <>
      {showHeader && <NavigationHeader />}
      {children}
    </>
  );
};

function AppRoutes() {
  const location = useLocation();
  
  // Define routes where header should be shown
  const headerRoutes = [
    '/advocate', '/litigant', '/clerk',
    '/advlogin', '/register',
    '/litilogin', '/litiregister',
    '/clerklogin', '/clerkregister',
    '/noticeform', '/noticeboard',
    '/admin', '/adminlogin'
  ];
  
  const showHeader = headerRoutes.includes(location.pathname);

  return (
    <>
      {showHeader && <NavigationHeader />}
      <Routes>
        {/* Welcome Page */}
        <Route path="/" element={<Welcome />} />

        {/* Role Selection Pages */}
        <Route path="/advocate" element={<Advocate />} />
        <Route path="/litigant" element={<Litigant />} />
        <Route path="/clerk" element={<Clerk />} />

        {/* Advocate Routes */}
        <Route path="/advlogin" element={<AdvocateLogin />} />
        <Route path="/register" element={<AdvocateRegistration />} />
        <Route path="/advdash" element={<Advocatedashboard />} />

        {/* Litigant Routes */}
        <Route path="/litilogin" element={<LitigantLogin />} />
        <Route path="/litiregister" element={<LitigantRegister />} />
        <Route path="/litidash" element={<LitigantDashboard />} />

        {/* Clerk Routes */}
        <Route path="/clerklogin" element={<ClerkLogin />} />
        <Route path="/clerkregister" element={<ClerkRegister />} />
        <Route path="/clerkdash" element={<Clerkdashboard />} />
        <Route path="/noticeform" element={<NoticeForm/>} />
        <Route path="/noticeboard" element={<NoticeBoard/>} />
        <Route path="/noticelist" element={<NoticeList/>} />

        {/* Additional Routes */}
        <Route path="/usercalendar" element={<UserCalendarPanel/>} />
        <Route path="/videopleading" element={<Videoplead/>} />
        <Route path="/uploadvideoplead" element={<UploadVideoplead/>} />
        <Route path="/litigantmeeting" element={<Litigantmeeting/>} />
        <Route path="/litigantcaseassign" element={<Litigantcaseassign/>} />
        <Route path="/advocatecaseassign" element={<Advocatecaseassign/>} />
        <Route path="/advocatefilecase" element={<Advocatefilecase/>} />
        <Route path="/advocatemeeting" element={<Advocatemeeting/>} />
        <Route path="/chatbot" element={<LegalAssistantChatbot/>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Admin/>} />
        <Route path="/adminlogin" element={<AdminLogin/>} />
        <Route path="/admindash" element={<AdminDashboard/>} />

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;