
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader,Volume2 , VolumeX} from "lucide-react";

const GeminiLegalAssistantChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      content: 'Hello! I am Nova, your AI-powered legal assistant. I can help you:\n\n1. File a new case\n2. Find hearing details\n3. Check documents\n4. View court calendar\n5. Get meeting links\n\nHow can I assist you today?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);
  const [flowStep, setFlowStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const speechSynthesisRef = useRef(null);
  const [caseFormData, setCaseFormData] = useState({
    court: 'District & Sessions Court',
    case_type: '',
    plaintiff_details: {
      name: '', father_mother_husband: '', address: '', pin: '', sex: 'Male',
      age: '', caste: '', nationality: 'Indian', if_other_mention: '',
      occupation: '', email: '', phone: '', mobile: '', fax: '', subject: '', advocate_id: '', advocate: ''
    },
    respondent_details: {
      party_id: '', name: '', father_mother_husband: '', address: '', pin: '', sex: 'Male',
      age: '', caste: '', nationality: 'Indian', if_other_mention: '',
      occupation: '', email: '', phone: '', mobile: '', fax: '', subject: '', advocate_id: '', advocate: ''
    },
    police_station_details: { police_station: '', fir_no: '', fir_year: '', date_of_offence: '' },
    lower_court_details: { court_name: '', case_no: '', decision_date: '' },
    main_matter_details: { case_type: '', case_no: '', year: new Date().getFullYear() },
    hearings: [], 
    status: 'Pending', 
    case_approved: false
  });

  const [caseNumber, setCaseNumber] = useState('');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  // Load voices when component mounts
useEffect(() => {
  if (window.speechSynthesis) {
    // Load voices
    window.speechSynthesis.getVoices();
    
    // Some browsers need this event
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
  
  // Cleanup: stop speech when component unmounts
  return () => {
    stopSpeech();
  };
}, []);
// Stop any ongoing speech
const stopSpeech = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }
};

// Speak the bot's message
const speakMessage = (text) => {
  if (!speechEnabled || !window.speechSynthesis) return;
  
  // Stop any ongoing speech first
  stopSpeech();
  
  // Clean text for better speech
  const cleanText = text
    .replace(/[━─═]+/g, '') // Remove decorative lines
    .replace(/[📋📌👤📧📱🏠👥📝✅❌🔔📭📄🎉🔗📹🕐🕑📅📍📎🟢🔴⏰]/g, '') // Remove emojis
    .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
    .trim();
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Configure speech settings
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang = 'en-IN'; // Indian English
  
  // Select a voice (prefer female voice for assistant)
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.lang.includes('en') && voice.name.includes('Female')
  ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  utterance.onstart = () => setIsSpeaking(true);
  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = () => setIsSpeaking(false);
  
  window.speechSynthesis.speak(utterance);
};

// Toggle speech on/off
const toggleSpeech = () => {
  setSpeechEnabled(!speechEnabled);
  if (isSpeaking) {
    stopSpeech();
  }
};
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

 const addMessage = (type, content) => {
  setMessages(prev => [...prev, { type, content }]);
  
  // Auto-speak bot messages
  if (type === 'bot' && speechEnabled) {
    // Small delay to ensure message is rendered
    setTimeout(() => speakMessage(content), 300);
  }
};

  const addThinkingMessage = () => {
    setMessages(prev => [...prev, { type: 'thinking' }]);
    setIsProcessing(true);
  };

  const removeThinkingMessage = () => {
    setMessages(prev => prev.filter(msg => msg.type !== 'thinking'));
    setIsProcessing(false);
  };

const callLlamaStreamingAPI = async (prompt, onToken) => {
  const response = await fetch("https://ecourt-yr51.onrender.com/api/llama/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.response) {
          fullText += data.response;
          onToken(fullText);
        }
      } catch {
        continue;
      }
    }
  }

  return fullText;
};

  const determineIntent = async (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Direct keyword matching for better accuracy
    if (lowerInput.includes('file') || lowerInput.includes('create') || lowerInput.includes('new case')) {
      return 'create_case';
    }
    if (lowerInput.includes('hearing')) {
      return 'find_hearing';
    }
    if (lowerInput.includes('document')) {
      return 'find_documents';
    }
    if (lowerInput.includes('calendar') || lowerInput.includes('schedule')) {
      return 'check_calendar';
    }
    if (lowerInput.includes('meeting') || lowerInput.includes('video')) {
      return 'find_meeting';
    }

    // Fallback to AI for complex queries
    const prompt = `Classify this user request into ONE of these categories: create_case, find_hearing, find_documents, check_calendar, find_meeting, or general_query.

User input: "${userInput}"

Respond with ONLY the category name, nothing else.`;

    try {
      const response = await callLlamaAPI(prompt);
      const intent = response.trim().toLowerCase().replace(/[^a-z_]/g, '');
      
      const validIntents = ['create_case', 'find_hearing', 'find_documents', 'check_calendar', 'find_meeting'];
      if (validIntents.includes(intent)) {
        return intent;
      }
      return 'general_query';
    } catch {
      return 'general_query';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userInput = inputValue.trim();
    addMessage('user', userInput);
    setInputValue('');

    // If we're in an active flow, continue that flow
    if (activeFlow === 'create_case') {
      await handleCreateCaseFlow(userInput);
      return;
    }

    if (activeFlow === 'find_hearing') {
      await handleFindHearingFlow(userInput);
      return;
    }

    if (activeFlow === 'find_documents') {
      await handleFindDocumentsFlow(userInput);
      return;
    }

    // Otherwise determine intent
    addThinkingMessage();
    try {
      const intent = await determineIntent(userInput);
      removeThinkingMessage();

      switch (intent) {
        case 'create_case':
          setActiveFlow('create_case');
          setFlowStep(0);
          addMessage('bot', '📋 Let\'s file a new case! First, what type of case is this?\n\nType "Civil" or "Criminal"');
          break;
        case 'find_hearing':
          setActiveFlow('find_hearing');
          await handleFindHearingFlow(userInput);
          break;
        case 'find_documents':
          setActiveFlow('find_documents');
          await handleFindDocumentsFlow(userInput);
          break;
        case 'check_calendar':
          await handleCheckCalendarFlow(userInput);
          break;
        case 'find_meeting':
          await handleFindMeetingFlow(userInput);
          break;
        default:
          await handleGeneralQuery(userInput);
      }
    } catch (error) {
      removeThinkingMessage();
      addMessage('bot', `❌ Error: ${error.message}`);
    }
  };

  const handleCreateCaseFlow = async (userInput) => {
    const lowerInput = userInput.toLowerCase();

    try {
      // Step 0: Case Type
      if (flowStep === 0) {
        if (lowerInput.includes('civil')) {
          setCaseFormData(prev => ({ ...prev, case_type: 'Civil' }));
          setFlowStep(1);
          addMessage('bot', '✅ Civil case selected.\n\n👤 Please provide the plaintiff\'s (your) full name:');
        } else if (lowerInput.includes('criminal')) {
          setCaseFormData(prev => ({ ...prev, case_type: 'Criminal' }));
          setFlowStep(1);
          addMessage('bot', '✅ Criminal case selected.\n\n👤 Please provide the plaintiff\'s (your) full name:');
        } else {
          addMessage('bot', 'Please specify either "Civil" or "Criminal" case type.');
        }
        return;
      }

      // Step 1: Plaintiff Name
      if (flowStep === 1) {
        setCaseFormData(prev => ({
          ...prev,
          plaintiff_details: { ...prev.plaintiff_details, name: userInput }
        }));
        setFlowStep(2);
        addMessage('bot', `✅ Name recorded: ${userInput}\n\n📧 What is the plaintiff's email address?`);
        return;
      }

      // Step 2: Plaintiff Email
      if (flowStep === 2) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userInput)) {
          addMessage('bot', '❌ Invalid email format. Please provide a valid email address:');
          return;
        }
        setCaseFormData(prev => ({
          ...prev,
          plaintiff_details: { ...prev.plaintiff_details, email: userInput }
        }));
        setFlowStep(3);
        addMessage('bot', `✅ Email recorded.\n\n📱 What is the plaintiff's mobile number?`);
        return;
      }

      // Step 3: Plaintiff Mobile
      if (flowStep === 3) {
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(userInput.replace(/[\s-]/g, ''))) {
          addMessage('bot', '❌ Invalid mobile number. Please provide a 10-digit Indian mobile number:');
          return;
        }
        setCaseFormData(prev => ({
          ...prev,
          plaintiff_details: { ...prev.plaintiff_details, mobile: userInput }
        }));
        setFlowStep(4);
        addMessage('bot', `✅ Mobile recorded.\n\n🏠 What is the plaintiff's address?`);
        return;
      }

      // Step 4: Plaintiff Address
      if (flowStep === 4) {
        setCaseFormData(prev => ({
          ...prev,
          plaintiff_details: { ...prev.plaintiff_details, address: userInput }
        }));
        setFlowStep(5);
        addMessage('bot', `✅ Address recorded.\n\n👥 Now, what is the respondent's (defendant's) full name?`);
        return;
      }

      // Step 5: Respondent Name
      if (flowStep === 5) {
        setCaseFormData(prev => ({
          ...prev,
          respondent_details: { ...prev.respondent_details, name: userInput }
        }));
        setFlowStep(6);
        addMessage('bot', `✅ Respondent name: ${userInput}\n\n📧 What is the respondent's email address?`);
        return;
      }

      // Step 6: Respondent Email
      if (flowStep === 6) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userInput)) {
          addMessage('bot', '❌ Invalid email format. Please provide a valid email address:');
          return;
        }
        setCaseFormData(prev => ({
          ...prev,
          respondent_details: { ...prev.respondent_details, email: userInput }
        }));
        setFlowStep(7);
        addMessage('bot', `✅ Email recorded.\n\n📱 What is the respondent's mobile number?`);
        return;
      }

      // Step 7: Respondent Mobile
      if (flowStep === 7) {
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(userInput.replace(/[\s-]/g, ''))) {
          addMessage('bot', '❌ Invalid mobile number. Please provide a 10-digit Indian mobile number:');
          return;
        }
        setCaseFormData(prev => ({
          ...prev,
          respondent_details: { ...prev.respondent_details, mobile: userInput }
        }));
        setFlowStep(8);
        addMessage('bot', `✅ Mobile recorded.\n\n🏠 What is the respondent's address?`);
        return;
      }

      // Step 8: Respondent Address
      if (flowStep === 8) {
        setCaseFormData(prev => ({
          ...prev,
          respondent_details: { ...prev.respondent_details, address: userInput }
        }));
        setFlowStep(9);
        addMessage('bot', `✅ Address recorded.\n\n📝 Please describe the case subject/matter (what is this case about?):)`);
        return;
      }

      // Step 9: Case Subject
      if (flowStep === 9) {
        setCaseFormData(prev => ({
          ...prev,
          plaintiff_details: { ...prev.plaintiff_details, subject: userInput },
          respondent_details: { ...prev.respondent_details, subject: userInput }
        }));
        setFlowStep(10);

        const summary = `
━━━━━━━━━━━━━━━━━━━━━
📋 CASE FILING SUMMARY
━━━━━━━━━━━━━━━━━━━━━

📌 Case Type: ${caseFormData.case_type}

👤 PLAINTIFF DETAILS:
   Name: ${caseFormData.plaintiff_details.name}
   Email: ${caseFormData.plaintiff_details.email}
   Mobile: ${caseFormData.plaintiff_details.mobile}
   Address: ${caseFormData.plaintiff_details.address}

👥 RESPONDENT DETAILS:
   Name: ${caseFormData.respondent_details.name}
   Email: ${caseFormData.respondent_details.email}
   Mobile: ${caseFormData.respondent_details.mobile}
   Address: ${caseFormData.respondent_details.address}

📝 Subject: ${userInput}

━━━━━━━━━━━━━━━━━━━━━

Please review the information above.
Type "CONFIRM" to submit the case or "CANCEL" to start over.`;

        addMessage('bot', summary);
        return;
      }

      // Step 10: Confirmation
      if (flowStep === 10) {
        if (lowerInput === 'confirm') {
          await submitCase();
        } else if (lowerInput === 'cancel') {
          resetCaseFlow();
          addMessage('bot', '❌ Case filing cancelled. How else can I help you?');
        } else {
          addMessage('bot', 'Please type "CONFIRM" to submit or "CANCEL" to start over.');
        }
        return;
      }

    } catch (error) {
      addMessage('bot', `❌ Error: ${error.message}`);
    }
  };

  const submitCase = async () => {
    addThinkingMessage();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        removeThinkingMessage();
        addMessage('bot', '❌ Authentication required. Please log in first.');
        resetCaseFlow();
        return;
      }

      const response = await fetch('https://ecourt-yr51.onrender.com/api/filecase/litigant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(caseFormData)
      });

      const data = await response.json();
      removeThinkingMessage();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to file case');
      }

      addMessage('bot', `✅ SUCCESS! Case Filed Successfully!\n\n📌 Your Case Number: ${data.case_num || data.case_no}\n\n🎉 An email notification has been sent to the registered email address.\n\nIs there anything else I can help you with?`);
      
      resetCaseFlow();
    } catch (error) {
      removeThinkingMessage();
      addMessage('bot', `❌ Error filing case: ${error.message}\n\nPlease try again or contact support.`);
      resetCaseFlow();
    }
  };

  const resetCaseFlow = () => {
    setActiveFlow(null);
    setFlowStep(0);
    setCaseFormData({
      court: 'District & Sessions Court',
      case_type: '',
      plaintiff_details: {
        name: '', father_mother_husband: '', address: '', pin: '', sex: 'Male',
        age: '', caste: '', nationality: 'Indian', if_other_mention: '',
        occupation: '', email: '', phone: '', mobile: '', fax: '', subject: '', advocate_id: '', advocate: ''
      },
      respondent_details: {
        party_id: '', name: '', father_mother_husband: '', address: '', pin: '', sex: 'Male',
        age: '', caste: '', nationality: 'Indian', if_other_mention: '',
        occupation: '', email: '', phone: '', mobile: '', fax: '', subject: '', advocate_id: '', advocate: ''
      },
      police_station_details: { police_station: '', fir_no: '', fir_year: '', date_of_offence: '' },
      lower_court_details: { court_name: '', case_no: '', decision_date: '' },
      main_matter_details: { case_type: '', case_no: '', year: new Date().getFullYear() },
      hearings: [], 
      status: 'Pending', 
      case_approved: false
    });
  };

  const handleFindHearingFlow = async (userInput) => {
    addThinkingMessage();
    try {
      // Extract case number from input
      const caseNumMatch = userInput.match(/[A-Z]{2}\d{4}[A-Z]\d{3}/i) || userInput.match(/\b[A-Z0-9]{8,}\b/i) || userInput.match(/\d+/);
      const targetCaseNumber = caseNumMatch ? caseNumMatch[0] : caseNumber;

      if (!targetCaseNumber) {
        removeThinkingMessage();
        addMessage('bot', '📋 Please provide the case number to find hearing details.\n\nExample: "Find hearings for case ABC123XYZ456"');
        setActiveFlow(null);
        return;
      }

      setCaseNumber(targetCaseNumber);
      const token = localStorage.getItem('token');

      if (!token) {
        removeThinkingMessage();
        addMessage('bot', '❌ Authentication required. Please log in first.');
        setActiveFlow(null);
        return;
      }

      const response = await fetch(
        `https://ecourt-yr51.onrender.com/api/case/${targetCaseNumber}/hearings`,
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch hearings');
      }

      const data = await response.json();
      removeThinkingMessage();

      if (data.hearings && data.hearings.length > 0) {
        const hearingsList = data.hearings.map((h, i) => 
          `${i + 1}. ${h.hearing_type || 'General Hearing'}\n   📅 Date: ${new Date(h.hearing_date).toLocaleDateString()}\n   📍 ${h.location || 'Court Room'}\n`
        ).join('\n');
        
        addMessage('bot', `🔔 Found ${data.hearings.length} hearing(s) for case ${targetCaseNumber}:\n\n${hearingsList}\n\nAnything else I can help with?`);
      } else {
        addMessage('bot', `📭 No hearings scheduled yet for case ${targetCaseNumber}.`);
      }
      
      setActiveFlow(null);
    } catch (error) {
      removeThinkingMessage();
      addMessage('bot', `❌ Error: ${error.message}`);
      setActiveFlow(null);
    }
  };

  const handleFindDocumentsFlow = async (userInput) => {
    addThinkingMessage();
    try {
   const caseNumMatch = userInput.match(/[A-Z]{2}\d{4}[A-Z]\d{3}/i) || userInput.match(/\b[A-Z0-9]{8,}\b/i) || userInput.match(/\d+/);
      const targetCaseNumber = caseNumMatch ? caseNumMatch[0] : caseNumber;

      if (!targetCaseNumber) {
        removeThinkingMessage();
        addMessage('bot', '📋 Please provide the case number to find documents.\n\nExample: "Find documents for case ABC123XYZ456"');
        setActiveFlow(null);
        return;
      }

      setCaseNumber(targetCaseNumber);
      const token = localStorage.getItem('token');

      if (!token) {
        removeThinkingMessage();
        addMessage('bot', '❌ Authentication required. Please log in first.');
        setActiveFlow(null);
        return;
      }

      const response = await fetch('https://ecourt-yr51.onrender.com/api/cases/litigant', {
        headers: { 'Authorization': `Bearer ${token}` },
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      const caseData = data.cases?.find(c => c.case_num === targetCaseNumber || c.case_no === targetCaseNumber);
      
      removeThinkingMessage();

      if (caseData && caseData.documents && caseData.documents.length > 0) {
        const docList = caseData.documents.map((d, i) => 
          `${i + 1}. ${d.description || d.name || 'Document'}\n   📎 Type: ${d.document_type || 'General'}\n   📅 Uploaded: ${d.upload_date ? new Date(d.upload_date).toLocaleDateString() : 'N/A'}\n`
        ).join('\n');
        
        addMessage('bot', `📄 Found ${caseData.documents.length} document(s) for case ${targetCaseNumber}:\n\n${docList}\n\nAnything else I can help with?`);
      } else {
        addMessage('bot', `📭 No documents found for case ${targetCaseNumber}.`);
      }
      
      setActiveFlow(null);
    } catch (error) {
      removeThinkingMessage();
      addMessage('bot', `❌ Error: ${error.message}`);
      setActiveFlow(null);
    }
  };

  const handleCheckCalendarFlow = async (userInput) => {
    addThinkingMessage();
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        removeThinkingMessage();
        addMessage('bot', '❌ Authentication required. Please log in first.');
        return;
      }

      const lowerInput = userInput.toLowerCase();
      
      if (lowerInput.includes('today')) {
        const response = await fetch('https://ecourt-yr51.onrender.com/api/calendar/today', {
          headers: { 'Authorization': `Bearer ${token}` },
          method: 'GET'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch calendar');
        }

        const data = await response.json();
        removeThinkingMessage();
        
        const { date, district, is_holiday, holiday_reason, opening_time, closing_time } = data;
        const info = `📅 COURT CALENDAR - TODAY\n━━━━━━━━━━━━━━━━━━━━━\n📆 Date: ${new Date(date).toLocaleDateString()}\n📍 District: ${district}\n\n${
          is_holiday 
            ? `🔴 CLOSED - Holiday${holiday_reason ? `\n📝 Reason: ${holiday_reason}` : ''}` 
            : `🟢 OPEN\n⏰ Timings: ${opening_time} - ${closing_time}`
        }\n\nAnything else I can help with?`;
        
        addMessage('bot', info);
      } else {
        removeThinkingMessage();
        addMessage('bot', '📅 To check court calendar, please type "today" or specify a date.');
      }
    } catch (error) {
      removeThinkingMessage();
      addMessage('bot', `❌ Error: ${error.message}`);
    }
  };

  const handleFindMeetingFlow = async (userInput) => {
    addThinkingMessage();
    try {
     const caseNumMatch = userInput.match(/[A-Z]{2}\d{4}[A-Z]\d{3}/i) || userInput.match(/\b[A-Z0-9]{8,}\b/i) || userInput.match(/\d+/);
      const targetCaseNumber = caseNumMatch ? caseNumMatch[0] : caseNumber;

      if (!targetCaseNumber) {
        removeThinkingMessage();
        addMessage('bot', '📋 Please provide the case number to find the meeting link.\n\nExample: "Meeting link for case ABC123XYZ456"');
        return;
      }

      setCaseNumber(targetCaseNumber);
      const token = localStorage.getItem('token');

      if (!token) {
        removeThinkingMessage();
        addMessage('bot', '❌ Authentication required. Please log in first.');
        return;
      }

      const response = await fetch(
        `https://ecourt-yr51.onrender.com/api/case/${targetCaseNumber}/video-meeting`,
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch meeting details');
      }

      const data = await response.json();
      removeThinkingMessage();

      if (data.meetingLink) {
        const startTime = new Date(data.startDateTime).toLocaleString();
        const endTime = new Date(data.endDateTime).toLocaleString();
        addMessage('bot', `📹 VIRTUAL MEETING DETAILS\n━━━━━━━━━━━━━━━━━━━━━\n📌 Case: ${targetCaseNumber}\n🕐 Start: ${startTime}\n🕑 End: ${endTime}\n🔗 Link: ${data.meetingLink}\n\nClick the link to join the meeting!`);
      } else {
        addMessage('bot', `📭 No virtual meeting scheduled for case ${targetCaseNumber}.`);
      }
    } catch (error) {
      removeThinkingMessage();
      addMessage('bot', `❌ Error: ${error.message}`);
    }
  };

 const handleGeneralQuery = async (userInput) => {
  const prompt = `You are Nova, a helpful legal assistant AI. Answer this question briefly and professionally. Any question quoted in user question which is not related to the legal help provider or services provider simply return "sorry i cant help you with this, ask me only legal advice or case details" , you have to return this quoted response only and not reject the query also warn every time that I'm only an assistent and not a lawyer.
       
User question: "${userInput}"

Keep your response concise (2-3 sentences max) and helpful. If it's a legal question, provide general guidance but remind them to consult a lawyer for specific advice.`;

  try {
    let botIndex;

    setMessages(prev => {
      botIndex = prev.length;
      return [...prev, { type: 'bot', content: '' }];
    });

    await callLlamaStreamingAPI(prompt, (text) => {
      setMessages(prev => {
        const updated = [...prev];
        updated[botIndex] = { type: 'bot', content: text };
        return updated;
      });
    });

  } catch (error) {
    addMessage('bot', 'I’m having trouble right now. Please try again.');
  }
};


  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .thinking-dots span { animation: pulse 1.4s infinite; }
        .thinking-dots span:nth-child(1) { animation-delay: 0s; }
        .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div style={styles.chatbotWrapper}>
        <div style={styles.chatbotIcon} onClick={toggleChatbot}>
          <div style={styles.avatarCircle}>💬</div>
          <div style={styles.chatbotName}>Nova</div>
          {!isOpen && <div style={styles.pulse}></div>}
        </div>
      </div>

      <div style={{...styles.chatbotContainer, ...(isOpen ? styles.chatbotOpen : {})}}>
       <div style={styles.header}>
  <h3 style={styles.headerTitle}>Legal Assistant</h3>
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <button 
      onClick={toggleSpeech} 
      style={styles.speechBtn}
      title={speechEnabled ? "Disable speech" : "Enable speech"}
    >
      {speechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
    <button onClick={toggleChatbot} style={styles.closeBtn}>×</button>
  </div>
</div>

        {isOpen && (
          <>
            <div style={styles.messagesContainer}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  ...styles.message,
                  ...(msg.type === 'user' ? styles.userMessageStyle : styles.botMessageStyle),
                }}>
                  {msg.type === 'thinking' ? (
                    <div className="thinking-dots" style={styles.thinkingDots}>
                      <span style={styles.dot}>●</span>
                      <span style={styles.dot}>●</span>
                      <span style={styles.dot}>●</span>
                    </div>
                  ) : (
                    <div style={{
                      ...styles.messageContent,
                      ...(msg.type === 'user' ? {backgroundColor: '#0066cc', color: 'white'} : {})
                    }}>
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputForm}>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isProcessing}
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              />
              <button 
                onClick={handleSubmit}
                disabled={isProcessing} 
                style={styles.sendBtn}
              >
                {isProcessing ? '⟳' : '→'}
              </button>
            </div>
          </>
        )}
      </div>

      <div
        style={{...styles.backdrop, ...(isOpen ? styles.backdropOpen : {})}}
        onClick={toggleChatbot}
      />
    </>
  );
};

const styles = {
  chatbotWrapper: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 999,
  },
  chatbotIcon: {
    width: '70px',
    height: '70px',
    backgroundColor: '#0066cc',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 102, 204, 0.4)',
    transition: 'all 0.3s ease',
  },
  avatarCircle: {
    fontSize: '32px',
    lineHeight: '1',
  },
  chatbotName: {
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold',
    marginTop: '2px',
  },
  pulse: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    width: '16px',
    height: '16px',
    backgroundColor: '#ff4444',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  chatbotContainer: {
    position: 'fixed',
    bottom: '100px',
    right: '20px',
    width: '400px',
    height: '600px',
    backgroundColor: 'white',
    borderRadius:'12px',
boxShadow: '0 5px 40px rgba(0, 0, 0, 0.16)',
display: 'flex',
flexDirection: 'column',
transform: 'scale(0.95) translateY(20px)',
opacity: 0,
pointerEvents: 'none',
transition: 'all 0.3s ease',
zIndex: 1000,
},
chatbotOpen: {
transform: 'scale(1) translateY(0)',
opacity: 1,
pointerEvents: 'auto',
},
header: {
padding: '16px 20px',
backgroundColor: '#0066cc',
color: 'white',
borderRadius: '12px 12px 0 0',
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
},
headerTitle: {
margin: 0,
fontSize: '18px',
fontWeight: 'bold',
},
closeBtn: {
background: 'none',
border: 'none',
color: 'white',
fontSize: '28px',
cursor: 'pointer',
padding: 0,
},
messagesContainer: {
flex: 1,
overflowY: 'auto',
padding: '16px',
display: 'flex',
flexDirection: 'column',
gap: '12px',
},
message: {
display: 'flex',
marginBottom: '4px',
},
userMessageStyle: {
justifyContent: 'flex-end',
},
botMessageStyle: {
justifyContent: 'flex-start',
},
messageContent: {
maxWidth: '85%',
padding: '12px 14px',
borderRadius: '12px',
wordWrap: 'break-word',
fontSize: '13px',
lineHeight: '1.5',
backgroundColor: '#f0f0f0',
color: '#333',
whiteSpace: 'pre-wrap',
},
thinkingDots: {
display: 'flex',
gap: '6px',
padding: '10px 14px',
backgroundColor: '#f0f0f0',
borderRadius: '12px',
},
dot: {
fontSize: '16px',
color: '#0066cc',
},
inputForm: {
display: 'flex',
gap: '8px',
padding: '12px 16px',
borderTop: '1px solid #e0e0e0',
backgroundColor: '#fff',
borderRadius: '0 0 12px 12px',
},
input: {
flex: 1,
border: '1px solid #ddd',
borderRadius: '20px',
padding: '10px 16px',
fontSize: '13px',
outline: 'none',
fontFamily: 'inherit',
},
sendBtn: {
background: '#0066cc',
border: 'none',
color: 'white',
width: '40px',
height: '40px',
borderRadius: '50%',
cursor: 'pointer',
fontSize: '20px',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
transition: 'background 0.2s',
},
backdrop: {
position: 'fixed',
top: 0,
left: 0,
right: 0,
bottom: 0,
backgroundColor: 'rgba(0, 0, 0, 0.3)',
opacity: 0,
pointerEvents: 'none',
transition: 'opacity 0.3s ease',
zIndex: 999,
},
speechBtn: {
  background: 'rgba(255, 255, 255, 0.2)',
  border: 'none',
  color: 'white',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
},
backdropOpen: {
opacity: 1,
pointerEvents: 'auto',
},
};
export default GeminiLegalAssistantChatbot;