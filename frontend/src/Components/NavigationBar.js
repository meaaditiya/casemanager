import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../ComponentsCSS/NavigationBar.css';

const VerticalNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navHistory, setNavHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // Track navigation history
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Only add to history if it's a new path
    if (navHistory[currentIndex] !== currentPath) {
      const newHistory = [...navHistory.slice(0, currentIndex + 1), currentPath];
      setNavHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    }
  }, [location.pathname]);

  const handleBackNavigation = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      navigate(navHistory[currentIndex - 1]);
    }
  };

  const handleForwardNavigation = () => {
    if (currentIndex < navHistory.length - 1) {
      setCurrentIndex(currentIndex + 1);
      navigate(navHistory[currentIndex + 1]);
    }
  };

  const handleHomeNavigation = () => {
    navigate('/');
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="vnav-container">
      <div className="vnav-wrapper">
        <button 
          className="vnav-btn vnav-home-btn"
          onClick={handleHomeNavigation}
          title="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="vnav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </button>
        
        <button 
          className={`vnav-btn vnav-back-btn ${currentIndex <= 0 ? 'vnav-disabled' : ''}`}
          onClick={handleBackNavigation}
          disabled={currentIndex <= 0}
          title="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="vnav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button 
          className={`vnav-btn vnav-forward-btn ${currentIndex >= navHistory.length - 1 ? 'vnav-disabled' : ''}`}
          onClick={handleForwardNavigation}
          disabled={currentIndex >= navHistory.length - 1}
          title="Forward"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="vnav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button 
          className="vnav-btn vnav-refresh-btn"
          onClick={handleRefreshPage}
          title="Refresh"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="vnav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VerticalNavBar;