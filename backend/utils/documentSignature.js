const crypto = require('crypto');

/**
 * Generate hash for document verification
 * ONLY uses immutable fields that never change after upload
 */
const generateDocumentHash = (document) => {
  // Only hash fields that are set at upload and NEVER change
  const data = JSON.stringify({
    document_id: document.document_id,
    file_name: document.file_name,
    file_path: document.file_path,
    size: document.size,
    uploaded_by: document.uploaded_by,
    uploaded_date: document.uploaded_date,
    // DO NOT include verification fields - they change after upload!
    // verified_by and verification_date are NOT part of the signature
  });
  
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
};

/**
 * Verify document signature
 */
const verifyDocumentSignature = (document) => {
  if (!document.digital_signature || !document.digital_signature.is_signed) {
    return {
      is_valid: false,
      message: 'Document is not signed',
      signed_by: null,
      signed_date: null
    };
  }
  
  // Regenerate hash using ONLY immutable fields
  const currentHash = generateDocumentHash(document);
  const storedHash = document.digital_signature.signature_hash;
  
  const isValid = currentHash === storedHash;
  
  return {
    is_valid: isValid,
    message: isValid 
      ? 'Digital signature is valid - document has not been tampered with' 
      : 'WARNING: Digital signature invalid - document may have been tampered with',
    current_hash: currentHash,
    stored_hash: storedHash,
    signed_by: document.digital_signature.signed_by_name,
    signed_date: document.digital_signature.signature_timestamp,
    verification_status: document.verification_status
  };
};

module.exports = {
  generateDocumentHash,
  verifyDocumentSignature
};