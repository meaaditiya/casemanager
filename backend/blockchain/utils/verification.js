const Block = require('../models/Block');
const { cryptoService } = require('./crypto');
const ipfsService = require('../services/ipfsService');
const auditService = require('../services/auditService');
const securityAudit = require('./securityAudit');
/**
 * LAYER 1: Basic Hash Chain Verification
 */
const verifyBlock = (block, previousBlock, secret, difficulty) => {
  if (block.index !== previousBlock.index + 1) {
    return { 
      valid: false, 
      error: 'Invalid block index',
      layer: 'HASH_CHAIN',
      severity: 'CRITICAL'
    };
  }

  if (block.previousHash !== previousBlock.hash) {
    return { 
      valid: false, 
      error: 'Invalid previous hash - chain broken',
      layer: 'HASH_CHAIN',
      severity: 'CRITICAL'
    };
  }

  const calculatedHash = block.merkleRoot 
    ? cryptoService.calculateHashWithMerkle(
        block.index,
        block.previousHash,
        block.timestamp,
        block.data,
        block.nonce,
        secret,
        block.merkleRoot
      )
    : cryptoService.calculateHash(
        block.index,
        block.previousHash,
        block.timestamp,
        block.data,
        block.nonce,
        secret
      );

  if (block.hash !== calculatedHash) {
    return { 
      valid: false, 
      error: 'Block hash mismatch - data tampered',
      layer: 'HASH_CHAIN',
      severity: 'CRITICAL',
      details: {
        stored: block.hash,
        calculated: calculatedHash
      }
    };
  }

  const requiredPrefix = '0'.repeat(difficulty);
  if (!block.hash.startsWith(requiredPrefix)) {
    return { 
      valid: false, 
      error: 'Hash does not meet difficulty requirement',
      layer: 'HASH_CHAIN',
      severity: 'HIGH'
    };
  }

  return { valid: true, layer: 'HASH_CHAIN' };
};

/**
 * LAYER 2: Merkle Root Verification
 */
const verifyMerkleRoot = (block) => {
  if (!block.merkleRoot) {
    return {
      valid: false,
      error: 'Block missing merkle root',
      layer: 'MERKLE_TREE',
      severity: 'MEDIUM',
      note: 'Old block format without merkle tree'
    };
  }

  try {
    const calculatedMerkleRoot = cryptoService.createMerkleRoot(block.data);

    if (block.merkleRoot !== calculatedMerkleRoot) {
      return {
        valid: false,
        error: 'Merkle root mismatch - transaction data tampered',
        layer: 'MERKLE_TREE',
        severity: 'CRITICAL',
        details: {
          stored: block.merkleRoot,
          calculated: calculatedMerkleRoot
        }
      };
    }

    return { valid: true, layer: 'MERKLE_TREE' };

  } catch (error) {
    return {
      valid: false,
      error: `Merkle verification failed: ${error.message}`,
      layer: 'MERKLE_TREE',
      severity: 'HIGH'
    };
  }
};

/**
 * LAYER 3: Digital Signature Verification
 */
const verifyDigitalSignature = (block) => {
  if (!block.signature || !block.signature.value) {
    return {
      valid: false,
      error: 'Block not signed',
      layer: 'DIGITAL_SIGNATURE',
      severity: 'MEDIUM',
      note: 'Block created before signature implementation'
    };
  }

  try {
    const signatureCheck = cryptoService.verifySignature(block, block.signature.value);

    if (!signatureCheck.valid) {
      return {
        valid: false,
        error: 'Digital signature invalid - block tampered after signing',
        layer: 'DIGITAL_SIGNATURE',
        severity: 'CRITICAL',
        details: signatureCheck
      };
    }

    if (block.signature.publicKeyFingerprint && cryptoService.publicKeyFingerprint) {
      if (block.signature.publicKeyFingerprint !== cryptoService.publicKeyFingerprint) {
        return {
          valid: false,
          error: 'Public key fingerprint mismatch',
          layer: 'DIGITAL_SIGNATURE',
          severity: 'HIGH',
          details: {
            stored: block.signature.publicKeyFingerprint,
            current: cryptoService.publicKeyFingerprint
          }
        };
      }
    }

    return { valid: true, layer: 'DIGITAL_SIGNATURE' };

  } catch (error) {
    return {
      valid: false,
      error: `Signature verification failed: ${error.message}`,
      layer: 'DIGITAL_SIGNATURE',
      severity: 'HIGH'
    };
  }
};

/**
 * LAYER 4: IPFS Anchor Verification
 */
const verifyIPFSAnchor = async (block) => {
  if (!block.ipfs || !block.ipfs.cid) {
    return {
      valid: false,
      error: 'Block not anchored to IPFS',
      layer: 'IPFS_ANCHOR',
      severity: 'MEDIUM',
      note: 'Block created before IPFS anchoring implementation'
    };
  }

  try {
    const ipfsVerification = await ipfsService.verifyBlockAgainstIPFS(block);

    if (!ipfsVerification.verified) {
      return {
        valid: false,
        error: ipfsVerification.error || 'IPFS anchor mismatch - external proof failed',
        layer: 'IPFS_ANCHOR',
        severity: 'CRITICAL',
        details: {
          ipfsCid: block.ipfs.cid,
          discrepancies: ipfsVerification.discrepancies
        }
      };
    }

    return { 
      valid: true, 
      layer: 'IPFS_ANCHOR',
      ipfsCid: block.ipfs.cid,
      ipfsUrl: ipfsVerification.ipfsUrl
    };

  } catch (error) {
    return {
      valid: false,
      error: `IPFS verification failed: ${error.message}`,
      layer: 'IPFS_ANCHOR',
      severity: 'HIGH'
    };
  }
};

/**
 * 🆕 LAYER 5: IMMUTABLE AUDIT CHECKPOINT (ULTIMATE DEFENSE)
 * This is the MOST CRITICAL layer - detects ALL tampering
 */
const verifyAuditCheckpoint = async (block) => {
  try {
    const checkpointVerification = await auditService.verifyAgainstCheckpoint(block);

    if (!checkpointVerification.checkpoint) {
      await securityAudit.logTamperingAttempt({
        blockIndex: block.index,
        entityId: block.entityId,
        discrepancies: checkpointVerification.discrepancies,
        message: 'Block does not match immutable checkpoint'
      });
      return {
        valid: false,
        error: 'No audit checkpoint found',
        layer: 'AUDIT_CHECKPOINT',
        severity: 'MEDIUM',
        note: 'Block created before audit system'
      };
    }

    if (!checkpointVerification.verified) {
      return {
        valid: false,
        error: '🚨 TAMPERING DETECTED - Block does not match immutable checkpoint',
        layer: 'AUDIT_CHECKPOINT',
        severity: 'CRITICAL',
        details: {
          discrepancies: checkpointVerification.discrepancies,
          checkpoint: checkpointVerification.checkpoint,
          timestampVerification: checkpointVerification.timestampVerification
        }
      };
    }

    return {
      valid: true,
      layer: 'AUDIT_CHECKPOINT',
      checkpoint: checkpointVerification.checkpoint,
      timestampVerification: checkpointVerification.timestampVerification
    };

  } catch (error) {
    return {
      valid: false,
      error: `Audit checkpoint verification failed: ${error.message}`,
      layer: 'AUDIT_CHECKPOINT',
      severity: 'HIGH'
    };
  }
};

/**
 * 🆕 COMPLETE 5-LAYER BLOCK VERIFICATION
 * Now includes immutable audit checkpoint
 */
const verifyBlockComplete = async (block, previousBlock, secret, difficulty) => {
  const results = {
    blockIndex: block.index,
    blockHash: block.hash,
    entityId: block.entityId,
    overall: true,
    layers: {}
  };

  // ⚡ Layers 1-3: CPU-bound, run synchronously (fast)
  const hashChainResult = verifyBlock(block, previousBlock, secret, difficulty);
  results.layers.hashChain = hashChainResult;
  if (!hashChainResult.valid) results.overall = false;

  const merkleResult = verifyMerkleRoot(block);
  results.layers.merkleTree = merkleResult;
  if (!merkleResult.valid && merkleResult.severity === 'CRITICAL') {
    results.overall = false;
  }

  const signatureResult = verifyDigitalSignature(block);
  results.layers.digitalSignature = signatureResult;
  if (!signatureResult.valid && signatureResult.severity === 'CRITICAL') {
    results.overall = false;
  }

  // ⚡ Layers 4-5: I/O-bound, run in PARALLEL (MUCH FASTER)
  const [ipfsResult, auditResult] = await Promise.all([
    verifyIPFSAnchor(block),
    verifyAuditCheckpoint(block)
  ]);

  results.layers.ipfsAnchor = ipfsResult;
  if (!ipfsResult.valid && ipfsResult.severity === 'CRITICAL') {
    results.overall = false;
  }

  results.layers.auditCheckpoint = auditResult;
  if (!auditResult.valid && auditResult.severity === 'CRITICAL') {
    results.overall = false;
  }
  // Count failures
  results.failedLayers = Object.values(results.layers).filter(l => !l.valid).length;
  results.criticalFailures = Object.values(results.layers)
    .filter(l => !l.valid && l.severity === 'CRITICAL').length;

  return results;
};

/**
 * 🆕 VERIFY ENTIRE BLOCKCHAIN WITH ALL 5 LAYERS
 */
const verifyChain = async (secret, difficulty) => {
  const blocks = await Block.find().sort({ index: 1 });

  if (blocks.length === 0) {
    return { 
      valid: false, 
      error: 'No blocks found',
      severity: 'CRITICAL'
    };
  }

  const results = {
    valid: true,
    totalBlocks: blocks.length,
    verifiedBlocks: 0,
    failedBlocks: 0,
    blockResults: [],
    summary: {
      hashChainFailures: 0,
      merkleTreeFailures: 0,
      signatureFailures: 0,
      ipfsAnchorFailures: 0,
      auditCheckpointFailures: 0  // 🆕
    }
  };

  // Verify each block (skip genesis at index 0)
  for (let i = 1; i < blocks.length; i++) {
    const blockResult = await verifyBlockComplete(
      blocks[i], 
      blocks[i - 1], 
      secret, 
      difficulty
    );

    results.blockResults.push(blockResult);

    if (blockResult.overall) {
      results.verifiedBlocks++;
    } else {
      results.failedBlocks++;
      results.valid = false;

      // Count failures by layer
      if (!blockResult.layers.hashChain?.valid) 
        results.summary.hashChainFailures++;
      if (!blockResult.layers.merkleTree?.valid && 
          blockResult.layers.merkleTree?.severity === 'CRITICAL') 
        results.summary.merkleTreeFailures++;
      if (!blockResult.layers.digitalSignature?.valid && 
          blockResult.layers.digitalSignature?.severity === 'CRITICAL') 
        results.summary.signatureFailures++;
      if (!blockResult.layers.ipfsAnchor?.valid && 
          blockResult.layers.ipfsAnchor?.severity === 'CRITICAL') 
        results.summary.ipfsAnchorFailures++;
      // 🆕
      if (!blockResult.layers.auditCheckpoint?.valid && 
          blockResult.layers.auditCheckpoint?.severity === 'CRITICAL') 
        results.summary.auditCheckpointFailures++;
    }
  }

  results.integrityScore = results.totalBlocks > 1 
    ? ((results.verifiedBlocks / (results.totalBlocks - 1)) * 100).toFixed(2)
    : 100;

  return results;
};

/**
 * 🆕 VERIFY ENTITY HISTORY WITH ALL 5 LAYERS
 */

const verifyEntityHistory = async (entityId) => {
  // ⚡ Use .lean() for 30-50% faster queries
  const blocks = await Block.find({ entityId }).sort({ index: 1 }).lean();

  if (blocks.length === 0) {
    return { 
      valid: false, 
      error: 'No blocks found for this entity',
      entityId
    };
  }

  const results = {
    valid: true,
    entityId,
    totalBlocks: blocks.length,
    history: [],
    verificationSummary: {
      allLayersValid: 0,
      partiallyValid: 0,
      invalid: 0
    }
  };

  // ⚡ Only fetch blocks we need (not entire chain)
  const minIndex = Math.min(...blocks.map(b => b.index));
  const maxIndex = Math.max(...blocks.map(b => b.index));
  const allBlocks = await Block.find({ 
    index: { $gte: minIndex - 1, $lte: maxIndex } 
  }).sort({ index: 1 }).lean();
  for (const block of blocks) {
    const previousBlock = allBlocks.find(b => b.index === block.index - 1);
    
    let blockVerification;
    if (previousBlock) {
      blockVerification = await verifyBlockComplete(
        block,
        previousBlock,
        process.env.BLOCKCHAIN_SECRET,
        parseInt(process.env.BLOCKCHAIN_DIFFICULTY)
      );
    } else {
      blockVerification = {
        blockIndex: block.index,
        overall: true,
        layers: {
          hashChain: { valid: true, note: 'Genesis block' }
        }
      };
    }

    results.history.push({
      index: block.index,
      timestamp: block.timestamp,
      dataType: block.dataType,
      hash: block.hash,
      data: block.data,
      userId: block.userId,
      userType: block.userType,
      verification: blockVerification,
      ipfsCid: block.ipfs?.cid,
      ipfsUrl: block.ipfs?.cid ? `https://ipfs.io/ipfs/${block.ipfs.cid}` : null
    });

    if (blockVerification.overall && blockVerification.failedLayers === 0) {
      results.verificationSummary.allLayersValid++;
    } else if (blockVerification.overall) {
      results.verificationSummary.partiallyValid++;
    } else {
      results.verificationSummary.invalid++;
      results.valid = false;
    }
  }

  return results;
};

/**
 * 🆕 ENHANCED TAMPERING PATTERN DETECTION
 */
const detectTamperingPatterns = (verificationResults) => {
  const patterns = {
    detected: [],
    riskLevel: 'LOW'
  };

  if (!verificationResults.layers) return patterns;

  const { 
    hashChain, 
    merkleTree, 
    digitalSignature, 
    ipfsAnchor, 
    auditCheckpoint 
  } = verificationResults.layers;

  // 🆕 Pattern 1: Database tampering with checkpoint violation (MOST SERIOUS)
  if (!auditCheckpoint?.valid) {
    patterns.detected.push({
      type: 'CHECKPOINT_VIOLATION',
      description: '🚨 CRITICAL: Block does not match immutable checkpoint - database tampered',
      indicators: ['Audit checkpoint failed', 'External proof violated'],
      riskLevel: 'CRITICAL',
      details: auditCheckpoint?.details
    });
    patterns.riskLevel = 'CRITICAL';
  }

  // Pattern 2: Hash recalculation attack
  if (hashChain?.valid && !digitalSignature?.valid && !ipfsAnchor?.valid) {
    patterns.detected.push({
      type: 'HASH_RECALCULATION_ATTACK',
      description: 'Block hash recalculated with stolen secret, but signatures invalid',
      indicators: ['Valid hash', 'Invalid signature', 'Invalid IPFS anchor'],
      riskLevel: 'CRITICAL'
    });
    patterns.riskLevel = 'CRITICAL';
  }

  // Pattern 3: Data manipulation
  if (hashChain?.valid && !merkleTree?.valid) {
    patterns.detected.push({
      type: 'DATA_MANIPULATION',
      description: 'Transaction data modified after block creation',
      indicators: ['Valid hash', 'Invalid merkle root'],
      riskLevel: 'HIGH'
    });
    if (patterns.riskLevel !== 'CRITICAL') patterns.riskLevel = 'HIGH';
  }

  // Pattern 4: Complete database tampering
  if (!hashChain?.valid && !merkleTree?.valid && !digitalSignature?.valid) {
    patterns.detected.push({
      type: 'DATABASE_TAMPERING',
      description: 'Multiple verification layers failed - direct database modification suspected',
      indicators: ['Invalid hash', 'Invalid merkle', 'Invalid signature'],
      riskLevel: 'CRITICAL'
    });
    patterns.riskLevel = 'CRITICAL';
  }

  return patterns;
};

module.exports = {
  verifyBlock,
  verifyMerkleRoot,
  verifyDigitalSignature,
  verifyIPFSAnchor,
  verifyAuditCheckpoint,
  verifyBlockComplete,
  verifyChain,
  verifyEntityHistory,
  detectTamperingPatterns
};