import React, { useState, useEffect } from "react";
import { Briefcase, User, Settings, BookOpen, ChevronRight, ChevronDown, Info, Calendar, FileText, Bell, Shield, HelpCircle, Phone, Mail, Linkedin, MapPin, Link as LinkIcon } from "lucide-react";
import "../ComponentsCSS/welcome.css";
import aadiImage from "../images/aadiimage2.jpg";
import ankitImage from "../images/aadiimage5.png";
import akshatImage from "../images/aadiimage6.jpg";
import akashImage from "../images/aadiimage7.png";
// Make sure react-router-dom is properly installed
import { Link } from "react-router-dom";

const CaseManagement = () => {
  // Text-only automatic running text slider content
  const [sliderText, setSliderText] = useState(0);
  const sliderTexts = [
    "Streamline Your Legal Workflows", "Track, Manage, and Resolve Cases with Ease", "Your Smart Partner in Legal Case Management", "Secure. Efficient. Powerful Case Handling", "One Portal. Total Control Over Every Case", "From Filing to Resolution — Simplified", "Organize Better. Work Smarter", "Modern Case Management for Modern Teams", "Say Goodbye to Manual Case Tracking", "Legal Management Made Effortless", "Centralized Case Data at Your Fingertips", "Automate Your Case Progression", "Real-Time Collaboration for Legal Teams", "Smart Notifications. Zero Missed Deadlines", "Empowering Legal Professionals with Technology"
  ];
  
  // Auto-rotate text banner without buttons
  useEffect(() => {
    const interval = setInterval(() => {
      setSliderText((prev) => (prev + 1) % sliderTexts.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // User manual accordion state
  const [showManual, setShowManual] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  
  // State for showing/hiding contact section
  const [showContact, setShowContact] = useState(false);
  
  const toggleManual = () => {
    setShowManual(!showManual);
  };
  
  const toggleContact = () => {
    setShowContact(!showContact);
  };
  
  const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };
  
  // If you're having Link-related issues and just need a temporary fix,
  // you can create a simple Link alternative
  const CustomLink = ({ to, className, children }) => (
    <a href={to} className={className}>{children}</a>
  );
  
  return (
    <div className="case-management">
      {/* Header with logo similar to the image */}
      <header className="e-filing-header">
        <div className="header-container">
          <div className="logo-section">
            <div className="emblem-logo">
              {/* Emblem of India placeholder */}
              <div className="emblem-image"></div>
            </div>
            <div className="justice-logo">
              {/* Justice logo placeholder */}
              <div className="justice-image"></div>
            </div>
            <div className="header-title">
              <h1>E-portal for Facilitating Case Management</h1>
              <p>Electronic filing of cases in the court and management</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Simple Text-only Slider */}
      <div className="text-only-slider">
        <p>{sliderTexts[sliderText]}</p>
      </div>
      
      <div className="content">
        <h1 className="title">About Case Management System</h1>
        <p className="subtitle">Your Legal Assistant - Streamlining Justice Delivery</p>
        
        {/* System highlights */}
        <div className="system-highlights">
          <div className="highlight-item">
            <Calendar size={24} className="highlight-icon" />
            <div className="highlight-text">
              <h4>Court Calendar Integration</h4>
              <p>Automated scheduling and reminders</p>
            </div>
          </div>
          <div className="highlight-item">
            <FileText size={24} className="highlight-icon" />
            <div className="highlight-text">
              <h4>Digital Documentation</h4>
              <p>Secure document storage and management</p>
            </div>
          </div>
          <div className="highlight-item">
            <Bell size={24} className="highlight-icon" />
            <div className="highlight-text">
              <h4>Real-time Notifications</h4>
              <p>Stay updated on case developments</p>
            </div>
          </div>
          <div className="highlight-item">
            <Shield size={24} className="highlight-icon" />
            <div className="highlight-text">
              <h4>Enterprise Security</h4>
              <p>End-to-end encryption for all data</p>
            </div>
          </div>
        </div>
        
        <div className="portal-container">
          {/* Advocate Portal */}
          <div className="portal advocate">
            <div className="icon">
              <Briefcase size={40} color="#1d4ed8" />
            </div>
            <h3>Advocate Portal</h3>
            <p>Manage cases, client details, and court schedules. Access document filing system and track hearing dates.</p>
            <div className="portal-stats">
              <div className="stat">
                <span className="stat-number">98%</span>
                <span className="stat-label">Faster filing</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Access</span>
              </div>
            </div>
            <CustomLink to="/advocate" className="login-btn advocate-btn">Continue as Advocate</CustomLink>
          </div>
          
          {/* Litigant Portal */}
          <div className="portal litigant">
            <div className="icon">
              <User size={40} color="#15803d" />
            </div>
            <h3>Litigant Portal</h3>
            <p>Track case progress, access documents, schedules and receive notifications for upcoming hearings.</p>
            <div className="portal-stats">
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Transparency</span>
              </div>
              <div className="stat">
                <span className="stat-number">80%</span>
                <span className="stat-label">Time saved</span>
              </div>
            </div>
            <CustomLink to="/litigant" className="login-btn litigant-btn">Continue as Litigant</CustomLink>
          </div>
          
          {/* Admin Portal */}
          <div className="portal admin">
            <div className="icon">
              <Settings size={40} color="#d97706" />
            </div>
            <h3>Admin Portal</h3>
            <p>Manage system users, monitor system performance, and handle administrative tasks for the platform.</p>
            <div className="portal-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Users</span>
              </div>
              <div className="stat">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>
            <CustomLink to="/clerk" className="login-btn admin-btn">Continue as Admin</CustomLink>
          </div>
        </div>
        
        {/* Additional Links Section */}
        <div className="additional-links-section">
          <h3 className="links-title">Judicial Data & Resources</h3>
          <div className="links-container">
            <a href="https://njdg.ecourts.gov.in/njdg_v3/" className="resource-link" target="_blank" rel="noopener noreferrer">
              <LinkIcon size={18} className="link-icon" />
              <div className="link-details">
                <span className="link-title">District Courts Case Statistics</span>
                <span className="link-description">National Judicial Data Grid - District Courts</span>
              </div>
            </a>
            
            <a href="https://njdg.ecourts.gov.in/hcnjdg_v2/" className="resource-link" target="_blank" rel="noopener noreferrer">
              <LinkIcon size={18} className="link-icon" />
              <div className="link-details">
                <span className="link-title">High Courts Case Statistics</span>
                <span className="link-description">National Judicial Data Grid - High Courts</span>
              </div>
            </a>
            
            <a href="#" className="resource-link" target="_blank" rel="noopener noreferrer">
              <LinkIcon size={18} className="link-icon" />
              <div className="link-details">
                <span className="link-title">Case Status</span>
                <span className="link-description">Check status of filed cases</span>
              </div>
            </a>
            
            <a href="#" className="resource-link" target="_blank" rel="noopener noreferrer">
              <LinkIcon size={18} className="link-icon" />
              <div className="link-details">
                <span className="link-title">Court Orders</span>
                <span className="link-description">Access court judgments and orders</span>
              </div>
            </a>
          </div>
        </div>
        
        {/* System information panel */}
        <div className="system-info">
          <div className="info-header">
            <Info size={20} />
            <h3>System Information</h3>
          </div>
          <div className="info-content">
            <p>Last updated: April 10, 2025</p>
            <p>Version: 3.5.2</p>
            <p>Supports all modern browsers</p>
            <p>Compatible with mobile devices</p>
          </div>
        </div>
        
        {/* Integrated User Manual */}
        <div className="user-manual-section">
          <div className="manual-header" onClick={toggleManual}>
            <div className="manual-title">
              <BookOpen size={20} />
              <h3>User Manual</h3>
            </div>
            <button className="toggle-button">
              {showManual ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
          
          {showManual && (
            <div className="manual-content">
              <div className="manual-intro">
                <h4>Welcome to the Case Management System</h4>
                <p>This user manual provides guidance on using the different portals and features of the system.</p>
              </div>
              
              <div className="manual-navigation">
                <div className={`manual-section ${activeSection === 'getting-started' ? 'active' : ''}`}>
                  <div className="section-header" onClick={() => toggleSection('getting-started')}>
                    <h5>Getting Started</h5>
                    {activeSection === 'getting-started' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  {activeSection === 'getting-started' && (
                    <div className="section-content">
                      <h6>System Requirements</h6>
                      <ul>
                        <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                        <li>Internet connection</li>
                        <li>Screen resolution of 1280×720 or higher (recommended)</li>
                      </ul>
                      
                      <h6>Accessing the System</h6>
                      <ol>
                        <li>Navigate to the Case Management System URL</li>
                        <li>Choose the appropriate portal based on your role</li>
                        <li>Login with your credentials or register if you are a new user</li>
                      </ol>
                    </div>
                  )}
                </div>
                
                <div className={`manual-section ${activeSection === 'advocate' ? 'active' : ''}`}>
                  <div className="section-header" onClick={() => toggleSection('advocate')}>
                    <h5>Advocate Portal Guide</h5>
                    {activeSection === 'advocate' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  {activeSection === 'advocate' && (
                    <div className="section-content">
                      <h6>Dashboard Overview</h6>
                      <p>The advocate dashboard provides quick access to:</p>
                      <ul>
                        <li>Active cases</li>
                        <li>Upcoming hearings</li>
                        <li>Client requests</li>
                        <li>Document status</li>
                      </ul>
                      
                      <h6>Managing Cases</h6>
                      <p><strong>Creating a New Case:</strong> Click "New Case" button, fill in required details, upload documents, associate client information, and submit for review.</p>
                      
                      <p><strong>Document Management:</strong> Upload documents in supported formats (.pdf, .docx, .jpg), create document collections, share with clients, and request digital signatures.</p>
                    </div>
                  )}
                </div>
                
                <div className={`manual-section ${activeSection === 'litigant' ? 'active' : ''}`}>
                  <div className="section-header" onClick={() => toggleSection('litigant')}>
                    <h5>Litigant Portal Guide</h5>
                    {activeSection === 'litigant' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  {activeSection === 'litigant' && (
                    <div className="section-content">
                      <h6>Case Information</h6>
                      <p>View current status and history, access filed documents, review court decisions, and track upcoming dates.</p>
                      
                      <h6>Document Access</h6>
                      <p>View documents shared by your advocate, download copies for your records, upload requested documents, and sign documents electronically when required.</p>
                      
                      <h6>Communication</h6>
                      <p>Message your advocate directly, request meetings or calls, receive important notifications, and set communication preferences.</p>
                    </div>
                  )}
                </div>
                
                <div className={`manual-section ${activeSection === 'admin' ? 'active' : ''}`}>
                  <div className="section-header" onClick={() => toggleSection('admin')}>
                    <h5>Admin Portal Guide</h5>
                    {activeSection === 'admin' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  {activeSection === 'admin' && (
                    <div className="section-content">
                      <h6>User Administration</h6>
                      <p>Create new user accounts, manage user roles and permissions, reset passwords, and deactivate accounts.</p>
                      
                      <h6>System Monitoring</h6>
                      <p>View system performance metrics, generate usage reports, monitor storage utilization, and track activity logs.</p>
                    </div>
                  )}
                </div>
                
                <div className={`manual-section ${activeSection === 'troubleshooting' ? 'active' : ''}`}>
                  <div className="section-header" onClick={() => toggleSection('troubleshooting')}>
                    <h5>Troubleshooting</h5>
                    {activeSection === 'troubleshooting' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  {activeSection === 'troubleshooting' && (
                    <div className="section-content">
                      <h6>Login Problems</h6>
                      <p>Verify username and password, clear browser cache and cookies, use the "Forgot Password" option if needed, or contact system administrator if issues persist.</p>
                      
                      <h6>Document Upload Errors</h6>
                      <p>Ensure file is in supported format, check file size (maximum 25MB per file), verify internet connection, or try uploading in smaller batches.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="manual-support">
                <HelpCircle size={16} />
                <p>Need additional help? Contact support at <strong>support@casemanagement.com</strong></p>
              </div>
            </div>
          )}
        </div>
        
        {/* Contact button to show developer info */}
        <div className="contact-button-container">
          <button className="contact-toggle-btn" onClick={toggleContact}>
            {showContact ? "Developed By" : "Developed By"}
          </button>
        </div>
        
        {/* Contact Section - Hidden by default */}
        {showContact && (
          <div className="contact-section">
            <h2 className="contact-title">Proudly Developed By </h2>
            <p className="contact-subtitle">We're here to help with any questions about the Case Management System</p>
            
            <div className="developer-profile">
              <div className="profile-image-container">
                <img src={aadiImage} alt="Aaditiya Tyagi" className="profile-image" />
              </div>
              
              <div className="developer-info">
                <h3>Aaditiya Tyagi</h3>
                <p className="developer-role">Lead Developer & Project Manager</p>
                
                <div className="contact-details">
                  <div className="contact-item">
                    <Phone size={18} className="contact-icon" />
                    <span>+91 7351102026</span>
                  </div>
                  
                  <div className="contact-item">
                    <Mail size={18} className="contact-icon" />
                    <span>aaditiyatyagi123@gmail.com</span>
                  </div>
                  
                  <div className="contact-item">
                    <MapPin size={18} className="contact-icon" />
                    <span>New Delhi, India</span>
                  </div>
                </div>
                
                <div className="social-links">
                  <a href="https://linkedin.com/in/aaditiyatyagi" className="social-link" target="_blank" rel="noopener noreferrer">
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="team-section">
              <h3>Development Team</h3>
              <div className="team-members">
                <div className="team-member">
                  <div className="member-image">
                    <img src={aadiImage} alt="Aaditiya Tyagi" className="team-profile-image" />
                  </div>
                  <span className="member-name">Aaditiya Tyagi</span>
                  <span className="member-role">Frontend Developer</span>
                </div>
                <div className="team-member">
                  <div className="member-image">
                    <img src={akashImage} alt="Akash Tiwari" className="team-profile-image" />
                  </div>
                  <span className="member-name">Akash Tiwari</span>
                  <span className="member-role">Backend Engineer</span>
                </div>
                <div className="team-member">
                  <div className="member-image">
                    <img src={ankitImage} alt="Ankit Chaudhary" className="team-profile-image" />
                  </div>
                  <span className="member-name">Ankit Chaudhary</span>
                  <span className="member-role">Tester</span>
                </div>
                <div className="team-member">
                  <div className="member-image">
                    <img src={akshatImage} alt="Akshat Jain" className="team-profile-image" />
                  </div>
                  <span className="member-name">Akshat Jain</span>
                  <span className="member-role">Designer</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed Footer */}
      <footer className="footer">
        <p>© 2025 Case Management System</p>
      </footer>
    </div>
  );
};

export default CaseManagement;