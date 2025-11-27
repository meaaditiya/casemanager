import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/Advocatecasefile.css';

const AdvocateCaseFiling = ({ setActiveSection, advocateData }) => {
  // Initial form state
  const initialFormData = {
    court: 'District & Sessions Court',
    case_type: 'Civil',
    representing_party: 'plaintiff', // New field to track which party the advocate represents
    plaintiff_details: {
      party_id: '', // Added party_id field
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
      advocate_id: advocateData?.advocate_id || '',
      advocate: advocateData?.name || ''
    },
    respondent_details: {
      party_id: '', // Added party_id field
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
      fir_year: new Date().getFullYear(),
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
    status: 'Filed',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Update advocate details when advocateData changes
  useEffect(() => {
    if (advocateData) {
      setFormData(prevState => {
        const updatedData = { ...prevState };
        
        if (prevState.representing_party === 'plaintiff') {
          updatedData.plaintiff_details.advocate_id = advocateData.advocate_id || '';
          updatedData.plaintiff_details.advocate = advocateData.name || '';
          // Clear respondent advocate details if they exist
          updatedData.respondent_details.advocate_id = '';
          updatedData.respondent_details.advocate = '';
        } else {
          updatedData.respondent_details.advocate_id = advocateData.advocate_id || '';
          updatedData.respondent_details.advocate = advocateData.name || '';
          // Clear plaintiff advocate details if they exist
          updatedData.plaintiff_details.advocate_id = '';
          updatedData.plaintiff_details.advocate = '';
        }
        
        return updatedData;
      });
    }
  }, [advocateData, formData.representing_party]);

  // Handle change for top-level form fields
  const handleTopLevelChange = (field, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: value
    }));
  };

  // Handle change for nested form fields
  const handleNestedChange = (parent, field, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [parent]: {
        ...prevState[parent],
        [field]: value
      }
    }));
  };

  // Handle representing party change
  const handleRepresentingPartyChange = (value) => {
    setFormData(prevState => {
      const updatedData = { ...prevState, representing_party: value };
      
      // Update advocate details based on selected party
      if (value === 'plaintiff') {
        updatedData.plaintiff_details.advocate_id = advocateData?.advocate_id || '';
        updatedData.plaintiff_details.advocate = advocateData?.name || '';
        // Clear respondent advocate details
        updatedData.respondent_details.advocate_id = '';
        updatedData.respondent_details.advocate = '';
      } else {
        updatedData.respondent_details.advocate_id = advocateData?.advocate_id || '';
        updatedData.respondent_details.advocate = advocateData?.name || '';
        // Clear plaintiff advocate details
        updatedData.plaintiff_details.advocate_id = '';
        updatedData.plaintiff_details.advocate = '';
      }
      
      return updatedData;
    });
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      // Make API call to file the case
      const response = await axios.post(
        'https://ecourt-yr51.onrender.com/api/filecase/advocate',
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setFormSuccess(`Case filed successfully. Case Number: ${response.data.case_num}`);
      // Reset form after successful submission
      setTimeout(() => {
        if (typeof setActiveSection === 'function') {
          setActiveSection('dashboard');
        } else {
          console.error('setActiveSection is not a function');
          // Fallback handling if setActiveSection is not available
          // Maybe redirect or show a message to the user
        }
      }, 3000);
    } catch (error) {
      setFormError(
        error.response?.data?.message || 'Error filing case. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advocate-case-filing-container">
      <h2 className="page-title">File New Case as Advocate</h2>
      
      <form onSubmit={handleFormSubmit} className="case-filing-form">
        <div className="form-section">
          <h3>Basic Case Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Court</label>
              <select
                value={formData.court}
                onChange={(e) => handleTopLevelChange('court', e.target.value)}
                required
              >
                <option value="District & Sessions Court">District & Sessions Court</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Case Type</label>
              <select
                value={formData.case_type}
                onChange={(e) => handleTopLevelChange('case_type', e.target.value)}
                required
              >
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
              </select>
            </div>
            <div className="form-group">
              <label>You are representing</label>
              <select
                value={formData.representing_party}
                onChange={(e) => handleRepresentingPartyChange(e.target.value)}
                required
              >
                <option value="plaintiff">Plaintiff/Applicant</option>
                <option value="respondent">Respondent/Opponent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Plaintiff Details</h3>
          <div className="form-grid">
            {/* Added Party ID field for plaintiff */}
            <div className="form-group">
              <label>Party ID (Optional)</label>
              <input
                type="text"
                value={formData.plaintiff_details.party_id}
                onChange={(e) => handleNestedChange('plaintiff_details', 'party_id', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.plaintiff_details.name}
                onChange={(e) => handleNestedChange('plaintiff_details', 'name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Father/Mother/Husband</label>
              <input
                type="text"
                value={formData.plaintiff_details.father_mother_husband}
                onChange={(e) =>
                  handleNestedChange('plaintiff_details', 'father_mother_husband', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.plaintiff_details.address}
                onChange={(e) => handleNestedChange('plaintiff_details', 'address', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>PIN Code</label>
              <input
                type="text"
                value={formData.plaintiff_details.pin}
                onChange={(e) => handleNestedChange('plaintiff_details', 'pin', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Sex</label>
              <select
                value={formData.plaintiff_details.sex}
                onChange={(e) => handleNestedChange('plaintiff_details', 'sex', e.target.value)}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={formData.plaintiff_details.age}
                onChange={(e) => handleNestedChange('plaintiff_details', 'age', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Caste</label>
              <input
                type="text"
                value={formData.plaintiff_details.caste}
                onChange={(e) => handleNestedChange('plaintiff_details', 'caste', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <select
                value={formData.plaintiff_details.nationality}
                onChange={(e) =>
                  handleNestedChange('plaintiff_details', 'nationality', e.target.value)
                }
                required
              >
                <option value="Indian">Indian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.plaintiff_details.nationality === 'Other' && (
              <div className="form-group">
                <label>Specify Nationality</label>
                <input
                  type="text"
                  value={formData.plaintiff_details.if_other_mention}
                  onChange={(e) =>
                    handleNestedChange('plaintiff_details', 'if_other_mention', e.target.value)
                  }
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Occupation</label>
              <input
                type="text"
                value={formData.plaintiff_details.occupation}
                onChange={(e) =>
                  handleNestedChange('plaintiff_details', 'occupation', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.plaintiff_details.email}
                onChange={(e) => handleNestedChange('plaintiff_details', 'email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.plaintiff_details.phone}
                onChange={(e) => handleNestedChange('plaintiff_details', 'phone', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input
                type="text"
                value={formData.plaintiff_details.mobile}
                onChange={(e) => handleNestedChange('plaintiff_details', 'mobile', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Fax</label>
              <input
                type="text"
                value={formData.plaintiff_details.fax}
                onChange={(e) => handleNestedChange('plaintiff_details', 'fax', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={formData.plaintiff_details.subject}
                onChange={(e) => handleNestedChange('plaintiff_details', 'subject', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Advocate ID</label>
              <input
                type="text"
                value={formData.plaintiff_details.advocate_id}
                onChange={(e) =>
                  handleNestedChange('plaintiff_details', 'advocate_id', e.target.value)
                }
                readOnly={formData.representing_party === 'plaintiff'}
                disabled={formData.representing_party === 'plaintiff'}
              />
              {formData.representing_party === 'plaintiff' && (
                <small className="form-info">Auto-filled with your advocate ID</small>
              )}
            </div>
            <div className="form-group">
              <label>Advocate Name</label>
              <input
                type="text"
                value={formData.plaintiff_details.advocate}
                onChange={(e) => handleNestedChange('plaintiff_details', 'advocate', e.target.value)}
                readOnly={formData.representing_party === 'plaintiff'}
                disabled={formData.representing_party === 'plaintiff'}
              />
              {formData.representing_party === 'plaintiff' && (
                <small className="form-info">Auto-filled with your name</small>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Respondent Details</h3>
          <div className="form-grid">
            {/* Added Party ID field for respondent */}
            <div className="form-group">
              <label>Party ID (Optional)</label>
              <input
                type="text"
                value={formData.respondent_details.party_id}
                onChange={(e) => handleNestedChange('respondent_details', 'party_id', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.respondent_details.name}
                onChange={(e) => handleNestedChange('respondent_details', 'name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Father/Mother/Husband</label>
              <input
                type="text"
                value={formData.respondent_details.father_mother_husband}
                onChange={(e) =>
                  handleNestedChange('respondent_details', 'father_mother_husband', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.respondent_details.address}
                onChange={(e) => handleNestedChange('respondent_details', 'address', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>PIN Code</label>
              <input
                type="text"
                value={formData.respondent_details.pin}
                onChange={(e) => handleNestedChange('respondent_details', 'pin', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Sex</label>
              <select
                value={formData.respondent_details.sex}
                onChange={(e) => handleNestedChange('respondent_details', 'sex', e.target.value)}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={formData.respondent_details.age}
                onChange={(e) => handleNestedChange('respondent_details', 'age', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Caste</label>
              <input
                type="text"
                value={formData.respondent_details.caste}
                onChange={(e) => handleNestedChange('respondent_details', 'caste', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <select
                value={formData.respondent_details.nationality}
                onChange={(e) =>
                  handleNestedChange('respondent_details', 'nationality', e.target.value)
                }
                required
              >
                <option value="Indian">Indian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.respondent_details.nationality === 'Other' && (
              <div className="form-group">
                <label>Specify Nationality</label>
                <input
                  type="text"
                  value={formData.respondent_details.if_other_mention}
                  onChange={(e) =>
                    handleNestedChange('respondent_details', 'if_other_mention', e.target.value)
                  }
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Occupation</label>
              <input
                type="text"
                value={formData.respondent_details.occupation}
                onChange={(e) =>
                  handleNestedChange('respondent_details', 'occupation', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.respondent_details.email}
                onChange={(e) => handleNestedChange('respondent_details', 'email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.respondent_details.phone}
                onChange={(e) => handleNestedChange('respondent_details', 'phone', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input
                type="text"
                value={formData.respondent_details.mobile}
                onChange={(e) => handleNestedChange('respondent_details', 'mobile', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Fax</label>
              <input
                type="text"
                value={formData.respondent_details.fax}
                onChange={(e) => handleNestedChange('respondent_details', 'fax', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={formData.respondent_details.subject}
                onChange={(e) => handleNestedChange('respondent_details', 'subject', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Advocate ID</label>
              <input
                type="text"
                value={formData.respondent_details.advocate_id}
                onChange={(e) =>
                  handleNestedChange('respondent_details', 'advocate_id', e.target.value)
                }
                readOnly={formData.representing_party === 'respondent'}
                disabled={formData.representing_party === 'respondent'}
              />
              {formData.representing_party === 'respondent' && (
                <small className="form-info">Auto-filled with your advocate ID</small>
              )}
            </div>
            <div className="form-group">
              <label>Advocate Name</label>
              <input
                type="text"
                value={formData.respondent_details.advocate}
                onChange={(e) => handleNestedChange('respondent_details', 'advocate', e.target.value)}
                readOnly={formData.representing_party === 'respondent'}
                disabled={formData.representing_party === 'respondent'}
              />
              {formData.representing_party === 'respondent' && (
                <small className="form-info">Auto-filled with your name</small>
              )}
            </div>
          </div>
        </div>

        {/* Police Station Details (Only for Criminal Cases) */}
        {formData.case_type === 'Criminal' && (
          <div className="form-section">
            <h3>Police Station Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Police Station</label>
                <input
                  type="text"
                  value={formData.police_station_details.police_station}
                  onChange={(e) =>
                    handleNestedChange('police_station_details', 'police_station', e.target.value)
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>FIR Number</label>
                <input
                  type="text"
                  value={formData.police_station_details.fir_no}
                  onChange={(e) =>
                    handleNestedChange('police_station_details', 'fir_no', e.target.value)
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>FIR Year</label>
                <input
                  type="number"
                  value={formData.police_station_details.fir_year}
                  onChange={(e) =>
                    handleNestedChange('police_station_details', 'fir_year', e.target.value)
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Offence</label>
                <input
                  type="date"
                  value={formData.police_station_details.date_of_offence}
                  onChange={(e) =>
                    handleNestedChange('police_station_details', 'date_of_offence', e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Lower Court Details */}
        <div className="form-section">
          <h3>Lower Court Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Court Name</label>
              <input
                type="text"
                value={formData.lower_court_details.court_name}
                onChange={(e) =>
                  handleNestedChange('lower_court_details', 'court_name', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Case Number</label>
              <input
                type="text"
                value={formData.lower_court_details.case_no}
                onChange={(e) =>
                  handleNestedChange('lower_court_details', 'case_no', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Decision Date</label>
              <input
                type="date"
                value={formData.lower_court_details.decision_date}
                onChange={(e) =>
                  handleNestedChange('lower_court_details', 'decision_date', e.target.value)
                }
                required
              />
            </div>
          </div>
        </div>

        {/* Main Matter Details */}
        <div className="form-section">
          <h3>Main Matter Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Case Type</label>
              <input
                type="text"
                value={formData.main_matter_details.case_type}
                onChange={(e) =>
                  handleNestedChange('main_matter_details', 'case_type', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Case Number</label>
              <input
                type="text"
                value={formData.main_matter_details.case_no}
                onChange={(e) =>
                  handleNestedChange('main_matter_details', 'case_no', e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                value={formData.main_matter_details.year}
                onChange={(e) =>
                  handleNestedChange('main_matter_details', 'year', e.target.value)
                }
                required
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        {formError && <div className="error-message">{formError}</div>}
        {formSuccess && <div className="success-message">{formSuccess}</div>}
        {loading && <div className="loading-message">Processing your case submission...</div>}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Filing Case...' : 'File Case'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof setActiveSection === 'function') {
                setActiveSection('dashboard');
              } else {
                console.error('setActiveSection is not a function');
                // Fallback handling - maybe show a message to the user
                setFormError('Navigation error. Please try again or refresh the page.');
              }
            }}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvocateCaseFiling;