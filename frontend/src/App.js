import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
import NavigationBar from './Components/NavigationBar'; // Import the new navigation component
import LegalAssistantChatbot from './Components/LegalAssistantChatbot';
import AdminLogin from './Components/AdminLogin';
function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation Bar will appear on all routes */}
        <NavigationBar />
        
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
          <Route path="/noticeboard" element= {<NoticeBoard/>}/>
  
          <Route path = "/noticelist" element = {<NoticeList/>}/>


          <Route path = "/usercalendar" element = {<UserCalendarPanel/>}/>
          <Route path = "/videopleading" element = {<Videoplead/>}/>
          <Route path = "/uploadvideoplead" element = {<UploadVideoplead/>}/>

          <Route path = "/litigantmeeting" element = {<Litigantmeeting/>}/>
          <Route path ="/litigantcaseassign" element ={<Litigantcaseassign/>}/>
          <Route path ="/advocatecaseassign" element ={<Advocatecaseassign/>}/>
          <Route path ="/advocatefilecase" element ={<Advocatefilecase/>}/>
          <Route path ="/advocatemeeting" element ={<Advocatemeeting/>}/>
          <Route path ="chatbot" element={<LegalAssistantChatbot/>}/>
          <Route path ="/admin" element= {<Admin/>}/>
          <Route path="/adminlogin" element={<AdminLogin/>} />
          <Route path ="/admindash" element ={<AdminDashboard/>}/>
          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;