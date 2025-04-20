import React from "react";
import { Link } from "react-router-dom";
import "../ComponentsCSS/Advocate.css"; // Updated CSS file name

const AuthPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome</h2>
        <p className="subtext">Please login or register to continue</p>
        <div className="auth-buttons">
          <Link to="/litilogin" className="auth-button login">Login</Link>
          <Link to="/litiregister" className="auth-button register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
