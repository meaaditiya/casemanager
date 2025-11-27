import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const VideoRecorder = ({ caseNum, token }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, recording, preview, uploading, success, error
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  
  const startRecording = async () => {
    try {
      setStatus('recording');
      setRecordedChunks([]);
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: true 
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setStatus('error');
      setErrorMessage("Cannot access camera and microphone. Please check permissions.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      clearInterval(timerRef.current);
      
      // Stop camera and mic usage
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      videoRef.current.srcObject = null;
      setStatus('preview');
    }
  };
  
  const handleUpload = async () => {
    if (recordedChunks.length === 0 || !videoBlob) {
      setStatus('error');
      setErrorMessage("No video recorded. Please record a video first.");
      return;
    }
    
    if (!title.trim()) {
      setStatus('error');
      setErrorMessage("Title is required.");
      return;
    }
    
    try {
      setStatus('uploading');
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('videoFile', videoBlob, 'recorded-video.webm');
      formData.append('title', title);
      formData.append('description', description);
      
      const response = await axios.post(
        `http://localhost:5000/api/case/${caseNum}/video-pleading`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      setStatus('success');
      setTimeout(() => resetComponent(), 5000);
    } catch (err) {
      console.error("Error uploading video:", err);
      setStatus('error');
      setErrorMessage(err.response?.data?.message || "Failed to upload video. Please try again.");
    }
  };
  
  const resetComponent = () => {
    setRecordedChunks([]);
    setVideoBlob(null);
    setPreviewUrl('');
    setTitle('');
    setDescription('');
    setStatus('idle');
    setErrorMessage('');
    setRecordingTime(0);
    setUploadProgress(0);
    
    // Revoke object URL to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
  
  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    resetComponent();
  };
  
  useEffect(() => {
    // Clean up on component unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  useEffect(() => {
    // Process recorded chunks when recording stops
    if (recordedChunks.length > 0 && !isRecording && status === 'preview') {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm'
      });
      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }
  }, [recordedChunks, isRecording, status]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      width: '100%',
      maxWidth: '600px',
      padding: '20px',
      margin: '0 auto',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#f9f9f9'
    }}>
      <h2 style={{
        textAlign: 'center',
        color: '#2c3e50',
        marginBottom: '20px'
      }}>Video Pleading Recorder</h2>
      
      {/* Video display area */}
      <div style={{
        width: '100%',
        height: '320px',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '20px'
      }}>
        <video 
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: status === 'preview' ? 'none' : 'block'
          }}
          autoPlay
          muted={status !== 'preview'}
        />
        
        {status === 'preview' && previewUrl && (
          <video
            src={previewUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            controls
            autoPlay
          />
        )}
        
        {status === 'recording' && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              backgroundColor: '#f00',
              borderRadius: '50%',
              marginRight: '8px'
            }}></span>
            <span>{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {status === 'idle' && (
          <button 
            onClick={startRecording}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Start Recording
          </button>
        )}
        
        {status === 'recording' && (
          <>
            <button 
              onClick={stopRecording}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Stop Recording
            </button>
            <button 
              onClick={cancelRecording}
              style={{
                padding: '10px 20px',
                backgroundColor: '#7f8c8d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          </>
        )}
        
        {status === 'preview' && (
          <>
            <button 
              onClick={startRecording}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Record Again
            </button>
            <button 
              onClick={cancelRecording}
              style={{
                padding: '10px 20px',
                backgroundColor: '#7f8c8d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
      
      {/* Form fields for uploading */}
      {status === 'preview' && (
        <div style={{
          marginBottom: '20px'
        }}>
          <div style={{
            marginBottom: '15px'
          }}>
            <label 
              htmlFor="title"
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your video pleading"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '16px'
              }}
              required
            />
          </div>
          
          <div style={{
            marginBottom: '15px'
          }}>
            <label 
              htmlFor="description"
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description (optional)"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '16px',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <button 
            onClick={handleUpload}
            style={{
              padding: '10px 20px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              width: '100%'
            }}
          >
            Upload Video Pleading
          </button>
        </div>
      )}
      
      {/* Upload progress */}
      {status === 'uploading' && (
        <div style={{
          marginTop: '20px'
        }}>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#ecf0f1',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${uploadProgress}%`,
              backgroundColor: '#3498db',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{
            textAlign: 'center',
            marginTop: '10px',
            color: '#7f8c8d'
          }}>
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
      
      {/* Success message */}
      {status === 'success' && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>
            Video pleading uploaded successfully!
          </p>
        </div>
      )}
      
      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>
            {errorMessage}
          </p>
          <button 
            onClick={() => setStatus('idle')}
            style={{
              padding: '5px 10px',
              backgroundColor: 'transparent',
              color: '#721c24',
              border: '1px solid #721c24',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px',
              fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* File size information */}
      {videoBlob && status === 'preview' && (
        <p style={{
          textAlign: 'center',
          color: '#7f8c8d',
          fontSize: '14px',
          marginTop: '10px'
        }}>
          Video size: {(videoBlob.size / (1024 * 1024)).toFixed(2)} MB
          {videoBlob.size > 50 * 1024 * 1024 && (
            <span style={{ color: '#e74c3c', display: 'block' }}>
              Warning: File exceeds 50MB limit!
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default VideoRecorder;
