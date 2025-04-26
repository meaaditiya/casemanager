import React from "react";
import { Link } from "react-router-dom";
import "../ComponentsCSS/AuthPage.css";

const ClerkAuthPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <img
          src="../images/aadiimage4.svg"
          alt="Official Logo"
          className="auth-logo"
        />
        <h2>Welcome</h2>
        <p className="auth-subtext">Please login or register to continue</p>
        <div className="auth-buttons">
          <Link to="/clerklogin" className="auth-button auth-login">
            Login
          </Link>
          <Link to="/clerkregister" className="auth-button auth-register">
            Register
          </Link>
        </div>
        <div className="auth-secured">
          <svg
            className="auth-lock-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Secured Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default ClerkAuthPage;