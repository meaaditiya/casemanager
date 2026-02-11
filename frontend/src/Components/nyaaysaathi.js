import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Volume2, VolumeX, FileText, Calendar, Gavel, Users, Search, Square, Copy, Check } from 'lucide-react';
import '../ComponentsCSS/nyaaysaathi.css';

const NyaySaathi = () => {
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      content: 'Namaste! I am Nyay Saathi, your comprehensive legal intelligence assistant. I provide expert legal advice, guidance on procedures, and strategic legal recommendations based on Indian law.\n\nI can help you with:\n• Legal Advice & Guidance on Indian Laws\n• Understanding Legal Procedures (IPC, CrPC, CPC)\n• Bail, Evidence, and Court Procedures\n• Legal Rights & Responsibilities\n• Case Strategy Recommendations\n• Document Requirements\n• Filing Procedures\n• Constitutional Matters\n\n⚠️ Important Disclaimer:\n• I provide legal information and guidance only\n• I cannot access personal case details or information\n• I am NOT a replacement for a qualified lawyer\n• For case-specific advice, consult your advocate\n• I only answer legal-related questions\n\nWhat legal advice do you need today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [abortController, setAbortController] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    
    return () => {
      stopSpeech();
    };
  }, []);

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakMessage = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    stopSpeech();
    
    const cleanText = text
      .replace(/[━─═•→]+/g, '')
      .replace(/[📋📌👤📧📱🏠👥📝✅❌🔔📭📄🎉🔗📹🕐🕑📅📍📎🟢🔴⏰⚖️📖💼🔍🔬🏛️💡]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-IN';
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.lang.includes('en')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (isSpeaking) stopSpeech();
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const addMessage = (type, content) => {
    setMessages(prev => [...prev, { type, content, timestamp: new Date() }]);
    if (type === 'bot' && speechEnabled) {
      setTimeout(() => speakMessage(content), 300);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsProcessing(false);
    }
  };

  // ==================== LEGAL QUESTION VALIDATION ====================
  const isLegalQuestion = (query) => {
    const legalKeywords = [
      'case', 'court', 'judge', 'advocate', 'lawyer', 'legal', 'law', 'petition', 'appeal',
      'trial', 'evidence', 'witness', 'bail', 'arrest', 'complaint', 'fir', 'charge',
      'sentence', 'judgment', 'verdict', 'hearing', 'testimony', 'prosecution', 'defense',
      'ipc', 'crpc', 'cpc', 'constitution', 'section', 'article', 'act', 'code',
      'indian penal code', 'criminal procedure', 'civil procedure', 'bharatiya',
      'file', 'filing', 'sue', 'lawsuit', 'litigation', 'dispute', 'claim', 'rights',
      'duty', 'obligation', 'contract', 'agreement', 'violation', 'offense', 'crime',
      'supreme court', 'high court', 'district court', 'magistrate', 'sessions court',
      'tribunal', 'jurisdiction', 'bench', 'counsel',
      'compensation', 'damages', 'injunction', 'writ', 'habeas corpus', 'mandamus',
      'certiorari', 'prohibition', 'quo warranto',
      'divorce', 'property', 'inheritance', 'will', 'custody', 'maintenance', 'alimony',
      'cheque bounce', 'defamation', 'harassment', 'domestic violence', 'dowry',
      'consumer', 'tenant', 'landlord', 'employment', 'labour', 'accident',
      'affidavit', 'deed', 'power of attorney', 'notice', 'summons', 'warrant',
      'plaint', 'written statement', 'vakalatnama',
      'fundamental rights', 'legal rights', 'constitutional rights', 'human rights',
      'right to', 'privacy', 'freedom', 'equality', 'justice'
    ];

    const nonLegalKeywords = [
      'recipe', 'cooking', 'food', 'weather', 'movie', 'film', 'music', 'song',
      'game', 'sport', 'cricket', 'football', 'travel', 'hotel', 'restaurant',
      'programming', 'code', 'python', 'java', 'javascript', 'software',
      'math', 'calculate', 'add', 'subtract', 'multiply', 'divide',
      'joke', 'story', 'poem', 'write me', 'tell me a story'
    ];

    const lowerQuery = query.toLowerCase();
    const hasNonLegal = nonLegalKeywords.some(k => lowerQuery.includes(k));
    if (hasNonLegal) return false;
    const hasLegal = legalKeywords.some(k => lowerQuery.includes(k));
    return hasLegal;
  };

  // ==================== LLAMA API WITH STREAMING ====================
  const callLlamaStreamingAPI = async (prompt, onToken, controller) => {
    try {
      const response = await fetch("http://localhost:5000/api/llama/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("Failed to connect to backend API");
      }

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
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Generation stopped by user');
      }
      throw new Error(`API Error: ${error.message}`);
    }
  };

  // ==================== LEGAL ADVICE HANDLER ====================
  const handleLegalAdvice = async (userInput) => {
    const legalPrompt = `You are Nyay Saathi, an expert Indian legal assistant with comprehensive knowledge of Indian law, including IPC (Indian Penal Code), CrPC (Criminal Procedure Code), CPC (Civil Procedure Code), and Indian Constitution.

STRICT INSTRUCTIONS:
1. You ONLY answer questions related to Indian law, legal procedures, rights, and legal advice
2. If the question is NOT related to legal matters, respond EXACTLY with: "I apologize, but I can only assist with legal advice and guidance related to Indian law. Please ask me a legal question, and I'll be happy to help."
3. For legal questions, provide detailed, accurate, and authentic information based on Indian legal framework
4. Always cite relevant sections, articles, or legal provisions when applicable (e.g., "Section 420 IPC", "Article 21 of Constitution")
5. Provide practical, step-by-step advice while reminding users to consult a qualified lawyer for their specific case
6. Use clear, professional language accessible to non-lawyers
7. Structure your response with proper formatting for readability
8. Include warnings about limitations and the importance of professional legal counsel
9. Provide comprehensive explanations covering:
   - Legal provisions applicable
   - Procedures to follow
   - Rights of the parties involved
   - Potential outcomes
   - Timelines (if applicable)
   - Required documents
   - Practical recommendations

USER QUESTION: "${userInput}"

ANALYSIS:
First, determine if this is a legal question. If NO, use the rejection response above. If YES, provide comprehensive, rigorous, and authentic legal guidance with specific legal references.

YOUR DETAILED RESPONSE:`;

    const controller = new AbortController();
    setAbortController(controller);

    try {
      let botMessageIndex;
      
      setMessages(prev => {
        botMessageIndex = prev.length;
        return [...prev, { type: 'bot', content: '', timestamp: new Date(), isGenerating: true }];
      });

      await callLlamaStreamingAPI(legalPrompt, (streamedText) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[botMessageIndex] = { 
            type: 'bot', 
            content: streamedText,
            timestamp: updated[botMessageIndex].timestamp,
            isGenerating: true
          };
          return updated;
        });
        scrollToBottom();
      }, controller);

      setMessages(prev => {
        const updated = [...prev];
        if (updated[botMessageIndex]) {
          updated[botMessageIndex].isGenerating = false;
        }
        return updated;
      });

      if (speechEnabled) {
        const finalMessage = messages[botMessageIndex]?.content || '';
        setTimeout(() => speakMessage(finalMessage), 300);
      }

    } catch (error) {
      if (error.message !== 'Generation stopped by user') {
        addMessage('bot', `❌ I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.\n\nError: ${error.message}`);
      }
    } finally {
      setAbortController(null);
    }
  };

  // ==================== MAIN SUBMIT HANDLER ====================
  const handleSubmit = () => {
    if (!inputValue.trim() || isProcessing) return;

    const userInput = inputValue.trim();
    addMessage('user', userInput);
    setInputValue('');
    setIsProcessing(true);

    if (!isLegalQuestion(userInput)) {
      setIsProcessing(false);
      addMessage('bot', '⚖️ I apologize, but I can only assist with legal advice and guidance related to Indian law.\n\nI specialize in:\n• Indian Penal Code (IPC)\n• Criminal Procedure Code (CrPC)\n• Civil Procedure Code (CPC)\n• Constitutional Law\n• Legal Rights & Procedures\n• Court Processes\n• Legal Documentation\n• Bail & Evidence Laws\n• Property & Family Law\n• Consumer Protection\n\nPlease ask me a legal question, and I\'ll provide comprehensive guidance with specific legal references.');
      return;
    }

    setTimeout(async () => {
      try {
        await handleLegalAdvice(userInput);
      } catch (error) {
        if (error.message !== 'Generation stopped by user') {
          addMessage('bot', `⚠️ Error: ${error.message}\n\nPlease try again or rephrase your question.`);
        }
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="nyaysaathi-container">
      <div className="nyaysaathi-header">
        <div className="header-left">
          <Gavel className="header-icon" />
          <div className="header-text">
            <h1>Nyay Saathi</h1>
            <p>Advanced Legal Intelligence Assistant</p>
          </div>
        </div>
        <div className="header-right">
          <button 
            onClick={toggleSpeech} 
            className={`speech-toggle ${speechEnabled ? 'active' : ''}`}
            title={speechEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {speechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      <div className="nyaysaathi-main">
        <div className="messages-area" ref={messagesContainerRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.type}`}>
              <div className={`message-bubble ${msg.type}`}>
                {msg.type === 'bot' && <div className="bot-avatar">⚖️</div>}
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  {msg.type === 'bot' && msg.content && (
                    <div className="message-actions">
                      <button 
                        onClick={() => copyToClipboard(msg.content, i)}
                        className="action-btn"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === i ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      {msg.isGenerating && (
                        <button 
                          onClick={stopGeneration}
                          className="action-btn stop-btn"
                          title="Stop generating"
                        >
                          <Square size={16} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  )}
                  {msg.timestamp && (
                    <div className="message-time">
                      {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="quick-actions">
            <button onClick={() => setInputValue('What is Section 420 IPC?')} className="quick-btn">
              <FileText size={16} />
              IPC Sections
            </button>
            <button onClick={() => setInputValue('How to file a case in court?')} className="quick-btn">
              <Calendar size={16} />
              File Case
            </button>
            <button onClick={() => setInputValue('What are bail procedures in India?')} className="quick-btn">
              <Users size={16} />
              Bail Info
            </button>
            <button onClick={() => setInputValue('Legal rights during arrest')} className="quick-btn">
              <Search size={16} />
              Legal Rights
            </button>
          </div>
          
          <div className="input-form">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about Indian laws, legal procedures, rights, court processes..."
              disabled={isProcessing}
              className="message-input"
              rows="1"
            />
            <button 
              onClick={isProcessing ? stopGeneration : handleSubmit}
              disabled={!isProcessing && !inputValue.trim()} 
              className={`send-button ${isProcessing ? 'stop-mode' : ''}`}
              title={isProcessing ? 'Stop generating' : 'Send message'}
            >
              {isProcessing ? (
                <Square size={18} fill="currentColor" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NyaySaathi;