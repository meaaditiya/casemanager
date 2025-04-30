const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Litigant = require('../models/Litigant');
const Advocate = require('../models/Advocate');
const Clerk = require('../models/Clerk');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.use(cors({
    origin: ['http://localhost:3000', 'http://192.168.1.39:3000'],
    credentials: true
}));

// Authentication middleware directly in routes
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
  });
};

// Verify clerk middleware
const verifyClerk = async (req, res, next) => {
  try {
    const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
    
    if (!clerk) {
      return res.status(403).json({ message: 'Access denied: Not a clerk' });
    }
    
    req.clerk = clerk;
    next();
  } catch (error) {
    console.error('Clerk verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to send status change emails
const sendStatusChangeEmail = async (recipient, name, newStatus, reason = null) => {
  try {
    const subject = newStatus === 'suspended' 
      ? 'Your Account Has Been Suspended' 
      : 'Your Account Has Been Reinstated';
    
    let htmlContent;
    
    if (newStatus === 'suspended') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #f8d7da; color: #721c24; padding: 10px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h2>Account Suspension Notice</h2>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>We regret to inform you that your account has been suspended by the court clerk.</p>
              <p><strong>Reason for suspension:</strong> ${reason || 'No specific reason provided'}</p>
              <p>If you believe this is in error or have questions about this decision, please contact the district court office.</p>
              <p>You will not be able to access your account until it is reinstated by a court clerk.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Court Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #d4edda; color: #155724; padding: 10px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h2>Account Reinstated</h2>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>We are pleased to inform you that your account has been reinstated by the court clerk.</p>
              <p>You now have full access to your account and all its features.</p>
              <p>Thank you for your patience during this process.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Court Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    
    const msg = {
      to: recipient,
      from: process.env.FROM_EMAIL,
      subject: subject,
      html: htmlContent,
    };
    
    await sgMail.send(msg);
    console.log(`Status change email sent successfully to ${recipient}`);
    return true;
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error response body:', error.response.body);
    }
    throw error;
  }
};

// Get all litigants in clerk's district
router.get('/litigants', verifyToken, verifyClerk, async (req, res) => {
  try {
    const litigants = await Litigant.find({
      'address.district': req.clerk.district
    }).select('-password -emailOTP -otpExpiry -resetPasswordOTP -resetPasswordExpiry');
    
    res.json(litigants);
  } catch (error) {
    console.error('Error fetching litigants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all advocates in clerk's district
router.get('/advocates', verifyToken, verifyClerk, async (req, res) => {
  try {
    const advocates = await Advocate.find({
      'practice_details.district': req.clerk.district
    }).select('-password -emailOTP -otpExpiry');
    
    res.json(advocates);
  } catch (error) {
    console.error('Error fetching advocates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suspend a litigant account
router.put('/litigants/:id/suspend', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Suspension reason is required' });
    }
    
    const litigant = await Litigant.findOne({ party_id: req.params.id });
    
    if (!litigant) {
      return res.status(404).json({ message: 'Litigant not found' });
    }
    
    // Verify the litigant belongs to the clerk's district
    if (litigant.address.district !== req.clerk.district) {
      return res.status(403).json({ 
        message: 'Access denied: Litigant is not in your district jurisdiction' 
      });
    }
    
    // Update the status and save the suspension reason
    litigant.status = 'suspended';
    litigant.suspension_reason = reason;
    litigant.suspension_date = new Date();
    await litigant.save();
    
    // Send email notification
    try {
      await sendStatusChangeEmail(litigant.contact.email, litigant.full_name, 'suspended', reason);
    } catch (emailError) {
      console.error('Failed to send suspension email:', emailError);
      // Continue with the response even if email fails
    }
    
    res.json({ 
      message: 'Litigant account suspended successfully',
      litigant: {
        party_id: litigant.party_id,
        full_name: litigant.full_name,
        status: litigant.status
      } 
    });
  } catch (error) {
    console.error('Error suspending litigant account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reinstate a litigant account
router.put('/litigants/:id/reinstate', verifyToken, verifyClerk, async (req, res) => {
  try {
    const litigant = await Litigant.findOne({ party_id: req.params.id });
    
    if (!litigant) {
      return res.status(404).json({ message: 'Litigant not found' });
    }
    
    // Verify the litigant belongs to the clerk's district
    if (litigant.address.district !== req.clerk.district) {
      return res.status(403).json({ 
        message: 'Access denied: Litigant is not in your district jurisdiction' 
      });
    }
    
    // Update the status and clear suspension details
    litigant.status = 'active';
    litigant.suspension_reason = undefined;
    litigant.suspension_date = undefined;
    await litigant.save();
    
    // Send email notification
    try {
      await sendStatusChangeEmail(litigant.contact.email, litigant.full_name, 'active');
    } catch (emailError) {
      console.error('Failed to send reinstatement email:', emailError);
      // Continue with the response even if email fails
    }
    
    res.json({ 
      message: 'Litigant account reinstated successfully',
      litigant: {
        party_id: litigant.party_id,
        full_name: litigant.full_name,
        status: litigant.status
      } 
    });
  } catch (error) {
    console.error('Error reinstating litigant account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suspend an advocate account
router.put('/advocates/:id/suspend', verifyToken, verifyClerk, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Suspension reason is required' });
    }
    
    const advocate = await Advocate.findOne({ advocate_id: req.params.id });
    
    if (!advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }
    
    // Verify the advocate belongs to the clerk's district
    if (advocate.practice_details.district !== req.clerk.district) {
      return res.status(403).json({ 
        message: 'Access denied: Advocate is not in your district jurisdiction' 
      });
    }
    
    // Update the status and save the suspension reason
    advocate.status = 'suspended';
    advocate.suspension_reason = reason;
    advocate.suspension_date = new Date();
    await advocate.save();
    
    // Send email notification
    try {
      await sendStatusChangeEmail(advocate.contact.email, advocate.name, 'suspended', reason);
    } catch (emailError) {
      console.error('Failed to send suspension email:', emailError);
      // Continue with the response even if email fails
    }
    
    res.json({ 
      message: 'Advocate account suspended successfully',
      advocate: {
        advocate_id: advocate.advocate_id,
        name: advocate.name,
        status: advocate.status
      } 
    });
  } catch (error) {
    console.error('Error suspending advocate account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reinstate an advocate account
router.put('/advocates/:id/reinstate', verifyToken, verifyClerk, async (req, res) => {
  try {
    const advocate = await Advocate.findOne({ advocate_id: req.params.id });
    
    if (!advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }
    
    // Verify the advocate belongs to the clerk's district
    if (advocate.practice_details.district !== req.clerk.district) {
      return res.status(403).json({ 
        message: 'Access denied: Advocate is not in your district jurisdiction' 
      });
    }
    
    // Update the status and clear suspension details
    advocate.status = 'active';
    advocate.suspension_reason = undefined;
    advocate.suspension_date = undefined;
    await advocate.save();
    
    // Send email notification
    try {
      await sendStatusChangeEmail(advocate.contact.email, advocate.name, 'active');
    } catch (emailError) {
      console.error('Failed to send reinstatement email:', emailError);
      // Continue with the response even if email fails
    }
    
    res.json({ 
      message: 'Advocate account reinstated successfully',
      advocate: {
        advocate_id: advocate.advocate_id,
        name: advocate.name,
        status: advocate.status
      } 
    });
  } catch (error) {
    console.error('Error reinstating advocate account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific litigant's details
router.get('/litigants/:id', verifyToken, verifyClerk, async (req, res) => {
  try {
    const litigant = await Litigant.findOne({ party_id: req.params.id })
      .select('-password -emailOTP -otpExpiry -resetPasswordOTP -resetPasswordExpiry');
    
    if (!litigant) {
      return res.status(404).json({ message: 'Litigant not found' });
    }
    
    // Verify the litigant belongs to the clerk's district
    if (litigant.address.district !== req.clerk.district) {
      return res.status(403).json({ 
        message: 'Access denied: Litigant is not in your district jurisdiction' 
      });
    }
    
    res.json(litigant);
  } catch (error) {
    console.error('Error fetching litigant details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific advocate's details
router.get('/advocates/:id', verifyToken, verifyClerk, async (req, res) => {
  try {
    const advocate = await Advocate.findOne({ advocate_id: req.params.id })
      .select('-password -emailOTP -otpExpiry');
    
    if (!advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }
    
    // Verify the advocate belongs to the clerk's district
    if (advocate.practice_details.district !== req.clerk.district) {
      return res.status(403).json({ 
        message: 'Access denied: Advocate is not in your district jurisdiction' 
      });
    }
    
    res.json(advocate);
  } catch (error) {
    console.error('Error fetching advocate details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;