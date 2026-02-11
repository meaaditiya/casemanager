const express = require('express');
const router = express.Router();
const blockchainService = require('../blockchain/services/blockchainService');
const { verifyChain } = require('../blockchain/utils/verification');
const LegalCase = require('../models/LegalCase');
const Clerk = require('../models/Clerk');
const CourtAdmin = require('../models/CourtAdmin');
const blockchain = require('../blockchain/services/blockchain');
const auditService = require('../blockchain/services/auditService');
const Block = require('../blockchain/models/Block');
const { verifyBlockComplete } = require('../blockchain/utils/verification');

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const isAdminOrClerk = (req, res, next) => {
  if (req.user.user_type !== 'clerk' && req.user.user_type !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin or Clerk only' });
  }
  next();
};

/**
 * 🆕 ENHANCED INTEGRITY DASHBOARD
 * Multi-layer verification with security metrics
 */
router.get('/dashboard/integrity', authenticateToken, isAdminOrClerk, async (req, res) => {
  try {
    // Get comprehensive blockchain stats with verification
    const stats = await blockchainService.getBlockchainStats();
    
    // Get tampered blocks
    const tamperedBlocksInfo = await blockchainService.getTamperedBlocks();
    
    // Get district cases
    let districtCases = [];
    if (req.user.user_type === 'clerk') {
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      districtCases = await LegalCase.find({ district: clerk.district })
        .sort({ createdAt: -1 })
        .limit(50);
    } else if (req.user.user_type === 'admin') {
      const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
      districtCases = await LegalCase.find({ 
        'for_office_use_only.court_allotted': admin.court_name 
      }).sort({ createdAt: -1 }).limit(50);
    }
    
    // Verify each case with enhanced verification
    const caseVerifications = [];
    for (const legalCase of districtCases) {
      try {
        const caseVerification = await blockchainService.verifyCaseHistory(legalCase.case_num);
        
        caseVerifications.push({
          case_num: legalCase.case_num,
          case_type: legalCase.case_type,
          status: legalCase.status,
          plaintiff: legalCase.plaintiff_details.name,
          respondent: legalCase.respondent_details.name,
          blockchain_valid: caseVerification.valid,
          blockchain_error: caseVerification.error,
          total_blockchain_entries: caseVerification.history?.length || 0,
          verification_summary: caseVerification.verificationSummary,
          tampering_patterns: caseVerification.tamperingPatterns || [],
          created_at: legalCase.createdAt
        });
      } catch (error) {
        caseVerifications.push({
          case_num: legalCase.case_num,
          blockchain_valid: false,
          blockchain_error: 'No blockchain records found',
          tampering_patterns: []
        });
      }
    }
    
    // Categorize cases by risk
    const criticalCases = caseVerifications.filter(c => 
      c.tampering_patterns?.some(p => p.riskLevel === 'CRITICAL')
    );
    const highRiskCases = caseVerifications.filter(c => 
      c.tampering_patterns?.some(p => p.riskLevel === 'HIGH')
    );
    const validCases = caseVerifications.filter(c => c.blockchain_valid);
    
    res.json({
      success: true,
      
      // Overall blockchain integrity
      integrity: {
        blockchain_status: stats.verification.chainValid ? 'SECURE' : 'COMPROMISED',
        blockchain_valid: stats.verification.chainValid,
        integrity_score: stats.verification.integrityScore,
        total_blocks: stats.totalBlocks,
        latest_block_index: stats.latestBlockIndex,
        network_id: stats.networkId,
        mining_difficulty: stats.difficulty,
        
        // Verification layer summary
        verified_blocks: stats.verification.verifiedBlocks,
        failed_blocks: stats.verification.failedBlocks,
        layer_failures: stats.verification.layerFailures,
        
        // Security features status
        security_features: {
          ipfs_anchored: `${stats.security.ipfsAnchoredBlocks}/${stats.totalBlocks} (${stats.security.ipfsAnchorPercentage}%)`,
          digitally_signed: `${stats.security.signedBlocks}/${stats.totalBlocks} (${stats.security.signaturePercentage}%)`,
          merkle_trees_enabled: true
        }
      },
      
      // District/Court summary
      district_summary: {
        total_cases_checked: caseVerifications.length,
        valid_cases: validCases.length,
        critical_risk_cases: criticalCases.length,
        high_risk_cases: highRiskCases.length,
        cases_without_blockchain: caseVerifications.filter(c => 
          c.blockchain_error === 'No blockchain records found'
        ).length
      },
      
      // Recent cases with verification status
      cases: caseVerifications.slice(0, 20), // Latest 20 for display
      
      // High priority alerts
      critical_cases: criticalCases,
      high_risk_cases: highRiskCases,
      
      // Tampered blocks across entire chain
      tampered_blocks: tamperedBlocksInfo.tamperedBlocks,
      
      // Block distribution by type
      blocks_by_type: stats.blocksByType
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading integrity dashboard',
      error: error.message 
    });
  }
});

/**
 * 🆕 ENHANCED AUDIT TRAIL WITH VERIFICATION DETAILS
 */
router.get('/case/:caseNum/audit-trail', authenticateToken, isAdminOrClerk, async (req, res) => {
  try {
    const { caseNum } = req.params;
    
    const legalCase = await LegalCase.findOne({ case_num: caseNum });
    if (!legalCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    const blocks = await blockchain.getBlocksByEntity(caseNum);
    const currentCase = await LegalCase.findOne({ case_num: caseNum });
    
    const auditTrail = [];
    
    for (const block of blocks) {
      const checkpointVerification = await auditService.verifyAgainstCheckpoint(block);
      
      const allBlocks = await Block.find().sort({ index: 1 });
      const previousBlock = allBlocks.find(b => b.index === block.index - 1);
      
      let chainVerification;
      if (previousBlock) {
        chainVerification = await verifyBlockComplete(
          block, 
          previousBlock, 
          process.env.BLOCKCHAIN_SECRET, 
          parseInt(process.env.BLOCKCHAIN_DIFFICULTY)
        );
      } else {
        chainVerification = { overall: true, note: 'Genesis block', layers: {} };
      }
      
      let action = '';
      let details = {};
      
      switch(block.dataType) {
        case 'case_filing':
          action = '📋 Case Filed';
          details = {
            case_type: block.data.case_type,
            plaintiff: block.data.plaintiff,
            respondent: block.data.respondent,
            court: block.data.court,
            district: block.data.district
          };
          break;
        case 'case_approval':
          action = block.data.approved ? '✅ Case Approved' : '❌ Case Rejected';
          details = { approved: block.data.approved };
          break;
        case 'case_status_update':
          action = '📄 Status Updated';
          details = {
            from: block.data.old_status,
            to: block.data.new_status,
            remarks: block.data.remarks
          };
          break;
        case 'hearing_added':
          action = '⚖️ Hearing Scheduled';
          details = {
            hearing_date: block.data.hearing_date,
            hearing_type: block.data.hearing_type,
            remarks: block.data.remarks
          };
          break;
        case 'document_upload':
          action = '📎 Document Uploaded';
          details = {
            document_type: block.data.document_type,
            file_name: block.data.file_name,
            file_size: block.data.file_size
          };
          break;
        case 'video_meeting_scheduled':
          action = '🎥 Video Meeting Scheduled';
          details = {
            start_time: block.data.start_time,
            end_time: block.data.end_time
          };
          break;
        case 'advocate_verification':
          action = '👨‍⚖️ Advocate Verification';
          details = {
            advocate_id: block.data.advocate_id,
            verified: block.data.verified
          };
          break;
        default:
          action = '📋 Other Action';
          details = block.data;
      }
      
      auditTrail.push({
        sequence: auditTrail.length + 1,
        block_index: block.index,
        action,
        details,
        timestamp: block.timestamp,
        performed_by: block.userId,
        user_type: block.userType,
        
        verification: {
          checkpoint: checkpointVerification,
          chain: chainVerification,
          overall: checkpointVerification.verified && chainVerification.overall,
          issues: [
            ...(checkpointVerification.discrepancies || []),
            ...(chainVerification.failedLayers ? 
              Object.entries(chainVerification.layers)
                .filter(([_, v]) => !v.valid)
                .map(([layer, v]) => ({ layer, ...v })) 
              : [])
          ]
        },
        
        blockchain_hash: block.hash,
        previous_hash: block.previousHash,
        merkle_root: block.merkleRoot,
        
        ipfs_anchor: block.ipfs?.cid ? {
          cid: block.ipfs.cid,
          url: `https://ipfs.io/ipfs/${block.ipfs.cid}`,
          anchored_at: block.ipfs.anchoredAt
        } : null,
        
        digital_signature: block.signature?.value ? {
          algorithm: block.signature.algorithm,
          fingerprint: block.signature.publicKeyFingerprint
        } : null
      });
    }
    
    res.json({
      success: true,
      case_num: caseNum,
      
      blockchain_verified: auditTrail.every(a => a.verification.overall),
      
      current_case_data: {
        status: legalCase.status,
        plaintiff: legalCase.plaintiff_details.name,
        respondent: legalCase.respondent_details.name,
        case_approved: legalCase.case_approved
      },
      
      total_entries: auditTrail.length,
      audit_trail: auditTrail,
      
      verification_summary: {
        total_blocks: auditTrail.length,
        verified_blocks: auditTrail.filter(a => a.verification.overall).length,
        failed_blocks: auditTrail.filter(a => !a.verification.overall).length,
        critical_issues: auditTrail.filter(a => 
          a.verification.issues.some(i => i.severity === 'CRITICAL')
        ).length
      }
    });
    
  } catch (error) {
    console.error('Audit trail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading audit trail',
      error: error.message 
    });
  }
});

/**
 * 🆕 FIXED TAMPERING DETECTION ROUTE
 * Now properly checks blockchain integrity AND compares with database
 * If audit trail shows tampering, this will catch it
 */
// REAL FIX - The problem is in the response structure
// Replace lines 336-628 in blockchainRoutes.js

router.get('/case/:caseNum/verify', authenticateToken, isAdminOrClerk, async (req, res) => {
  try {
    const { caseNum } = req.params;
    
    const legalCase = await LegalCase.findOne({ case_num: caseNum });
    if (!legalCase) {
      return res.status(404).json({ 
        success: false,
        message: 'Case not found' 
      });
    }
    
    const verification = await blockchainService.verifyCaseHistory(caseNum);
    
    if (!verification.history || verification.history.length === 0) {
      return res.json({
        success: true,
        case_num: caseNum,
        verification_status: 'NO_BLOCKCHAIN_RECORDS',
        message: 'No blockchain records found for comparison',
        blockchain_integrity: { valid: false, reason: 'No blockchain history' },
        discrepancies: [],
        current_case_data: {
          plaintiff: legalCase.plaintiff_details.name,
          respondent: legalCase.respondent_details.name,
          case_approved: legalCase.case_approved,
          case_type: legalCase.case_type,
          status: legalCase.status
        }
      });
    }
    
    const blockchainTampered = verification.history.some(h => 
      h.verification && !h.verification.overall
    );
    
    const criticalTampering = verification.history.some(h => 
      h.verification && h.verification.criticalFailures > 0
    );
    
    if (blockchainTampered) {
      const tamperedBlocks = verification.history
        .filter(h => h.verification && !h.verification.overall)
        .map(h => ({
          blockIndex: h.index,
          blockHash: h.hash,
          timestamp: h.timestamp,
          dataType: h.dataType,
          failedLayers: h.verification.failedLayers,
          criticalFailures: h.verification.criticalFailures,
          layerDetails: h.verification.layers
        }));
      
      return res.json({
        success: true,
        case_num: caseNum,
        verification_status: criticalTampering ? 'CRITICAL_BLOCKCHAIN_TAMPERING' : 'BLOCKCHAIN_TAMPERING',
        alert: {
          severity: criticalTampering ? 'CRITICAL' : 'HIGH',
          message: criticalTampering 
            ? '🚨 CRITICAL: Blockchain records have been tampered with'
            : '⚠️ WARNING: Blockchain integrity issues detected',
          action_required: 'IMMEDIATE INVESTIGATION REQUIRED'
        },
        blockchain_integrity: {
          valid: false,
          tampering_detected: true,
          total_blocks: verification.totalBlocks,
          tampered_blocks: tamperedBlocks.length,
          verification_summary: verification.verificationSummary,
          tampering_patterns: verification.tamperingPatterns || []
        },
        tampered_blocks: tamperedBlocks,
        current_case_data: {
          plaintiff: legalCase.plaintiff_details.name,
          respondent: legalCase.respondent_details.name,
          case_approved: legalCase.case_approved,
          case_type: legalCase.case_type,
          status: legalCase.status,
          warning: 'Database data may not be trustworthy - blockchain compromised'
        },
        discrepancies: [{
          severity: 'CRITICAL',
          message: 'Cannot perform database comparison - blockchain integrity compromised',
          recommendation: 'Investigate blockchain tampering first, then verify database accuracy'
        }]
      });
    }
    
    // ✅ THE REAL FIX: Build a proper blockchain state snapshot
    const discrepancies = [];
    
    // Get original filing
    const originalFiling = verification.history.find(h => h.dataType === 'case_filing');
    
    // Get LATEST status
    const statusUpdates = verification.history
      .filter(h => h.dataType === 'case_status_update')
      .sort((a, b) => b.index - a.index); // Sort by block index descending
    const latestStatusBlock = statusUpdates[0];
    
    // Get LATEST approval
    const approvalEntries = verification.history
      .filter(h => h.dataType === 'case_approval')
      .sort((a, b) => b.index - a.index);
    const latestApprovalBlock = approvalEntries[0];
    
    // ✅ Build the EXPECTED blockchain state (what database SHOULD have)
    const expectedBlockchainState = {
      plaintiff: originalFiling?.data?.plaintiff || 'Unknown',
      respondent: originalFiling?.data?.respondent || 'Unknown',
      case_type: originalFiling?.data?.case_type || 'Unknown',
      status: latestStatusBlock?.data?.new_status || 'Filed', // ✅ LATEST status, not filing status
      case_approved: latestApprovalBlock?.data?.approved || false
    };
    
    // ✅ Compare with database
    // Plaintiff (immutable)
    if (expectedBlockchainState.plaintiff !== legalCase.plaintiff_details.name) {
      discrepancies.push({
        field: 'Plaintiff Name',
        blockchain_value: expectedBlockchainState.plaintiff,
        database_value: legalCase.plaintiff_details.name,
        severity: 'CRITICAL',
        block_index: originalFiling?.index || 'N/A',
        message: 'Plaintiff name is immutable'
      });
    }
    
    // Respondent (immutable)
    if (expectedBlockchainState.respondent !== legalCase.respondent_details.name) {
      discrepancies.push({
        field: 'Respondent Name',
        blockchain_value: expectedBlockchainState.respondent,
        database_value: legalCase.respondent_details.name,
        severity: 'CRITICAL',
        block_index: originalFiling?.index || 'N/A',
        message: 'Respondent name is immutable'
      });
    }
    
    // Case type (immutable)
    if (expectedBlockchainState.case_type !== legalCase.case_type) {
      discrepancies.push({
        field: 'Case Type',
        blockchain_value: expectedBlockchainState.case_type,
        database_value: legalCase.case_type,
        severity: 'HIGH',
        block_index: originalFiling?.index || 'N/A',
        message: 'Case type is immutable'
      });
    }
    
    // ✅ Status (mutable - compare with LATEST)
    if (expectedBlockchainState.status !== legalCase.status) {
      discrepancies.push({
        field: 'Case Status',
        blockchain_value: expectedBlockchainState.status, // ✅ This will be "Hearing in Progress"
        database_value: legalCase.status,
        severity: 'CRITICAL',
        block_index: latestStatusBlock?.index || 'N/A',
        message: 'Current status does not match latest blockchain record'
      });
    }
    
    // ✅ Approval (mutable - compare with LATEST)
    if (latestApprovalBlock && expectedBlockchainState.case_approved !== legalCase.case_approved) {
      discrepancies.push({
        field: 'Case Approval Status',
        blockchain_value: expectedBlockchainState.case_approved,
        database_value: legalCase.case_approved,
        severity: 'CRITICAL',
        block_index: latestApprovalBlock?.index || 'N/A',
        message: 'Approval status does not match latest blockchain record'
      });
    }
    
    // Determine status
    let verificationStatus = 'VERIFIED';
    if (discrepancies.length > 0) {
      const hasCritical = discrepancies.some(d => d.severity === 'CRITICAL');
      verificationStatus = hasCritical ? 'CRITICAL_DATABASE_TAMPERING' : 'DISCREPANCY_DETECTED';
    }
    
    // ✅ Return with correct blockchain state
    res.json({
      success: true,
      case_num: caseNum,
      verification_status: verificationStatus,
      
      alert: discrepancies.length > 0 ? {
        severity: discrepancies.some(d => d.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
        message: discrepancies.some(d => d.severity === 'CRITICAL')
          ? '🚨 CRITICAL: Database has been tampered with'
          : '⚠️ WARNING: Discrepancies found between database and blockchain',
        action_required: 'Investigate discrepancies immediately'
      } : null,
      
      discrepancies: discrepancies,
      discrepancy_count: discrepancies.length,
      
      blockchain_integrity: {
        valid: verification.valid,
        total_blocks: verification.totalBlocks,
        verification_summary: verification.verificationSummary,
        tampering_patterns: verification.tamperingPatterns || [],
        message: 'Blockchain integrity verified - records are trustworthy'
      },
      
      // Current database values
      current_case_data: {
        plaintiff: legalCase.plaintiff_details.name,
        respondent: legalCase.respondent_details.name,
        case_approved: legalCase.case_approved,
        case_type: legalCase.case_type,
        status: legalCase.status
      },
      
      // ✅ Expected blockchain state (what database SHOULD have)
      expected_blockchain_state: expectedBlockchainState,
      
      // Block details for reference
      original_filing_block: originalFiling ? {
        block_index: originalFiling.index,
        timestamp: originalFiling.timestamp,
        plaintiff: originalFiling.data.plaintiff,
        respondent: originalFiling.data.respondent,
        case_type: originalFiling.data.case_type
      } : null,
      
      latest_status_block: latestStatusBlock ? {
        block_index: latestStatusBlock.index,
        timestamp: latestStatusBlock.timestamp,
        old_status: latestStatusBlock.data.old_status,
        new_status: latestStatusBlock.data.new_status,
        remarks: latestStatusBlock.data.remarks
      } : null,
      
      latest_approval_block: latestApprovalBlock ? {
        block_index: latestApprovalBlock.index,
        timestamp: latestApprovalBlock.timestamp,
        approved: latestApprovalBlock.data.approved
      } : null
    });
    
  } catch (error) {
    console.error('Tampering verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying case tampering',
      error: error.message 
    });
  }
});

/**
 * 🆕 FULL BLOCKCHAIN SCAN
 * Comprehensive verification of entire chain
 */
router.post('/verify/full-scan', authenticateToken, isAdminOrClerk, async (req, res) => {
  try {
    console.log('🔍 Starting full blockchain scan...');
    
    // Verify entire blockchain
    const chainVerification = await blockchainService.verifyBlockchainIntegrity();
    
    if (!chainVerification.valid) {
      return res.json({
        success: true,
        scan_result: 'FAILED',
        message: 'Blockchain integrity compromised',
        integrity_score: chainVerification.integrityScore,
        verification_details: chainVerification,
        recommendation: 'CRITICAL: Immediate investigation required. Multiple blocks failed verification.'
      });
    }
    
    // Get all cases for this clerk/admin
    let allCases = [];
    if (req.user.user_type === 'clerk') {
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      allCases = await LegalCase.find({ district: clerk.district });
    } else if (req.user.user_type === 'admin') {
      const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
      allCases = await LegalCase.find({ 
        'for_office_use_only.court_allotted': admin.court_name 
      });
    }
    
    const issues = [];
    let scannedCount = 0;
    let validCount = 0;
    let criticalIssues = 0;
    let highIssues = 0;
    
    for (const legalCase of allCases) {
      scannedCount++;
      try {
        const caseVerification = await blockchainService.verifyCaseHistory(legalCase.case_num);
        
        if (caseVerification.valid && 
            caseVerification.verificationSummary?.allLayersValid === caseVerification.totalBlocks) {
          validCount++;
        } else if (!caseVerification.valid) {
          const severity = caseVerification.tamperingPatterns?.some(p => p.riskLevel === 'CRITICAL') 
            ? 'CRITICAL' 
            : 'HIGH';
          
          if (severity === 'CRITICAL') criticalIssues++;
          else highIssues++;
          
          issues.push({
            case_num: legalCase.case_num,
            case_type: legalCase.case_type,
            plaintiff: legalCase.plaintiff_details.name,
            issue_type: 'INTEGRITY_FAILURE',
            description: caseVerification.error || 'Blockchain verification failed',
            severity: severity,
            tampering_patterns: caseVerification.tamperingPatterns || [],
            verification_summary: caseVerification.verificationSummary
          });
        }
      } catch (error) {
        issues.push({
          case_num: legalCase.case_num,
          issue_type: 'MISSING_BLOCKCHAIN_DATA',
          description: 'No blockchain records found for this case',
          severity: 'MEDIUM'
        });
      }
    }
    
    const scanResult = criticalIssues > 0 ? 'CRITICAL_ISSUES' :
                       highIssues > 0 ? 'HIGH_ISSUES' :
                       issues.length > 0 ? 'MINOR_ISSUES' : 'PASSED';
    
    res.json({
      success: true,
      scan_result: scanResult,
      
      scan_summary: {
        total_cases_scanned: scannedCount,
        valid_cases: validCount,
        cases_with_critical_issues: criticalIssues,
        cases_with_high_issues: highIssues,
        cases_with_minor_issues: issues.length - criticalIssues - highIssues,
        scan_timestamp: new Date()
      },
      
      blockchain_integrity: {
        chain_valid: chainVerification.valid,
        integrity_score: chainVerification.integrityScore,
        total_blocks: chainVerification.totalBlocks,
        verified_blocks: chainVerification.verifiedBlocks,
        failed_blocks: chainVerification.failedBlocks
      },
      
      issues: issues.sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      
      recommendation: criticalIssues > 0 
        ? `CRITICAL: Found ${criticalIssues} case(s) with critical integrity issues. Immediate investigation required.`
        : highIssues > 0
        ? `WARNING: Found ${highIssues} case(s) with high-priority issues. Review recommended.`
        : issues.length > 0
        ? `INFO: Found ${issues.length} case(s) with minor issues. Regular monitoring recommended.`
        : 'All cases verified successfully. Blockchain integrity intact.'
    });
    
  } catch (error) {
    console.error('Full scan error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error performing full scan',
      error: error.message 
    });
  }
});

/**
 * 🆕 SECURITY ALERTS
 * Real-time tampering detection alerts
 */
router.get('/alerts', authenticateToken, isAdminOrClerk, async (req, res) => {
  try {
    const alerts = [];
    
    // Check overall blockchain integrity
    const chainVerification = await blockchainService.verifyBlockchainIntegrity();
    
    if (!chainVerification.valid) {
      alerts.push({
        id: 'blockchain_integrity_failure',
        severity: 'CRITICAL',
        title: '🚨 Blockchain Integrity Compromised',
        message: `Chain validation failed. Integrity score: ${chainVerification.integrityScore}%`,
        details: {
          failed_blocks: chainVerification.failedBlocks,
          layer_failures: chainVerification.summary
        },
        timestamp: new Date(),
        action_required: 'IMMEDIATE: Investigation required - blockchain may be compromised'
      });
    }
    
    // Get tampered blocks
    const tamperedBlocksInfo = await blockchainService.getTamperedBlocks();
    
    if (tamperedBlocksInfo.count > 0) {
      for (const tamperedBlock of tamperedBlocksInfo.tamperedBlocks.slice(0, 10)) {
        alerts.push({
          id: `tampered_block_${tamperedBlock.blockIndex}`,
          severity: tamperedBlock.tamperingPatterns.riskLevel || 'HIGH',
          title: `⚠️ Block ${tamperedBlock.blockIndex} - Tampering Detected`,
          message: `Entity: ${tamperedBlock.entityId}`,
          details: {
            failed_layers: tamperedBlock.failedLayers,
            critical_failures: tamperedBlock.criticalFailures,
            tampering_patterns: tamperedBlock.tamperingPatterns.detected
          },
          timestamp: new Date(),
          action_required: 'Investigate block integrity immediately'
        });
      }
    }
    
    // Check recent cases for tampering
    let recentCases = [];
    if (req.user.user_type === 'clerk') {
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      recentCases = await LegalCase.find({ district: clerk.district })
        .sort({ createdAt: -1 })
        .limit(100);
    } else if (req.user.user_type === 'admin') {
      const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
      recentCases = await LegalCase.find({ 
        'for_office_use_only.court_allotted': admin.court_name 
      }).sort({ createdAt: -1 }).limit(100);
    }
    
    for (const legalCase of recentCases) {
      try {
        const caseVerification = await blockchainService.verifyCaseHistory(legalCase.case_num);
        
        if (!caseVerification.valid && caseVerification.tamperingPatterns?.length > 0) {
          const highestRisk = caseVerification.tamperingPatterns.reduce((max, p) => 
            p.riskLevel === 'CRITICAL' ? p : max.riskLevel === 'CRITICAL' ? max : p
          );
          
          alerts.push({
            id: `case_tampered_${legalCase.case_num}`,
            severity: highestRisk.riskLevel,
            title: `⚠️ Case ${legalCase.case_num} - ${highestRisk.patterns[0]?.type || 'Tampering Detected'}`,
            message: highestRisk.patterns[0]?.description || 'Blockchain verification failed',
            case_num: legalCase.case_num,
            details: {
              tampering_patterns: highestRisk.patterns,
              verification_summary: caseVerification.verificationSummary
            },
            timestamp: new Date(),
            action_required: 'Verify case data manually and investigate discrepancies'
          });
        }
      } catch (error) {
        // Skip cases without blockchain records
      }
    }
    
    res.json({
      success: true,
      total_alerts: alerts.length,
      critical_alerts: alerts.filter(a => a.severity === 'CRITICAL').length,
      high_alerts: alerts.filter(a => a.severity === 'HIGH').length,
      medium_alerts: alerts.filter(a => a.severity === 'MEDIUM').length,
      alerts: alerts.sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }).slice(0, 50) // Limit to 50 most important alerts
    });
    
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading alerts',
      error: error.message 
    });
  }
});

/**
 * 🆕 VERIFY SPECIFIC BLOCK
 * Deep dive into a single block's verification
 */
router.get('/block/:blockIndex/verify', authenticateToken, isAdminOrClerk, async (req, res) => {
  try {
    const blockIndex = parseInt(req.params.blockIndex);
    const verification = await blockchainService.verifySpecificBlock(blockIndex);
    
    res.json({
      success: true,
      ...verification
    });
    
  } catch (error) {
    console.error('Block verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying block',
      error: error.message 
    });
  }
});

/**
 * 🆕 GET BLOCKCHAIN STATISTICS
 * Comprehensive blockchain stats and metrics
 */
router.get('/stats', authenticateToken, isAdminOrClerk, async (req, res) => {
  try {
    const stats = await blockchainService.getBlockchainStats();
    
    res.json({
      success: true,
      ...stats
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading blockchain stats',
      error: error.message 
    });
  }
});

module.exports = router;