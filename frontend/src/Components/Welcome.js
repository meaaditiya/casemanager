import React, { useState, useEffect } from "react";
import { 
  Briefcase, User, Settings, BookOpen, ChevronRight, ChevronDown, 
  Info, Calendar, FileText, Bell, Shield, HelpCircle, Phone, Mail, 
  Linkedin, MapPin, Link as LinkIcon, ArrowRight
} from "lucide-react";
import "../ComponentsCSS/welcome.css";
 
import emblem from "../images/aadiimage4.svg";
import logo from "../images/aadiimage4.png";
import aadiImage from "../images/aadiimage2.jpg";
import ankitImage from "../images/aadiimage5.png";
import akshatImage from "../images/aadiimage6.jpg";
import akashImage from "../images/aadiimage7.png";
import banner1 from "../images/aadiimage9.jpg";
import banner2 from "../images/aadiimage10.jpg";
import banner3 from "../images/aadiimage11.jpg";

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
      <header className="modern-header">
        <div className="header-container">
          <div className="logo-section">
            <div className="emblem-logo">
              <div className="emblem-image"><img src={emblem} alt="Emblem" /></div>
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

      {/* Hero Section */}
      <section id="home" className="modern-hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1>The platform for <span className="highlight">modern</span> case management</h1>
            <p>Centralize your legal workflows, documents, and case tracking in one powerful system.</p>
            <div className="hero-buttons">
              <a href="#portals" className="button primary">
                Get Started
                <ArrowRight size={18} className="button-icon" />
              </a>
              <a href="#about" className="button secondary">Learn More</a>
            </div>
          </div>
          <div className="hero-banner">
            {banners.map((banner, index) => (
              <div
                key={index}
                className={`banner-item ${index === sliderIndex ? "active" : ""}`}
                style={{ backgroundImage: `url(${banner.image})` }}
              >
                <div className="banner-overlay">
                  <h2>{banner.text}</h2>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-decoration"></div>
      </section>

      {/* About Section */}
      <section id="about" className="modern-about">
        <div className="section-container">
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
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="modern-portals">
        <div className="section-container">
          <h2 className="section-title">Our Portals</h2>
          <div className="portal-container">
            <div className="portal-card advocate">
              <Briefcase size={48} className="portal-icon" />
              <h3>Advocate Portal</h3>
              <p>Manage cases, clients, and schedules.</p>
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
              <User size={48} className="portal-icon" />
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
              <Settings size={48} className="portal-icon" />
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
            
            <div className="portal-card advocate">
              <Briefcase size={48} className="portal-icon" />
              <h3>Court Clerk</h3>
              <p>Manage cases and schedules.</p>
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
              <a href="/admin" className="portal-btn advocate-btn">Continue as Court Clerk</a>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="modern-resources">
        <div className="section-container">
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
        </div>
      </section>

      {/* System Info Section */}
      <section className="modern-system-info">
        <div className="section-container">
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
        </div>
      </section>

      {/* User Manual Section */}
      <section id="guide" className="modern-manual">
        <div className="section-container">
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
                {/* Other sections remain the same */}
              </div>
              <div className="manual-support">
                <HelpCircle size={16} />
                <p>Contact support at <strong>support@casemanagement.com</strong></p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="modern-contact">
        <div className="section-container">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="emblem-image"><img src={emblem} alt="Emblem" /></div>
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