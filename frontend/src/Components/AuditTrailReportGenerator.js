import React, { useState } from 'react';
import axios from 'axios';
import '../ComponentsCSS/admincase.css';

const AuditTrailReportGenerator = ({ caseData, onClose, showLoadingOverlay, hideLoadingOverlay }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'severity-critical';
      case 'HIGH':
        return 'severity-high';
      case 'MEDIUM':
        return 'severity-medium';
      case 'LOW':
        return 'severity-low';
      default:
        return '';
    }
  };

 const fetchCompleteReportData = async () => {
  try {
    setLoading(true);
    showLoadingOverlay('generating_report', 'Compiling audit trail and verification data...');  // ADD THIS LINE
    
    const token = localStorage.getItem('token');
  
      // Fetch audit trail
      const auditResponse = await axios.get(
        `http://localhost:5000/api/blockchain/case/${caseData.case_num}/audit-trail`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch verification report
      const verificationResponse = await axios.get(
        `http://localhost:5000/api/blockchain/case/${caseData.case_num}/verify`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const completeData = {
        audit: auditResponse.data,
        verification: verificationResponse.data,
      };

      setReportData(completeData);
    setShowReport(true);
    
    hideLoadingOverlay();  // ADD THIS LINE
    setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.response?.data?.message || 'Failed to fetch report data');
      
      hideLoadingOverlay();  // ADD THIS LINE
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <>
      <button
        className="blockchain-btn blockchain-btn--report"
        onClick={fetchCompleteReportData}
        disabled={loading}
      >
        {loading ? 'Generating Report...' : 'Generate Audit Report'}
      </button>

      {error && (
        <div className="report-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showReport && reportData && (
        <div className="report-modal-overlay" onClick={onClose}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header no-print">
              <h2>Comprehensive Case Audit Trail Report</h2>
              <div className="report-actions">
                <button className="print-btn" onClick={handlePrintReport}>
                  Print to PDF
                </button>
                 <button className="close-btn" onClick={() => { setShowReport(false); if (onClose) onClose(); }}>
                  Close
                </button>
              </div>
            </div>

            <div className="report-content" id="printable-report">
              {/* ==================== HEADER ==================== */}
              <div className="report-header">
                <h1 className="report-main-title">DISTRICT COURT</h1>
                <h2 className="report-district-name">
                  {(caseData.district_name || caseData.district || 'DISTRICT NAME').toUpperCase()}
                </h2>
                <h3 className="report-title">COMPREHENSIVE CASE AUDIT TRAIL REPORT</h3>
                <div className="report-divider"></div>
              </div>

              {/* ==================== ENTITY INFORMATION ==================== */}
              <div className="report-section">
                <h4 className="section-title">ENTITY: CASE NUMBER - {caseData.case_num}</h4>
                
                <table className="report-table">
                  <tbody>
                    <tr>
                      <td className="label-col">Case Number:</td>
                      <td className="value-col">{caseData.case_num || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Case Type:</td>
                      <td className="value-col">{caseData.case_type || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Filing Date:</td>
                      <td className="value-col">{formatDate(caseData.created_at)}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Current Status:</td>
                      <td className="value-col">{caseData.status || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ==================== PARTIES TO THE CASE ==================== */}
              <div className="report-section">
                <h4 className="section-title">PARTIES TO THE CASE</h4>
                
                <table className="report-table">
                  <tbody>
                    <tr>
                      <td className="label-col">Petitioner/Plaintiff:</td>
                      <td className="value-col">{caseData.plaintiff_details?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Contact Number:</td>
                      <td className="value-col">{caseData.plaintiff_details?.mobile || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Address:</td>
                      <td className="value-col">{caseData.plaintiff_details?.address || 'N/A'}</td>
                    </tr>
                    <tr><td colSpan="2" style={{height: '10px'}}></td></tr>
                    <tr>
                      <td className="label-col">Respondent/Defendant:</td>
                      <td className="value-col">{caseData.respondent_details?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Contact Number:</td>
                      <td className="value-col">{caseData.respondent_details?.mobile || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="label-col">Address:</td>
                      <td className="value-col">{caseData.respondent_details?.address || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ==================== CASE MATTER ==================== */}
              <div className="report-section">
                <h4 className="section-title">MATTER/SUBJECT</h4>
                <p className="matter-text">
                  {caseData.case_title || caseData.case_matter || caseData.case_description || 'N/A'}
                </p>
              </div>

              <div className="report-divider"></div>

              {/* ==================== RECORD VERIFICATION STATUS ==================== */}
              <div className="report-section">
                <h4 className="section-title">RECORD VERIFICATION STATUS</h4>
                
                <table className="report-table">
                  <tbody>
                    <tr>
                      <td className="label-col">Verification Status:</td>
                      <td className="value-col">
                        {reportData.audit.blockchain_verified
                          ? 'VERIFIED - All records authenticated and tamper-proof'
                          : 'VERIFICATION ISSUES DETECTED - See details below'}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-col">Total Audit Entries:</td>
                      <td className="value-col">{reportData.audit.total_entries || 0}</td>
                    </tr>
                    {reportData.audit.verification_summary && (
                      <>
                        <tr>
                          <td className="label-col">Total Records:</td>
                          <td className="value-col">{reportData.audit.verification_summary.total_blocks || 0}</td>
                        </tr>
                        <tr>
                          <td className="label-col">Verified Records:</td>
                          <td className="value-col">{reportData.audit.verification_summary.verified_blocks || 0}</td>
                        </tr>
                        <tr>
                          <td className="label-col">Failed Verification:</td>
                          <td className="value-col">{reportData.audit.verification_summary.failed_blocks || 0}</td>
                        </tr>
                        <tr>
                          <td className="label-col">Critical Issues:</td>
                          <td className="value-col">{reportData.audit.verification_summary.critical_issues || 0}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="report-divider"></div>

              {/* ==================== COMPLETE AUDIT TRAIL ==================== */}
              <div className="report-section">
                <h4 className="section-title">COMPLETE AUDIT TRAIL</h4>
                
                {reportData.audit.audit_trail && reportData.audit.audit_trail.length > 0 ? (
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th style={{width: '40px'}}>#</th>
                        <th style={{width: '120px'}}>Action</th>
                        <th style={{width: '110px'}}>Date & Time</th>
                        <th style={{width: '90px'}}>User</th>
                        <th style={{width: '70px'}}>User Type</th>
                        <th style={{width: '70px'}}>Status</th>
                        <th style={{width: '60px'}}>Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.audit.audit_trail.map((entry, index) => (
                        <tr key={index}>
                          <td>{entry.sequence || index + 1}</td>
                          <td>{entry.action || 'N/A'}</td>
                          <td>{formatDateTime(entry.timestamp)}</td>
                          <td>{entry.performed_by || 'N/A'}</td>
                          <td>{entry.user_type || 'N/A'}</td>
                          <td>{entry.verification?.overall ? 'Verified' : 'Failed'}</td>
                          <td>{entry.verification?.issues?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data">No audit trail entries found.</p>
                )}
              </div>

              <div className="page-break"></div>

              {/* ==================== DETAILED AUDIT ENTRIES ==================== */}
              <div className="report-section">
                <h4 className="section-title">DETAILED AUDIT ENTRIES</h4>
                
                {reportData.audit.audit_trail && reportData.audit.audit_trail.length > 0 ? (
                  <div className="detailed-entries">
                    {reportData.audit.audit_trail.map((entry, index) => (
                      <div key={index} className="audit-entry-detail">
                        <div className="entry-header">
                          <span className="entry-number">Entry #{entry.sequence || index + 1}</span>
                          <span className="entry-action">{entry.action || 'N/A'}</span>
                        </div>
                        
                        <table className="entry-table">
                          <tbody>
                            <tr>
                              <td className="label-col">Date & Time:</td>
                              <td className="value-col">{formatDateTime(entry.timestamp)}</td>
                            </tr>
                            <tr>
                              <td className="label-col">Performed By:</td>
                              <td className="value-col">{entry.performed_by || 'N/A'} ({entry.user_type || 'N/A'})</td>
                            </tr>
                            <tr>
                              <td className="label-col">Record Index:</td>
                              <td className="value-col">#{entry.block_index || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="label-col">Verification Status:</td>
                              <td className="value-col">
                                {entry.verification?.overall ? '✓ Verified' : '✗ Failed'}
                              </td>
                            </tr>
                            <tr>
                              <td className="label-col">Cryptographic Hash:</td>
                              <td className="value-col hash-value">
                                {entry.blockchain_hash || 'N/A'}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <div className="entry-details">
                            <strong>Details:</strong>
                            <ul>
                              {Object.entries(entry.details).map(([key, value]) => (
                                <li key={key}>
                                  <span className="detail-key">{key}:</span>{' '}
                                  <span className="detail-value">{value?.toString() || 'N/A'}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {entry.verification?.issues && entry.verification.issues.length > 0 && (
                          <div className="entry-issues">
                            <strong>Issues Detected:</strong>
                            <ul>
                              {entry.verification.issues.map((issue, idx) => (
                                <li key={idx} className={getSeverityClass(issue.severity)}>
                                  [{issue.severity}] {issue.field || issue.layer}: {issue.error || issue.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No detailed entries available.</p>
                )}
              </div>

              <div className="page-break"></div>

              {/* ==================== DATA INTEGRITY VERIFICATION ==================== */}
              <div className="report-section">
                <h4 className="section-title">DATA INTEGRITY VERIFICATION REPORT</h4>
                
                {reportData.verification.verification_status === 'VERIFIED' ||
                (reportData.verification.discrepancies && reportData.verification.discrepancies.length === 0) ? (
                  <div className="verification-success">
                    <p className="success-message">
                      ✓ NO DISCREPANCIES FOUND - All case data is intact and verified.
                    </p>
                    <table className="report-table">
                      <tbody>
                        <tr>
                          <td className="label-col">Integrity Score:</td>
                          <td className="value-col">
                            {reportData.verification.blockchain_integrity?.integrity_score || '100'}%
                          </td>
                        </tr>
                        <tr>
                          <td className="label-col">Verification Date:</td>
                          <td className="value-col">{formatDateTime(new Date())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="verification-issues">
                    <p className="warning-message">
                      ⚠ {reportData.verification.discrepancy_count || reportData.verification.discrepancies?.length || 0} 
                      {' '}DISCREPANCY(IES) DETECTED
                    </p>
                    
                    {reportData.verification.discrepancies && reportData.verification.discrepancies.length > 0 && (
                      <table className="discrepancy-table">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Original Value</th>
                            <th>Current Value</th>
                            <th>Severity</th>
                            <th>Record</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.verification.discrepancies.map((disc, index) => (
                            <tr key={index} className={getSeverityClass(disc.severity)}>
                              <td><strong>{disc.field}</strong></td>
                              <td>{disc.blockchain_value?.toString() || 'N/A'}</td>
                              <td>{disc.database_value?.toString() || 'N/A'}</td>
                              <td>{disc.severity}</td>
                              <td>#{disc.block_index || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportData.verification.blockchain_integrity && (
                      <div className="integrity-analysis">
                        <strong>Integrity Analysis:</strong>
                        <table className="report-table">
                          <tbody>
                            <tr>
                              <td className="label-col">Total Records:</td>
                              <td className="value-col">{reportData.verification.blockchain_integrity.total_blocks}</td>
                            </tr>
                            <tr>
                              <td className="label-col">Verified Records:</td>
                              <td className="value-col">
                                {reportData.verification.blockchain_integrity.verification_summary?.allLayersValid || 0}
                              </td>
                            </tr>
                            <tr>
                              <td className="label-col">Failed Records:</td>
                              <td className="value-col">
                                {reportData.verification.blockchain_integrity.verification_summary?.invalid || 0}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="recommended-actions">
                      <strong>RECOMMENDED ACTIONS:</strong>
                      <ol>
                        <li>Lock case for editing to prevent further modifications</li>
                        <li>Notify senior administrator about the discrepancies</li>
                        <li>Create detailed incident report</li>
                        <li>Consider restoring data from verified records</li>
                        <li>Review access logs for unauthorized changes</li>
                        <li>If CRITICAL severity, escalate to system security team immediately</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* ==================== REPORT FOOTER ==================== */}
              <div className="report-footer">
                <div className="report-divider"></div>
                <p className="footer-text">
                  This is a computer-generated report from the Court Administration System.
                </p>
                <p className="footer-text">
                  Generated on: {formatDateTime(new Date())}
                </p>
                <p className="footer-text">
                  Report ID: AUDIT-{caseData.case_num}-{new Date().getTime()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .blockchain-btn--report {
          background-color: #2c3e50;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .blockchain-btn--report:hover:not(:disabled) {
          background-color: #34495e;
        }

        .blockchain-btn--report:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .report-error {
          background-color: #fee;
          border: 1px solid #fcc;
          padding: 10px;
          margin-top: 10px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .report-error p {
          margin: 0;
          color: #c33;
        }

        .report-error button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #c33;
        }

        .report-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 20px;
        }

        .report-modal {
          background: white;
          width: 95%;
          max-width: 1200px;
          max-height: 90vh;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .report-modal-header {
          background-color: #2c3e50;
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .report-modal-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .report-actions {
          display: flex;
          gap: 10px;
        }

        .print-btn,
        .close-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .print-btn {
          background-color: #27ae60;
          color: white;
        }

        .print-btn:hover {
          background-color: #229954;
        }

        .close-btn {
          background-color: #e74c3c;
          color: white;
        }

        .close-btn:hover {
          background-color: #c0392b;
        }

        .report-content {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
          background: white;
        }

        /* ==================== REPORT STYLES ==================== */
        .report-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .report-main-title {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 8px 0;
          letter-spacing: 1px;
        }

        .report-district-name {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 15px 0;
        }

        .report-title {
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 10px 0;
        }

        .report-divider {
          border-bottom: 2px solid #000;
          margin: 20px 0;
        }

        .report-section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 12px;
          font-weight: bold;
          margin: 0 0 12px 0;
          text-decoration: underline;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 11px;
        }

        .report-table td {
          padding: 6px 8px;
          border: 1px solid #ddd;
        }

        .label-col {
          font-weight: bold;
          width: 200px;
          background-color: #f9f9f9;
        }

        .value-col {
          width: auto;
        }

        .matter-text {
          font-size: 11px;
          line-height: 1.6;
          margin: 0;
          padding: 10px;
          border: 1px solid #ddd;
          background-color: #f9f9f9;
        }

        .audit-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          margin-bottom: 15px;
        }

        .audit-table th,
        .audit-table td {
          padding: 6px 4px;
          border: 1px solid #000;
          text-align: left;
        }

        .audit-table th {
          background-color: #e0e0e0;
          font-weight: bold;
        }

        .no-data {
          font-size: 11px;
          font-style: italic;
          color: #666;
          padding: 15px;
          text-align: center;
          border: 1px solid #ddd;
        }

        .detailed-entries {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .audit-entry-detail {
          border: 1px solid #000;
          padding: 15px;
          page-break-inside: avoid;
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ddd;
        }

        .entry-number {
          font-size: 11px;
          font-weight: bold;
        }

        .entry-action {
          font-size: 11px;
          font-weight: bold;
        }

        .entry-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          margin-bottom: 10px;
        }

        .entry-table td {
          padding: 4px 8px;
          border: 1px solid #ddd;
        }

        .hash-value {
          font-family: monospace;
          font-size: 9px;
          word-break: break-all;
        }

        .entry-details,
        .entry-issues {
          margin-top: 10px;
          font-size: 10px;
        }

        .entry-details ul,
        .entry-issues ul {
          margin: 5px 0;
          padding-left: 20px;
        }

        .entry-details li,
        .entry-issues li {
          margin: 3px 0;
        }

        .detail-key {
          font-weight: bold;
        }

        .verification-success {
          border: 2px solid #27ae60;
          padding: 15px;
          background-color: #f0f9f4;
        }

        .success-message {
          font-size: 12px;
          font-weight: bold;
          color: #27ae60;
          margin: 0 0 15px 0;
        }

        .verification-issues {
          border: 2px solid #e74c3c;
          padding: 15px;
          background-color: #fef5f5;
        }

        .warning-message {
          font-size: 12px;
          font-weight: bold;
          color: #e74c3c;
          margin: 0 0 15px 0;
        }

        .discrepancy-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          margin: 15px 0;
        }

        .discrepancy-table th,
        .discrepancy-table td {
          padding: 6px 4px;
          border: 1px solid #000;
          text-align: left;
        }

        .discrepancy-table th {
          background-color: #e0e0e0;
          font-weight: bold;
        }

        .severity-critical {
          background-color: #fee !important;
        }

        .severity-high {
          background-color: #fff3cd !important;
        }

        .severity-medium {
          background-color: #fff9e6 !important;
        }

        .severity-low {
          background-color: #f0f9ff !important;
        }

        .integrity-analysis {
          margin: 15px 0;
          font-size: 10px;
        }

        .recommended-actions {
          margin-top: 15px;
          font-size: 10px;
        }

        .recommended-actions ol {
          margin: 5px 0;
          padding-left: 25px;
        }

        .recommended-actions li {
          margin: 5px 0;
          line-height: 1.5;
        }

        .report-footer {
          margin-top: 40px;
          page-break-inside: avoid;
        }

        .footer-text {
          font-size: 10px;
          text-align: center;
          margin: 5px 0;
          color: #666;
        }

        .page-break {
          page-break-after: always;
        }

        /* ==================== PRINT STYLES ==================== */
        @media print {
          .no-print {
            display: none !important;
          }

          .report-content {
            padding: 20px;
          }

          .report-modal {
            max-height: none;
            width: 100%;
            max-width: none;
          }

          .page-break {
            page-break-after: always;
          }

          .audit-entry-detail,
          .report-section {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
};

export default AuditTrailReportGenerator;