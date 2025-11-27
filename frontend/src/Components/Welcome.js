import React, { useState, useEffect } from "react";
import { 
  Briefcase, User, Settings, ChevronRight, ChevronDown, 
  Info, Calendar, FileText, Bell, Shield, HelpCircle, Phone, Mail, 
  Linkedin, MapPin, Link as LinkIcon, ArrowRight
} from "lucide-react";
import "../ComponentsCSS/welcome.css";
 
import emblem from "../images/aadiimage4.svg";
import logo from "../images/aadiimage4.png";
import banner1 from "../images/aadiimage9.jpg";
import banner2 from "../images/aadiimage10.jpg";
import banner3 from "../images/aadiimage11.jpg";

const CaseManagement = () => {
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
              <div className="emblem-image">
                <img src={emblem} alt="National Emblem" />
              </div>
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
            <button onClick={() => scrollToSection("system-info")} className="nav-link">System Info</button>
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
              <h3>Court Calendar Integration</h3>
              <p>Automated scheduling and timely reminders for all court proceedings.</p>
            </div>
            <div className="highlight-item">
              <FileText size={32} className="highlight-icon" />
              <h3>Digital Documentation</h3>
              <p>Secure storage and management of all case-related documents.</p>
            </div>
            <div className="highlight-item">
              <Bell size={32} className="highlight-icon" />
              <h3>Real-time Notifications</h3>
              <p>Instant updates on case developments and hearing schedules.</p>
            </div>
            <div className="highlight-item">
              <Shield size={32} className="highlight-icon" />
              <h3>Enterprise Security</h3>
              <p>End-to-end encryption ensuring complete data protection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="modern-portals">
        <div className="section-container">
          <h2 className="section-title">Access Portals</h2>
          <p className="section-subtitle">Choose your portal to get started</p>
          <div className="portal-container">
            <div className="portal-card advocate">
              <Briefcase size={48} className="portal-icon" />
              <h3>Advocate Portal</h3>
              <p>Manage cases, clients, and schedules with comprehensive tools.</p>
              <div className="portal-stats">
                <div className="stat">
                  <span className="stat-number">Faster</span>
                  <span className="stat-label">Case Filing</span>
                </div>
                <div className="stat">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Access</span>
                </div>
              </div>
              <a href="/advocate" className="portal-btn advocate-btn">
                Continue as Advocate
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="portal-card litigant">
              <User size={48} className="portal-icon" />
              <h3>Litigant Portal</h3>
              <p>Track your case progress and access documents anytime.</p>
              <div className="portal-stats">
                <div className="stat">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Transparency</span>
                </div>
                <div className="stat">
                  <span className="stat-number">Real-time</span>
                  <span className="stat-label">Updates</span>
                </div>
              </div>
              <a href="/litigant" className="portal-btn litigant-btn">
                Continue as Litigant
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="portal-card admin">
              <Settings size={48} className="portal-icon" />
              <h3>Court-Room Clerk</h3>
              <p>Manage cases, schedules, and administrative tasks efficiently.</p>
              <div className="portal-stats">
                <div className="stat">
                  <span className="stat-number">Streamlined</span>
                  <span className="stat-label">Workflow</span>
                </div>
                <div className="stat">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Access</span>
                </div>
              </div>
              <a href="/admin" className="portal-btn admin-btn">
                Continue as Court Clerk
                <ArrowRight size={16} />
              </a>
            </div>
            
            <div className="portal-card clerk">
              <Settings size={48} className="portal-icon" />
              <h3>Admin</h3>
              <p>Manage users, system settings, and monitor performance.</p>
              <div className="portal-stats">
                <div className="stat">
                  <span className="stat-number">Complete</span>
                  <span className="stat-label">Control</span>
                </div>
                <div className="stat">
                  <span className="stat-number">99.9%</span>
                  <span className="stat-label">Uptime</span>
                </div>
              </div>
              <a href="/clerk" className="portal-btn clerk-btn">
                Continue as Admin
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="modern-resources">
        <div className="section-container">
          <h2 className="section-title">Judicial Resources</h2>
          <p className="section-subtitle">Access important judicial information and statistics</p>
          <div className="links-container">
            <a href="https://njdg.ecourts.gov.in/njdg_v3/" className="resource-link" target="_blank" rel="noopener noreferrer">
              <LinkIcon size={20} className="link-icon" />
              <div className="link-details">
                <span className="link-title">District Courts Case Statistics</span>
                <span className="link-description">National Judicial Data Grid - District Courts</span>
              </div>
              <ArrowRight size={16} className="link-arrow" />
            </a>
            <a href="https://njdg.ecourts.gov.in/hcnjdg_v2/" className="resource-link" target="_blank" rel="noopener noreferrer">
              <LinkIcon size={20} className="link-icon" />
              <div className="link-details">
                <span className="link-title">High Courts Case Statistics</span>
                <span className="link-description">National Judicial Data Grid - High Courts</span>
              </div>
              <ArrowRight size={16} className="link-arrow" />
            </a>
            <a href="/case-status" className="resource-link">
              <FileText size={20} className="link-icon" />
              <div className="link-details">
                <span className="link-title">Case Status</span>
                <span className="link-description">Check the current status of filed cases</span>
              </div>
              <ArrowRight size={16} className="link-arrow" />
            </a>
            <a href="/court-orders" className="resource-link">
              <FileText size={20} className="link-icon" />
              <div className="link-details">
                <span className="link-title">Court Orders & Judgments</span>
                <span className="link-description">Access court judgments and orders</span>
              </div>
              <ArrowRight size={16} className="link-arrow" />
            </a>
          </div>
        </div>
      </section>

      {/* System Info Section */}
      <section id="system-info" className="modern-system-info">
        <div className="section-container">
          <div className="system-info">
            <div className="info-header">
              <Info size={24} />
              <h2>System Information</h2>
            </div>
            <div className="info-content">
              <div className="info-item">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">April 25, 2025</span>
              </div>
              <div className="info-item">
                <span className="info-label">Version:</span>
                <span className="info-value">3.5.2</span>
              </div>
              <div className="info-item">
                <span className="info-label">Browser Support:</span>
                <span className="info-value">All modern browsers (Chrome, Firefox, Safari, Edge)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Device Compatibility:</span>
                <span className="info-value">Desktop, Tablet, and Mobile devices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <div className="emblem-image">
                <img src={emblem} alt="National Emblem" />
              </div>
              <h3>Case Management System</h3>
            </div>
            <p className="footer-description">
              Empowering justice delivery through innovative technology solutions.
            </p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <button onClick={() => scrollToSection("about")} className="footer-link">About</button>
              <button onClick={() => scrollToSection("portals")} className="footer-link">Portals</button>
              <button onClick={() => scrollToSection("resources")} className="footer-link">Resources</button>
              <button onClick={() => scrollToSection("system-info")} className="footer-link">System Info</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2025 Case Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CaseManagement;