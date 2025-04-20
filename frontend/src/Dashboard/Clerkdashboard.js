import React, { useState, useEffect } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import axios from 'axios';
import { Check, X, LogOut, User, FileText, Calendar, Database, ShieldCheck,Info,Book,Users } from 'lucide-react';
import '../ComponentsCSS/Clerkdashboard.css';
const ClerkDashboard = () => {
    // Main Dashboard State
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [logoutPassword, setLogoutPassword] = useState('');
    const [showVerificationSection, setShowVerificationSection] = useState(false);
    const navigate = useNavigate();

    // Advocate Verification State
    const [advocates, setAdvocates] = useState({ verifiedAdvocates: [], unverifiedAdvocates: [] });
    const [selectedAdvocate, setSelectedAdvocate] = useState(null);
    const [verificationDeclaration, setVerificationDeclaration] = useState('');
    const [verificationNotes, setVerificationNotes] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationData, setVerificationData] = useState({});
    const [signaturePin, setSignaturePin] = useState('');
    const [signatureStatus, setSignatureStatus] = useState(null);
    const [isGeneratingSignature, setIsGeneratingSignature] = useState(false);

    useEffect(() => {
        fetchProfile();
        if (showVerificationSection) {
            fetchAdvocates();
        }
    }, [showVerificationSection]);

    // Profile Fetching
    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/clerklogin');
                throw new Error('No authentication token found');
            }
            const response = await axios.get('http://localhost:5000/api/clerk/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProfile(response.data.clerk);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
            if (err.response?.status === 401) {
                navigate('/clerklogin');
            }
        }
    };

    // Advocates Fetching
    const fetchAdvocates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/clerk/dashboard/advocates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAdvocates(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching advocates');
        }
    };

    // Document Viewing
    const viewCOPDocument = async (advocateId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/clerk/advocate/cop-document/${advocateId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    responseType: 'blob'
                }
            );
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            window.open(fileURL, '_blank');
        } catch (err) {
            setError('Error viewing document');
        }
    };

    // Digital Signature Generation
    const generateDigitalSignature = async () => {
        if (!signaturePin || signaturePin.length !== 6) {
            setSignatureStatus({
                type: 'error',
                message: 'Please enter a valid 6-digit PIN'
            });
            return;
        }

        setIsGeneratingSignature(true);
        try {
            const timestamp = new Date().toISOString();
            // Generate certificate hash
            const encoder = new TextEncoder();
            const data = encoder.encode(signaturePin + timestamp + profile.clerk_id);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const certificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const signature = {
                timestamp,
                signatureId: `SIG-${Math.random().toString(36).substr(2, 9)}`,
                certificateHash,
                clerkId: profile.clerk_id,
                clerkName: profile.name,
                district: profile.district,
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

            setVerificationData(prevData => ({
                ...prevData,
                digitalSignature: signature
            }));

            setSignatureStatus({
                type: 'success',
                message: 'Digital signature generated successfully'
            });
        } catch (error) {
            setSignatureStatus({
                type: 'error',
                message: 'Failed to generate signature. Please try again.'
            });
        }
        setIsGeneratingSignature(false);
    };

    // Verification Handling
    const handleVerification = async () => {
        if (!verificationData.digitalSignature) {
            setError('Digital signature is required for verification');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:5000/api/clerk/verify-advocate/${selectedAdvocate.advocate_id}`,
                {
                    verificationDeclaration,
                    notes: verificationNotes,
                    digitalSignature: verificationData.digitalSignature,
                    verificationTimestamp: new Date().toISOString()
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setShowVerificationModal(false);
            resetVerificationForm();
            fetchAdvocates();
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        }
    };

    // Logout Handling
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/clerk/logout', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            localStorage.removeItem('token');
            navigate('/clerklogin');
        } catch (error) {
            setError(error.response?.data?.message || 'Logout failed');
        }
    };

    const handleLogoutAll = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/clerk/logout-all', 
                { password: logoutPassword },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            localStorage.removeItem('token');
            setShowLogoutConfirm(false);
            navigate('/clerklogin');
        } catch (error) {
            setError(error.response?.data?.message || 'Logout from all devices failed');
        }
    };

    // Utility Functions
    const resetVerificationForm = () => {
        setVerificationDeclaration('');
        setVerificationNotes('');
        setVerificationData({});
        setSignaturePin('');
        setSignatureStatus(null);
    };
    document.addEventListener('DOMContentLoaded', function() {
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.court-clerk-sidebar');
        const sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'court-clerk-sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
        
        // Toggle sidebar
        sidebarToggle.addEventListener('click', function() {
          sidebar.classList.toggle('active');
          sidebarOverlay.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside
        sidebarOverlay.addEventListener('click', function() {
          sidebar.classList.remove('active');
          sidebarOverlay.classList.remove('active');
        });
        
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.court-clerk-mobile-menu-toggle');
        const mobileMenu = document.querySelector('.court-clerk-mobile-menu');
        
        if (mobileMenuToggle && mobileMenu) {
          mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
          });
        }
        
        // Close mobile menu on window resize
        window.addEventListener('resize', function() {
          if (window.innerWidth > 640) {
            if (mobileMenu) {
              mobileMenu.classList.remove('active');
            }
          }
          
          if (window.innerWidth > 992) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
          }
        });
      });
    if (loading) {
        return (
            <div className="clerk-loading-container">
                <div className="clerk-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="court-clerk-dashboard">
            {/* Header */}
            <header className="court-clerk-header">
                <div className="court-clerk-header-left">
                    <h1 className="court-clerk-title">Welcome To Clerk Dashboard</h1>
                </div>
                <div className="court-clerk-header-right">
                    <div className="court-clerk-logout-buttons">
                        <button className="court-clerk-logout-btn" onClick={handleLogout}>
                            <LogOut className="court-clerk-logout-icon" />
                            Logout
                        </button>
                        <button className="court-clerk-logout-all-btn" onClick={() => setShowLogoutConfirm(true)}>
                            <LogOut className="court-clerk-logout-icon" />
                            Logout All Devices
                        </button>
                    </div>
                    <div className="court-clerk-profile-toggle" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                        <div className="court-clerk-avatar">
                            {profile?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="court-clerk-content">
                {/* Sidebar */}
                <aside className="court-clerk-sidebar">
                    <nav className="court-clerk-nav">
                        <button className="court-clerk-nav-btn">
                            <FileText className="court-clerk-nav-icon" />
                            Cases
                        </button>
                        <button className="court-clerk-nav-btn">
                            <Calendar className="court-clerk-nav-icon" />
                            Schedule
                        </button>
                        <button 
                            className="court-clerk-nav-btn"
                            onClick={() => setShowVerificationSection(!showVerificationSection)}
                        >
                            <ShieldCheck className="court-clerk-nav-icon" />
                            Verifications
                        </button>
                        <Link to="/noticepanel" className="court-clerk-nav-btn">
                            <Info className="court-clerk-nav-icon" />
                            Notice Panel
                        </Link>
                        <Link to="/admincasehandle" className="court-clerk-nav-btn">
                            <Book className="court-clerk-nav-icon" />
                            Case Management Panel
                        </Link>
                        <Link to="/admincalendar" className="court-clerk-nav-btn">
                            <Calendar className="court-clerk-nav-icon" />
                            Set Calendar
                        </Link>
                        <Link to="/adminmeeting" className="court-clerk-nav-btn">
                            <Users className="court-clerk-nav-icon" />
                            Set Meetings
                        </Link>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="court-clerk-main">
                    {/* Stats Section */}
                    <section className="court-clerk-stats">
                        <div className="court-clerk-stat-card">
                            <h3 className="court-clerk-stat-title">Total Cases</h3>
                            <p className="court-clerk-stat-value">0</p>
                        </div>
                        <div className="court-clerk-stat-card">
                            <h3 className="court-clerk-stat-title">Pending Cases</h3>
                            <p className="court-clerk-stat-value">0</p>
                        </div>
                        <div className="court-clerk-stat-card">
                            <h3 className="court-clerk-stat-title">Upcoming Hearings</h3>
                            <p className="court-clerk-stat-value">0</p>
                        </div>
                    </section>

                    {/* Verification Section */}
                    {showVerificationSection && (
                        <div className="court-clerk-verification-section">
                            <h2 className="court-clerk-verification-title">Advocate Verification Management</h2>
                            
                            {/* Unverified Advocates */}
                            <div className="court-clerk-unverified-section">
                                <h3 className="court-clerk-section-heading">Pending Verifications</h3>
                                <div className="court-clerk-advocates-grid">
                                    {advocates.unverifiedAdvocates.map(advocate => (
                                        <div key={advocate.advocate_id} className="court-clerk-advocate-card">
                                            <h4 className="court-clerk-advocate-name">{advocate.name}</h4>
                                            <p className="court-clerk-advocate-detail">Enrollment No: {advocate.enrollment_no}</p>
                                            <p className="court-clerk-advocate-detail">District: {advocate.practice_details.district}</p>
                                            <p className="court-clerk-advocate-detail">Bar ID: {advocate.barId}</p>
                                            <div className="court-clerk-card-actions">
                                                <button 
                                                    onClick={() => viewCOPDocument(advocate.advocate_id)}
                                                    className="court-clerk-view-doc-btn"
                                                >
                                                    View COP Document
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedAdvocate(advocate);
                                                        setShowVerificationModal(true);
                                                    }}
                                                    className="court-clerk-verify-btn"
                                                >
                                                    Verify Advocate
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Verified Advocates */}
                            <div className="court-clerk-verified-section">
                                <h3 className="court-clerk-section-heading">Verified Advocates</h3>
                                <div className="court-clerk-advocates-grid">
                                    {advocates.verifiedAdvocates.map(advocate => (
                                        <div key={advocate.advocate_id} className="court-clerk-advocate-card court-clerk-verified">
                                            <h4 className="court-clerk-advocate-name">{advocate.name}</h4>
                                            <p className="court-clerk-advocate-detail">Enrollment No: {advocate.enrollment_no}</p>
                                            <p className="court-clerk-advocate-detail">District: {advocate.practice_details.district}</p>
                                            <p className="court-clerk-advocate-detail">Bar ID: {advocate.barId}</p>
                                            <p className="court-clerk-verification-date">
                                                Verified On: {new Date(advocate.verificationDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Verification Modal */}
            {showVerificationModal && (
                <div className="court-clerk-modal-overlay">
                    <div className="court-clerk-verification-modal">
                        <h3 className="court-clerk-modal-title">Verify Advocate</h3>
                        <p className="court-clerk-modal-advocate-name">
                            Advocate Name: {selectedAdvocate?.name}
                        </p>
                        
                        <div className="court-clerk-form-group">
                            <label className="court-clerk-form-label">
                                Verification Declaration:
                                <textarea
                                    className="court-clerk-form-textarea"
                                    value={verificationDeclaration}
                                    onChange={(e) => setVerificationDeclaration(e.target.value)}
                                    placeholder="I hereby declare that I have verified all the documents..."
                                    required
                                />
                            </label>
                        </div>

                        <div className="court-clerk-form-group">
                            <label className="court-clerk-form-label">
                                Verification Notes:
                                <textarea
                                    className="court-clerk-form-textarea"
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    placeholder="Additional notes about verification..."
                                />
                            </label>
                        </div>

                        {/* Digital Signature Section */}
                        <div className="court-clerk-signature-section">
                            <h4 className="court-clerk-signature-title">Digital Signature Verification</h4>
                            
                            <div className="court-clerk-form-group">
                                <label className="court-clerk-form-label">
                                    Enter Your 6-digit PIN:
                                    <input
                                        type="password"
                                        maxLength={6}
                                        value={signaturePin}
                                        onChange={(e) => setSignaturePin(e.target.value)}
                                        className="court-clerk-pin-input"
                                        placeholder="Enter PIN"
                                    /></label>
                            </div>

                            <button
                                onClick={generateDigitalSignature}
                                disabled={isGeneratingSignature || signaturePin.length !== 6}
                                className="court-clerk-generate-signature-btn"
                            >
                                {isGeneratingSignature ? 'Generating...' : 'Generate Digital Signature'}
                            </button>

                            {signatureStatus && (
                                <div className={`court-clerk-alert ${signatureStatus.type === 'error' ? 'court-clerk-alert-error' : 'court-clerk-alert-success'}`}>
                                    <div className="court-clerk-alert-icon">
                                        {signatureStatus.type === 'success' ? (
                                            <Check className="court-clerk-check-icon" />
                                        ) : (
                                            <X className="court-clerk-x-icon" />
                                        )}
                                    </div>
                                    <div className="court-clerk-alert-content">
                                        <h4 className="court-clerk-alert-title">
                                            {signatureStatus.type === 'success' ? 'Success' : 'Error'}
                                        </h4>
                                        <p className="court-clerk-alert-message">
                                            {signatureStatus.message}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {verificationData.digitalSignature && (
                                <div className="court-clerk-signature-details">
                                    <h5 className="court-clerk-signature-details-title">Signature Details</h5>
                                    <div className="court-clerk-signature-info">
                                        <p>Signature ID: {verificationData.digitalSignature.signatureId}</p>
                                        <p>Generated: {new Date(verificationData.digitalSignature.timestamp).toLocaleString()}</p>
                                        <p>Valid Until: {new Date(verificationData.digitalSignature.validUntil).toLocaleString()}</p>
                                        <p className="court-clerk-signature-hash">
                                            Certificate Hash: {verificationData.digitalSignature.certificateHash}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="court-clerk-modal-actions">
                            <button 
                                onClick={handleVerification}
                                className="court-clerk-confirm-btn"
                                disabled={!verificationDeclaration || !verificationData.digitalSignature}
                            >
                                Confirm Verification
                            </button>
                            <button 
                                onClick={() => {
                                    setShowVerificationModal(false);
                                    resetVerificationForm();
                                }}
                                className="court-clerk-cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileOpen && (
                <div className="court-clerk-profile-overlay">
                    <div className="court-clerk-profile-modal">
                        <button
                            className="court-clerk-close-profile"
                            onClick={() => setIsProfileOpen(false)}
                        >
                            ×
                        </button>
                        <div className="court-clerk-profile-content">
                            <div className="court-clerk-profile-avatar court-clerk-large">
                                {profile?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h2>{profile?.name}</h2>
                            <h4>{profile?.clerk_id}</h4>
                            <p>{profile?.email}</p>
                            <p>District: {profile?.district}</p>
                            <div className="court-clerk-profile-details">
                                <div className="court-clerk-detail-item">
                                    <span>Employment No:</span>
                                    <strong>{profile?.employment_no}</strong>
                                </div>
                                <div className="court-clerk-detail-item">
                                    <span>Status:</span>
                                    <strong>{profile?.status}</strong>
                                </div>
                                <div className="court-clerk-detail-item">
                                    <span>Practice Area:</span>
                                    <strong>
                                        {profile?.practice_details?.district_court ? 'District Court' : 'Not Specified'}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="court-clerk-logout-overlay">
                    <div className="court-clerk-logout-modal">
                        <h3 className="court-clerk-logout-title">Confirm Logout from All Devices</h3>
                        <p className="court-clerk-logout-text">Please enter your password to confirm:</p>
                        <input
                            type="password"
                            value={logoutPassword}
                            onChange={(e) => setLogoutPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="court-clerk-password-input"
                        />
                        <div className="court-clerk-logout-actions">
                            <button onClick={handleLogoutAll} className="court-clerk-confirm-btn">
                                Confirm Logout
                            </button>
                            <button 
                                onClick={() => {
                                    setShowLogoutConfirm(false);
                                    setLogoutPassword('');
                                }}
                                className="court-clerk-cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="court-clerk-error-message">
                    <X className="court-clerk-error-icon" />
                    {error}
                </div>
            )}
        </div>
    );
};

export default ClerkDashboard;