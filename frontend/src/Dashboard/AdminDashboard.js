import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, 
  Database, 
  FileText, 
  Calendar, 
  Settings, 
  Info, 
  User, 
  ShieldCheck, 
  Users, 
  PanelLeft, 
  Clipboard, 
  UserPlus, 
  Check, 
  X 
} from 'lucide-react';

// Import components (assuming same component structure as ClerkDashboard)
import NoticePanel from '../Components/NoticePanel';
import NoticeBoard from '../Components/NoticeBoard';
import AdminCalendar from '../Components/AdminCalendar';
import UserCalendar from '../Components/UserCalendar';
import Adminmeet from '../Components/CourtAdminmeeting';
import AdminCaseHandle from '../Components/Admincasehandle';
import AdminAccountHandle from '../Components/Adminaccounthandle';
import AdminCreation from '../Components/AdminCreation';
import CourtAdminCaseHandle from '../Components/CourtAdminCaseHandle'

// Import CSS file
import '../ComponentsCSS/AdminDashboard.css';

const AdminDashboard = () => {
  // Main Dashboard State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [showVerificationSection, setShowVerificationSection] = useState(false);
  const navigate = useNavigate();

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
        navigate('/adminlogin');
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:5000/api/courtadmin/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setProfile(response.data.admin);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
      if (err.response?.status === 401) {
        navigate('/adminlogin');
      }
    }
  };

  // Advocates Fetching
  const fetchAdvocates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/courtadmin/dashboard/advocates', {
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
        `http://localhost:5000/api/courtadmin/advocate/cop-document/${advocateId}`,
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
      const encoder = new TextEncoder();
      const data = encoder.encode(signaturePin + timestamp + profile.admin_id);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const certificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const signature = {
        timestamp,
        signatureId: `SIG-${Math.random().toString(36).substr(2, 9)}`,
        certificateHash,
        adminId: profile.admin_id,
        adminName: profile.name,
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
        `http://localhost:5000/api/courtadmin/verify-advocate/${selectedAdvocate.advocate_id}`,
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
      await axios.post('http://localhost:5000/api/courtadmin/logout', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      localStorage.removeItem('token');
      navigate('/adminlogin');
    } catch (error) {
      setError(error.response?.data?.message || 'Logout failed');
    }
  };

  const handleLogoutAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/courtadmin/logout-all',
        { password: logoutPassword },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      localStorage.removeItem('token');
      setShowLogoutConfirm(false);
      navigate('/adminlogin');
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

  // Navigation handler
  const handleNavigation = (component) => {
    setActiveComponent(component);
    if (component === 'verifications') {
      setShowVerificationSection(true);
    } else {
      setShowVerificationSection(false);
    }
    setIsSidebarOpen(false);
  };

  // Sidebar toggle handler
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Dashboard Content Handler
  const renderContent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return (
          <section className="crt_adm_stats_panel_758fde">
            <div className="crt_adm_stat_card_9a76bc">
              <h3 className="crt_adm_stat_heading_37c2ef">Active Cases</h3>
              <p className="crt_adm_stat_value_482d1c">42</p>
            </div>
            <div className="crt_adm_stat_card_9a76bc">
              <h3 className="crt_adm_stat_heading_37c2ef">Upcoming Hearings</h3>
              <p className="crt_adm_stat_value_482d1c">15</p>
            </div>
            <div className="crt_adm_stat_card_9a76bc">
              <h3 className="crt_adm_stat_heading_37c2ef">Pending Documents</h3>
              <p className="crt_adm_stat_value_482d1c">8</p>
            </div>
            <div className="crt_adm_stat_card_9a76bc">
              <h3 className="crt_adm_stat_heading_37c2ef">Active Admins</h3>
              <p className="crt_adm_stat_value_482d1c">3</p>
            </div>
          </section>
        );
      case 'verifications':
        return (
          <div className="crt_adm_verification_wrapper_e63a17">
            <h2 className="crt_adm_verification_main_title_d28f9c">Advocate Verification Management</h2>
            <div className="crt_adm_unverified_section_b92c5d">
              <h3 className="crt_adm_section_subheading_8a34ed">Pending Verifications</h3>
              <div className="crt_adm_advocates_display_grid_7f9e20">
                {advocates.unverifiedAdvocates.map(advocate => (
                  <div key={advocate.advocate_id} className="crt_adm_advocate_display_card_2c68df">
                    <h4 className="crt_adm_advocate_display_name_1e7a49">{advocate.name}</h4>
                    <p className="crt_adm_advocate_info_detail_59c8e6">Enrollment No: {advocate.enrollment_no}</p>
                    <p className="crt_adm_advocate_info_detail_59c8e6">District: {advocate.practice_details.district}</p>
                    <p className="crt_adm_advocate_info_detail_59c8e6">Bar ID: {advocate.barId}</p>
                    <div className="crt_adm_card_action_buttons_5d9e78">
                      <button
                        onClick={() => viewCOPDocument(advocate.advocate_id)}
                        className="crt_adm_view_document_btn_f39a21"
                      >
                        View COP Document
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAdvocate(advocate);
                          setShowVerificationModal(true);
                        }}
                        className="crt_adm_verification_btn_6b27c4"
                      >
                        Verify Advocate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="crt_adm_verified_section_4c1bd9">
              <h3 className="crt_adm_section_subheading_8a34ed">Verified Advocates</h3>
              <div className="crt_adm_advocates_display_grid_7f9e20">
                {advocates.verifiedAdvocates.map(advocate => (
                  <div key={advocate.advocate_id} className="crt_adm_advocate_display_card_2c68df crt_adm_card_verified_8d70b1">
                    <h4 className="crt_adm_advocate_display_name_1e7a49">{advocate.name}</h4>
                    <p className="crt_adm_advocate_info_detail_59c8e6">Enrollment No: {advocate.enrollment_no}</p>
                    <p className="crt_adm_advocate_info_detail_59c8e6">District: {advocate.practice_details.district}</p>
                    <p className="crt_adm_advocate_info_detail_59c8e6">Bar ID: {advocate.barId}</p>
                    <p className="crt_adm_verification_date_display_37d8f2">
                      Verified On: {new Date(advocate.verificationDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
     
      case 'admincasemanagement':
        return <CourtAdminCaseHandle />;
     
      case 'meetings':
        return <Adminmeet />;
      case 'usercalendar':
        return <UserCalendar />;
      case 'usernoticeboard':
        return <NoticeBoard />;
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };

  if (loading) {
    return (
      <div className="crt_adm_loading_container_f42d9e">
        <div className="crt_adm_loading_spinner_1e84a3">Loading...</div>
      </div>
    );
  }

  return (
    <div className="crt_adm_dashboard_wrapper_93b7c5">
      {/* Header */}
      <header className="crt_adm_main_header_d57e2f">
        <div className="crt_adm_header_left_section_7c3a8d">
          <button className="crt_adm_sidebar_toggle_button_9de48b" onClick={toggleSidebar}>
            ☰
          </button>
          <div className="crt_adm_emblem_logo_container_6f27d9">
            <div className="crt_adm_emblem_image_wrapper_b8e513">
              <div className="crt_adm_logo_placeholder_text_5c78a2">Court Admin</div>
            </div>
          </div>
          <h1 className="crt_adm_main_title_heading_3fa8c4">Admin Panel</h1>
        </div>
        <div className="crt_adm_header_right_section_24d6f7">
          <div className="crt_adm_logout_buttons_group_a97c36">
            <button className="crt_adm_logout_single_btn_e31f82" onClick={handleLogout}>
              <LogOut className="crt_adm_logout_icon_display_7d8b25" />
              Logout
            </button>
            <button className="crt_adm_logout_all_devices_btn_1c9d84" onClick={() => setShowLogoutConfirm(true)}>
              <LogOut className="crt_adm_logout_icon_display_7d8b25" />
              Logout All Devices
            </button>
          </div>
          <div className="crt_adm_profile_toggle_button_8e7c53" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="crt_adm_avatar_circle_5d89e2">
              {profile?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="crt_adm_sidebar_overlay_backdrop_2e7f9c"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="crt_adm_main_content_wrapper_6c37d8">
        {/* Sidebar */}
        <aside className={`crt_adm_sidebar_panel_98e2d5 ${isSidebarOpen ? 'crt_adm_sidebar_active_state_f82d47' : ''}`}>
          <nav className="crt_adm_navigation_menu_5a9c63">
            <button
              className={`crt_adm_nav_menu_button_2d6f74 ${activeComponent === 'dashboard' ? 'crt_adm_nav_active_state_e8d237' : ''}`}
              onClick={() => handleNavigation('dashboard')}
            >
              <Database className="crt_adm_nav_icon_display_7c8d33" />
              Dashboard
            </button>
          
            
            <button
              className={`crt_adm_nav_menu_button_2d6f74 ${activeComponent === 'meetings' ? 'crt_adm_nav_active_state_e8d237' : ''}`}
              onClick={() => handleNavigation('meetings')}
            >
              <Users className="crt_adm_nav_icon_display_7c8d33" />
              Schedule Meetings
            </button>
            
            <button
              className={`crt_adm_nav_menu_button_2d6f74 ${activeComponent === 'usercalendar' ? 'crt_adm_nav_active_state_e8d237' : ''}`}
              onClick={() => handleNavigation('usercalendar')}
            >
              <Calendar className="crt_adm_nav_icon_display_7c8d33" />
              Calendar
            </button>
            <button
              className={`crt_adm_nav_menu_button_2d6f74 ${activeComponent === 'usernoticeboard' ? 'crt_adm_nav_active_state_e8d237' : ''}`}
              onClick={() => handleNavigation('usernoticeboard')}
            >
              <Clipboard className="crt_adm_nav_icon_display_7c8d33" />
              Notice Board
            </button>
            <button
              className={`crt_adm_nav_menu_button_2d6f74 ${activeComponent === 'admincasemanagement' ? 'crt_adm_nav_active_state_e8d237' : ''}`}
              onClick={() => handleNavigation('admincasemanagement')}
            >
              <Clipboard className="crt_adm_nav_icon_display_7c8d33" />
               Handle Cases
            </button>
            <button
              className={`crt_adm_nav_menu_button_2d6f74 ${activeComponent === 'notifications' ? 'crt_adm_nav_active_state_e8d237' : ''}`}
              onClick={() => handleNavigation('notifications')}
            >
              <Info className="crt_adm_nav_icon_display_7c8d33" />
              Notifications
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="crt_adm_main_content_area_4e8d19">
          {renderContent()}
        </main>
      </div>

      

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="crt_adm_profile_overlay_backdrop_6f3d41">
          <div className="crt_adm_profile_modal_container_3a8d21">
            <button
              className="crt_adm_close_profile_button_9c83e7"
              onClick={() => setIsProfileOpen(false)}
            >
              ×
            </button>
            <div className="crt_adm_profile_content_wrapper_b7e920">
              <div className="crt_adm_profile_avatar_large_4e9d25 crt_adm_avatar_size_large_7f3d62">
                {profile?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <h2 className="crt_adm_profile_name_display_8e2d74">{profile?.name || 'Admin User'}</h2>
              <h4 className="crt_adm_profile_id_display_9c7a36">{profile?.admin_id || 'ADM-2025-001'}</h4>
              <p className="crt_adm_profile_email_display_5d6f82">{profile?.contact?.email || 'admin@court.gov'}</p>
              <div className="crt_adm_profile_details_list_8d6e43">
                <div className="crt_adm_detail_item_row_4f7e93">
                  <span className="crt_adm_detail_label_2d7e41">Email:</span>
                  <strong className="crt_adm_detail_value_6e9f35">{profile?.contact?.email || 'admin@court.gov'}</strong>
                </div>
                <div className="crt_adm_detail_item_row_4f7e93">
                  <span className="crt_adm_detail_label_2d7e41">Status:</span>
                  <strong className="crt_adm_detail_value_6e9f35">{profile?.status || 'Active'}</strong>
                </div>
                <div className="crt_adm_detail_item_row_4f7e93">
                  <span className="crt_adm_detail_label_2d7e41">Court:</span>
                  <strong className="crt_adm_detail_value_6e9f35">{profile?.court_name || 'District Court'}</strong>
                </div>
                <div className="crt_adm_detail_item_row_4f7e93">
                  <span className="crt_adm_detail_label_2d7e41">Role:</span>
                  <strong className="crt_adm_detail_value_6e9f35">{profile?.role || 'Administrator'}</strong>
                </div>
                <div className="crt_adm_detail_item_row_4f7e93">
                  <span className="crt_adm_detail_label_2d7e41">Last Login:</span>
                  <strong className="crt_adm_detail_value_6e9f35">
                    {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'April 29, 2025 9:30 AM'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="crt_adm_logout_overlay_backdrop_3f9d27">
          <div className="crt_adm_logout_modal_container_4e7a15">
            <h3 className="crt_adm_logout_modal_title_d9f71e">Confirm Logout from All Devices</h3>
            <p className="crt_adm_logout_modal_text_e83d27">Please enter your password to confirm:</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              placeholder="Enter your password"
              className="crt_adm_password_input_field_9d7e35"
            />
            <div className="crt_adm_logout_actions_group_2d9f15">
              <button onClick={handleLogoutAll} className="crt_adm_confirm_logout_btn_7e8d36">
                Confirm Logout
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutPassword('');
                }}
                className="crt_adm_cancel_logout_btn_3f8d21"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="crt_adm_error_message_display_7d9e32">
          <X className="crt_adm_error_icon_display_6f7d23" />
          {error}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;