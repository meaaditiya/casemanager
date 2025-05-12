import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/Chatbot.css';
import { Send } from "lucide-react";

const LegalAssistantChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      content: 'Hello! I am your legal assistant. How can I help you today?',
      options: [
        { text: 'Create new case', value: 'create_case' },
        { text: 'Find hearing details', value: 'find_hearing' },
        { text: 'Find documents', value: 'find_documents' },
        { text: 'Check calendar', value: 'check_calendar' },
        { text: 'Find meeting link', value: 'find_meeting' },
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);
  const [flowData, setFlowData] = useState({});
  
  // For finding hearings and documents
  const [caseNumber, setCaseNumber] = useState('');
  const [hearings, setHearings] = useState([]);
  
  // For calendar
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [calendarData, setCalendarData] = useState(null);
  
  // For finding documents
  const [documents, setDocuments] = useState([]);
  const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');
  
  // For meeting links
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [emailForOTP, setEmailForOTP] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // For case filing
  const [caseFormData, setCaseFormData] = useState({
    court: 'District & Sessions Court',
    case_type: 'Civil',
    plaintiff_details: {
      name: '',
      father_mother_husband: '',
      address: '',
      pin: '',
      sex: 'Male',
      age: '',
      caste: '',
      nationality: 'Indian',
      if_other_mention: '',
      occupation: '',
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      subject: '',
      advocate_id: '',
      advocate: ''
    },
    respondent_details: {
      party_id: '',
      name: '',
      father_mother_husband: '',
      address: '',
      pin: '',
      sex: 'Male',
      age: '',
      caste: '',
      nationality: 'Indian',
      if_other_mention: '',
      occupation: '',
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      subject: '',
      advocate_id: '',
      advocate: ''
    },
    police_station_details: {
      police_station: '',
      fir_no: '',
      fir_year: '',
      date_of_offence: ''
    },
    lower_court_details: {
      court_name: '',
      case_no: '',
      decision_date: ''
    },
    main_matter_details: {
      case_type: '',
      case_no: '',
      year: new Date().getFullYear()
    },
    hearings: [],
    status: 'Pending',
    case_approved: false
  });
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionValue) => {
    // Find the option text based on the value
    let optionText = '';
    
    // Look for the option in the last message first
    const lastMessageOptions = messages[messages.length - 1].options;
    if (lastMessageOptions) {
      const option = lastMessageOptions.find(opt => opt.value === optionValue);
      if (option) {
        optionText = option.text;
      }
    }
    
    // If not found in the last message, search through all messages
    if (!optionText) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].options) {
          const option = messages[i].options.find(opt => opt.value === optionValue);
          if (option) {
            optionText = option.text;
            break;
          }
        }
      }
    }
    
    // Add the selected option as a user message
    if (optionText) {
      addMessage('user', optionText);
    } else {
      // Fallback in case we can't find the option text
      addMessage('user', optionValue);
    }
    
    // Set active flow and handle the option selection
    switch (optionValue) {
      case 'create_case':
        setActiveFlow('create_case');
        startCreateCaseFlow();
        break;
      case 'find_hearing':
        setActiveFlow('find_hearing');
        startFindHearingFlow();
        break;
      case 'find_documents':
        setActiveFlow('find_documents');
        startFindDocumentsFlow();
        break;
      case 'check_calendar':
        setActiveFlow('check_calendar');
        startCheckCalendarFlow();
        break;
      case 'find_meeting':
        setActiveFlow('find_meeting');
        startFindMeetingFlow();
        break;
      case 'main_menu':
        resetToMainMenu();
        break;
      case 'civil':
        handleCaseTypeSelection('Civil');
        break;
      case 'criminal':
        handleCaseTypeSelection('Criminal');
        break;
      case 'submit_case':
        handleCaseSubmission();
        break;
      default:
        addMessage('bot', 'I\'m not sure how to help with that. Please select one of the options.', [
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
    }
  };

  const addMessage = (type, content, options = []) => {
    setMessages(prev => [...prev, { type, content, options }]);
  };

  const addThinkingMessage = () => {
    setMessages(prev => [...prev, { type: 'thinking' }]);
    setIsProcessing(true);
  };

  const removeThinkingMessage = () => {
    setMessages(prev => prev.filter(msg => msg.type !== 'thinking'));
    setIsProcessing(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    
    // Add user message
    addMessage('user', inputValue);
    
    // Handle input based on active flow
    if (activeFlow) {
      switch (activeFlow) {
        case 'create_case':
          handleCreateCaseInput(inputValue);
          break;
        case 'find_hearing':
          handleFindHearingInput(inputValue);
          break;
        case 'find_documents':
          handleFindDocumentsInput(inputValue);
          break;
        case 'check_calendar':
          handleCheckCalendarInput(inputValue);
          break;
        case 'find_meeting':
          handleFindMeetingInput(inputValue);
          break;
        default:
          handleDefaultInput(inputValue);
      }
    } else {
      handleDefaultInput(inputValue);
    }
    
    setInputValue('');
  };

  const handleDefaultInput = (input) => {
    // Handle custom message responses
    if (input.toLowerCase().includes('hi') || 
        input.toLowerCase().includes('hello') || 
        input.toLowerCase().includes('hey')) {
      addMessage('bot', 'Hello! How can I assist you with your legal needs today?', [
        { text: 'Create new case', value: 'create_case' },
        { text: 'Find hearing details', value: 'find_hearing' },
        { text: 'Find documents', value: 'find_documents' },
        { text: 'Check calendar', value: 'check_calendar' },
        { text: 'Find meeting link', value: 'find_meeting' },
      ]);
    } else if (input.toLowerCase().includes('help')) {
      addMessage('bot', 'I can help you with various legal services. What would you like to do?', [
        { text: 'Create new case', value: 'create_case' },
        { text: 'Find hearing details', value: 'find_hearing' },
        { text: 'Find documents', value: 'find_documents' },
        { text: 'Check calendar', value: 'check_calendar' },
        { text: 'Find meeting link', value: 'find_meeting' },
      ]);
    } else if (input.toLowerCase().includes('thank')) {
      addMessage('bot', 'You\'re welcome! Is there anything else I can help you with?', [
        { text: 'Create new case', value: 'create_case' },
        { text: 'Find hearing details', value: 'find_hearing' },
        { text: 'Find documents', value: 'find_documents' },
        { text: 'Check calendar', value: 'check_calendar' },
        { text: 'Find meeting link', value: 'find_meeting' },
      ]);
    } else {
      addMessage('bot', 'I\'m not sure I understand. Please select one of these options to proceed:', [
        { text: 'Create new case', value: 'create_case' },
        { text: 'Find hearing details', value: 'find_hearing' },
        { text: 'Find documents', value: 'find_documents' },
        { text: 'Check calendar', value: 'check_calendar' },
        { text: 'Find meeting link', value: 'find_meeting' },
      ]);
    }
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const resetToMainMenu = () => {
    setActiveFlow(null);
    setFlowData({});
    setCaseNumber('');
    setHearings([]);
    setDocuments([]);
    setCalendarData(null);
    setMeetingDetails(null);
    setEmailForOTP('');
    setOtp('');
    setOtpSent(false);

    addMessage('bot', 'What would you like to do?', [
      { text: 'Create new case', value: 'create_case' },
      { text: 'Find hearing details', value: 'find_hearing' },
      { text: 'Find documents', value: 'find_documents' },
      { text: 'Check calendar', value: 'check_calendar' },
      { text: 'Find meeting link', value: 'find_meeting' },
    ]);
  };
  // Case Filing Flow - Fixed Implementation
  const startCreateCaseFlow = () => {
    addMessage('bot', 'Let\'s create a new case. First, please select the case type:', [
      { text: 'Civil Case', value: 'civil' },
      { text: 'Criminal Case', value: 'criminal' },
    ]);
    
    // Reset case form data to default values
    setCaseFormData({
      court: 'District & Sessions Court',
      case_type: 'Civil',
      plaintiff_details: {
        name: '',
        father_mother_husband: '',
        address: '',
        pin: '',
        sex: 'Male',
        age: '',
        caste: '',
        nationality: 'Indian',
        if_other_mention: '',
        occupation: '',
        email: '',
        phone: '',
        mobile: '',
        fax: '',
        subject: '',
        advocate_id: '',
        advocate: ''
      },
      respondent_details: {
        party_id: '',
        name: '',
        father_mother_husband: '',
        address: '',
        pin: '',
        sex: 'Male',
        age: '',
        caste: '',
        nationality: 'Indian',
        if_other_mention: '',
        occupation: '',
        email: '',
        phone: '',
        mobile: '',
        fax: '',
        subject: '',
        advocate_id: '',
        advocate: ''
      },
      police_station_details: {
        police_station: '',
        fir_no: '',
        fir_year: '',
        date_of_offence: ''
      },
      lower_court_details: {
        court_name: '',
        case_no: '',
        decision_date: ''
      },
      main_matter_details: {
        case_type: '',
        case_no: '',
        year: new Date().getFullYear()
      },
      hearings: [],
      status: 'Pending',
      case_approved: false
    });
  };

  // Handle case type selection
  const handleCaseTypeSelection = (caseType) => {
    setCaseFormData(prev => ({
      ...prev,
      case_type: caseType
    }));
    
    addMessage('bot', `You've selected a ${caseType} case. Now, I need plaintiff details. Please provide the name of the plaintiff:`);
  };

  // Handle case submission
  const handleCaseSubmission = async () => {
    addThinkingMessage();
    
    try {
      const token = localStorage.getItem('token');
      
      // Use the correct API endpoint for litigant case filing
      const response = await axios.post(
        'https://ecourt-yr51.onrender.com/api/filecase/litigant',
        caseFormData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      removeThinkingMessage();
      
      // Display success message with case number
      addMessage('bot', `Case filed successfully! Your case number is ${response.data.case_no || response.data.case_num}.\n\nWhat would you like to do next?`, [
        { text: 'File another case', value: 'create_case' },
        { text: 'Return to main menu', value: 'main_menu' }
      ]);
      
    } catch (error) {
      removeThinkingMessage();
      addMessage('bot', `Error: ${error.response?.data?.message || 'Failed to file case. Please try again later.'}`, [
        { text: 'Try again', value: 'create_case' },
        { text: 'Return to main menu', value: 'main_menu' }
      ]);
    }
  };

  const handleCreateCaseInput = async (input) => {
    // Handle plaintiff name
    if (!caseFormData.plaintiff_details.name) {
      setCaseFormData(prev => ({
        ...prev,
        plaintiff_details: {
          ...prev.plaintiff_details,
          name: input
        }
      }));
      
      addMessage('bot', `Thank you. Now, please provide the plaintiff's address:`);
    }
    // Handle plaintiff address
    else if (!caseFormData.plaintiff_details.address) {
      setCaseFormData(prev => ({
        ...prev,
        plaintiff_details: {
          ...prev.plaintiff_details,
          address: input
        }
      }));
      
      addMessage('bot', `Now, please provide the plaintiff's email address:`);
    }
    // Handle plaintiff email
    else if (!caseFormData.plaintiff_details.email) {
      setCaseFormData(prev => ({
        ...prev,
        plaintiff_details: {
          ...prev.plaintiff_details,
          email: input
        }
      }));
      
      addMessage('bot', `Now, please provide the plaintiff's mobile number:`);
    }
    // Handle plaintiff mobile
    else if (!caseFormData.plaintiff_details.mobile) {
      setCaseFormData(prev => ({
        ...prev,
        plaintiff_details: {
          ...prev.plaintiff_details,
          mobile: input
        }
      }));
      
      addMessage('bot', `Great! Now I need respondent details. Please provide the name of the respondent:`);
    }
    // Handle respondent name
    else if (!caseFormData.respondent_details.name) {
      setCaseFormData(prev => ({
        ...prev,
        respondent_details: {
          ...prev.respondent_details,
          name: input
        }
      }));
      
      addMessage('bot', `Please provide the respondent's address:`);
    }
    // Handle respondent address
    else if (!caseFormData.respondent_details.address) {
      setCaseFormData(prev => ({
        ...prev,
        respondent_details: {
          ...prev.respondent_details,
          address: input
        }
      }));
      
      addMessage('bot', `Please provide the respondent's email address:`);
    }
    // Handle respondent email
    else if (!caseFormData.respondent_details.email) {
      setCaseFormData(prev => ({
        ...prev,
        respondent_details: {
          ...prev.respondent_details,
          email: input
        }
      }));
      
      addMessage('bot', `Please provide the respondent's mobile number:`);
    }
    // Handle respondent mobile
    else if (!caseFormData.respondent_details.mobile) {
      setCaseFormData(prev => ({
        ...prev,
        respondent_details: {
          ...prev.respondent_details,
          mobile: input
        }
      }));
      
      // If it's a criminal case, ask for police station details
      if (caseFormData.case_type === 'Criminal') {
        addMessage('bot', `For criminal cases, I need police station details. Please provide the police station name:`);
      } else {
        // For civil cases, ask for subject/description
        addMessage('bot', `Please provide a brief subject or description of the case:`);
      }
    }
    // Handle police station for criminal cases
    else if (caseFormData.case_type === 'Criminal' && !caseFormData.police_station_details.police_station) {
      setCaseFormData(prev => ({
        ...prev,
        police_station_details: {
          ...prev.police_station_details,
          police_station: input
        }
      }));
      
      addMessage('bot', `Please provide the FIR number:`);
    }
    // Handle FIR number for criminal cases
    else if (caseFormData.case_type === 'Criminal' && !caseFormData.police_station_details.fir_no) {
      setCaseFormData(prev => ({
        ...prev,
        police_station_details: {
          ...prev.police_station_details,
          fir_no: input
        }
      }));
      
      addMessage('bot', `Please provide the FIR year:`);
    }
    // Handle FIR year for criminal cases
    else if (caseFormData.case_type === 'Criminal' && !caseFormData.police_station_details.fir_year) {
      setCaseFormData(prev => ({
        ...prev,
        police_station_details: {
          ...prev.police_station_details,
          fir_year: input
        }
      }));
      
      addMessage('bot', `Please provide the date of offence (YYYY-MM-DD):`);
    }
    // Handle date of offence for criminal cases
    else if (caseFormData.case_type === 'Criminal' && !caseFormData.police_station_details.date_of_offence) {
      setCaseFormData(prev => ({
        ...prev,
        police_station_details: {
          ...prev.police_station_details,
          date_of_offence: input
        }
      }));
      
      addMessage('bot', `Please provide a brief subject or description of the case:`);
    }
    // Handle subject for both case types
    else if (!caseFormData.plaintiff_details.subject) {
      setCaseFormData(prev => ({
        ...prev,
        plaintiff_details: {
          ...prev.plaintiff_details,
          subject: input
        },
        respondent_details: {
          ...prev.respondent_details,
          subject: input
        }
      }));
      
      // Display summary and ask for confirmation
      const summary = `Case Summary:
Court: ${caseFormData.court}
Case Type: ${caseFormData.case_type}
Plaintiff: ${caseFormData.plaintiff_details.name}
Plaintiff Email: ${caseFormData.plaintiff_details.email}
Plaintiff Mobile: ${caseFormData.plaintiff_details.mobile}
Respondent: ${caseFormData.respondent_details.name}
Respondent Email: ${caseFormData.respondent_details.email}
Respondent Mobile: ${caseFormData.respondent_details.mobile}
Subject: ${input}`;
      
      if (caseFormData.case_type === 'Criminal') {
        const criminalDetails = `Police Station: ${caseFormData.police_station_details.police_station}
FIR Number: ${caseFormData.police_station_details.fir_no}
FIR Year: ${caseFormData.police_station_details.fir_year}
Date of Offence: ${caseFormData.police_station_details.date_of_offence}`;
        
        addMessage('bot', `${summary}\n${criminalDetails}\n\nWould you like to submit this case?`, [
          { text: 'Yes, submit case', value: 'submit_case' },
          { text: 'No, start over', value: 'create_case' },
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
      } else {
        addMessage('bot', `${summary}\n\nWould you like to submit this case?`, [
          { text: 'Yes, submit case', value: 'submit_case' },
          { text: 'No, start over', value: 'create_case' },
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
      }
    }
    // Handle confirmation responses
    else if (input.toLowerCase().includes('yes') || input === 'Yes, submit case') {
      handleCaseSubmission();
    } 
    else if (input.toLowerCase().includes('no') || input === 'No, start over') {
      startCreateCaseFlow();
    } 
    else if (input.toLowerCase().includes('main') || input === 'Return to main menu') {
      resetToMainMenu();
    }
    else {
      addMessage('bot', 'I didn\'t understand your response. Please answer with "yes" to submit, "no" to start over, or "main" to return to the main menu.', [
        { text: 'Yes, submit case', value: 'submit_case' },
        { text: 'No, start over', value: 'create_case' },
        { text: 'Return to main menu', value: 'main_menu' }
      ]);
    }
  };// Find Hearing Flow
  const startFindHearingFlow = () => {
    addMessage('bot', 'Please enter the case number to find hearing details:');
    setCaseNumber('');
    setHearings([]);
  };

  const handleFindHearingInput = async (input) => {
    addMessage('user', input);
    
    if (input.toLowerCase() === 'main' || input.toLowerCase() === 'return to main menu') {
      resetToMainMenu();
      return;
    }
    
    if (!caseNumber) {
      setCaseNumber(input);
      addThinkingMessage();
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `https://ecourt-yr51.onrender.com/api/case/${input}/hearings`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        removeThinkingMessage();
        
        if (response.data.hearings && response.data.hearings.length > 0) {
          setHearings(response.data.hearings);
          
          const hearingsList = response.data.hearings.map((hearing, index) => {
            const hearingDate = new Date(hearing.hearing_date).toLocaleDateString();
            return `${index + 1}. ${hearing.hearing_type} - ${hearingDate}`;
          }).join('\n');
          
          addMessage('bot', `Found ${response.data.hearings.length} hearings for case ${input}:\n\n${hearingsList}\n\nSelect a hearing number for details, or type 'main' to return to main menu.`);
        } else {
          addMessage('bot', `No hearings found for case ${input}.`, [
            { text: 'Try another case number', value: 'find_hearing' },
            { text: 'Return to main menu', value: 'main_menu' }
          ]);
        }
      } catch (error) {
        removeThinkingMessage();
        addMessage('bot', `Error: ${error.response?.data?.message || 'Failed to fetch hearings.'}`, [
          { text: 'Try again', value: 'find_hearing' },
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
      }
    } else {
      // Check if user selected a hearing number
      const hearingIndex = parseInt(input) - 1;
      if (!isNaN(hearingIndex) && hearingIndex >= 0 && hearingIndex < hearings.length) {
        const hearing = hearings[hearingIndex];
        const hearingDate = new Date(hearing.hearing_date).toLocaleDateString();
        const nextHearingDate = hearing.next_hearing_date ? new Date(hearing.next_hearing_date).toLocaleDateString() : 'Not scheduled';
        
        let hearingDetails = `Hearing Details:\n`;
        hearingDetails += `Type: ${hearing.hearing_type}\n`;
        hearingDetails += `Date: ${hearingDate}\n`;
        hearingDetails += `Next Hearing: ${nextHearingDate}\n`;
        if (hearing.remarks) hearingDetails += `Remarks: ${hearing.remarks}\n`;
        
        if (hearing.attachments && hearing.attachments.length > 0) {
          hearingDetails += `\nAttachments: ${hearing.attachments.length} document(s)\n`;
          hearing.attachments.forEach((attachment, i) => {
            hearingDetails += `${i + 1}. ${attachment.originalname} (${(attachment.size / 1024).toFixed(2)} KB)\n`;
          });
          
          addMessage('bot', hearingDetails);
          addMessage('bot', 'Would you like to download an attachment? Enter attachment number or "no".', [
            { text: 'No, thank you', value: 'no' }
          ]);
        } else {
          addMessage('bot', hearingDetails, [
            { text: 'View another hearing', value: 'find_hearing' },
            { text: 'Return to main menu', value: 'main_menu' }
          ]);
        }
      } else if (input.toLowerCase() === 'no') {
        addMessage('bot', 'What would you like to do next?', [
          { text: 'View another hearing', value: 'find_hearing' },
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
      } else {
        const attachmentIndex = parseInt(input) - 1;
        const selectedHearing = hearings.find(h => h.attachments && h.attachments.length > attachmentIndex);
        
        if (selectedHearing && attachmentIndex >= 0) {
          const attachment = selectedHearing.attachments[attachmentIndex];
          if (attachment) {
            addMessage('bot', `Downloading ${attachment.originalname}...`);
            
            // Download attachment
            const token = localStorage.getItem('token');
            const downloadUrl = `/api/files/${attachment.filename}`;
            
            // Create a temporary anchor element to trigger the download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = attachment.originalname;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            addMessage('bot', 'Download initiated. What would you like to do next?', [
              { text: 'View another hearing', value: 'find_hearing' },
              { text: 'Return to main menu', value: 'main_menu' }
            ]);
          } else {
            addMessage('bot', 'Invalid attachment number. Please try again.');
          }
        } else {
          addMessage('bot', 'Invalid selection. Please enter a valid hearing number or "main" to return to menu.');
        }
      }
    }
  };

  // Find Documents Flow - FIXED to use correct endpoint

  const startFindDocumentsFlow = () => {
    addMessage('bot', 'Please enter the case number to find documents:');
    setCaseNumber('');
    setDocuments([]);
    setSelectedCaseForDocuments(null);
    setDocumentError('');
  };
  
  const handleFindDocumentsInput = async (input) => {
    addMessage('user', input);
    
    if (input.toLowerCase() === 'main' || input.toLowerCase() === 'return to main menu') {
      resetToMainMenu();
      return;
    }
    
    if (!caseNumber) {
      setCaseNumber(input);
      addThinkingMessage();
      
      try {
        const token = localStorage.getItem('token');
        
        // Use the litigant cases endpoint as in your fetchDocuments function
        const response = await axios.get(
          'https://ecourt-yr51.onrender.com/api/cases/litigant',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        removeThinkingMessage();
        
        // Find the specific case from the cases array
        const caseData = response.data.cases.find(c => c.case_num === input);
        
        if (caseData) {
          const documentsArray = caseData.documents || [];
          setDocuments(documentsArray);
          setSelectedCaseForDocuments(caseData);
          
          if (documentsArray.length > 0) {
            const documentList = documentsArray.map((doc, index) => {
              const type = doc.document_type;
              const uploadDate = doc.uploaded_date ? new Date(doc.uploadDate).toLocaleDateString() : 'Unknown date';
              return `${index + 1}. ${doc.description || doc.name} (${type})`;
            }).join('\n');
            
            addMessage('bot', `Found ${documentsArray.length} documents for case ${input}:\n\n${documentList}\n\nEnter a document number to download, or type 'main' to return to main menu.`);
          } else {
            addMessage('bot', `No documents found for case ${input}.`, [
              { text: 'Try another case number', value: 'find_documents' },
              { text: 'Return to main menu', value: 'main_menu' }
            ]);
          }
        } else {
          setDocumentError('Case not found');
          addMessage('bot', `Case ${input} not found. Please check the case number and try again.`, [
            { text: 'Try another case number', value: 'find_documents' },
            { text: 'Return to main menu', value: 'main_menu' }
          ]);
        }
      } catch (error) {
        removeThinkingMessage();
        setDocumentError('Error fetching documents');
        addMessage('bot', `Error: ${error.response?.data?.message || 'Failed to fetch documents.'}`, [
          { text: 'Try again', value: 'find_documents' },
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
      }
    } else {
      // Check if user selected a document number
      const docIndex = parseInt(input) - 1;
      if (!isNaN(docIndex) && docIndex >= 0 && docIndex < documents.length) {
        const document = documents[docIndex];
        
        addMessage('bot', `Downloading ${document.originalname || document.name}...`);
        
        // Download document
        const token = localStorage.getItem('token');
        const downloadUrl = `https://ecourt-yr51.onrender.com/api/files/${document.filename || document._id}`;
        
        // Create a temporary anchor element to trigger the download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = document.originalname || document.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        addMessage('bot', 'Download initiated. What would you like to do next?', [
          { text: 'Download another document', value: 'find_documents' },
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
      } else {
        addMessage('bot', 'Invalid document number. Please enter a valid number or "main" to return to menu.');
      }
    }
  };
// Check Calendar Flow
const startCheckCalendarFlow = () => {
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

addMessage('bot', `Please specify the month and year (MM/YYYY) to check court calendar, or type "today" for today's schedule:`);
setYear(currentYear);
setMonth(currentMonth);
setCalendarData(null);
};

const handleCheckCalendarInput = async (input) => {
addMessage('user', input);

if (input.toLowerCase() === 'main' || input.toLowerCase() === 'return to main menu') {
resetToMainMenu();
return;
}

addThinkingMessage();

try {
const token = localStorage.getItem('token');
let response;

if (input.toLowerCase() === 'today') {
  // Get today's calendar
  response = await axios.get(
    `https://ecourt-yr51.onrender.com/api/calendar/today`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  removeThinkingMessage();
  
  const { date, district, is_holiday, holiday_reason, opening_time, closing_time } = response.data;
  
  let calendarInfo = `Court Calendar for Today (${new Date(date).toLocaleDateString()}):\n`;
  calendarInfo += `District: ${district}\n`;
  
  if (is_holiday) {
    calendarInfo += `Status: HOLIDAY\n`;
    if (holiday_reason) calendarInfo += `Reason: ${holiday_reason}\n`;
  } else {
    calendarInfo += `Court Hours: ${opening_time} - ${closing_time}\n`;
  }
  
  addMessage('bot', calendarInfo, [
    { text: 'Check another date', value: 'check_calendar' },
    { text: 'Return to main menu', value: 'main_menu' }
  ]);
} else {
  // Parse input as MM/YYYY
  const dateRegex = /^(\d{1,2})\/(\d{4})$/;
  const match = input.match(dateRegex);
  
  if (match) {
    const month = parseInt(match[1]);
    const year = parseInt(match[2]);
    
    if (month >= 1 && month <= 12) {
      setMonth(month);
      setYear(year);
      
      // Get calendar for specific month
      response = await axios.get(
        `https://ecourt-yr51.onrender.com/api/calendar/${year}/${month}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      removeThinkingMessage();
      
      const { calendar } = response.data;
      setCalendarData(calendar);
      
      if (calendar && calendar.length > 0) {
        // Find holidays and special schedules
        const holidays = calendar.filter(entry => entry.is_holiday);
        
        let calendarInfo = `Court Calendar for ${getMonthName(month)} ${year}:\n\n`;
        
        if (holidays.length > 0) {
          calendarInfo += `Holidays:\n`;
          holidays.forEach(holiday => {
            calendarInfo += `- ${new Date(holiday.date).toLocaleDateString()}: ${holiday.holiday_reason || 'Court Holiday'}\n`;
          });
          calendarInfo += '\n';
        }
        
        // Check if there are special schedules
        const specialSchedules = calendar.filter(entry => !entry.is_holiday && (entry.opening_time !== '09:00' || entry.closing_time !== '17:00'));
        
        if (specialSchedules.length > 0) {
          calendarInfo += `Special Schedules:\n`;
          specialSchedules.forEach(schedule => {
            calendarInfo += `- ${new Date(schedule.date).toLocaleDateString()}: ${schedule.opening_time} - ${schedule.closing_time}\n`;
          });
        } else {
          calendarInfo += `Regular Court Hours: 09:00 - 17:00 (except holidays)`;
        }
        
        addMessage('bot', calendarInfo, [
          { text: 'Check another month', value: 'check_calendar' },
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
      } else {
        addMessage('bot', `No calendar entries found for ${getMonthName(month)} ${year}. Default court hours are 09:00 - 17:00 on weekdays.`, [
          { text: 'Check another month', value: 'check_calendar' },
          { text: 'Return to main menu', value: 'main_menu' }
        ]);
      }
    } else {
      removeThinkingMessage();
      addMessage('bot', 'Invalid month. Please enter a valid month (1-12) and year in MM/YYYY format.');
    }
  } else {
    removeThinkingMessage();
    addMessage('bot', 'Invalid date format. Please use MM/YYYY format (e.g., 05/2025) or type "today".');
  }
}
} catch (error) {
removeThinkingMessage();
addMessage('bot', `Error: ${error.response?.data?.message || 'Failed to fetch calendar information.'}`, [
  { text: 'Try again', value: 'check_calendar' },
  { text: 'Return to main menu', value: 'main_menu' }
]);
}
};

// Find Meeting Link Flow
const startFindMeetingFlow = () => {
addMessage('bot', 'Please enter the case number to find virtual meeting links:');
setCaseNumber('');
setMeetingDetails(null);
setEmailForOTP('');
setOtp('');
setOtpSent(false);
};

const handleFindMeetingInput = async (input) => {
addMessage('user', input);

if (input.toLowerCase() === 'main' || input.toLowerCase() === 'return to main menu') {
resetToMainMenu();
return;
}

if (!caseNumber) {
setCaseNumber(input);
addThinkingMessage();

try {
  const token = localStorage.getItem('token');
  // Try to get meeting directly first (for authenticated users)
  const response = await axios.get(
    `https://ecourt-yr51.onrender.com/api/case/${input}/video-meeting`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  removeThinkingMessage();
  
  if (response.data.meetingLink) {
    setMeetingDetails(response.data);
    
    const startTime = new Date(response.data.startDateTime).toLocaleString();
    const endTime = new Date(response.data.endDateTime).toLocaleString();
    
    addMessage('bot', `Meeting found for case ${input}:\n\nStart: ${startTime}\nEnd: ${endTime}\nMeeting Link: ${response.data.meetingLink}\n\nYou can join the meeting at the scheduled time.`, [
      { text: 'Find another meeting', value: 'find_meeting' },
      { text: 'Return to main menu', value: 'main_menu' }
    ]);
  }
} catch (error) {
  removeThinkingMessage();
  
  if (error.response?.status === 403 || error.response?.status === 404) {
    // Need OTP verification
    addMessage('bot', `Authentication needed for meeting access. Please enter your email to receive an OTP:`);
  } else {
    addMessage('bot', `Error: ${error.response?.data?.message || 'Failed to fetch meeting details.'}`, [
      { text: 'Try another case number', value: 'find_meeting' },
      { text: 'Return to main menu', value: 'main_menu' }
    ]);
  }
}
} else if (!emailForOTP && !otpSent) {
// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(input)) {
  addMessage('bot', 'Please enter a valid email address.');
  return;
}

setEmailForOTP(input);
addThinkingMessage();

try {
  // Request OTP
  const response = await axios.post(
    `https://ecourt-yr51.onrender.com/api/case/${caseNumber}/video-meeting/request-access`,
    { email: input }
  );
  
  removeThinkingMessage();
  setOtpSent(true);
  
  addMessage('bot', `${response.data.message} Please enter the OTP you received:`);
} catch (error) {
  removeThinkingMessage();
  addMessage('bot', `Error: ${error.response?.data?.message || 'Failed to send OTP.'}`, [
    { text: 'Try again', value: 'find_meeting' },
    { text: 'Return to main menu', value: 'main_menu' }
  ]);
}
} else if (otpSent) {
// Verify OTP
setOtp(input);
addThinkingMessage();

try {
  const response = await axios.post(
    `https://ecourt-yr51.onrender.com/api/case/${caseNumber}/video-meeting/verify-otp`,
    { 
      email: emailForOTP,
      otp: input
    }
  );
  
  removeThinkingMessage();
  
  if (response.data.meetingLink) {
    setMeetingDetails(response.data);
    
    const startTime = new Date(response.data.startDateTime).toLocaleString();
    const endTime = new Date(response.data.endDateTime).toLocaleString();
    
    addMessage('bot', `Meeting access granted!\n\nStart: ${startTime}\nEnd: ${endTime}\nMeeting Link: ${response.data.meetingLink}\n\nYou can join the meeting at the scheduled time.`, [
      { text: 'Find another meeting', value: 'find_meeting' },
      { text: 'Return to main menu', value: 'main_menu' }
    ]);
  } else {
    addMessage('bot', 'OTP verified, but no meeting information found.', [
      { text: 'Try again', value: 'find_meeting' },
      { text: 'Return to main menu', value: 'main_menu' }
    ]);
  }
} catch (error) {
  removeThinkingMessage();
  addMessage('bot', `Error: ${error.response?.data?.message || 'Failed to verify OTP.'}`, [
    { text: 'Try again', value: 'find_meeting' },
    { text: 'Return to main menu', value: 'main_menu' }
  ]);
}
}
};

return (
<>
<div className="chatbot-wrapper">
      <div className="chatbot-icon" onClick={toggleChatbot}>
        <div className="avatar-container">
          <div className="avatar-hair"></div>
          <div className="avatar-face">
            <div className="avatar-eyes"></div>
            <div className="avatar-smile"></div>
          </div>
        </div>
        <span className="chatbot-name">Nova</span>
        {!isOpen && <div className="pulse-effect"></div>}
      </div>
    </div>
<div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
  <div className="chatbot-header">
    <h3>Legal Assistant</h3>
    <button onClick={toggleChatbot} className="close-btn">
      ×
    </button>
  </div>
  {isOpen && (
    <>
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.type === 'thinking' ? (
              <div className="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <>
                <div className="message-content">{message.content}</div>
                {message.options && message.options.length > 0 && (
                  <div className="message-options">
                    {message.options.map((option, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleOptionClick(option.value)}
                        className="option-button"
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chatbot-input">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing}><Send /></button>
      </form>
    </>
  )}
</div>
<div className={`chatbot-backdrop ${isOpen ? 'open' : ''}`} onClick={toggleChatbot}></div>
</>
);
};

export default LegalAssistantChatbot;
    
    