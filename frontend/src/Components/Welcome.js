import React, { useState, useEffect } from "react";
import { Briefcase, User, Settings, BookOpen, ChevronRight, ChevronDown, Info, Calendar, FileText, Bell, Shield, HelpCircle, Phone, Mail, Linkedin, MapPin, Link as LinkIcon } from "lucide-react";
import "../ComponentsCSS/welcome.css";
import aadiImage from "../images/aadiimage2.jpg";
import ankitImage from "../images/aadiimage5.png";
import akshatImage from "../images/aadiimage6.jpg";
import akashImage from "../images/aadiimage7.png";
import banner1 from "../images/aadiimage9.jpg"; // Placeholder for banner images
import banner2 from "../images/aadiimage10.jpg";
import banner3 from "../images/aadiimage11.jpg";
import emblem from "../images/aadiimage4.svg";
import logo from "../images/aadiimage4.png";

const CaseManagement = () => {
  // Sliding banner state
  const [sliderIndex, setSliderIndex] = useState(0);
  const banners = [
    { image: banner1, text: "Streamline Your Legal Workflows" },
    { image: banner2, text: "Track, Manage, and Resolve Cases with Ease" },
    { image: banner3, text: "Your Smart Partner in Legal Case Management" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // User manual and contact states
  const [showManual, setShowManual] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showContact, setShowContact] = useState(false);

  const toggleManual = () => setShowManual(!showManual);
  const toggleContact = () => setShowContact(!showContact);
  const toggleSection = (section) => setActiveSection(activeSection === section ? null : section);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="case-management">
      {/* Header */}
      <header className="e-filing-header">
        <div className="header-container">
          <div className="logo-section">
            <div className="emblem-logo">
              <div className="emblem-image"><img src={emblem} alt="Aaditiya Tyagi" ></img></div>
            </div>
            <div className="justice-logo">
              <div className="justice-image"><img src={logo} alt="Aaditiya Tyagi" ></img></div>
            </div>
            <div className="header-title">
              <h1>E-Portal for Case Management</h1>
              <p>Simplifying Justice Delivery with Technology</p>
            </div>
          </div>
          <nav className="header-nav">
            <button onClick={() => scrollToSection("home")} className="nav-link">Home</button>
            <button onClick={() => scrollToSection("about")} className="nav-link">About</button>
            <button onClick={() => scrollToSection("portals")} className="nav-link">Portals</button>
            <button onClick={() => scrollToSection("resources")} className="nav-link">Resources</button>
            <button onClick={() => scrollToSection("guide")} className="nav-link">Guide</button>
            <button onClick={() => scrollToSection("contact")} className="nav-link">Contact</button>
          </nav>
        </div>
      </header>

      {/* Sliding Banner */}
      <section id="home" className="banner-section">
        <div className="banner-slider">
          {banners.map((banner, index) => (
            <div
              key={index}
              className={`banner-item ${index === sliderIndex ? "active" : ""}`}
              style={{ backgroundImage: `url(${banner.image})` }}
            >
              <div className="banner-content">
                <h2 className="banner-text">{banner.text}</h2>
                <a href={banner.link} className="banner-cta">{banner.cta}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <h2 className="section-title">About Case Management System</h2>
        <p className="section-subtitle">Your trusted partner in streamlining justice delivery.</p>
        <div className="system-highlights">
          <div className="highlight-item">
            <Calendar size={32} className="highlight-icon" />
            <h4>Court Calendar Integration</h4>
            <p>Automated scheduling and timely reminders.</p>
          </div>
          <div className="highlight-item">
            <FileText size={32} className="highlight-icon" />
            <h4>Digital Documentation</h4>
            <p>Secure storage and management of case documents.</p>
          </div>
          <div className="highlight-item">
            <Bell size={32} className="highlight-icon" />
            <h4>Real-time Notifications</h4>
            <p>Instant updates on case developments.</p>
          </div>
          <div className="highlight-item">
            <Shield size={32} className="highlight-icon" />
            <h4>Enterprise Security</h4>
            <p>End-to-end encryption for all data.</p>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="portals-section">
        <h2 className="section-title">Our Portals</h2>
        <div className="portal-container">
          <div className="portal-card advocate">
            <Briefcase size={48} color="#3b82f6" />
            <h3>Advocate Portal</h3>
            <p>Manage cases, clients, and schedules efficiently.</p>
            <div className="portal-stats">
              <div className="stat">
                <span className="stat-number">98%</span>
                <span className="stat-label">Faster Filing</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Access</span>
              </div>
            </div>
            <a href="/advocate" className="portal-btn advocate-btn">Continue as Advocate</a>
          </div>
          <div className="portal-card litigant">
            <User size={48} color="#10b981" />
            <h3>Litigant Portal</h3>
            <p>Track case progress and access documents.</p>
            <div className="portal-stats">
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Transparency</span>
              </div>
              <div className="stat">
                <span className="stat-number">80%</span>
                <span className="stat-label">Time Saved</span>
              </div>
            </div>
            <a href="/litigant" className="portal-btn litigant-btn">Continue as Litigant</a>
          </div>
          <div className="portal-card admin">
            <Settings size={48} color="#f59e0b" />
            <h3>Admin Portal</h3>
            <p>Manage users and system performance.</p>
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
            <a href="/clerk" className="portal-btn advocate-btn">Continue as Admin</a>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="resources-section">
        <h2 className="section-title">Judicial Resources</h2>
        <div className="links-container">
          <a href="https://njdg.ecourts.gov.in/njdg_v3/" className="resource-link" target="_blank" rel="noopener noreferrer">
            <LinkIcon size={20} className="link-icon" />
            <div className="link-details">
              <span className="link-title">District Courts Case Statistics</span>
              <span className="link-description">National Judicial Data Grid - District Courts</span>
            </div>
          </a>
          <a href="https://njdg.ecourts.gov.in/hcnjdg_v2/" className="resource-link" target="_blank" rel="noopener noreferrer">
            <LinkIcon size={20} className="link-icon" />
            <div className="link-details">
              <span className="link-title">High Courts Case Statistics</span>
              <span className="link-description">National Judicial Data Grid - High Courts</span>
            </div>
          </a>
          <a href="/case-status" className="resource-link" target="_blank" rel="noopener noreferrer">
            <LinkIcon size={20} className="link-icon" />
            <div className="link-details">
              <span className="link-title">Case Status</span>
              <span className="link-description">Check status of filed cases</span>
            </div>
          </a>
          <a href="/court-orders" className="resource-link" target="_blank" rel="noopener noreferrer">
            <LinkIcon size={20} className="link-icon" />
            <div className="link-details">
              <span className="link-title">Court Orders</span>
              <span className="link-description">Access court judgments and orders</span>
            </div>
          </a>
        </div>
      </section>

      {/* System Info Section */}
      <section className="system-info-section">
        <div className="system-info">
          <div className="info-header">
            <Info size={24} />
            <h3>System Information</h3>
          </div>
          <div className="info-content">
            <p>Last updated: April 25, 2025</p>
            <p>Version: 3.5.2</p>
            <p>Supports all modern browsers</p>
            <p>Compatible with mobile devices</p>
          </div>
        </div>
      </section>

      {/* User Manual Section */}
      <section id="guide" className="manual-section">
        <div className="manual-header" onClick={toggleManual}>
          <div className="manual-title">
            <BookOpen size={24} />
            <h3>User Manual</h3>
          </div>
          <button className="toggle-button" onClick={toggleManual}>
            {showManual ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>
        {showManual && (
          <div className="manual-content">
            <div className="manual-intro">
              <h4>Welcome to the Case Management System</h4>
              <p>Comprehensive guide to using our portals and features.</p>
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
                      <li>Stable internet connection</li>
                      <li>Screen resolution of 1280×720 or higher</li>
                    </ul>
                    <h6>Accessing the System</h6>
                    <ol>
                      <li>Navigate to the Case Management System URL</li>
                      <li>Choose your portal (Advocate, Litigant, Admin)</li>
                      <li>Login or register as a new user</li>
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
                    <ul>
                      <li>Active cases</li>
                      <li>Upcoming hearings</li>
                      <li>Client requests</li>
                      <li>Document status</li>
                    </ul>
                    <h6>Managing Cases</h6>
                    <p>Create new cases, upload documents, and track progress.</p>
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
                    <p>View status, access documents, and track hearings.</p>
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
                    <p>Manage accounts, roles, and permissions.</p>
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
                    <p>Verify credentials, clear cache, or contact support.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="manual-support">
              <HelpCircle size={16} />
              <p>Contact support at <strong>support@casemanagement.com</strong></p>
            </div>
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-button-container">
          <button className="contact-toggle-btn" onClick={toggleContact}>
            {showContact ? "Hide Team Details" : "Meet Our Team"}
          </button>
        </div>
        {showContact && (
          <div className="contact-content">
            <h2 className="section-title">Proudly Developed By</h2>
            <p className="section-subtitle">Our dedicated team is here to support you.</p>
            <div className="developer-profile">
              <img src={aadiImage} alt="Aaditiya Tyagi" className="profile-image" />
              <div className="developer-info">
                <h3>Aaditiya Tyagi</h3>
                <p className="developer-role">Lead Developer & Project Manager</p>
                <div className="contact-details">
                  <div className="contact-item">
                    <Phone size={20} className="contact-icon" />
                    <span>+91 7351102026</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={20} className="contact-icon" />
                    <span>aaditiyatyagi123@gmail.com</span>
                  </div>
                  <div className="contact-item">
                    <MapPin size={20} className="contact-icon" />
                    <span>New Delhi, India</span>
                  </div>
                  <div className="contact-item">
                    <Linkedin size={20} className="contact-icon" />
                    <a href="https://linkedin.com/in/aaditiyatyagi" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="team-section">
              <h3>Development Team</h3>
              <div className="team-members">
                <div className="team-member">
                  <img src={aadiImage} alt="Aaditiya Tyagi" className="team-profile-image" />
                  <span className="member-name">Aaditiya Tyagi</span>
                  <span className="member-role">Frontend Developer</span>
                </div>
                <div className="team-member">
                  <img src={akashImage} alt="Akash Tiwari" className="team-profile-image" />
                  <span className="member-name">Akash Tiwari</span>
                  <span className="member-role">Backend Engineer</span>
                </div>
                <div className="team-member">
                  <img src={ankitImage} alt="Ankit Chaudhary" className="team-profile-image" />
                  <span className="member-name">Ankit Chaudhary</span>
                  <span className="member-role">Tester</span>
                </div>
                <div className="team-member">
                  <img src={akshatImage} alt="Akshat Jain" className="team-profile-image" />
                  <span className="member-name">Akshat Jain</span>
                  <span className="member-role">Designer</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="emblem-image"></div>
            <p>Case Management System</p>
          </div>
          <div className="footer-links">
            <button onClick={() => scrollToSection("about")} className="footer-link">About</button>
            <button onClick={() => scrollToSection("resources")} className="footer-link">Resources</button>
            <button onClick={() => scrollToSection("guide")} className="footer-link">Guide</button>
            <button onClick={() => scrollToSection("contact")} className="footer-link">Contact</button>
          </div>
        </div>
        <p className="footer-copy">© 2025 Case Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CaseManagement;