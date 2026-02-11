// utils/hearingUtils.js
const crypto = require('crypto');

/**
 * Convert plain text to HTML with preserved formatting
 */
const convertTextToHtml = (text) => {
  if (!text) return '';
  
  // Replace newlines with <br> tags
  // Preserve multiple spaces
  return text
    .replace(/\n/g, '<br>')
    .replace(/  /g, '&nbsp;&nbsp;')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
};

/**
 * Strip HTML tags to get plain text (for search/indexing)
 */
const stripHtmlTags = (html) => {
  if (!html) return '';
  
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
};

/**
 * Generate a hash for hearing content (for digital signature verification)
 */
const generateHearingHash = (hearingData) => {
  const contentToHash = JSON.stringify({
    hearing_date: hearingData.hearing_date,
    hearing_type: hearingData.hearing_type,
    remarks: hearingData.remarks,
    next_hearing_date: hearingData.next_hearing_date
  });
  
  return crypto
    .createHash('sha256')
    .update(contentToHash)
    .digest('hex');
};

/**
 * Verify hearing signature
 */
const verifyHearingSignature = (hearing) => {
  if (!hearing.digital_signature || !hearing.digital_signature.is_signed) {
    return { valid: false, message: 'Hearing is not signed' };
  }
  
  const currentHash = generateHearingHash(hearing);
  const storedHash = hearing.digital_signature.signature_hash;
  
  if (currentHash === storedHash) {
    return { 
      valid: true, 
      message: 'Signature is valid',
      signed_by: hearing.digital_signature.signed_by_name,
      signed_at: hearing.digital_signature.signature_timestamp
    };
  } else {
    return { 
      valid: false, 
      message: 'Signature is invalid - content has been modified'
    };
  }
};

/**
 * Sanitize HTML to prevent XSS attacks
 */
const sanitizeHtml = (html) => {
  if (!html) return '';
  
  // Basic sanitization - you might want to use a library like 'sanitize-html' for production
  const allowedTags = ['br', 'p', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li'];
  
  // Remove script tags and dangerous attributes
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '');
  
  return sanitized;
};

module.exports = {
  convertTextToHtml,
  stripHtmlTags,
  generateHearingHash,
  verifyHearingSignature,
  sanitizeHtml
};