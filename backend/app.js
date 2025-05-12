
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');

const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const app = express();
const Advocate = require('./models/Advocate');
const Litigant = require('./models/Litigant');
const EnrollmentRecord = require('./models/Enrollment');
const CourtCalendar = require('./models/Calendar');
const  OTPVerification= require('./models/OTP');
const Notice = require('./models/Notice');
const LegalCase = require ('./models/LegalCase');
const StateDistrict = require('./models/Statedistrict');
const Clerk = require ('./models/Clerk');
const BlacklistedToken = require('./models/Blaclisttoken');
const clerkRoutes = require('./routes/clerkRoutes');
const CourtAdmin = require('./models/CourtAdmin');
app.use('/api/clerk', clerkRoutes);
app.use(cors({
    origin:  ['http://localhost:3000', 'http://192.168.1.39:3000','https://ecourt-yr51.onrender.com'],
    credentials: true
}));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daily_schedule')
    .then(() => console.log('Connection to Database Successful , MongoDB connected!'))
    .catch(err => console.error('MongoDB connection error:', err));

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/cop_documents')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
//multer ki configuration
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// OTP  
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailOTP = async (email, otp) => {
    const currentYear = new Date().getFullYear();
    
    const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: 'Verification Code - Legal Portal',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }
                .header {
                    background-color: #1a365d;
                    padding: 24px;
                    text-align: center;
                }
                .logo {
                    max-height: 60px;
                }
                .content {
                    padding: 30px;
                }
                .otp-container {
                    margin: 30px auto;
                    padding: 20px;
                    background-color: #f7fafc;
                    border-radius: 6px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                }
                .otp-code {
                    font-size: 32px;
                    letter-spacing: 8px;
                    font-weight: bold;
                    color: #1a365d;
                    margin: 20px 0;
                }
                .expiry {
                    color: #e53e3e;
                    font-size: 14px;
                    margin-top: 10px;
                }
                .footer {
                    background-color: #f7fafc;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #718096;
                    border-top: 1px solid #e2e8f0;
                }
                .btn {
                    display: inline-block;
                    background-color: #1a365d;
                    color: white;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 4px;
                    font-weight: bold;
                    margin-top: 20px;
                }
                .security-note {
                    font-size: 13px;
                    color: #718096;
                    background-color: #f7fafc;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 30px;
                    border-left: 4px solid #4299e1;
                }
                .divider {
                    height: 1px;
                    background-color: #e2e8f0;
                    margin: 25px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${process.env.LOGO_URL || 'https://yoursite.com/logo.png'}" alt="Legal Portal" class="logo">
                </div>
                <div class="content">
                    <h2>Verify Your Email Address</h2>
                    <p>Thank you for registering with Legal Portal. Please use the verification code below to complete your registration.</p>
                    
                    <div class="otp-container">
                        <p>Your verification code is:</p>
                        <div class="otp-code">${otp}</div>
                        <p class="expiry">This code will expire in 10 minutes</p>
                    </div>
                    
                    <p>If you did not request this code, please ignore this email or contact our support team if you believe this is an error.</p>
                    
                    <div class="security-note">
                        <strong>Security Note:</strong> Legal Portal representatives will never ask for this code via phone or email. Please do not share this code with anyone.
                    </div>
                    
                    <div class="divider"></div>                 
                    <p>Need assistance? Our support team is available to help.</p>
                    <a href="${process.env.SUPPORT_URL || 'https://yoursite.com/support'}" class="btn">Contact Support</a>
                </div>
                <div class="footer">
                    <p>&copy; ${currentYear} Legal Portal. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>
                        <a href="${process.env.PRIVACY_URL || 'https://yoursite.com/privacy'}">Privacy Policy</a> | 
                        <a href="${process.env.TERMS_URL || 'https://yoursite.com/terms'}">Terms of Service</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`Verification email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('SendGrid Error:', error);
        if (error.response) {
            console.error('Error response body:', error.response.body);
        }
        throw error;
    }
};


//Adv REgister 
app.post('/api/advocate/verify-enrollment', async (req, res) => {
    try {
        const { enrollment_no, name, district, date_of_registration } = req.body;

        if (!enrollment_no || !name || !district || !date_of_registration) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const dateParts = date_of_registration.split('/');
        const formattedDate = `${parseInt(dateParts[0])}/${parseInt(dateParts[1])}/${dateParts[2]}`;

        console.log('Incoming date:', date_of_registration);
        console.log('Formatted date:', formattedDate);

        const record = await EnrollmentRecord.findOne({
            ENROLLMENT_NO: enrollment_no,
            NAME_OF_ADVOCATE: name,
            DISTRICT: district,
            DATE_OF_REGISTRATION: formattedDate
        });

        if (!record) {
            return res.status(400).json({
                message: 'Enrollment details do not match our records',
                debug: {
                    receivedDate: date_of_registration,
                    formattedDate: formattedDate,
                    query: {
                        ENROLLMENT_NO: enrollment_no,
                        NAME_OF_ADVOCATE: name,
                        DISTRICT: district,
                        DATE_OF_REGISTRATION: formattedDate
                    }
                }
            });
        }

        res.json({
            message: 'Enrollment verified successfully',
            record: {
                enrollment_no: record.ENROLLMENT_NO,
                name: record.NAME_OF_ADVOCATE,
                fathers_name: record.FATHERS_NAME_OF_ADVOCATE,
                district: record.DISTRICT,
                date_of_registration: record.DATE_OF_REGISTRATION
            }
        });
    } catch (error) {
        console.error('Date processing error:', error);
        res.status(500).json({ 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


app.post('/api/advocate/register', upload.single('cop_document'), async (req, res) => {
    try {
      const {
        enrollment_no,
        name,
        email,
        password,
        gender,
        dob,
        district,
        iCOP_number,
        barId
      } = req.body;
      const practice_details = {
        district_court: req.body['practice_details[district_court]'] === 'true',
        high_court: req.body['practice_details[high_court]'] === 'true',
        state: req.body['practice_details[state]'] || '',
        district: req.body['practice_details[district]'] || '',
        high_court_bench: req.body['practice_details[high_court_bench]'] || ''
    };

        if (!req.file) {
            return res.status(400).json({ message: 'COP document is required' });
        }
        
        const existingAdvocate = await Advocate.findOne({
            $or: [
                { email }, 
                { enrollment_no },
                { iCOP_number },
                { barId }
            ]
        });

        if (existingAdvocate) {
            return res.status(400).json({
                message: 'Advocate already registered with this email, enrollment number, iCOP number, or Bar ID'
            });
        }

        const emailOTP = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const advocate = new Advocate({
            advocate_id: 'ADV' + Date.now(),
            enrollment_no,
            name,
            gender,
            dob,
            contact: { email },
            district,
            practice_details,
            email,
            password: hashedPassword,
            emailOTP,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
            iCOP_number,
            barId,
            cop_document: {
                filename: req.file.filename,
                path: req.file.path,
                uploadDate: new Date()
            },
            status: 'pending',
            isVerified: false
        });

        await advocate.save();
        await sendEmailOTP(email, emailOTP);

        res.status(201).json({
            message: 'Registration initiated. Please verify your email. Account will be activated after document verification.',
            advocate_id: advocate.advocate_id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/advocate/verify-email', async (req, res) => {
    try {
        const { advocate_id, otp } = req.body;
        console.log('Current Server Time (UTC):', new Date().toISOString());

        const advocate = await Advocate.findOne({
            advocate_id,
            emailOTP: otp,
            otpExpiry: { $gt: new Date() }
        });

        if (!advocate) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        console.log('Before update:', advocate);

        advocate.isEmailVerified = true;
        advocate.emailOTP = undefined;
        advocate.status = 'pending';
        await advocate.save();

        console.log('After update:', await Advocate.findOne({ advocate_id }));

        res.json({ message: 'Email verified successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/advocate/verify/:advocate_id', async (req, res) => {
    try {
        const { verified, notes } = req.body;
        const advocate = await Advocate.findOne({ advocate_id: req.params.advocate_id });

        if (!advocate) {
            return res.status(404).json({ message: 'Advocate not found' });
        }

        advocate.isVerified = verified;
        advocate.verificationNotes = notes;
        advocate.verificationDate = new Date();
        advocate.status = verified ? 'active' : 'pending';

        await advocate.save();

        res.json({ 
            message: `Advocate ${verified ? 'verified' : 'verification rejected'} successfully`,
            advocate_id: advocate.advocate_id,
            status: advocate.status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Adv Login
app.post('/api/advocate/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const advocate = await Advocate.findOne({ email });
        if (!advocate) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, advocate.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!advocate.isEmailVerified) {
            return res.status(401).json({ message: 'Please complete verification process' });
        }

        if (advocate.status !== 'active') {
            return res.status(401).json({ message: 'Account is not active,wait for your verification done by court admin ' });
        }

  
        advocate.lastLogin = new Date();
        await advocate.save();

     
        const token = jwt.sign(
            {
                advocate_id: advocate.advocate_id,
                email: advocate.email,
                user_type: 'advocate'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            advocate: {
                advocate_id: advocate.advocate_id,
                name: advocate.name,
                email: advocate.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Token 
const authenticateToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const isBlacklisted = await BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Token has been invalidated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

app.post('/api/advocate/logout', authenticateToken, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        await new BlacklistedToken({
            token,
            user_id: req.user.advocate_id,
            user_type: 'advocate'
        }).save();

        await Advocate.findOneAndUpdate(
            { advocate_id: req.user.advocate_id },
            { lastLogout: new Date() }
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/advocate/logout-all', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        
        const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
        if (!advocate) {
            return res.status(404).json({ message: 'Advocate not found' });
        }

        const isValidPassword = await bcrypt.compare(password, advocate.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const currentToken = req.headers.authorization?.split(' ')[1];
        await new BlacklistedToken({
            token: currentToken,
            user_id: req.user.advocate_id,
            user_type: 'advocate'
        }).save();

        await Advocate.findOneAndUpdate(
            { advocate_id: req.user.advocate_id },
            { 
                lastLogout: new Date(),
                lastForceLogout: new Date()
            }
        );

        res.json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
const profilePicturesDir = path.join(__dirname, 'uploads/profile_pictures');
if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir);
}
// Multer Profile 
const profilePictureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile_pictures')
  },
  filename: function (req, file, cb) {
   
    cb(null, `temp-${Date.now()}-${file.originalname}`)
  }
});

const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: (req, file, cb) => {
   
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024 
  }
})

app.post('/api/advocate/profile-picture', authenticateToken, uploadProfilePicture.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
    if (!advocate) {
     
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Advocate not found' });
    }
    
   
    const newFilename = `${req.user.advocate_id}-${Date.now()}-${req.file.originalname}`;
    const newPath = path.join('uploads/profile_pictures', newFilename);
    fs.renameSync(req.file.path, newPath);
    
   
    if (advocate.profilePicture && advocate.profilePicture.path) {
      try {
        fs.unlinkSync(advocate.profilePicture.path);
      } catch (err) {
        console.error('Error deleting old profile picture:', err);
      }
    }
    
   
    advocate.profilePicture = {
      filename: newFilename,
      path: newPath,
      uploadDate: new Date()
    };
    
    await advocate.save();
    
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: {
        filename: advocate.profilePicture.filename
      }
    });
  } catch (error) {
   
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file after error:', err);
      }
    }
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/advocate/profile-picture/:filename', async (req, res) => {
  try {
      const filename = req.params.filename;
      const filepath = path.join(__dirname, 'uploads/profile_pictures', filename);
      
   
      if (fs.existsSync(filepath)) {
          res.sendFile(filepath);
      } else {
          res.status(404).json({ message: 'Profile picture not found' });
      }
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


app.get('/api/advocate/profile', authenticateToken, async (req, res) => {
  try {
      const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
      if (!advocate) {
          return res.status(404).json({ message: 'Advocate not found' });
      }

      res.json({
          advocate: {
              advocate_id: advocate.advocate_id,
              name: advocate.name,
              email: advocate.email,
              enrollment_no: advocate.enrollment_no,
              district: advocate.district,
              status: advocate.status,
              practice_details: advocate.practice_details,
              profilePicture: advocate.profilePicture ? advocate.profilePicture.filename : null
          }
      });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});
const cleanupBlacklistedTokens = async () => {
    try {
        const expiryDate = new Date(Date.now() - 86400 * 1000); 
        await BlacklistedToken.deleteMany({ createdAt: { $lt: expiryDate } });
    } catch (error) {
        console.error('Token cleanup error:', error);
    }
};
const cron = require('node-cron');


cron.schedule('0 0 * * *', () => {
    cleanupBlacklistedTokens();
});


// Register litigant
app.post('/api/litigant/register', async (req, res) => {
    try {
        const {
            party_type,
            full_name,
            parentage,
            gender,
            street,
            city,
            district,
            state,
            pincode,
            email,
            mobile,
            password
        } = req.body;
        
       
        if (!party_type || !full_name || !parentage || !gender || 
            !street || !city || !district || !state || 
            !email || !mobile || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
       
        const existingLitigant = await Litigant.findOne({
            'contact.email': email
        });
        
        if (existingLitigant) {
            return res.status(400).json({
                message: 'Email already registered'
            });
        }
        
        const emailOTP = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const litigant = new Litigant({
            party_id: 'LIT' + Date.now(),
            party_type,
            full_name,
            parentage,
            gender,
            address: {
                street,
                city,
                district,
                state,
                pincode
            },
            contact: {
                email,
                mobile
            },
            password: hashedPassword,
            emailOTP,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
        });
        
        await litigant.save();
        await sendEmailOTP(email, emailOTP);
        
        res.status(201).json({
            message: 'Registration initiated. Please verify your email.',
            party_id: litigant.party_id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/litigant/verify-email', async (req, res) => {
    try {
        const { party_id, otp } = req.body;

        const litigant = await Litigant.findOne({
            party_id,
            emailOTP: otp,
            otpExpiry: { $gt: new Date() }
        });

        if (!litigant) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        
        litigant.isEmailVerified = true;
        litigant.emailOTP = undefined;
        litigant.status = 'active';
        await litigant.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
app.post('/api/litigant/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const litigant = await Litigant.findOne({ 'contact.email': email });
        if (!litigant) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, litigant.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!litigant.isEmailVerified) {
            return res.status(401).json({ message: 'Please complete email verification' });
        }

        if (litigant.status !== 'active') {
            return res.status(401).json({ message: 'Account is not active' });
        }

       
        litigant.lastLogin = new Date();
        await litigant.save();

        
        const token = jwt.sign(
            {
                party_id: litigant.party_id,
                email: litigant.contact.email,
                user_type: 'litigant',
                party_type: litigant.party_type
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            litigant: {
                party_id: litigant.party_id,
                full_name: litigant.full_name,
                email: litigant.contact.email,
                party_type: litigant.party_type,
                gender: litigant.gender,
                address: litigant.address,
                mobile: litigant.contact.mobile,
                status: litigant.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/litigant/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
 
    const litigant = await Litigant.findOne({ 'contact.email': email });
    
    if (!litigant) {
      return res.status(404).json({ message: 'No account found with this email' });
    }
    
  
    const resetOTP = generateOTP();
    
    
    litigant.resetPasswordOTP = resetOTP;
    litigant.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await litigant.save();
    
   
    await sendResetPasswordOTP(litigant.contact.email, resetOTP);
    
    res.json({
      message: 'Password reset OTP sent to your email',
      party_id: litigant.party_id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/litigant/reset-password', async (req, res) => {
  try {
      const { party_id, otp, newPassword, confirmPassword } = req.body;
      
     
      if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: 'Passwords do not match' });
      }
      
      
      const litigant = await Litigant.findOne({
          party_id,
          resetPasswordOTP: otp,
          resetPasswordExpiry: { $gt: new Date() }
      });
      
      if (!litigant) {
          return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
    litigant.password = hashedPassword;
      litigant.resetPasswordOTP = undefined;
      litigant.resetPasswordExpiry = undefined;
      await litigant.save();
      
      res.json({ message: 'Password updated successfully' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


const sendResetPasswordOTP = async (email, otp) => {
 
  const currentYear = new Date().getFullYear();
  
  
  const baseUrl = process.env.BASE_URL || 'https://yourdomain.com';
  
  const msg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: 'Password Reset Code - E-Portal CMS',
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
              body {
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #2c3e50;
                  margin: 0;
                  padding: 0;
                  background-color: #f8f9fa;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  border-radius: 8px;
              }
              .header {
                  background: linear-gradient(135deg, #2c3e50 0%, #1a2a3a 100%);
                  padding: 30px 20px;
                  text-align: center;
                  color: #ffffff;
                  border-bottom: 4px solid #3498db;
              }
              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
                  letter-spacing: 1px;
                  text-transform: uppercase;
              }
              .header span {
                  color: #3498db;
                  font-weight: 700;
              }
              .content {
                  padding: 35px 30px;
              }
              .otp-container {
                  margin: 35px auto;
                  padding: 25px;
                  background-color: #f8f9fa;
                  text-align: center;
                  border-radius: 8px;
                  border: 1px solid #e9ecef;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
              }
              .otp-wrapper {
                  text-align: center;
                  width: 100%;
              }
              .otp-code {
                  font-size: 36px;
                  letter-spacing: 10px;
                  font-weight: bold;
                  color: #2c3e50;
                  margin: 20px auto;
                  font-family: 'Courier New', monospace;
                  background-color: #ffffff;
                  padding: 18px;
                  border: 1px dashed #3498db;
                  border-radius: 6px;
                  display: inline-block;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              }
              .expiry {
                  color: #e74c3c;
                  font-size: 14px;
                  margin-top: 15px;
                  font-weight: 600;
              }
              .footer {
                  background: linear-gradient(135deg, #2c3e50 0%, #1a2a3a 100%);
                  padding: 25px;
                  text-align: center;
                  font-size: 12px;
                  color: #ffffff;
                  border-top: 3px solid #3498db;
              }
              .security-note {
                  font-size: 14px;
                  color: #2c3e50;
                  background-color: #f1f9ff;
                  padding: 18px;
                  margin-top: 30px;
                  border-radius: 6px;
                  border-left: 5px solid #3498db;
              }
              .divider {
                  height: 1px;
                  background-color: #e9ecef;
                  margin: 30px 0;
              }
              .help-text {
                  font-size: 14px;
                  color: #2c3e50;
                  background-color: #f8f9fa;
                  padding: 18px;
                  margin-top: 20px;
                  border-radius: 6px;
                  border-left: 5px solid #2c3e50;
              }
              h2 {
                  color: #2c3e50;
                  font-weight: 600;
                  margin-top: 0;
                  padding-bottom: 15px;
                  border-bottom: 2px solid #3498db;
                  font-family: 'Helvetica Neue', Arial, sans-serif;
              }
              p {
                  margin: 15px 0;
                  font-size: 15px;
                  line-height: 1.7;
              }
              .official-notice {
                  text-align: center;
                  font-size: 13px;
                  text-transform: uppercase;
                  letter-spacing: 1.5px;
                  color: #7f8c8d;
                  margin-bottom: 25px;
                  font-weight: 600;
              }
              .premium-badge {
                  display: inline-block;
                  background-color: #3498db;
                  color: white;
                  font-size: 11px;
                  padding: 3px 8px;
                  border-radius: 12px;
                  margin-left: 8px;
                  text-transform: uppercase;
                  font-weight: bold;
                  letter-spacing: 1px;
                  vertical-align: middle;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>E-Portal <span>CMS</span></h1>
              </div>
              <div class="content">
                  <div class="official-notice">SECURE NOTIFICATION <span class="premium-badge">Official Channel</span></div>
                  <h2>Password Reset Verification</h2>
                  <p>We received a request to reset your password for your E-Portal CMS account. For your security, please use the verification code below to complete the process.</p>
                  
                  <div class="otp-container">
                      <p>Your secure verification code:</p>
                      <div class="otp-code">${otp}</div>
                      <p class="expiry">Valid for 10 minutes only</p>
                  </div>
                  
                  <p>Enter this code on the password reset screen to create your new password and regain access to your account.</p>
                  
                  <div class="help-text">
                      <strong>Didn't request this change?</strong><br>
                      If you didn't initiate this password reset, please secure your account immediately by logging in and changing your password, or contact our support team.
                  </div>
                  
                  <div class="security-note">
                      <strong>Security Advisory:</strong> Your security is our priority. We will never ask for this code via phone or email. Keep this verification code confidential.
                  </div>
                  
                  <div class="divider"></div>
                  
                  <p>If you need any assistance with the password reset process, our dedicated support team is available to help you.</p>
              </div>
              <div class="footer">
                  <p>&copy; ${currentYear} E-Portal CMS. All rights reserved.</p>
                  <p>This is an automated message. Please do not reply.</p>
                  <p>Your privacy and data security remain our highest priority.</p>
              </div>
          </div>
      </body>
      </html>
      `
  };
  
  try {
      await sgMail.send(msg);
      console.log(`Password reset email sent successfully to ${email}`);
      return true;
  } catch (error) {
      console.error('SendGrid Error:', error);
      if (error.response) {
          console.error('Error response body:', error.response.body);
      }
      throw error;
  }
};
// Protected route for litigant profile
app.get('/api/litigant/profile', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'litigant') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const litigant = await Litigant.findOne({ party_id: req.user.party_id })
            .select('-password -emailOTP');
        
        if (!litigant) {
            return res.status(404).json({ message: 'Litigant not found' });
        }

        res.json({ litigant });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Logout
app.post('/api/litigant/logout', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'litigant') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const token = req.headers.authorization?.split(' ')[1];
        
        await new BlacklistedToken({
            token,
            user_id: req.user.party_id,
            user_type: 'litigant'
        }).save();

        await Litigant.findOneAndUpdate(
            { party_id: req.user.party_id },
            { lastLogout: new Date() }
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/litigant/logout-all', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'litigant') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { password } = req.body;
        
        const litigant = await Litigant.findOne({ party_id: req.user.party_id });
        if (!litigant) {
            return res.status(404).json({ message: 'Litigant not found' });
        }

        const isValidPassword = await bcrypt.compare(password, litigant.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const currentToken = req.headers.authorization?.split(' ')[1];
        await new BlacklistedToken({
            token: currentToken,
            user_id: req.user.party_id,
            user_type: 'litigant'
        }).save();

        await Litigant.findOneAndUpdate(
            { party_id: req.user.party_id },
            { 
                lastLogout: new Date(),
                lastForceLogout: new Date()
            }
        );

        res.json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Register clerk
app.post('/api/clerk/register', async (req, res) => {
    try {
        const {
            name,
            gender,
            district,
            court_name,
            court_no,
            email,
            mobile,
            password
        } = req.body;

        // Validate required fields
        if (!name || !gender || !district || !court_name || !court_no || !email || !mobile || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const existingClerk = await Clerk.findOne({
            'contact.email': email
        });

        if (existingClerk) {
            return res.status(400).json({
                message: 'Email already registered'
            });
        }

        const emailOTP = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const clerk = new Clerk({
            clerk_id: 'CLK' + Date.now(),
            name,
            gender,
            district,
            court_name,
            court_no,
            contact: {
                email,
                mobile
            },
            password: hashedPassword,
            emailOTP,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
        });

        await clerk.save();
        await sendEmailOTP(email, emailOTP);

        res.status(201).json({
            message: 'Registration initiated. Please verify your email.',
            clerk_id: clerk.clerk_id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify Email OTP
app.post('/api/clerk/verify-email', async (req, res) => {
    try {
        const { clerk_id, otp } = req.body;

        const clerk = await Clerk.findOne({
            clerk_id,
            emailOTP: otp,
            otpExpiry: { $gt: new Date() }
        });

        if (!clerk) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        clerk.isEmailVerified = true;
        clerk.emailOTP = undefined;
        clerk.status = 'active';
        await clerk.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
app.post('/api/clerk/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const clerk = await Clerk.findOne({ 'contact.email': email });
        if (!clerk) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, clerk.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!clerk.isEmailVerified) {
            return res.status(401).json({ message: 'Please complete email verification' });
        }

        if (clerk.status !== 'active') {
            return res.status(401).json({ message: 'Account is not active' });
        }

        clerk.lastLogin = new Date();
        await clerk.save();

        const token = jwt.sign(
            {
                clerk_id: clerk.clerk_id,
                email: clerk.contact.email,
                user_type: 'clerk'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            clerk: {
                clerk_id: clerk.clerk_id,
                name: clerk.name,
                email: clerk.contact.email,
                district: clerk.district,
                court_name: clerk.court_name,
                court_no: clerk.court_no
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get clerk profile
app.get('/api/clerk/profile', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'clerk') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id })
            .select('-password -emailOTP');
        
        if (!clerk) {
            return res.status(404).json({ message: 'Clerk not found' });
        }

        res.json({ clerk });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Logout
app.post('/api/clerk/logout', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'clerk') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const token = req.headers.authorization?.split(' ')[1];
        
        await new BlacklistedToken({
            token,
            user_id: req.user.clerk_id,
            user_type: 'clerk'
        }).save();

        await Clerk.findOneAndUpdate(
            { clerk_id: req.user.clerk_id },
            { lastLogout: new Date() }
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Logout from all devices
app.post('/api/clerk/logout-all', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'clerk') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { password } = req.body;
        
        const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
        if (!clerk) {
            return res.status(404).json({ message: 'Clerk not found' });
        }

        const isValidPassword = await bcrypt.compare(password, clerk.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const currentToken = req.headers.authorization?.split(' ')[1];
        await new BlacklistedToken({
            token: currentToken,
            user_id: req.user.clerk_id,
            user_type: 'clerk'
        }).save();

        await Clerk.findOneAndUpdate(
            { clerk_id: req.user.clerk_id },
            { 
                lastLogout: new Date(),
                lastForceLogout: new Date()
            }
        );

        res.json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.get('/api/clerk/dashboard/advocates', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'clerk') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
        if (!clerk) {
            return res.status(404).json({ message: 'Clerk not found' });
        }

        // Find advocates in clerk's district
        const advocates = await Advocate.find({
            'practice_details.district': clerk.district
        }).select('-password -emailOTP');

        // Separate verified and unverified advocates
        const verifiedAdvocates = advocates.filter(adv => adv.isVerified);
        const unverifiedAdvocates = advocates.filter(adv => !adv.isVerified);

        res.json({
            verifiedAdvocates,
            unverifiedAdvocates
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get advocate's COP document
app.get('/api/clerk/advocate/cop-document/:advocate_id', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'clerk') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const advocate = await Advocate.findOne({ advocate_id: req.params.advocate_id });
        if (!advocate) {
            return res.status(404).json({ message: 'Advocate not found' });
        }

        const filePath = path.join(__dirname, advocate.cop_document.path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/clerk/verify-advocate/:advocate_id', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'clerk') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { verificationDeclaration, notes } = req.body;
        if (!verificationDeclaration) {
            return res.status(400).json({ message: 'Verification declaration is required' });
        }

        const advocate = await Advocate.findOne({ advocate_id: req.params.advocate_id });
        if (!advocate) {
            return res.status(404).json({ message: 'Advocate not found' });
        }

        // Update advocate verification status
        advocate.isVerified = true;
        advocate.verificationNotes = notes;
        advocate.verificationDate = new Date();
        advocate.verifiedBy = req.user.clerk_id;
        advocate.status = 'active';

        await advocate.save();

        // Send email notification to advocate
        const emailMsg = {
            to: advocate.email,
            from: process.env.FROM_EMAIL,
            subject: 'Account Verification Successful - Legal Portal',
            html: `
                <h2>Account Verification Successful</h2>
                <p>Dear ${advocate.name},</p>
                <p>Your advocate account has been verified successfully. You can now access all features of the legal portal.</p>
                <p>Verification Notes: ${notes || 'None'}</p>
            `
        };
        await sgMail.send(emailMsg);

        res.json({
            message: 'Advocate verified successfully',
            advocate_id: advocate.advocate_id,
            status: advocate.status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all states
app.get('/api/states', async (req, res) => {
  try {
    const states = await StateDistrict.find({}, 'state');
    res.json(states.map(state => state.state));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get districts by state
app.get('/api/districts/:state', async (req, res) => {
  try {
    const stateData = await StateDistrict.findOne({ state: req.params.state });
    if (!stateData) {
      return res.status(404).json({ message: 'State not found' });
    }
    res.json(stateData.districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize data
async function initializeData() {
  try {
    await StateDistrict.deleteMany({});
    await StateDistrict.insertMany(statesAndDistricts);
    console.log('Data initialized successfully');
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

  const generateCNRFromCaseData = async (caseData) => {
    const typePrefix = caseData.case_type === 'Civil' ? 'CL' : 'CM';
    const year = new Date().getFullYear().toString();
    
    // Function to generate a unique serial
    const generateSerial = () => {
        // Get nanosecond timestamp
        const hrTime = process.hrtime();
        const timestamp = hrTime[0] * 1000000000 + hrTime[1];
        
        // Convert to base 36 and take last 2 digits
        const timeComponent = timestamp.toString(36).slice(-2);
        
        // Generate 2 random digits
        const randomComponent = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        
        // Combine them to create a 4-digit serial
        return (timeComponent + randomComponent).slice(-4).toUpperCase();
    };

    // Try to generate a unique CNR up to 5 times
    for (let attempts = 0; attempts < 5; attempts++) {
        const serialNumber = generateSerial();
        const cnrNumber = `${typePrefix}${year}${serialNumber}`;
        
        // Check if this CNR exists
        const existingCase = await LegalCase.findOne({ case_num: cnrNumber });
        
        if (!existingCase) {
            return cnrNumber;
        }
        
        // Add small delay before retry
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // If all attempts fail, use milliseconds + random as last resort
    const lastResortSerial = (Date.now() % 10000).toString().padStart(4, '0');
    return `${typePrefix}${year}${lastResortSerial}`;
};
// First, let's create the email template function for both types of users
const createCaseFilingSuccessEmail = (recipientName, caseDetails, userType) => {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    subject: `Case Filing Successful - CNR: ${caseDetails.case_num}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3c366b;">
          <h1 style="color: #3c366b; margin-bottom: 5px;">Case Filed Successfully</h1>
          <p style="color: #718096; font-size: 14px;">${date}</p>
        </div>
        
        <div style="padding: 20px 0;">
          <p>Dear ${recipientName},</p>
          
          <p>We are pleased to confirm that your case has been successfully filed in our system.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #3c366b; font-size: 18px; margin-bottom: 15px;">Case Details:</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 40%;">CNR Number:</td>
                <td style="padding: 8px 0;">${caseDetails.case_num}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Court:</td>
                <td style="padding: 8px 0;">${caseDetails.court}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Case Type:</td>
                <td style="padding: 8px 0;">${caseDetails.case_type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">District:</td>
                <td style="padding: 8px 0;">${caseDetails.district}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                <td style="padding: 8px 0;">${caseDetails.status}</td>
              </tr>
            </table>
          </div>
          
          ${userType === 'advocate' ? 
            `<p>As an advocate, you can track and manage this case through your advocate dashboard.` :
            `<p>You can track the status and updates of your case through your litigant dashboard.`
          }
          
          <p>For any queries or assistance, please do not hesitate to contact our support team.</p>
          
          <p>Thank you for using our services.</p>
          
          <p>Best regards,<br>Legal Case Management System</p>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} Legal Case Management System. All rights reserved.</p>
        </div>
      </div>
    `
  };
};

// Function to send email notification for case filing
const sendCaseFilingNotification = async (recipient, caseDetails, userType) => {
  try {
    const { name, email } = recipient;
    const emailContent = createCaseFilingSuccessEmail(name, caseDetails, userType);
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'notifications@legalcasesystem.com',
      subject: emailContent.subject,
      html: emailContent.html,
    };
    
    await sgMail.send(msg);
    console.log(`Case filing notification email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error response body:', error.response.body);
    }
    return false;
  }
};

// Now let's modify both routes to include email notifications

// Modified litigant route with email notification
app.post('/api/filecase/litigant', authenticateToken, async (req, res) => {
  let retryCount = 0;
  const maxRetries = 3;

  async function attemptCaseCreation() {
      try {
          const {
              court,
              case_type,
              plaintiff_details,
              respondent_details,
              police_station_details,
              lower_court_details,
              main_matter_details,
              hearings,
              status,
              case_approved,
              case_no
          } = req.body;

          if (!court || !case_type || !plaintiff_details || !respondent_details) {
              return res.status(400).json({ message: 'Missing required fields' });
          }
          
          // Fetch litigant using token
          const litigant = await Litigant.findOne({ party_id: req.user.party_id });
          
          if (!litigant) {
              return res.status(404).json({ message: 'Litigant profile not found' });
          }
          
          userDistrict = litigant.address.district;

          // Get district directly from user data
          if (!userDistrict) {
              return res.status(400).json({ 
                  message: 'User district information is missing. Please update your profile.' 
              });
          }
          
          // Determine party type and assign party_id automatically
          if (litigant.party_type === 'plaintiff') {
              plaintiff_details.party_id = litigant.party_id;
              // Optionally populate other plaintiff details if not provided
              plaintiff_details.name = plaintiff_details.name || litigant.name;
          } else if (litigant.party_type === 'respondent') {
              respondent_details.party_id = litigant.party_id;
              // Optionally populate other respondent details if not provided
              respondent_details.name = respondent_details.name || litigant.name;
          } else {
              return res.status(400).json({
                  message: 'Invalid party type. Must be either plaintiff or respondent.'
              });
          }
          
          // Generate unique CNR
          const cnrNumber = await generateCNRFromCaseData({
              case_type
          });

          const newCase = new LegalCase({
              court,
              case_type,
              district: userDistrict,
              plaintiff_details,
              respondent_details,
              police_station_details,
              lower_court_details,
              main_matter_details,
              hearings,
              status,
              case_approved: case_approved || false,
              case_num: cnrNumber,
              case_no: cnrNumber,
              filed_by: {
                  party_id: litigant.party_id,
                  party_type: litigant.party_type
              }
          });

          await newCase.save();
          
          // Send email notification to the litigant
          if (litigant && litigant.contact && litigant.contact.email) {
              const recipient = {
                  name: litigant.name || 'Litigant',
                  email: litigant.contact.email
              };
              
              await sendCaseFilingNotification(recipient, newCase, 'litigant');
          }

          return res.status(201).json({
              message: 'Case filed successfully',
              case: newCase,
              case_num: cnrNumber,
              case_no: cnrNumber
          });

      } catch (error) {
          console.error('Error in case filing:', error);
          
          if (error.code === 11000 && retryCount < maxRetries) {
              retryCount++;
              console.log(`Retry attempt ${retryCount}`);
              await new Promise(resolve => 
                  setTimeout(resolve, Math.random() * 100)
              );
              return attemptCaseCreation();
          }
          
          throw error;
      }
  }

  try {
      await attemptCaseCreation();
  } catch (error) {
      console.error('Final error in case filing:', error);
      if (error.code === 11000) {
          res.status(409).json({
              message: 'Unable to generate unique case number after multiple attempts. Please try again.'
          });
      } else {
          res.status(500).json({
              message: 'Server error while filing case'
          });
      }
  }
});

// Modified advocate route with email notification
app.post('/api/filecase/advocate', authenticateToken, async (req, res) => {
  let retryCount = 0;
  const maxRetries = 3;
  
  async function attemptCaseCreation() {
      try {
          const {
              court,
              case_type,
              plaintiff_details,
              respondent_details,
              police_station_details,
              lower_court_details,
              main_matter_details,
              hearings,
              status,
              case_approved,
              case_no,
              representing_party
          } = req.body;
          
          if (!court || !case_type || !plaintiff_details || !respondent_details || !representing_party) {
              return res.status(400).json({ message: 'Missing required fields' });
          }
          
          // Find the advocate using the token
          const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
          if (!advocate) {
              return res.status(404).json({ message: 'Advocate not found' });
          }
          
          // Check if advocate is verified and active
          if (!advocate.isVerified || advocate.status !== 'active') {
              return res.status(403).json({ 
                  message: 'Your account must be verified and active to file cases' 
              });
          }
          
          // Set advocate details based on which party they represent
          if (representing_party === 'plaintiff') {
              plaintiff_details.advocate_id = advocate.advocate_id;
              plaintiff_details.advocate = advocate.name;
          } else if (representing_party === 'respondent') {
              respondent_details.advocate_id = advocate.advocate_id;
              respondent_details.advocate = advocate.name;
          } else {
              return res.status(400).json({ message: 'Invalid representing party value' });
          }
          
          // Get district from advocate profile
          const userDistrict = advocate.district;
          if (!userDistrict) {
              return res.status(400).json({
                  message: 'Advocate district information is missing. Please update your profile.'
              });
          }
          
          // Generate unique CNR
          const cnrNumber = await generateCNRFromCaseData({
              case_type
          });
          
          const newCase = new LegalCase({
              court,
              case_type,
              district: userDistrict,
              plaintiff_details,
              respondent_details,
              police_station_details,
              lower_court_details,
              main_matter_details,
              hearings,
              status,
              case_approved: case_approved || false,
              case_num: cnrNumber,
              case_no: cnrNumber
          });
          
          await newCase.save();
          
          // Send email notification to the advocate
          if (advocate && advocate.email) {
              const recipient = {
                  name: advocate.name || 'Advocate',
                  email: advocate.email
              };
              
              await sendCaseFilingNotification(recipient, newCase, 'advocate');
          }
          
          return res.status(201).json({
              message: 'Case filed successfully',
              case: newCase,
              case_num: cnrNumber,
              case_no: cnrNumber
          });
      } catch (error) {
          console.error('Error in advocate case filing:', error);
          
          if (error.code === 11000 && retryCount < maxRetries) {
              retryCount++;
              console.log(`Retry attempt ${retryCount}`);
              await new Promise(resolve => 
                  setTimeout(resolve, Math.random() * 100)
              );
              return attemptCaseCreation();
          }
          
          throw error;
      }
  }
  
  try {
      await attemptCaseCreation();
  } catch (error) {
      console.error('Final error in advocate case filing:', error);
      if (error.code === 11000) {
          res.status(409).json({
              message: 'Unable to generate unique case number after multiple attempts. Please try again.'
          });
      } else {
          res.status(500).json({
              message: 'Server error while filing case'
          });
      }
  }
});


// POST endpoint to add new hearing (clerk only)
app.get('/api/cases/admin', authenticateToken, async (req, res) => {
    try {
      // Verify if the user is a clerk/admin
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({
          message: 'Access denied: Only court administrators can view this data'
        });
      }
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      const adminDistrict = clerk.district;
      
      if (!adminDistrict) {
        return res.status(400).json({
          message: 'Admin district not found in user profile'
        });
      }
  
      // Find cases in the admin's district
      const cases = await LegalCase.find({ district: adminDistrict })
        .sort({ created_at: -1 });
  
      res.status(200).json({ 
        message: `Retrieved ${cases.length} cases for district: ${adminDistrict}`,
        cases 
      });
    } catch (err) {
      console.error('Error fetching admin cases:', err);
      res.status(500).json({ 
        message: 'Server error while fetching cases' 
      });
    }
});

  
  // Approve or reject a case
  app.patch('/api/case/:caseNum/approve', authenticateToken, async (req, res) => {
    try {
      // Verify if the user is a clerk/admin
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({
          message: 'Access denied: Only court administrators can approve cases'
        });
      }
  
      const { caseNum } = req.params;
      const { case_approved } = req.body;
  
      // Validate the case_approved field is a boolean
      if (typeof case_approved !== 'boolean') {
        return res.status(400).json({
          message: 'case_approved must be a boolean value'
        });
      }
  
      // Update case approval status
      const updatedCase = await LegalCase.findOneAndUpdate(
        { case_num: caseNum },
        { case_approved: case_approved },
        { new: true }
      );
  
      if (!updatedCase) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
  
      res.status(200).json({
        message: `Case ${case_approved ? 'approved' : 'rejected'} successfully`,
        case: updatedCase
      });
    } catch (err) {
      console.error(`Error ${req.body.case_approved ? 'approving' : 'rejecting'} case:`, err);
      res.status(500).json({
        message: `Server error while ${req.body.case_approved ? 'approving' : 'rejecting'} case`
      });
    }
  });
  
  // Update case status
  app.patch('/api/case/:caseNum/status', authenticateToken, async (req, res) => {
    try {
      // Verify if the user is a clerk/admin
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({
          message: 'Access denied: Only court administrators can update case status'
        });
      }
  
      const { caseNum } = req.params;
      const { status, remarks } = req.body;
  
      // Validate status enum
      const validStatuses = [
        'Filed', 
        'Pending', 
        'Under Investigation', 
        'Hearing in Progress', 
        'Awaiting Judgment', 
        'Disposed', 
        'Appealed'
      ];
  
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Invalid status value'
        });
      }
  
      // Update case status
      const updatedCase = await LegalCase.findOneAndUpdate(
        { case_num: caseNum },
        { 
          status: status,
          $push: { 
            status_history: {
              status: status,
              remarks: remarks,
              updated_at: new Date(),
              updated_by: req.user.clerk_id
            } 
          }
        },
        { new: true }
      );
  
      if (!updatedCase) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
  
      res.status(200).json({
        message: 'Case status updated successfully',
        case: updatedCase
      });
    } catch (err) {
      console.error('Error updating case status:', err);
      res.status(500).json({
        message: 'Server error while updating case status'
      });
    }
  });
  app.get('/api/files/:filename', authenticateToken, async (req, res) => {
    try {
      const { filename } = req.params;
      
      // You'll need to determine where files are stored
      // For example, if using multer with local storage:
      const filePath = path.join(__dirname, 'uploads', 'cop_documents',filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: 'File not found'
        });
      }
      
      // Fetch the file metadata from database to get original name and MIME type
      // This could be from any collection that stores your file metadata
      const caseWithFile = await LegalCase.findOne({
        'hearings.attachments.filename': filename
      });
      
      if (!caseWithFile) {
        return res.status(404).json({
          message: 'File metadata not found'
        });
      }
      
      // Find the hearing and attachment
      let fileMetadata = null;
      caseWithFile.hearings.forEach(hearing => {
        if (hearing.attachments) {
          const attachment = hearing.attachments.find(att => att.filename === filename);
          if (attachment) {
            fileMetadata = attachment;
          }
        }
      });
      
      if (!fileMetadata) {
        return res.status(404).json({
          message: 'File metadata not found'
        });
      }
      
      // Set appropriate headers
      res.setHeader('Content-Type', fileMetadata.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.originalname}"`);
      
      // Send the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({
        message: 'Server error while downloading file'
      });
    }
  });
  app.get('/api/case/:caseNum/hearings', authenticateToken, async (req, res) => {
    try {
      const { caseNum } = req.params;
          
      // Find the case and select only the hearings field
      const caseData = await LegalCase.findOne(
        { case_num: caseNum },
        { hearings: 1 }
      );
      
      if (!caseData) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
      
      // For litigants, verify they are associated with the case
      if (req.user.user_type !== 'clerk') {
        const isPartyToCase = await LegalCase.findOne({
          case_num: caseNum,
          $or: [
            { 'plaintiff_details.party_id': req.user.party_id },
            { 'respondent_details.party_id': req.user.party_id }
          ]
        });
        
        if (!isPartyToCase) {
          return res.status(403).json({
            message: 'Please Enter a valid case number'
          });
        }
      }
      
      // Process attachments to include download URLs if needed
      const hearingsWithUrls = caseData.hearings.map(hearing => {
        const hearingObj = hearing.toObject ? hearing.toObject() : hearing;
        
        // If the hearing has attachments, add download URLs
        if (hearingObj.attachments && hearingObj.attachments.length > 0) {
          hearingObj.attachments = hearingObj.attachments.map(attachment => ({
            ...attachment,
            download_url: `/api/files/${attachment.filename}` // Assuming you have a file download endpoint
          }));
        }
        
        return hearingObj;
      });
      
      return res.status(200).json({
        hearings: hearingsWithUrls,
        message: 'Hearings fetched successfully'
      });
      
    } catch (error) {
      console.error('Error fetching hearings:', error);
      return res.status(500).json({
        message: 'Server error while fetching hearings'
      });
    }
  });
  
  app.post('/api/case/:caseNum/hearing', authenticateToken, upload.array('attachments', 5), async (req, res) => {
    try {
      // Verify if the user is a clerk/admin
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({
          message: 'Access denied: Only court administrators can add hearing details'
        });
      }
  
      const { caseNum } = req.params;
      const {
        hearing_date,
        hearing_type,
        remarks,
        next_hearing_date
      } = req.body;
  
      // Validate required fields
      if (!hearing_date || !hearing_type) {
        return res.status(400).json({
          message: 'Hearing date and type are required'
        });
      }
  
      // Validate hearing type enum
      const validHearingTypes = ['Initial', 'Intermediate', 'Final', 'Adjournment'];
      if (!validHearingTypes.includes(hearing_type)) {
        return res.status(400).json({
          message: 'Invalid hearing type'
        });
      }
  
      // Find the case
      const caseData = await LegalCase.findOne({ case_num: caseNum });
  
      if (!caseData) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
  
      // Create a new hearing object
      const newHearing = {
        hearing_date: new Date(hearing_date),
        hearing_type,
        remarks,
        next_hearing_date: next_hearing_date ? new Date(next_hearing_date) : undefined
      };
  
      // Handle file attachments if any
      const files = req.files;
      if (files && files.length > 0) {
        const attachments = files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: file.path,
          size: file.size,
          uploaded_at: new Date()
        }));
        
        newHearing.attachments = attachments;
      }
  
      // Add the new hearing to the case
      if (!caseData.hearings) {
        caseData.hearings = [];
      }
      caseData.hearings.push(newHearing);
  
      // Update case status if appropriate
      if (caseData.status === 'Filed' || caseData.status === 'Pending') {
        caseData.status = 'Hearing in Progress';
      }
  
      // Save the updated case
      await caseData.save();
  
      res.status(201).json({
        message: 'Hearing added successfully',
        hearing: caseData.hearings[caseData.hearings.length - 1]
      });
    } catch (err) {
      console.error('Error adding hearing:', err);
      res.status(500).json({
        message: 'Server error while adding hearing'
      });
    }
  });
  // Update hearing details
 // Update hearing details
app.patch('/api/case/:caseNum/hearing/:hearingId', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    // Verify if the user is a clerk/admin
    if (req.user.user_type !== 'clerk') {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can update hearing details'
      });
    }

    const { caseNum, hearingId } = req.params;
    const {
      hearing_date,
      hearing_type,
      remarks,
      next_hearing_date
    } = req.body;

    // Validate required fields
    if (!hearing_date || !hearing_type) {
      return res.status(400).json({
        message: 'Hearing date and type are required'
      });
    }

    // Validate hearing type enum
    const validHearingTypes = ['Initial', 'Intermediate', 'Final', 'Adjournment'];
    if (!validHearingTypes.includes(hearing_type)) {
      return res.status(400).json({
        message: 'Invalid hearing type'
      });
    }

    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found'
      });
    }

    // Find and update the specific hearing
    const hearingIndex = caseData.hearings.findIndex(h => h._id.toString() === hearingId);

    if (hearingIndex === -1) {
      return res.status(404).json({
        message: 'Hearing not found'
      });
    }

    // Update hearing details
    const updatedHearing = {
      ...caseData.hearings[hearingIndex].toObject(),
      hearing_date: new Date(hearing_date),
      hearing_type,
      remarks,
      next_hearing_date: next_hearing_date ? new Date(next_hearing_date) : undefined
    };

    // Handle file attachments if any
    const files = req.files;
    if (files && files.length > 0) {
      const newAttachments = files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        uploaded_at: new Date()
      }));
      
      // Initialize attachments array if it doesn't exist
      if (!updatedHearing.attachments) {
        updatedHearing.attachments = [];
      }
      
      // Add new attachments
      updatedHearing.attachments.push(...newAttachments);
    }

    // Update the hearing in the document
    caseData.hearings[hearingIndex] = updatedHearing;

    // Save the updated case
    await caseData.save();

    res.status(200).json({
      message: 'Hearing updated successfully',
      hearing: caseData.hearings[hearingIndex]
    });
  } catch (err) {
    console.error('Error updating hearing:', err);
    res.status(500).json({
      message: 'Server error while updating hearing'
    });
  }
});
  
  // Add attachments to a hearing
  app.post('/api/case/:caseNum/hearing/:hearingId/attachments', authenticateToken, upload.array('attachments', 5), async (req, res) => {
    try {
      // Verify if the user is a clerk/admin
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({
          message: 'Access denied: Only court administrators can add hearing attachments'
        });
      }
  
      const { caseNum, hearingId } = req.params;
      const files = req.files;
  
      if (!files || files.length === 0) {
        return res.status(400).json({
          message: 'No files uploaded'
        });
      }
  
      // Find the case
      const caseData = await LegalCase.findOne({ case_num: caseNum });
  
      if (!caseData) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
  
      // Find the specific hearing
      const hearingIndex = caseData.hearings.findIndex(h => h._id.toString() === hearingId);
  
      if (hearingIndex === -1) {
        return res.status(404).json({
          message: 'Hearing not found'
        });
      }
  
      // Create attachment objects for each file
      const attachments = files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        uploaded_at: new Date()
      }));
  
      // Initialize attachments array if it doesn't exist
      if (!caseData.hearings[hearingIndex].attachments) {
        caseData.hearings[hearingIndex].attachments = [];
      }
  
      // Add new attachments
      caseData.hearings[hearingIndex].attachments.push(...attachments);
  
      // Save the updated case
      await caseData.save();
  
      res.status(201).json({
        message: 'Attachments added successfully',
        attachments: caseData.hearings[hearingIndex].attachments
      });
    } catch (err) {
      console.error('Error adding attachments:', err);
      res.status(500).json({
        message: 'Server error while adding attachments'
      });
    }
  });
  const uploadDir2 = 'uploads/casedocument/';

// Ensure the directory exists
if (!fs.existsSync(uploadDir2)) {
  fs.mkdirSync(uploadDir2, { recursive: true });
}

// Configure storage with the name storage3
const storage3 = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir2);
  },
  filename: function(req, file, cb) {
    // Create a unique filename using the original name and timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});
// File download route


// Create upload middleware named upload3
const upload3 = multer({ 
  storage: storage3,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function(req, file, cb) {
    // Accept common document formats
    const allowedFileTypes = [
      '.pdf', '.doc', '.docx', '.txt', '.rtf', '.xls', 
      '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
      return cb(null, true);
    }
    
    cb(new Error('Invalid file type. Only PDF, Word, Excel, PowerPoint, text and image files are allowed.'));
  }
});
  // Upload case document
// Update the document upload route to store consistent file paths

// Document download route
app.get('/api/document/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(`Download request for document ID: ${documentId}`);

    // Find the case containing the document - exact string match on document_id
    const caseWithDocument = await LegalCase.findOne(
      { 'documents.document_id': documentId }
    );

    if (!caseWithDocument) {
      console.log(`No case found with document ID: ${documentId}`);
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // For non-clerks, verify they are associated with the case
    if (req.user.user_type !== 'clerk') {
      const isPartyToCase = 
        caseWithDocument.plaintiff_details.party_id === req.user.party_id || 
        caseWithDocument.respondent_details.party_id === req.user.party_id;

      if (!isPartyToCase) {
        return res.status(403).json({
          message: 'Access denied: You are not authorized to access this document'
        });
      }
    }

    // Find the specific document - exact string match
    const document = caseWithDocument.documents.find(d => d.document_id === documentId);

    if (!document) {
      console.log(`Document with ID ${documentId} not found in case`);
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Get the full file path - using stored path but with safeguards
    let filePath = document.file_path;
    
    // Ensure the path is accessible - if it's not an absolute path, resolve it
    if (!path.isAbsolute(filePath)) {
      // If the path is stored relative to __dirname, resolve it
      filePath = path.resolve(filePath);
    }
    
    console.log(`Attempting to download file at path: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found at primary path: ${filePath}`);
      
      // Fallback - try checking if it's in the uploads directory by filename
      const fallbackPath = path.join(UPLOADS_DIR, path.basename(filePath));
      console.log(`Attempting fallback path: ${fallbackPath}`);
      
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath;
        console.log(`File found at fallback path: ${filePath}`);
      } else {
        return res.status(404).json({
          message: 'Document file not found on server'
        });
      }
    }

    // Check file permissions - try to access the file
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (err) {
      console.error(`Permission denied or cannot access file: ${err.message}`);
      return res.status(403).json({
        message: 'Cannot access file due to permission issues'
      });
    }

    // Set correct content type based on mime type
    const contentType = document.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Set content disposition to suggest filename
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.file_name)}"`);
    const safeFilename = encodeURIComponent(document.file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    // Use res.sendFile for better handling of file serving
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
        
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
          res.status(500).json({
            message: 'Error serving file',
            error: err.message
          });
        }
      } else {
        console.log(`File download completed for: ${document.file_name}`);
      }
    });
  } catch (err) {
    console.error('Error downloading document:', err);
    res.status(500).json({
      message: 'Server error while downloading document',
      error: err.message
    });
  }
});
// Modified document upload route - Allow litigants to upload to their cases
app.post('/api/case/:caseNum/document', authenticateToken, upload3.single('file'), async (req, res) => {
  try {
    const { caseNum } = req.params;
    const { document_type, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!document_type) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // If user is a litigant, verify they are associated with this case
    if (req.user.user_type !== 'clerk') {
      const isPartyToCase = 
        caseData.plaintiff_details.party_id === req.user.party_id || 
        caseData.respondent_details.party_id === req.user.party_id;

      if (!isPartyToCase) {
        return res.status(403).json({
          message: 'Access denied: You can only upload documents to your own cases'
        });
      }
    }

    // Generate a document ID once and use it consistently
    const documentId = new mongoose.Types.ObjectId();
    
    // Store only the relative path for consistency (relative to uploads dir)
    const relativePath = file.path.replace(/\\/g, '/'); // Convert Windows backslashes if needed
    
    // Create document object - only store essential data
    const document = {
      document_id: documentId.toString(), // Convert ObjectId to string consistently
      document_type,
      description: description || '',
      file_name: file.originalname,
      file_path: relativePath,
      mime_type: file.mimetype,
      size: file.size,
      uploaded_date: new Date(),
      uploaded_by: req.user.litigant_id
    };

    // Initialize documents array if it doesn't exist
    if (!caseData.documents) {
      caseData.documents = [];
    }
    
    caseData.documents.push(document);
    await caseData.save();

    console.log(`Document uploaded successfully:`, {
      document_id: document.document_id,
      file_name: document.file_name,
      file_path: document.file_path
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        ...document,  // Send back the exact same document object that was saved
        _id: document.document_id  // Include _id explicitly to match what frontend expects
      },
      case_num: caseNum
    });
  } catch (err) {
    console.error(`Error uploading document:`, err);
    res.status(500).json({
      message: 'Server error while uploading document',
      error: err.message
    });
  }
});

// Document download route - Unchanged except for the access control portion
app.get('/api/document/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(`Download request for document ID: ${documentId}`);

    // Find the case containing the document - exact string match on document_id
    const caseWithDocument = await LegalCase.findOne(
      { 'documents.document_id': documentId }
    );

    if (!caseWithDocument) {
      console.log(`No case found with document ID: ${documentId}`);
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // For non-clerks, verify they are associated with the case
    if (req.user.user_type !== 'clerk') {
      const isPartyToCase = 
        caseWithDocument.plaintiff_details.party_id === req.user.party_id || 
        caseWithDocument.respondent_details.party_id === req.user.party_id;

      if (!isPartyToCase) {
        return res.status(403).json({
          message: 'Access denied: You are not authorized to access this document'
        });
      }
    }

    // Find the specific document - exact string match
    const document = caseWithDocument.documents.find(d => d.document_id === documentId);

    if (!document) {
      console.log(`Document with ID ${documentId} not found in case`);
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Get the full file path - using stored path but with safeguards
    let filePath = document.file_path;
    
    // Ensure the path is accessible - if it's not an absolute path, resolve it
    if (!path.isAbsolute(filePath)) {
      // If the path is stored relative to __dirname, resolve it
      filePath = path.resolve(filePath);
    }
    
    console.log(`Attempting to download file at path: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found at primary path: ${filePath}`);
      
      // Fallback - try checking if it's in the uploads directory by filename
      const fallbackPath = path.join(UPLOADS_DIR, path.basename(filePath));
      console.log(`Attempting fallback path: ${fallbackPath}`);
      
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath;
        console.log(`File found at fallback path: ${filePath}`);
      } else {
        return res.status(404).json({
          message: 'Document file not found on server'
        });
      }
    }

    // Check file permissions - try to access the file
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (err) {
      console.error(`Permission denied or cannot access file: ${err.message}`);
      return res.status(403).json({
        message: 'Cannot access file due to permission issues'
      });
    }

    // Set correct content type based on mime type
    const contentType = document.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Set content disposition to suggest filename
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.file_name)}"`);
    const safeFilename = encodeURIComponent(document.file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    // Use res.sendFile for better handling of file serving
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
        
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
          res.status(500).json({
            message: 'Error serving file',
            error: err.message
          });
        }
      } else {
        console.log(`File download completed for: ${document.file_name}`);
      }
    });
  } catch (err) {
    console.error('Error downloading document:', err);
    res.status(500).json({
      message: 'Server error while downloading document',
      error: err.message
    });
  }
});

// Modified cases route to include documents
app.get('/api/cases/litigant', authenticateToken, async (req, res) => {
  try {
    const partyId = req.user.party_id;
    
    // Find cases where the user is either plaintiff or respondent
    const cases = await LegalCase.find({
      $or: [
        { 'plaintiff_details.party_id': partyId },
        { 'respondent_details.party_id': partyId }
      ]
    }).sort({ createdAt: -1 });
    
    if (!cases || cases.length === 0) {
      return res.status(200).json({ cases: [] });
    }
    
    res.status(200).json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({
      message: 'Server error while fetching cases'
    });
  }
});
  
  // Update office use details
  app.patch('/api/case/:caseNum/office-details', authenticateToken, async (req, res) => {
    try {
      // Verify if the user is a clerk/admin
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({
          message: 'Access denied: Only court administrators can update office details'
        });
      }
  
      const { caseNum } = req.params;
      const officeDetails = req.body;
  
      // Validate date fields
      const dateFields = [
        'filing_date',
        'objection_red_date',
        'objection_compliance_date',
        'registration_date',
        'listing_date',
        'allocation_date'
      ];
  
      for (const field of dateFields) {
        if (officeDetails[field]) {
          try {
            officeDetails[field] = new Date(officeDetails[field]);
          } catch (error) {
            return res.status(400).json({
              message: `Invalid date format for ${field}`
            });
          }
        }
      }
  
      // Update office details
      const updatedCase = await LegalCase.findOneAndUpdate(
        { case_num: caseNum },
        { for_office_use_only: officeDetails },
        { new: true }
      );
  
      if (!updatedCase) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
  
      res.status(200).json({
        message: 'Office details updated successfully',
        for_office_use_only: updatedCase.for_office_use_only
      });
    } catch (err) {
      console.error('Error updating office details:', err);
      res.status(500).json({
        message: 'Server error while updating office details'
      });
    }
  });
  // Configure storage for video uploads
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads','video-pleadings');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `video-pleading-${uniqueSuffix}${ext}`);
  }
});

// Configure multer for video uploads with file size limit (50MB)
const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only video formats
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Route for uploading video pleadings
app.post('/api/case/:caseNum/video-pleading', authenticateToken, uploadVideo.single('videoFile'), async (req, res) => {
  try {
    const { caseNum } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Verify user is associated with this case (if not clerk)
    if (req.user.user_type !== 'clerk') {
      const isPartyToCase = 
        caseData.plaintiff_details.party_id === req.user.party_id || 
        caseData.respondent_details.party_id === req.user.party_id;

      if (!isPartyToCase) {
        return res.status(403).json({
          message: 'Access denied: You can only upload video pleadings to your own cases'
        });
      }
    }

    // Generate a document ID
    const documentId = new mongoose.Types.ObjectId().toString();
    
    // Store relative path for consistency
    const relativePath = file.path.replace(/\\/g, '/');
    
    // Create document object with video-specific metadata
    const document = {
      document_id: documentId,
      document_type: 'video-pleading',
      description: description || '',
      title: title || 'Video Pleading',
      file_name: file.originalname,
      file_path: relativePath,
      mime_type: file.mimetype,
      size: file.size,
      uploaded_date: new Date(),
      uploaded_by: req.user.litigant_id
    };

    // Initialize documents array if it doesn't exist
    if (!caseData.documents) {
      caseData.documents = [];
    }
    
    caseData.documents.push(document);
    await caseData.save();

    console.log(`Video pleading uploaded successfully:`, {
      document_id: document.document_id,
      file_name: document.file_name,
      file_path: document.file_path
    });

    res.status(201).json({
      message: 'Video pleading uploaded successfully',
      document: {
        ...document,
        _id: document.document_id
      },
      case_num: caseNum
    });
  } catch (err) {
    console.error(`Error uploading video pleading:`, err);
    res.status(500).json({
      message: 'Server error while uploading video pleading',
      error: err.message
    });
  }
});

// Route for streaming/downloading video pleadings
app.get('/api/video-pleading/:documentId/stream', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(`Stream request for video pleading ID: ${documentId}`);

    // Find the case containing the video document
    const caseWithVideo = await LegalCase.findOne(
      { 'documents.document_id': documentId, 'documents.document_type': 'video-pleading' }
    );

    if (!caseWithVideo) {
      console.log(`No case found with video pleading ID: ${documentId}`);
      return res.status(404).json({
        message: 'Video pleading not found'
      });
    }

    // For non-clerks, verify they are associated with the case
    if (req.user.user_type !== 'clerk') {
      const isPartyToCase = 
        caseWithVideo.plaintiff_details.party_id === req.user.party_id || 
        caseWithVideo.respondent_details.party_id === req.user.party_id;

      if (!isPartyToCase) {
        return res.status(403).json({
          message: 'Access denied: You are not authorized to access this video pleading'
        });
      }
    }

    // Find the specific video document
    const videoDoc = caseWithVideo.documents.find(d => 
      d.document_id === documentId && d.document_type === 'video-pleading'
    );

    if (!videoDoc) {
      console.log(`Video pleading with ID ${documentId} not found in case`);
      return res.status(404).json({
        message: 'Video pleading not found'
      });
    }

    // Get the full file path
    let filePath = videoDoc.file_path;
    
    // Resolve path if it's not absolute
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(filePath);
    }
    
    console.log(`Attempting to stream video at path: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found at primary path: ${filePath}`);
      
      // Try fallback path
      const fallbackPath = path.join(UPLOADS_DIR, 'video-pleadings', path.basename(filePath));
      console.log(`Attempting fallback path: ${fallbackPath}`);
      
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath;
        console.log(`File found at fallback path: ${filePath}`);
      } else {
        return res.status(404).json({
          message: 'Video file not found on server'
        });
      }
    }

    // Get file stats for video size
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Handle range requests for video streaming
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': videoDoc.mime_type,
      };
      
      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      // Stream the entire file if no range is requested
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': videoDoc.mime_type,
      };
      
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Error streaming video pleading:', err);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Server error while streaming video pleading',
        error: err.message
      });
    }
  }
});

  // Set up multer for file uploads - CORRECTED
  const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/notice_attachments')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  });
  
  const upload2 = multer({ 
    storage: storage2, // CORRECTED: using 'storage' instead of 'storage2'
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });
  
  // Middleware to check if user is admin/clerk
  const isAdmin = async (req, res, next) => {
    try {
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({ message: 'Access denied. Only admins can perform this action.' });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Create a new notice (admin only)
  app.post('/api/notices', authenticateToken, isAdmin, upload2.single('attachment'), async (req, res) => {
    try {
      const {
        title,
        content,
        visibility,
        expiry_date
      } = req.body;
  
      // Get admin information
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      if (!clerk) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      const newNotice = new Notice({
        notice_id: 'NOTICE' + Date.now(),
        title,
        content,
        district: clerk.district,
        visibility: visibility || 'all',
        published_by: {
          admin_id: clerk.clerk_id,
          admin_name: clerk.name
        },
        expiry_date: expiry_date ? new Date(expiry_date) : null
      });
  
      // Add attachment if present
      if (req.file) {
        newNotice.attachment = {
          filename: req.file.filename,
          path: req.file.path,
          mimetype: req.file.mimetype,
          uploadDate: new Date()
        };
      }
  
      await newNotice.save();
  
      res.status(201).json({
        message: 'Notice published successfully',
        notice: newNotice
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all notices for a user
  app.get('/api/notices', authenticateToken, async (req, res) => {
    try {
      const userType = req.user.user_type;
      let userDistrict;
      
      // Get user's district based on user type
      if (userType === 'advocate') {
        const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
        userDistrict = advocate.practice_details.district;
      } else if (userType === 'litigant') {
        const litigant = await Litigant.findOne({ party_id: req.user.party_id });
        userDistrict = litigant.address.district;
      } else if (userType === 'clerk') {
        const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
        userDistrict = clerk.district;
      }
      // Query conditions
      let queryConditions = {
        is_active: true
      };
      
      // Add district condition only if we have a valid district
      if (userDistrict) {
        queryConditions.district = userDistrict;
      }
      
      // If user is not an advocate, they can only see notices for all users
      if (userType !== 'advocate') {
        queryConditions.visibility = 'all';
      }
      
      // If an expiry date is set, it should be in the future
      queryConditions.$or = [
        { expiry_date: { $exists: false } },
        { expiry_date: null },
        { expiry_date: { $gt: new Date() } }
      ];
      
      const notices = await Notice.find(queryConditions)
        .sort({ published_date: -1 });
      
      res.json({ notices });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  // Add this route to handle POST requests for attachments
app.post('/api/notices/:notice_id/attachment', async (req, res) => {
    try {
      // Get token from body
      const token = req.body.token;
      
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Verify token manually
      jwt.verify(token, process.env.JWT_SECRET, async (err, decodedUser) => {
        if (err) {
          return res.status(403).json({ message: 'Invalid or expired token' });
        }
        
        // Add user to request
        req.user = decodedUser;
        
        // Find notice
        const notice = await Notice.findOne({ notice_id: req.params.notice_id });
        
        if (!notice || !notice.attachment) {
          return res.status(404).json({ message: 'Attachment not found' });
        }
        
        // Rest of your permission checks...
        
        // Send the file
        const filePath = path.resolve(__dirname, notice.attachment.path);
        res.setHeader('Content-Type', notice.attachment.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${notice.attachment.filename}"`);
        res.sendFile(filePath);
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  // Get notice attachment - CORRECTED
  app.get('/api/notices/:notice_id/attachment', authenticateToken, async (req, res) => {
    try {
      const notice = await Notice.findOne({ notice_id: req.params.notice_id });
      
      if (!notice || !notice.attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
  
      // Check visibility permissions
      if (notice.visibility === 'advocates_only' && req.user.user_type !== 'advocate' && req.user.user_type !== 'clerk') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      // Check district match
      let userDistrict;
      if (req.user.user_type === 'advocate') {
        const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
        userDistrict = advocate.practice_details.district;
        
      } else if (req.user.user_type === 'litigant') {
        const litigant = await Litigant.findOne({ party_id: req.user.party_id });
        userDistrict = litigant.address.district;
      } else if (req.user.user_type === 'clerk') {
        const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
        userDistrict = clerk.district;
      }
  
      if (notice.district !== userDistrict) {
        return res.status(403).json({ message: 'Access denied. Notice not available in your district.' });
      }
  
      // CORRECTED: Use absolute path resolve
      const filePath = path.resolve(__dirname, notice.attachment.path);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Attachment file not found on server' });
      }
      
      res.setHeader('Content-Type', notice.attachment.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${notice.attachment.filename}"`);
      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a notice (admin only) - CORRECTED to use upload2 consistently
  app.put('/api/notices/:notice_id', authenticateToken, isAdmin, upload2.single('attachment'), async (req, res) => {
    try {
      const {
        title,
        content,
        visibility,
        expiry_date,
        is_active
      } = req.body;
  
      // Find existing notice
      const notice = await Notice.findOne({ notice_id: req.params.notice_id });
      if (!notice) {
        return res.status(404).json({ message: 'Notice not found' });
      }
  
      // Verify admin has rights to update this notice (same district)
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      if (clerk.district !== notice.district) {
        return res.status(403).json({ message: 'Access denied. You can only update notices in your district.' });
      }
  
      // Update fields
      if (title) notice.title = title;
      if (content) notice.content = content;
      if (visibility) notice.visibility = visibility;
      if (expiry_date) notice.expiry_date = new Date(expiry_date);
      if (is_active !== undefined) notice.is_active = is_active;
  
      // Update attachment if present
      if (req.file) {
        // Remove old file if exists
        if (notice.attachment && notice.attachment.path) {
          try {
            const oldFilePath = path.resolve(__dirname, notice.attachment.path);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          } catch (err) {
            console.error('Error deleting old attachment:', err);
          }
        }
  
        notice.attachment = {
          filename: req.file.filename,
          path: req.file.path,
          mimetype: req.file.mimetype,
          uploadDate: new Date()
        };
      }
  
      await notice.save();
  
      res.json({
        message: 'Notice updated successfully',
        notice
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a notice (admin only)
  app.delete('/api/notices/:notice_id', authenticateToken, isAdmin, async (req, res) => {
    try {
      // Find the notice
      const notice = await Notice.findOne({ notice_id: req.params.notice_id });
      if (!notice) {
        return res.status(404).json({ message: 'Notice not found' });
      }
  
      // Verify admin has rights to delete this notice (same district)
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      if (clerk.district !== notice.district) {
        return res.status(403).json({ message: 'Access denied. You can only delete notices in your district.' });
      }
  
      // Delete attachment file if exists
      if (notice.attachment && notice.attachment.path) {
        try {
          const filePath = path.resolve(__dirname, notice.attachment.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Error deleting attachment:', err);
        }
      }
  
      // Delete the notice
      await Notice.deleteOne({ notice_id: req.params.notice_id });
  
      res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get admin's notices (admin only)
  app.get('/api/admin/notices', authenticateToken, isAdmin, async (req, res) => {
    try {
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      
      const notices = await Notice.find({
        'published_by.admin_id': req.user.clerk_id,
        district: clerk.district
      }).sort({ published_date: -1 });
  
      res.json({ notices });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  // Get today's court timing for user's district
  app.get('/api/calendar/today', authenticateToken, async (req, res) => {
    try {
      // Get user's district
      let userDistrict;
      
      if (req.user.user_type === 'advocate') {
        const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
        userDistrict = advocate.practice_details.district;
      } else if (req.user.user_type === 'litigant') {
        const litigant = await Litigant.findOne({ party_id: req.user.party_id });
        userDistrict = litigant.address.district;
      } else if (req.user.user_type === 'clerk') {
        const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
        userDistrict = clerk.district;
      }
      else if (req.user.user_type === 'admin') {
        const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
        userDistrict = admin.district;
      } else {
        return res.status(403).json({ message: 'User type not authorized' });
      }
      
      // Get today's date in YYYY-MM-DD format
      const today = formatDate(new Date());
      
      // Find calendar entry for today in user's district
      let calendarEntry = await CourtCalendar.findOne({
        district: userDistrict,
        date: {
          $gte: new Date(today),
          $lt: new Date(today + 'T23:59:59.999Z')
        }
      });
      
      // If no entry exists for today, return default timings
      if (!calendarEntry) {
        return res.json({
          date: today,
          district: userDistrict,
          is_holiday: false,
          opening_time: '09:00',
          closing_time: '17:00'
        });
      }
      
      res.json({
        date: today,
        district: userDistrict,
        is_holiday: calendarEntry.is_holiday,
        holiday_reason: calendarEntry.holiday_reason,
        opening_time: calendarEntry.opening_time,
        closing_time: calendarEntry.closing_time
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get calendar entries for a specific month and year
  app.get('/api/calendar/:year/:month', authenticateToken, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month) - 1; // JS months are 0-based
      
      // Get user's district
      let userDistrict;
      
      if (req.user.user_type === 'advocate') {
        const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
        userDistrict = advocate.practice_details.district;
      } else if (req.user.user_type === 'litigant') {
        const litigant = await Litigant.findOne({ party_id: req.user.party_id });
        userDistrict = litigant.address.district;
      } else if (req.user.user_type === 'clerk') {
        const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
        userDistrict = clerk.district;
      } 
      else if (req.user.user_type === 'admin') {
        const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
        userDistrict = admin.district;
      } else {
        return res.status(403).json({ message: 'User type not authorized' });
      }
      
      // Create date range for the month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month
      
      // Find all calendar entries for the month in user's district
      const calendarEntries = await CourtCalendar.find({
        district: userDistrict,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ date: 1 });
      
      res.json({ calendar: calendarEntries });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Set court timing for a specific date (admin only)
  app.post('/api/calendar', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { date, is_holiday, holiday_reason, opening_time, closing_time } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: 'Date is required' });
      }
      
      // Get admin's district
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      
      // Format date
      const formattedDate = formatDate(date);
      
      // Check if entry already exists
      let calendarEntry = await CourtCalendar.findOne({
        district: clerk.district,
        date: {
          $gte: new Date(formattedDate),
          $lt: new Date(formattedDate + 'T23:59:59.999Z')
        }
      });
      
      if (calendarEntry) {
        // Update existing entry
        calendarEntry.is_holiday = is_holiday !== undefined ? is_holiday : calendarEntry.is_holiday;
        calendarEntry.holiday_reason = holiday_reason || calendarEntry.holiday_reason;
        calendarEntry.opening_time = opening_time || calendarEntry.opening_time;
        calendarEntry.closing_time = closing_time || calendarEntry.closing_time;
        calendarEntry.updated_at = new Date();
        
        await calendarEntry.save();
        
        return res.json({
          message: 'Calendar entry updated successfully',
          calendar: calendarEntry
        });
      }
      
      // Create new entry
      const newCalendarEntry = new CourtCalendar({
        calendar_id: uuidv4(),
        district: clerk.district,
        date: new Date(formattedDate),
        is_holiday: is_holiday !== undefined ? is_holiday : false,
        holiday_reason: holiday_reason || '',
        opening_time: opening_time || '09:00',
        closing_time: closing_time || '17:00',
        created_by: {
          admin_id: req.user.clerk_id,
          admin_name: clerk.name
        }
      });
      
      await newCalendarEntry.save();
      
      res.status(201).json({
        message: 'Calendar entry created successfully',
        calendar: newCalendarEntry
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update court timing for a specific date (admin only)
  app.put('/api/calendar/:calendar_id', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { is_holiday, holiday_reason, opening_time, closing_time } = req.body;
      
      // Get admin's district
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      
      // Find calendar entry
      const calendarEntry = await CourtCalendar.findOne({ calendar_id: req.params.calendar_id });
      
      if (!calendarEntry) {
        return res.status(404).json({ message: 'Calendar entry not found' });
      }
      
      // Check if admin has rights to update this entry (same district)
      if (clerk.district !== calendarEntry.district) {
        return res.status(403).json({ message: 'Access denied. You can only update calendar entries in your district.' });
      }
      
      // Update fields
      if (is_holiday !== undefined) calendarEntry.is_holiday = is_holiday;
      if (holiday_reason !== undefined) calendarEntry.holiday_reason = holiday_reason;
      if (opening_time) calendarEntry.opening_time = opening_time;
      if (closing_time) calendarEntry.closing_time = closing_time;
      calendarEntry.updated_at = new Date();
      
      await calendarEntry.save();
      
      res.json({
        message: 'Calendar entry updated successfully',
        calendar: calendarEntry
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a calendar entry (admin only)
  app.delete('/api/calendar/:calendar_id', authenticateToken, isAdmin, async (req, res) => {
    try {
      // Get admin's district
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      
      // Find calendar entry
      const calendarEntry = await CourtCalendar.findOne({ calendar_id: req.params.calendar_id });
      
      if (!calendarEntry) {
        return res.status(404).json({ message: 'Calendar entry not found' });
      }
      
      // Check if admin has rights to delete this entry (same district)
      if (clerk.district !== calendarEntry.district) {
        return res.status(403).json({ message: 'Access denied. You can only delete calendar entries in your district.' });
      }
      
      // Delete the entry
      await CourtCalendar.deleteOne({ calendar_id: req.params.calendar_id });
      
      res.json({ message: 'Calendar entry deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all holidays for admin's district (admin only)
  app.get('/api/admin/calendar/holidays', authenticateToken, isAdmin, async (req, res) => {
    try {
      // Get admin's district
      const clerk = await Clerk.findOne({ clerk_id: req.user.clerk_id });
      
      // Find all holidays
      const holidays = await CourtCalendar.find({
        district: clerk.district,
        is_holiday: true
      }).sort({ date: 1 });
      
      res.json({ holidays });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  // Make sure to create the uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, 'uploads/notice_attachments');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }









  app.post('/api/case/:caseNum/video-meeting', authenticateToken, async (req, res) => {
    try {
      // Verify if user is admin/clerk
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({
          message: 'Access denied: Only court administrators can add meeting links'
        });
      }
      
      const { caseNum } = req.params;
      const { meetingLink, startDateTime, endDateTime } = req.body;
      
      // Validate required fields
      if (!meetingLink || !startDateTime || !endDateTime) {
        return res.status(400).json({
          message: 'Meeting link, start date/time, and end date/time are required'
        });
      }
      
      // Validate dates
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({
          message: 'Invalid date format'
        });
      }
      
      if (end <= start) {
        return res.status(400).json({
          message: 'End date/time must be after start date/time'
        });
      }
      
      // Find the case
      const caseData = await LegalCase.findOne({ case_num: caseNum });
      
      if (!caseData) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
      
      // Add/update video meeting details
      caseData.videoMeeting = {
        meetingLink,
        startDateTime: start,
        endDateTime: end,
        isActive: true,
        createdBy: req.user.clerk_id,
        createdAt: new Date()
      };
      
      // Save the updated case
      await caseData.save();
  
      // Collection of notification promises
      const notificationPromises = [];
  
      // If there's a plaintiff party_id, fetch and notify them
      if (caseData.plaintiff_details && caseData.plaintiff_details.party_id) {
        try {
          const plaintiffData = await Litigant.findOne({party_id: caseData.plaintiff_details.party_id });
          if (plaintiffData && plaintiffData.contact && plaintiffData.contact.email && 
              plaintiffData.contact.email !== caseData.plaintiff_details.email) { // Avoid duplicate emails
            
            // Send email with meeting details
            notificationPromises.push(
              sendVideoMeetingNotification({
                name: plaintiffData.full_name,
                email: plaintiffData.contact.email
              }, caseData, 'plaintiff', meetingLink, start, end)
            );
          }
        } catch (error) {
          console.error('Error fetching plaintiff data:', error);
          // Continue execution, don't block the response for this error
        }
      }
  
      // If there's a plaintiff advocate_id, fetch and notify them
      if (caseData.plaintiff_details && caseData.plaintiff_details.advocate_id) {
        try {
          const plaintiffAdvocate = await Advocate.findOne({ advocate_id: caseData.plaintiff_details.advocate_id });
          if (plaintiffAdvocate && plaintiffAdvocate.contact && plaintiffAdvocate.contact.email) {
            // Send email with meeting details
            notificationPromises.push(
              sendVideoMeetingNotification({
                name: plaintiffAdvocate.name,
                email: plaintiffAdvocate.contact.email
              }, caseData, 'plaintiff_advocate', meetingLink, start, end)
            );
          }
        } catch (error) {
          console.error('Error fetching plaintiff advocate data:', error);
          // Continue execution, don't block the response for this error
        }
      }
      
      // If there's a respondent party_id, fetch and notify them
      if (caseData.respondent_details && caseData.respondent_details.party_id) {
        try {
          const respondentData = await Litigant.findOne({party_id: caseData.respondent_details.party_id });
          if (respondentData && respondentData.contact && respondentData.contact.email && 
              respondentData.contact.email !== caseData.respondent_details.email) { // Avoid duplicate emails
            
            // Send email with meeting details
            notificationPromises.push(
              sendVideoMeetingNotification({
                name: respondentData.name,
                email: respondentData.contact.email
              }, caseData, 'respondent', meetingLink, start, end)
            );
          }
        } catch (error) {
          console.error('Error fetching respondent data:', error);
          // Continue execution, don't block the response for this error
        }
      }
  
      // If there's a respondent advocate_id, fetch and notify them
      if (caseData.respondent_details && caseData.respondent_details.advocate_id) {
        try {
          const respondentAdvocate = await Advocate.findOne({ advocate_id: caseData.respondent_details.advocate_id });
          if (respondentAdvocate && respondentAdvocate.contact && respondentAdvocate.contact.email) {
            // Send email with meeting details
            notificationPromises.push(
              sendVideoMeetingNotification({
                name: respondentAdvocate.name,
                email: respondentAdvocate.contact.email
              }, caseData, 'respondent_advocate', meetingLink, start, end)
            );
          }
        } catch (error) {
          console.error('Error fetching respondent advocate data:', error);
          // Continue execution, don't block the response for this error
        }
      }
      
      // Wait for all notification emails to be sent
      await Promise.all(notificationPromises);
      
      res.status(201).json({
        message: 'Video meeting link added successfully',
        videoMeeting: caseData.videoMeeting
      });
      
    } catch (err) {
      console.error('Error adding video meeting:', err);
      res.status(500).json({
        message: 'Server error while adding video meeting'
      });
    }
  });
  
  // Function to send video meeting notification emails without OTP
  const sendVideoMeetingNotification = async (recipient, caseDetails, userType, meetingLink, startDateTime, endDateTime) => {
    try {
      const { name, email } = recipient;
      
      // Format dates for better readability
      const formattedStartDate = startDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedStartTime = startDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const formattedEndTime = endDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Create email content
      const subject = `Court Video Meeting Scheduled - Case #${caseDetails.case_num}`;
      
      // Create HTML email with professional template
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .header {
              background-color: #1a365d;
              color: white;
              padding: 15px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              padding: 20px;
            }
            .meeting-details {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background-color: #1a365d;
              color: white;
              padding: 12px 25px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              font-size: 12px;
              text-align: center;
              margin-top: 30px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Court Video Meeting Notification</h2>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>This is to inform you that a virtual court meeting has been scheduled for case #${caseDetails.case_num} - ${caseDetails.case_title || 'Court Case'}.</p>
              
              <div class="meeting-details">
                <h3>Meeting Details:</h3>
                <p><strong>Date:</strong> ${formattedStartDate}</p>
                <p><strong>Time:</strong> ${formattedStartTime} to ${formattedEndTime}</p>
                <p><strong>Case Number:</strong> ${caseDetails.case_num}</p>
                <p><strong>Your Role:</strong> ${userType.replace('_', ' ').charAt(0).toUpperCase() + userType.replace('_', ' ').slice(1)}</p>
              </div>
              
              <p>Please ensure you log in at least 10 minutes before the scheduled time to test your audio and video settings.</p>
              
              <a href="${meetingLink}" class="button">Join Meeting</a>
              
              <p>If you have any questions or need technical assistance, please contact the court registry.</p>
              
              <p>Regards,<br>Court Administration</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Legal Case Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const msg = {
        to: email,
        from: process.env.FROM_EMAIL || 'notifications@legalcasesystem.com',
        subject: subject,
        html: html,
      };
      
      await sgMail.send(msg);
      console.log(`Video meeting notification email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('SendGrid Error:', error);
      if (error.response) {
        console.error('Error response body:', error.response.body);
      }
      return false;
    }
  };
  // 4. Route for litigant to request OTP for meeting access
  app.post('/api/case/:caseNum/video-meeting/request-access', async (req, res) => {
    try {
      const { caseNum } = req.params;
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          message: 'Email is required'
        });
      }
      
      // Find the case
      const caseData = await LegalCase.findOne({ case_num: caseNum });
      
      if (!caseData) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
      
      // Verify if email belongs to plaintiff or respondent
    
      
      // Check if video meeting exists and is active
      if (!caseData.videoMeeting || !caseData.videoMeeting.isActive) {
        return res.status(404).json({
          message: 'No active video meeting found for this case'
        });
      }
      
      // Generate new OTP
      const otp = generateOTP();
      
      // Store OTP in database
      await OTPVerification.create({
        email,
        otp,
        purpose: 'meeting-access',
        caseNum,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      // Send email with OTP
      await sendEmailOTP(email, otp);
      
      res.status(200).json({
        message: 'OTP sent successfully to your email'
      });
      
    } catch (err) {
      console.error('Error requesting meeting access:', err);
      res.status(500).json({
        message: 'Server error while requesting meeting access'
      });
    }
  });
  
  // 5. Route to verify OTP and get meeting link
  app.post('/api/case/:caseNum/video-meeting/verify-otp', async (req, res) => {
    try {
      const { caseNum } = req.params;
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({
          message: 'Email and OTP are required'
        });
      }
      
      // Find the OTP in database
      const otpRecord = await OTPVerification.findOne({
        email,
        otp,
        purpose: 'meeting-access',
        caseNum,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });
      
      if (!otpRecord) {
        return res.status(400).json({
          message: 'Invalid or expired OTP'
        });
      }
      
      // Find the case
      const caseData = await LegalCase.findOne({ case_num: caseNum });
      
      if (!caseData || !caseData.videoMeeting) {
        return res.status(404).json({
          message: 'Case or video meeting not found'
        });
      }
      
      // Check if current time is within the valid time range for the meeting
      const now = new Date();
      if (now < caseData.videoMeeting.startDateTime || now > caseData.videoMeeting.endDateTime) {
        return res.status(403).json({
          message: 'The meeting link is not currently available. Please check the scheduled time.'
        });
      }
      
      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();
      
      // Return meeting link
      res.status(200).json({
        message: 'OTP verified successfully',
        meetingLink: caseData.videoMeeting.meetingLink,
        startDateTime: caseData.videoMeeting.startDateTime,
        endDateTime: caseData.videoMeeting.endDateTime
      });
      
    } catch (err) {
      console.error('Error verifying OTP:', err);
      res.status(500).json({
        message: 'Server error while verifying OTP'
      });
    }
  });
  
  // 6. Route for authenticated users to directly get meeting link (if within time frame)
  app.get('/api/case/:caseNum/video-meeting', authenticateToken, async (req, res) => {
    try {
      const { caseNum } = req.params;
      
      // Find the case
      const caseData = await LegalCase.findOne({ case_num: caseNum });
      
      if (!caseData) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
      
      // For non-clerks, verify they are associated with the case
      if (req.user.user_type !== 'clerk') {
        const isPartyToCase = 
          caseData.plaintiff_details.party_id === req.user.party_id || 
          caseData.respondent_details.party_id === req.user.party_id;
        
        if (!isPartyToCase) {
          return res.status(403).json({
            message: 'Access denied: You are not authorized to access this case'
          });
        }
      }
      
      // Check if video meeting exists
      if (!caseData.videoMeeting || !caseData.videoMeeting.isActive) {
        return res.status(404).json({
          message: 'No active video meeting found for this case'
        });
      }
      
      // Check if current time is within the valid time range
      const now = new Date();
      if (now < caseData.videoMeeting.startDateTime || now > caseData.videoMeeting.endDateTime) {
        return res.status(403).json({
          message: 'The meeting link is not currently available',
          startDateTime: caseData.videoMeeting.startDateTime,
          endDateTime: caseData.videoMeeting.endDateTime
        });
      }
      
      // Return meeting details
      res.status(200).json({
        message: 'Meeting link retrieved successfully',
        meetingLink: caseData.videoMeeting.meetingLink,
        startDateTime: caseData.videoMeeting.startDateTime,
        endDateTime: caseData.videoMeeting.endDateTime
      });
      
    } catch (err) {
      console.error('Error getting video meeting:', err);
      res.status(500).json({
        message: 'Server error while getting video meeting'
      });
    }
  });
  
  // 7. Admin Route: Update or deactivate a meeting
  app.put('/api/case/:caseNum/video-meeting', authenticateToken, async (req, res) => {
    try {
      // Verify if user is admin/clerk
      if (req.user.user_type !== 'clerk') {
        return res.status(403).json({
          message: 'Access denied: Only court administrators can update meeting details'
        });
      }
      
      const { caseNum } = req.params;
      const { meetingLink, startDateTime, endDateTime, isActive } = req.body;
      
      // Find the case
      const caseData = await LegalCase.findOne({ case_num: caseNum });
      
      if (!caseData) {
        return res.status(404).json({
          message: 'Case not found'
        });
      }
      
      // Check if video meeting exists
      if (!caseData.videoMeeting) {
        return res.status(404).json({
          message: 'No video meeting found for this case'
        });
      }
      
      // Update fields if provided
      if (meetingLink) caseData.videoMeeting.meetingLink = meetingLink;
      
      if (startDateTime) {
        const start = new Date(startDateTime);
        if (isNaN(start)) {
          return res.status(400).json({
            message: 'Invalid start date/time format'
          });
        }
        caseData.videoMeeting.startDateTime = start;
      }
      
      if (endDateTime) {
        const end = new Date(endDateTime);
        if (isNaN(end)) {
          return res.status(400).json({
            message: 'Invalid end date/time format'
          });
        }
        caseData.videoMeeting.endDateTime = end;
      }
      
      // Ensure end time is after start time
      if (caseData.videoMeeting.endDateTime <= caseData.videoMeeting.startDateTime) {
        return res.status(400).json({
          message: 'End date/time must be after start date/time'
        });
      }
      
      // Update active status if provided
      if (isActive !== undefined) {
        caseData.videoMeeting.isActive = isActive;
      }
      
      // Save the updated case
      await caseData.save();
      
      res.status(200).json({
        message: 'Video meeting updated successfully',
        videoMeeting: caseData.videoMeeting
      });
      
    } catch (err) {
      console.error('Error updating video meeting:', err);
      res.status(500).json({
        message: 'Server error while updating video meeting'
      });
    }
  });
// Routes for advocate video meeting access

// 1. Route for advocates to directly get meeting link (if within time frame)
app.get('/api/case/:caseNum/advocate/video-meeting', authenticateToken, async (req, res) => {
  try {
    const { caseNum } = req.params;
    
    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found'
      });
    }
    
    // Verify the user is an advocate associated with the case
    const isAdvocateForCase = 
      caseData.plaintiff_details.advocate_id === req.user.advocate_id || 
      caseData.respondent_details.advocate_id === req.user.advocate_id;
    
    if (!isAdvocateForCase && req.user.user_type !== 'clerk') {
      return res.status(403).json({
        message: 'Access denied: You are not authorized to access this case'
      });
    }
    
    // Check if video meeting exists
    if (!caseData.videoMeeting || !caseData.videoMeeting.isActive) {
      return res.status(404).json({
        message: 'No active video meeting found for this case'
      });
    }
    
    // Check if current time is within the valid time range
    const now = new Date();
    if (now < caseData.videoMeeting.startDateTime || now > caseData.videoMeeting.endDateTime) {
      return res.status(403).json({
        message: 'The meeting link is not currently available',
        startDateTime: caseData.videoMeeting.startDateTime,
        endDateTime: caseData.videoMeeting.endDateTime
      });
    }
    
    // Return meeting details
    res.status(200).json({
      message: 'Meeting link retrieved successfully',
      meetingLink: caseData.videoMeeting.meetingLink,
      startDateTime: caseData.videoMeeting.startDateTime,
      endDateTime: caseData.videoMeeting.endDateTime
    });
    
  } catch (err) {
    console.error('Error getting video meeting:', err);
    res.status(500).json({
      message: 'Server error while getting video meeting'
    });
  }
});

// 2. Route for advocate to request OTP for meeting access
app.post('/api/case/:caseNum/advocate/video-meeting/request-access', async (req, res) => {
  try {
    const { caseNum } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }
    
    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found'
      });
    }
    
    // Check if video meeting exists and is active
    if (!caseData.videoMeeting || !caseData.videoMeeting.isActive) {
      return res.status(404).json({
        message: 'No active video meeting found for this case'
      });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Store OTP in database with advocate-specific purpose
    await OTPVerification.create({
      email,
      otp,
      purpose: 'advocate-meeting-access',
      caseNum,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    // Send email with OTP
    await sendEmailOTP(email, otp);
    
    res.status(200).json({
      message: 'OTP sent successfully to your email'
    });
    
  } catch (err) {
    console.error('Error requesting meeting access:', err);
    res.status(500).json({
      message: 'Server error while requesting meeting access'
    });
  }
});

// 3. Route to verify advocate OTP and get meeting link
app.post('/api/case/:caseNum/advocate/video-meeting/verify-otp', async (req, res) => {
  try {
    const { caseNum } = req.params;
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required'
      });
    }
    
    // Find the OTP in database
    const otpRecord = await OTPVerification.findOne({
      email,
      otp,
      purpose: 'advocate-meeting-access',
      caseNum,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        message: 'Invalid or expired OTP'
      });
    }
    
    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData || !caseData.videoMeeting) {
      return res.status(404).json({
        message: 'Case or video meeting not found'
      });
    }
    
    // Check if current time is within the valid time range for the meeting
    const now = new Date();
    if (now < caseData.videoMeeting.startDateTime || now > caseData.videoMeeting.endDateTime) {
      return res.status(403).json({
        message: 'The meeting link is not currently available. Please check the scheduled time.',
        startDateTime: caseData.videoMeeting.startDateTime,
        endDateTime: caseData.videoMeeting.endDateTime
      });
    }
    
    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();
    
    // Return meeting link
    res.status(200).json({
      message: 'OTP verified successfully',
      meetingLink: caseData.videoMeeting.meetingLink,
      startDateTime: caseData.videoMeeting.startDateTime,
      endDateTime: caseData.videoMeeting.endDateTime
    });
    
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({
      message: 'Server error while verifying OTP'
    });
  }
});

// 4. Route for clerk to add advocate to notification list when scheduling meetings
app.post('/api/case/:caseNum/video-meeting/add-advocate-notification', authenticateToken, async (req, res) => {
  try {
    // Verify if user is admin/clerk
    if (req.user.user_type !== 'clerk') {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can manage notifications'
      });
    }
    
    const { caseNum } = req.params;
    const { advocateId, advocateEmail } = req.body;
    
    if (!advocateId || !advocateEmail) {
      return res.status(400).json({
        message: 'Advocate ID and email are required'
      });
    }
    
    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found'
      });
    }
    
    // Verify advocate is associated with the case
    const isAdvocateForCase = 
      caseData.plaintiff_details.advocate_id === advocateId || 
      caseData.respondent_details.advocate_id === advocateId;
    
    if (!isAdvocateForCase) {
      return res.status(400).json({
        message: 'Advocate is not associated with this case'
      });
    }
    
    // Generate OTP for advocate
    const advocateOTP = generateOTP();
    
    // Store OTP in database
    await OTPVerification.create({
      email: advocateEmail,
      otp: advocateOTP,
      purpose: 'advocate-meeting-access',
      caseNum: caseNum,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    // Send email with OTP
    await sendEmailOTP(advocateEmail, advocateOTP);
    
    res.status(200).json({
      message: 'Advocate notification added successfully'
    });
    
  } catch (err) {
    console.error('Error adding advocate notification:', err);
    res.status(500).json({
      message: 'Server error while adding advocate notification'
    });
  }
});





  app.get('/advocates/search', authenticateToken, async (req, res) => {
    try {
      const { district } = req.query;
          
      if (!district) {
        return res.status(400).json({ message: 'District is required' });
      }
          
      // Find advocates who practice in the given district
      const advocates = await Advocate.find({
        'practice_details.district': district
      }).select('name advocate_id practice_details _id');
          
      console.log('Advocates found:', advocates.length); // Add logging
      res.status(200).json({ advocates });
    } catch (error) {
      console.error('Error searching advocates:', error);
      res.status(500).json({ message: 'Server error while searching advocates' });
    }
  });
  
  // 2. Endpoint for advocates to search for cases in their district
  app.get('/cases/district', authenticateToken, async (req, res) => {
    try {
      const advocate = await Advocate.findOne( {advocate_id : req.user.advocate_id});
      
      if (!advocate) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const district = advocate.practice_details.district;
      
      // Find cases in the advocate's district
      const cases = await LegalCase.find({ district }).sort({ created_at: -1 });
      
      res.status(200).json({ cases });
    } catch (error) {
      console.error('Error searching cases by district:', error);
      res.status(500).json({ message: 'Server error while searching cases' });
    }
  });
  
  // 3. Endpoint for litigant to request an advocate
  app.post('/cases/:caseId/request-advocate', authenticateToken, async (req, res) => {
    try {
      const { caseId } = req.params;
      const { advocateId, advocateName, partyType } = req.body;
      
      if (!advocateId || !partyType) {
        return res.status(400).json({ message: 'Advocate ID and party type are required' });
      }
      
      const legalCase = await LegalCase.findOne({ _id: caseId });
      
      if (!legalCase) {
        return res.status(404).json({ message: 'Case not found' });
      }
      
      // Check if user is authorized to make this request
      const partyId = req.user.party_id;
      const isPlaintiff = legalCase.plaintiff_details.party_id === partyId;
      const isRespondent = legalCase.respondent_details.party_id === partyId;
      
      if (!isPlaintiff && !isRespondent) {
        return res.status(403).json({ message: 'Not authorized to request advocate for this case' });
      }
      
      // Check if the request already exists
      const existingRequest = legalCase.advocate_requests.find(
        req => req.advocate_id === advocateId && 
               req.party_type === partyType && 
               req.litigant_id === partyId
      );
      
      if (existingRequest) {
        return res.status(400).json({ message: 'Request already exists' });
      }
      
      // Add the request
      legalCase.advocate_requests.push({
        advocate_id: advocateId,
        advocate_name: advocateName,
        party_type: partyType,
        requested_by: 'litigant',
        litigant_id: partyId,
        status: 'pending',
        requested_at: new Date(),
        updated_at: new Date()
      });
      
      await legalCase.save();
      
      res.status(201).json({ message: 'Advocate request sent successfully' });
    } catch (error) {
      console.error('Error requesting advocate:', error);
      res.status(500).json({ message: 'Server error while requesting advocate' });
    }
  });
  
  // 4. Endpoint for advocate to request to join a case
  app.post('/cases/:caseId/advocate-join-request', authenticateToken, async (req, res) => {
    try {
      const { caseId } = req.params;
      const { partyType, litigantId } = req.body;
      
      if (!partyType || !litigantId) {
        return res.status(400).json({ message: 'Party type and litigant ID are required' });
      }
      
      const advocate = await Advocate.findOne({ advocate_id: req.user.advocate_id });
      
      if (!advocate) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const legalCase = await LegalCase.findOne({ _id: caseId });
      
      if (!legalCase) {
        return res.status(404).json({ message: 'Case not found' });
      }
      
      // Check if the request already exists
      const existingRequest = legalCase.advocate_requests.find(
        req => req.advocate_id === advocate._id.toString() && 
               req.party_type === partyType && 
               req.litigant_id === litigantId
      );
      
      if (existingRequest) {
        return res.status(400).json({ message: 'Request already exists' });
      }
      
      // Add the request
      legalCase.advocate_requests.push({
        advocate_id: advocate.advocate_id,
        advocate_name: advocate.name,
        party_type: partyType,
        requested_by: 'advocate',
        litigant_id: litigantId,
        status: 'pending',
        requested_at: new Date(),
        updated_at: new Date()
      });
      
      await legalCase.save();
      
      res.status(201).json({ message: 'Request to join case sent successfully' });
    } catch (error) {
      console.error('Error requesting to join case:', error);
      res.status(500).json({ message: 'Server error while requesting to join case' });
    }
  });
  
  // 5. Endpoint to handle request approval/rejection
  app.put('/cases/:caseId/advocate-requests/:requestId', authenticateToken, async (req, res) => {
    try {
      const { caseId, requestId } = req.params;
      const { status } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Valid status (approved or rejected) is required' });
      }
      
      const legalCase = await LegalCase.findOne({ _id: caseId });
      
      if (!legalCase) {
        return res.status(404).json({ message: 'Case not found' });
      }
      
      // Find the request
      const request = legalCase.advocate_requests.id(requestId);
      
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      // Check authorization
      const partyId = req.user.party_id;
      const advocateId = req.user.user_type === 'advocate' ? req.user.advocate_id : null;
      
      // Litigant approving advocate's request
      if (request.requested_by === 'advocate' && request.litigant_id === partyId) {
        request.status = status;
        request.updated_at = new Date();
        
        // If approved, update the case with the advocate's ID
        if (status === 'approved') {
          if (request.party_type === 'plaintiff') {
            legalCase.plaintiff_details.advocate_id = request.advocate_id;
            legalCase.plaintiff_details.advocate = request.advocate_name;
          } else {
            legalCase.respondent_details.advocate_id = request.advocate_id;
            legalCase.respondent_details.advocate = request.advocate_name;
          }
        }
      } 
      // Advocate approving litigant's request
      else if (request.requested_by === 'litigant' && request.advocate_id === advocateId) {
        request.status = status;
        request.updated_at = new Date();
        
        // If approved, update the case with the advocate's ID
        if (status === 'approved') {
          if (request.party_type === 'plaintiff') {
            legalCase.plaintiff_details.advocate_id = advocateId;
            legalCase.plaintiff_details.advocate = req.user.name;
          } else {
            legalCase.respondent_details.advocate_id = advocateId;
            legalCase.respondent_details.advocate = req.user.name;
          }
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to update this request' });
      }
      
      await legalCase.save();
      
      res.status(200).json({ message: `Request ${status} successfully` });
    } catch (error) {
      console.error('Error updating advocate request:', error);
      res.status(500).json({ message: 'Server error while updating request' });
    }
  });
  
  // 6. Endpoint to get all pending requests for an advocate
  app.get('/advocate/pending-requests', authenticateToken, async (req, res) => {
    try {
      const advocateId = req.user.advocate_id;
      
      if (req.user.user_type !== 'advocate') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      // Find cases with pending requests for this advocate
      const cases = await LegalCase.find({
        'advocate_requests': {
          $elemMatch: {
            advocate_id: advocateId,
            status: 'pending',
            requested_by: 'litigant'
          }
        }
      });
      
      // Extract only the necessary information
      const pendingRequests = cases.map(legalCase => {
        const requests = legalCase.advocate_requests.filter(
          req => req.advocate_id === advocateId.toString() && 
                 req.status === 'pending' && 
                 req.requested_by === 'litigant'
        );
        
        return {
          case_id: legalCase._id,
          case_num: legalCase.case_num,
          court: legalCase.court,
          case_type: legalCase.case_type,
          district: legalCase.district,
          plaintiff: legalCase.plaintiff_details.name,
          respondent: legalCase.respondent_details.name,
          requests
        };
      });
      
      res.status(200).json({ pendingRequests });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(500).json({ message: 'Server error while fetching pending requests' });
    }
  });
  
  // 7. Endpoint to get all pending requests for a litigant
  app.get('/litigant/pending-requests', authenticateToken, async (req, res) => {
    try {
      const partyId = req.user.party_id;
      
      // Find cases with pending requests for this litigant
      const cases = await LegalCase.find({
        'advocate_requests': {
          $elemMatch: {
            litigant_id: partyId,
            status: 'pending',
            requested_by: 'advocate'
          }
        }
      });
      
      // Extract only the necessary information
      const pendingRequests = cases.map(legalCase => {
        const requests = legalCase.advocate_requests.filter(
          req => req.litigant_id === partyId && 
                 req.status === 'pending' && 
                 req.requested_by === 'advocate'
        );
        
        return {
          case_id: legalCase._id,
          case_num: legalCase.case_num,
          court: legalCase.court,
          case_type: legalCase.case_type,
          district: legalCase.district,
          plaintiff: legalCase.plaintiff_details.name,
          respondent: legalCase.respondent_details.name,
          requests
        };
      });
      
      res.status(200).json({ pendingRequests });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(500).json({ message: 'Server error while fetching pending requests' });
    }
  });
// 8. Endpoint to get all requests sent by an advocate
app.get('/advocate/sent-requests', authenticateToken, async (req, res) => {
  try {
    const advocateId = req.user.advocate_id;
    
    if (req.user.user_type !== 'advocate') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Find cases with requests sent by this advocate
    const cases = await LegalCase.find({
      'advocate_requests': {
        $elemMatch: {
          advocate_id: advocateId,
          requested_by: 'advocate'
        }
      }
    });
    
    // Extract only the necessary information
    const sentRequests = cases.map(legalCase => {
      const request = legalCase.advocate_requests.find(
        req => req.advocate_id === advocateId && 
               req.requested_by === 'advocate'
      );
      
      return {
        case_id: legalCase._id,
        case_num: legalCase.case_num,
        court: legalCase.court,
        case_type: legalCase.case_type,
        district: legalCase.district,
        plaintiff: legalCase.plaintiff_details.name,
        respondent: legalCase.respondent_details.name,
        party_type: request.party_type,
        request_status: request.status,
        requested_at: request.requested_at,
        updated_at: request.updated_at
      };
    });
    
    res.status(200).json({ sentRequests });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ message: 'Server error while fetching sent requests' });
  }
});








  // Route to get all cases for an advocate
app.get('/api/cases/advocate', authenticateToken, async (req, res) => {
  try {
    const advocateId = req.user.advocate_id;
    
    // Find cases where the user is either plaintiff's advocate or respondent's advocate
    const cases = await LegalCase.find({
      $or: [
        { 'plaintiff_details.advocate_id': advocateId },
        { 'respondent_details.advocate_id': advocateId }
      ]
    }).sort({ createdAt: -1 });
    
    if (!cases || cases.length === 0) {
      return res.status(200).json({ cases: [] });
    }
    
    res.status(200).json({ cases });
  } catch (error) {
    console.error('Error fetching advocate cases:', error);
    res.status(500).json({
      message: 'Server error while fetching cases'
    });
  }
});

// Route to get hearings for a specific case - accessible by advocate
app.get('/api/case/:caseNum/hearings/advocate', authenticateToken, async (req, res) => {
  try {
    const { caseNum } = req.params;
    const advocateId = req.user.advocate_id;
    
    // Find the case and verify advocate association
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      $or: [
        { 'plaintiff_details.advocate_id': advocateId },
        { 'respondent_details.advocate_id': advocateId }
      ]
    }, { hearings: 1 });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or you do not have access to this case'
      });
    }
    
    // Process attachments to include download URLs
    const hearingsWithUrls = caseData.hearings.map(hearing => {
      const hearingObj = hearing.toObject ? hearing.toObject() : hearing;
      
      // If the hearing has attachments, add download URLs
      if (hearingObj.attachments && hearingObj.attachments.length > 0) {
        hearingObj.attachments = hearingObj.attachments.map(attachment => ({
          ...attachment,
          download_url: `/api/files/${attachment.filename}`
        }));
      }
      
      return hearingObj;
    });
    
    return res.status(200).json({
      hearings: hearingsWithUrls,
      message: 'Hearings fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching hearings for advocate:', error);
    return res.status(500).json({
      message: 'Server error while fetching hearings'
    });
  }
});

// Route to get documents for a specific case - accessible by advocate
app.get('/api/case/:caseNum/documents/advocate', authenticateToken, async (req, res) => {
  try {
    const { caseNum } = req.params;
    const advocateId = req.user.advocate_id;
    
    // Find the case and verify advocate association
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      $or: [
        { 'plaintiff_details.advocate_id': advocateId },
        { 'respondent_details.advocate_id': advocateId }
      ]
    }, { documents: 1 });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or you do not have access to this case'
      });
    }
    
    return res.status(200).json({
      documents: caseData.documents || [],
      message: 'Documents fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching documents for advocate:', error);
    return res.status(500).json({
      message: 'Server error while fetching documents'
    });
  }
});

// Document upload route for advocates
app.post('/api/case/:caseNum/document/advocate', authenticateToken, upload3.single('file'), async (req, res) => {
  try {
    const { caseNum } = req.params;
    const { document_type, description } = req.body;
    const file = req.file;
    const advocateId = req.user.advocate_id;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!document_type) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    // Find the case and verify advocate association
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      $or: [
        { 'plaintiff_details.advocate_id': advocateId },
        { 'respondent_details.advocate_id': advocateId }
      ]
    });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or you do not have access to this case'
      });
    }

    // Generate a document ID
    const documentId = new mongoose.Types.ObjectId();
    
    // Store only the relative path for consistency
    const relativePath = file.path.replace(/\\/g, '/');
    
    // Create document object
    const document = {
      document_id: documentId.toString(),
      document_type,
      description: description || '',
      file_name: file.originalname,
      file_path: relativePath,
      mime_type: file.mimetype,
      size: file.size,
      uploaded_date: new Date(),
      uploaded_by: req.user.advocate_id
    };

    // Initialize documents array if it doesn't exist
    if (!caseData.documents) {
      caseData.documents = [];
    }
    
    caseData.documents.push(document);
    await caseData.save();

    console.log(`Document uploaded successfully by advocate:`, {
      advocate_id: advocateId,
      document_id: document.document_id,
      file_name: document.file_name
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        ...document,
        _id: document.document_id
      },
      case_num: caseNum
    });
  } catch (err) {
    console.error(`Error uploading document by advocate:`, err);
    res.status(500).json({
      message: 'Server error while uploading document',
      error: err.message
    });
  }
});

// Video pleading upload route for advocates
app.post('/api/case/:caseNum/video-pleading/advocate', authenticateToken, uploadVideo.single('videoFile'), async (req, res) => {
  try {
    const { caseNum } = req.params;
    const { title, description } = req.body;
    const file = req.file;
    const advocateId = req.user.advocate_id;

    if (!file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Find the case and verify advocate association
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      $or: [
        { 'plaintiff_details.advocate_id': advocateId },
        { 'respondent_details.advocate_id': advocateId }
      ]
    });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or you do not have access to this case'
      });
    }

    // Generate a document ID
    const documentId = new mongoose.Types.ObjectId().toString();
    
    // Store relative path for consistency
    const relativePath = file.path.replace(/\\/g, '/');
    
    // Create document object with video-specific metadata
    const document = {
      document_id: documentId,
      document_type: 'video-pleading',
      description: description || '',
      title: title || 'Video Pleading',
      file_name: file.originalname,
      file_path: relativePath,
      mime_type: file.mimetype,
      size: file.size,
      uploaded_date: new Date(),
      uploaded_by: req.user.advocate_id
    };

    // Initialize documents array if it doesn't exist
    if (!caseData.documents) {
      caseData.documents = [];
    }
    
    caseData.documents.push(document);
    await caseData.save();

    console.log(`Video pleading uploaded successfully by advocate:`, {
      advocate_id: advocateId,
      document_id: document.document_id,
      file_name: document.file_name
    });

    res.status(201).json({
      message: 'Video pleading uploaded successfully',
      document: {
        ...document,
        _id: document.document_id
      },
      case_num: caseNum
    });
  } catch (err) {
    console.error(`Error uploading video pleading by advocate:`, err);
    res.status(500).json({
      message: 'Server error while uploading video pleading',
      error: err.message
    });
  }
});

// Route for advocates to get video meeting information
app.get('/api/case/:caseNum/video-meeting/advocate', authenticateToken, async (req, res) => {
  try {
    const { caseNum } = req.params;
    const advocateId = req.user.advocate_id;
    
    // Find the case and verify advocate association
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      $or: [
        { 'plaintiff_details.advocate_id': advocateId },
        { 'respondent_details.advocate_id': advocateId }
      ]
    });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or you do not have access to this case'
      });
    }
    
    // Check if video meeting exists
    if (!caseData.videoMeeting || !caseData.videoMeeting.isActive) {
      return res.status(404).json({
        message: 'No active video meeting found for this case'
      });
    }
    
    // Check if current time is within the valid time range
    const now = new Date();
    if (now < caseData.videoMeeting.startDateTime || now > caseData.videoMeeting.endDateTime) {
      return res.status(403).json({
        message: 'The meeting link is not currently available',
        startDateTime: caseData.videoMeeting.startDateTime,
        endDateTime: caseData.videoMeeting.endDateTime
      });
    }
    
    // Return meeting details
    res.status(200).json({
      message: 'Meeting link retrieved successfully',
      meetingLink: caseData.videoMeeting.meetingLink,
      startDateTime: caseData.videoMeeting.startDateTime,
      endDateTime: caseData.videoMeeting.endDateTime
    });
    
  } catch (err) {
    console.error('Error getting video meeting for advocate:', err);
    res.status(500).json({
      message: 'Server error while getting video meeting',
      error: err.message
    });
  }
});

// Route to handle advocate-litigant association requests
app.post('/api/case/:caseNum/request-advocate-association', authenticateToken, async (req, res) => {
  try {
    const { caseNum } = req.params;
    const { party_type, litigant_id } = req.body;
    const advocateId = req.user.advocate_id;
    const advocateName = req.user.name || 'Unknown Advocate';
    
    if (!party_type || !litigant_id) {
      return res.status(400).json({ 
        message: 'Party type and litigant ID are required' 
      });
    }
    
    if (!['plaintiff', 'respondent'].includes(party_type)) {
      return res.status(400).json({ 
        message: 'Party type must be either plaintiff or respondent' 
      });
    }
    
    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData) {
      return res.status(404).json({ 
        message: 'Case not found' 
      });
    }
    
    // Check if an association request already exists
    const existingRequest = caseData.advocate_requests.find(req => 
      req.advocate_id === advocateId && 
      req.party_type === party_type && 
      req.litigant_id === litigant_id
    );
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'An association request already exists',
        status: existingRequest.status
      });
    }
    
    // Create new association request
    const newRequest = {
      advocate_id: advocateId,
      advocate_name: advocateName,
      party_type,
      requested_by: 'advocate',
      litigant_id,
      status: 'pending',
      requested_at: new Date(),
      updated_at: new Date()
    };
    
    caseData.advocate_requests.push(newRequest);
    await caseData.save();
    
    res.status(201).json({
      message: 'Advocate association request submitted successfully',
      request: newRequest
    });
    
  } catch (err) {
    console.error('Error creating advocate association request:', err);
    res.status(500).json({
      message: 'Server error while creating advocate association request',
      error: err.message
    });
  }
});

// Route for document download - checks advocate authorization
app.get('/api/document/:documentId/download/advocate', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const advocateId = req.user.advocate_id;
    console.log(`Download request for document ID: ${documentId} by advocate ID: ${advocateId}`);

    // Find the case containing the document with advocate authorization check
    const caseWithDocument = await LegalCase.findOne({
      'documents.document_id': documentId, 
      $or: [
        { 'plaintiff_details.advocate_id': advocateId },
        { 'respondent_details.advocate_id': advocateId }
      ]
    });

    if (!caseWithDocument) {
      console.log(`No accessible case found with document ID: ${documentId} for advocate ID: ${advocateId}`);
      return res.status(404).json({
        message: 'Document not found or you do not have access to this document'
      });
    }

    // Find the specific document
    const document = caseWithDocument.documents.find(d => d.document_id === documentId);

    if (!document) {
      console.log(`Document with ID ${documentId} not found in case`);
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Get the full file path with safeguards
    let filePath = document.file_path;
    
    // Ensure the path is accessible
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(filePath);
    }
    
    console.log(`Attempting to download file at path: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found at primary path: ${filePath}`);
      
      // Fallback path
      const fallbackPath = path.join(UPLOADS_DIR, path.basename(filePath));
      console.log(`Attempting fallback path: ${fallbackPath}`);
      
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath;
        console.log(`File found at fallback path: ${filePath}`);
      } else {
        return res.status(404).json({
          message: 'Document file not found on server'
        });
      }
    }

    // Check file permissions
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (err) {
      console.error(`Permission denied or cannot access file: ${err.message}`);
      return res.status(403).json({
        message: 'Cannot access file due to permission issues'
      });
    }

    // Set content type and disposition
    const contentType = document.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    const safeFilename = encodeURIComponent(document.file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    
    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending file to advocate: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({
            message: 'Error serving file',
            error: err.message
          });
        }
      } else {
        console.log(`File download completed for advocate: ${document.file_name}`);
      }
    });
  } catch (err) {
    console.error('Error downloading document for advocate:', err);
    res.status(500).json({
      message: 'Server error while downloading document',
      error: err.message
    });
  }
});

// Route for streaming video pleadings - checks advocate authorization
app.get('/api/video-pleading/:documentId/stream/advocate', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const advocateId = req.user.advocate_id;
    console.log(`Stream request for video pleading ID: ${documentId} by advocate ID: ${advocateId}`);

    // Find the case containing the video document with advocate authorization check
    const caseWithVideo = await LegalCase.findOne({
      'documents.document_id': documentId, 
      'documents.document_type': 'video-pleading',
      $or: [
        { 'plaintiff_details.advocate_id': advocateId },
        { 'respondent_details.advocate_id': advocateId }
      ]
    });

    if (!caseWithVideo) {
      console.log(`No accessible case found with video pleading ID: ${documentId} for advocate ID: ${advocateId}`);
      return res.status(404).json({
        message: 'Video pleading not found or you do not have access to this video'
      });
    }

    // Find the specific video document
    const videoDoc = caseWithVideo.documents.find(d => 
      d.document_id === documentId && d.document_type === 'video-pleading'
    );

    if (!videoDoc) {
      console.log(`Video pleading with ID ${documentId} not found in case`);
      return res.status(404).json({
        message: 'Video pleading not found'
      });
    }

    // Get the full file path
    let filePath = videoDoc.file_path;
    
    // Resolve path if it's not absolute
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(filePath);
    }
    
    console.log(`Attempting to stream video at path: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found at primary path: ${filePath}`);
      
      // Try fallback path
      const fallbackPath = path.join(UPLOADS_DIR, 'video-pleadings', path.basename(filePath));
      console.log(`Attempting fallback path: ${fallbackPath}`);
      
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath;
        console.log(`File found at fallback path: ${filePath}`);
      } else {
        return res.status(404).json({
          message: 'Video file not found on server'
        });
      }
    }

    // Get file stats for video size
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Handle range requests for video streaming
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': videoDoc.mime_type,
      };
      
      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      // Stream the entire file if no range is requested
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': videoDoc.mime_type,
      };
      
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Error streaming video pleading for advocate:', err);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Server error while streaming video pleading',
        error: err.message
      });
    }
  }
});


// Route for clerk to create a new court admin
app.post('/create-admin', authenticateToken, async (req, res) => {
  try {
    // Verify if user is clerk
    if (req.user.user_type !== 'clerk') {
      return res.status(403).json({
        message: 'Access denied: Only clerks can create court administrators'
      });
    }
    
    // Extract all required fields including district
    const { name, court_name, email, mobile, district } = req.body;
   
    // Check if required fields are provided
    if (!name || !court_name || !email || !district) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (name, court_name, email, district)'
      });
    }
   
    // Check if admin with same email already exists
    const existingAdmin = await CourtAdmin.findOne({ 'contact.email': email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'An admin with this email already exists'
      });
    }
   
    // Generate unique admin ID
    const admin_id = `ADMIN-${uuidv4().slice(0, 8).toUpperCase()}`;
   
    // Generate random default password
    const defaultPassword = CourtAdmin.generateRandomPassword();
   
    // Create new admin object
    const newAdmin = new CourtAdmin({
      admin_id,
      name,
      court_name,
      district, // Add the district from request body
      contact: {
        email,
        mobile: mobile || ''
      },
      password: defaultPassword, // Will be hashed by pre-save hook
      createdBy: req.user.id // Set clerk ID as creator
    });
   
    // Save admin to database
    await newAdmin.save();
   
    // Send welcome email with default password
    await sendWelcomeEmail(email, name, court_name, defaultPassword);
   
    // Return success response without sending password
    res.status(201).json({
      success: true,
      message: 'Court admin created successfully. Password has been sent to their email.',
      admin: {
        admin_id: newAdmin.admin_id,
        name: newAdmin.name,
        court_name: newAdmin.court_name,
        district: newAdmin.district,
        email: newAdmin.contact.email,
        status: newAdmin.status
      }
    });
   
  } catch (error) {
    console.error('Error creating court admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create court admin',
      error: error.message
    });
  }
});

// Route to get all court admins (for clerk)
app.get('/admins', authenticateToken, async (req, res) => {
  try {
    // Verify if user is clerk
    if (req.user.user_type !== 'clerk') {
      return res.status(403).json({
        message: 'Access denied: Only clerks can view court administrators'
      });
    }

    // Fetch all admins created by this clerk
    const admins = await CourtAdmin.find({ createdBy: req.user.id })
      .select('admin_id name court_name contact.email status createdAt');
    
    res.status(200).json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (error) {
    console.error('Error fetching court admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch court admins',
      error: error.message
    });
  }
});

// Route to update court admin status (activate/suspend)
app.put('/admin/:adminId/status', authenticateToken, async (req, res) => {
  try {
    // Verify if user is clerk
    if (req.user.user_type !== 'clerk') {
      return res.status(403).json({
        message: 'Access denied: Only clerks can update administrator status'
      });
    }

    const { adminId } = req.params;
    const { status, reason } = req.body;
    
    // Validate status
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either "active" or "suspended".'
      });
    }
    
    // Find admin by ID and created by this clerk
    const admin = await CourtAdmin.findOne({ 
      admin_id: adminId,
      createdBy: req.user.id
    });
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Court admin not found or you do not have permission to modify this admin'
      });
    }
    
    // Update status
    admin.status = status;
    await admin.save();
    
    // Send email notification about status change
    await sendStatusChangeEmail(admin.contact.email, admin.name, status, reason);
    
    res.status(200).json({
      success: true,
      message: `Court admin status updated to ${status}`,
      admin: {
        admin_id: admin.admin_id,
        name: admin.name,
        status: admin.status
      }
    });
    
  } catch (error) {
    console.error('Error updating court admin status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court admin status',
      error: error.message
    });
  }
});

// Email sending function for status changes
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

// Welcome email function (referenced in create-admin route)
const sendWelcomeEmail = async (email, name, court_name, password) => {
  try {
    const subject = 'Welcome to the Court Management System';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .email-container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .header { background-color: #e7f5fe; color: #0066cc; padding: 10px; text-align: center; border-radius: 5px; }
          .content { padding: 20px 0; }
          .credentials { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
          .warning { color: #721c24; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h2>Welcome to the Court Management System</h2>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>Welcome to the Court Management System. You have been registered as a court administrator for ${court_name}.</p>
            <p>Below are your login credentials:</p>
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p class="warning">Please change your password immediately after your first login for security reasons.</p>
            <p>You can access the system by visiting <a href="${process.env.APP_URL}">our website</a>.</p>
            <p>If you have any questions or need assistance, please contact the district court office.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Court Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: subject,
      html: htmlContent,
    };
    
    await sgMail.send(msg);
    console.log(`Welcome email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error response body:', error.response.body);
    }
    throw error;
  }
};



app.post('/api/courtadmin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if required fields are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find admin by email
    const admin = await CourtAdmin.findOne({ 'contact.email': email });
    
    // Check if admin exists
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if admin account is suspended
    if (admin.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact your court clerk.'
      });
    }
    
    // Check if password matches
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        user_type: 'admin',
        admin_id: admin.admin_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Update last login time
    admin.lastLogin = new Date();
    await admin.save();
    
    // Send response with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        user_type : admin.user_type,
        admin_id: admin.admin_id,
        name: admin.name,
        court_name: admin.court_name,
        email: admin.contact.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Logout route
app.post('/api/courtadmin/logout', authenticateToken, async (req, res) => {
  try {
      if (!req.user.admin_id) {
          return res.status(403).json({
              success: false,
              message: 'Access denied'
          });
      }

      const token = req.headers.authorization?.split(' ')[1];
      
      // Blacklist the token
      await new BlacklistedToken({
          token,
          user_id: req.user.admin_id,
          user_type: 'admin'
      }).save();

      // Update last logout time
      await CourtAdmin.findByIdAndUpdate(req.user.id, {
          lastLogout: new Date()
      });

      res.status(200).json({
          success: true,
          message: 'Logged out successfully'
      });
  } catch (error) {
      console.error('Admin logout error:', error);
      res.status(500).json({
          success: false,
          message: 'Logout failed',
          error: error.message
      });
  }
});

// Admin Logout All
app.post('/api/courtadmin/logout-all', authenticateToken, async (req, res) => {
  try {
      if (req.user.user_type!== 'admin') {
          return res.status(403).json({
              success: false,
              message: 'Access denied'
          });
      }

      const { password } = req.body;
      
      const admin = await CourtAdmin.findById(req.user.id);
      if (!admin) {
          return res.status(404).json({
              success: false,
              message: 'Admin not found'
          });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
          return res.status(401).json({
              success: false,
              message: 'Invalid password'
          });
      }

      const currentToken = req.headers.authorization?.split(' ')[1];
      await new BlacklistedToken({
          token: currentToken,
          user_id: req.user.id,
          user_type: 'admin'
      }).save();

      await CourtAdmin.findByIdAndUpdate(req.user.id, {
          lastLogout: new Date(),
          lastForceLogout: new Date()
      });

      res.status(200).json({
          success: true,
          message: 'Logged out from all devices successfully'
      });
  } catch (error) {
      console.error('Admin logout-all error:', error);
      res.status(500).json({
          success: false,
          message: 'Logout failed',
          error: error.message
      });
  }
});
// Change password route
app.post('/api/courtadmin/change-password', authenticateToken, async (req, res) => {
  try {
    // Only process if it's an admin user
    if (!req.user.admin_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Check if required fields are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Find admin by ID
    const admin = await CourtAdmin.findById(req.user.id);
    
    // Check if admin exists
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Check if current password matches
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    admin.password = newPassword;
    await admin.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// Send password reset email
const sendPasswordResetEmail = async (recipient, resetToken, name) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .email-container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .header { background-color: #cce5ff; color: #004085; padding: 10px; text-align: center; border-radius: 5px; }
          .content { padding: 20px 0; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>You have requested to reset your password for your Court Admin account.</p>
            <p>Please click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Court Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const msg = {
      to: recipient,
      from: process.env.FROM_EMAIL,
      subject: 'Password Reset Request',
      html: htmlContent,
    };
    
    await sgMail.send(msg);
    console.log(`Password reset email sent successfully to ${recipient}`);
    return true;
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error response body:', error.response.body);
    }
    throw error;
  }
};

// Request password reset route
app.post('/api/courtadmin/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find admin by email
    const admin = await CourtAdmin.findOne({ 'contact.email': email });
    
    // Check if admin exists
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    // Check if admin account is suspended
    if (admin.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact your court clerk.'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to admin document
    admin.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    // Set expiry (1 hour)
    admin.passwordResetExpires = Date.now() + 3600000;
    
    // Save admin
    await admin.save();
    
    // Send password reset email
    await sendPasswordResetEmail(email, resetToken, admin.name);
    
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message
    });
  }
});

// Reset password route
app.post('/api/courtadmin/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    // Check if password is provided
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }
    
    // Hash the token from params
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find admin with valid token and not expired
    const admin = await CourtAdmin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    // Check if admin exists and token is valid
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }
    
    // Update password and clear reset fields
    admin.password = newPassword;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    
    // Save admin
    await admin.save();
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});
// Fetch admin profile route
app.get('/api/courtadmin/profile', authenticateToken, async (req, res) => {
  try {
    // Only process if it's an admin user
    if (!req.user.admin_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Find admin by ID
    const admin = await CourtAdmin.findById(req.user.id);
    
    // Check if admin exists
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Create a sanitized admin object with hashed sensitive data
    const sanitizedAdmin = {
      admin_id: admin.admin_id,
      name: admin.name,
      court_name: admin.court_name,
      contact: {
        email: admin.contact.email,
        // Hash phone number (show only last 4 digits)
        phone: admin.contact.phone ? `****-****-${admin.contact.phone.slice(-4)}` : null
      },
      user_type: admin.user_type,
      status: admin.status,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
      // Do not include password, passwordResetToken, or passwordResetExpires
      // Do not include raw address details if sensitive
    };
    
    // If admin has additional profile details, add them with appropriate hashing
    if (admin.address) {
      sanitizedAdmin.address = {
        city: admin.address.city,
        state: admin.address.state,
        country: admin.address.country,
        // Hash specific address details for privacy
        street: admin.address.street ? `${admin.address.street.substring(0, 3)}****` : null,
        postalCode: admin.address.postalCode ? `${admin.address.postalCode.substring(0, 2)}****` : null
      };
    }
    
    // Include admin permissions if available
    if (admin.permissions) {
      sanitizedAdmin.permissions = admin.permissions;
    }
    
    res.status(200).json({
      success: true,
      admin: sanitizedAdmin
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Update admin profile route
app.put('/api/courtadmin/profile', authenticateToken, async (req, res) => {
  try {
    // Only process if it's an admin user
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const { name, phone, address } = req.body;
    
    // Find admin by ID
    const admin = await CourtAdmin.findById(req.user.id);
    
    // Check if admin exists
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Update fields if provided
    if (name) admin.name = name;
    if (phone) admin.contact.phone = phone;
    if (address) {
      // Create address object if it doesn't exist
      if (!admin.address) admin.address = {};
      
      // Update address fields if provided
      if (address.street) admin.address.street = address.street;
      if (address.city) admin.address.city = address.city;
      if (address.state) admin.address.state = address.state;
      if (address.country) admin.address.country = address.country;
      if (address.postalCode) admin.address.postalCode = address.postalCode;
    }
    
    // Save updated admin
    await admin.save();
    
    // Return the updated profile with hashed sensitive data
    const sanitizedAdmin = {
      admin_id: admin.admin_id,
      name: admin.name,
      court_name: admin.court_name,
      contact: {
        email: admin.contact.email,
        phone: admin.contact.phone ? `****-****-${admin.contact.phone.slice(-4)}` : null
      },
      status: admin.status,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt
    };
    
    // Include address if available
    if (admin.address) {
      sanitizedAdmin.address = {
        city: admin.address.city,
        state: admin.address.state,
        country: admin.address.country,
        street: admin.address.street ? `${admin.address.street.substring(0, 3)}****` : null,
        postalCode: admin.address.postalCode ? `${admin.address.postalCode.substring(0, 2)}****` : null
      };
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin: sanitizedAdmin
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});












// Admin Routes for Case Management

// 1. Fetch cases for admin (similar to clerk but with court_allotted filter)
app.get('/api/cases/courtadmin', authenticateToken, async (req, res) => {
  try {
    console.log(req.user.user_type|| 'not defined');
    console.log(req.user.user_type||'undefined');
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can view this data'
      });
    }

    // Find the admin to get their court_name
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    const adminCourtName = admin.court_name;
    
    // Find cases where court_allotted matches the admin's court_name
    const cases = await LegalCase.find({ 
      'for_office_use_only.court_allotted': adminCourtName 
    }).sort({ created_at: -1 });
    
    res.status(200).json({
      message: `Retrieved ${cases.length} cases for court: ${adminCourtName}`,
      cases
    });
  } catch (err) {
    console.error('Error fetching admin cases:', err);
    res.status(500).json({
      message: 'Server error while fetching cases'
    });
  }
});

// 2. Update case status (similar to clerk route)
app.patch('/api/case/:caseNum/status/courtadmin', authenticateToken, async (req, res) => {
  try {
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can update case status'
      });
    }

    const { caseNum } = req.params;
    const { status, remarks } = req.body;

    // Validate status enum
    const validStatuses = [
      'Filed', 
      'Pending', 
      'Under Investigation', 
      'Hearing in Progress', 
      'Awaiting Judgment', 
      'Disposed', 
      'Appealed'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status value'
      });
    }

    // Find the admin
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    // Find the case and verify it's assigned to this admin's court
    const caseData = await LegalCase.findOne({ 
      case_num: caseNum,
      'for_office_use_only.court_allotted': admin.court_name 
    });

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or not assigned to your court'
      });
    }

    // Update case status
    const updatedCase = await LegalCase.findOneAndUpdate(
      { _id: caseData._id },
      { 
        status: status,
        $push: { 
          status_history: {
            status: status,
            remarks: remarks,
            updated_at: new Date(),
            updated_by: req.user.admin_id,
            updated_by_type: 'admin'
          } 
        }
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Case status updated successfully',
      case: updatedCase
    });
  } catch (err) {
    console.error('Error updating case status:', err);
    res.status(500).json({
      message: 'Server error while updating case status'
    });
  }
});

// 3. Get case hearings
app.get('/api/case/:caseNum/hearings/courtadmin', authenticateToken, async (req, res) => {
  try {
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can view hearing details'
      });
    }

    const { caseNum } = req.params;
    
    // Find the admin
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    // Find the case and verify it's assigned to this admin's court
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      'for_office_use_only.court_allotted': admin.court_name
    }, { hearings: 1 });

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or not assigned to your court'
      });
    }
    
    // Process attachments to include download URLs
    const hearingsWithUrls = caseData.hearings.map(hearing => {
      const hearingObj = hearing.toObject ? hearing.toObject() : hearing;
      
      // If the hearing has attachments, add download URLs
      if (hearingObj.attachments && hearingObj.attachments.length > 0) {
        hearingObj.attachments = hearingObj.attachments.map(attachment => ({
          ...attachment,
          download_url: `/api/files/${attachment.filename}`
        }));
      }
      
      return hearingObj;
    });
    
    return res.status(200).json({
      hearings: hearingsWithUrls,
      message: 'Hearings fetched successfully'
    });
    
  } catch (error) {
    console.error('Error fetching hearings:', error);
    return res.status(500).json({
      message: 'Server error while fetching hearings'
    });
  }
});

// 4. Add hearing to a case
app.post('/api/case/:caseNum/hearing/courtadmin', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can add hearing details'
      });
    }

    const { caseNum } = req.params;
    const {
      hearing_date,
      hearing_type,
      remarks,
      next_hearing_date
    } = req.body;

    // Validate required fields
    if (!hearing_date || !hearing_type) {
      return res.status(400).json({
        message: 'Hearing date and type are required'
      });
    }

    // Validate hearing type enum
    const validHearingTypes = ['Initial', 'Intermediate', 'Final', 'Adjournment'];
    if (!validHearingTypes.includes(hearing_type)) {
      return res.status(400).json({
        message: 'Invalid hearing type'
      });
    }

    // Find the admin
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    // Find the case and verify it's assigned to this admin's court
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      'for_office_use_only.court_allotted': admin.court_name
    });

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or not assigned to your court'
      });
    }

    // Create a new hearing object
    const newHearing = {
      hearing_date: new Date(hearing_date),
      hearing_type,
      remarks,
      next_hearing_date: next_hearing_date ? new Date(next_hearing_date) : undefined,
      created_by: req.user.admin_id,
      created_by_type: 'admin'
    };

    // Handle file attachments if any
    const files = req.files;
    if (files && files.length > 0) {
      const attachments = files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        uploaded_at: new Date()
      }));
      
      newHearing.attachments = attachments;
    }

    // Add the new hearing to the case
    if (!caseData.hearings) {
      caseData.hearings = [];
    }
    caseData.hearings.push(newHearing);

    // Update case status if appropriate
    if (caseData.status === 'Filed' || caseData.status === 'Pending') {
      caseData.status = 'Hearing in Progress';
    }

    // Save the updated case
    await caseData.save();

    res.status(201).json({
      message: 'Hearing added successfully',
      hearing: caseData.hearings[caseData.hearings.length - 1]
    });
  } catch (err) {
    console.error('Error adding hearing:', err);
    res.status(500).json({
      message: 'Server error while adding hearing'
    });
  }
});

// 5. Update hearing details
app.patch('/api/case/:caseNum/hearing/:hearingId/courtadmin', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can update hearing details'
      });
    }

    const { caseNum, hearingId } = req.params;
    const {
      hearing_date,
      hearing_type,
      remarks,
      next_hearing_date
    } = req.body;

    // Validate required fields
    if (!hearing_date || !hearing_type) {
      return res.status(400).json({
        message: 'Hearing date and type are required'
      });
    }

    // Validate hearing type enum
    const validHearingTypes = ['Initial', 'Intermediate', 'Final', 'Adjournment'];
    if (!validHearingTypes.includes(hearing_type)) {
      return res.status(400).json({
        message: 'Invalid hearing type'
      });
    }

    // Find the admin
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    // Find the case and verify it's assigned to this admin's court
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      'for_office_use_only.court_allotted': admin.court_name
    });

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or not assigned to your court'
      });
    }

    // Find and update the specific hearing
    const hearingIndex = caseData.hearings.findIndex(h => h._id.toString() === hearingId);

    if (hearingIndex === -1) {
      return res.status(404).json({
        message: 'Hearing not found'
      });
    }

    // Update hearing details
    const updatedHearing = {
      ...caseData.hearings[hearingIndex].toObject(),
      hearing_date: new Date(hearing_date),
      hearing_type,
      remarks,
      next_hearing_date: next_hearing_date ? new Date(next_hearing_date) : undefined,
      updated_by: req.user.admin_id,
      updated_by_type: 'admin',
      updated_at: new Date()
    };

    // Handle file attachments if any
    const files = req.files;
    if (files && files.length > 0) {
      const newAttachments = files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        uploaded_at: new Date()
      }));
      
      // Initialize attachments array if it doesn't exist
      if (!updatedHearing.attachments) {
        updatedHearing.attachments = [];
      }
      
      // Add new attachments
      updatedHearing.attachments.push(...newAttachments);
    }

    // Update the hearing in the document
    caseData.hearings[hearingIndex] = updatedHearing;

    // Save the updated case
    await caseData.save();

    res.status(200).json({
      message: 'Hearing updated successfully',
      hearing: caseData.hearings[hearingIndex]
    });
  } catch (err) {
    console.error('Error updating hearing:', err);
    res.status(500).json({
      message: 'Server error while updating hearing'
    });
  }
});

// 6. Add attachments to a hearing
app.post('/api/case/:caseNum/hearing/:hearingId/attachments/courtadmin', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can add hearing attachments'
      });
    }

    const { caseNum, hearingId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: 'No files uploaded'
      });
    }

    // Find the admin
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    // Find the case and verify it's assigned to this admin's court
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      'for_office_use_only.court_allotted': admin.court_name
    });

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or not assigned to your court'
      });
    }

    // Find the specific hearing
    const hearingIndex = caseData.hearings.findIndex(h => h._id.toString() === hearingId);

    if (hearingIndex === -1) {
      return res.status(404).json({
        message: 'Hearing not found'
      });
    }

    // Create attachment objects for each file
    const attachments = files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size,
      uploaded_at: new Date(),
      uploaded_by: req.user.admin_id,
      uploaded_by_type: 'admin'
    }));

    // Initialize attachments array if it doesn't exist
    if (!caseData.hearings[hearingIndex].attachments) {
      caseData.hearings[hearingIndex].attachments = [];
    }

    // Add new attachments
    caseData.hearings[hearingIndex].attachments.push(...attachments);

    // Save the updated case
    await caseData.save();

    res.status(201).json({
      message: 'Attachments added successfully',
      attachments: caseData.hearings[hearingIndex].attachments
    });
  } catch (err) {
    console.error('Error adding attachments:', err);
    res.status(500).json({
      message: 'Server error while adding attachments'
    });
  }
});

// 7. Upload case document
app.post('/api/case/:caseNum/document/courtadmin', authenticateToken, upload3.single('file'), async (req, res) => {
  try {
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can upload documents'
      });
    }

    const { caseNum } = req.params;
    const { document_type, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!document_type) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    // Find the admin
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    // Find the case and verify it's assigned to this admin's court
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      'for_office_use_only.court_allotted': admin.court_name
    });

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or not assigned to your court'
      });
    }

    // Generate a document ID
    const documentId = new mongoose.Types.ObjectId();
    
    // Store only the relative path for consistency (relative to uploads dir)
    const relativePath = file.path.replace(/\\/g, '/'); // Convert Windows backslashes if needed
    
    // Create document object
    const document = {
      document_id: documentId.toString(),
      document_type,
      description: description || '',
      file_name: file.originalname,
      file_path: relativePath,
      mime_type: file.mimetype,
      size: file.size,
      uploaded_date: new Date(),
      uploaded_by: req.user.admin_id,
      uploaded_by_type: 'admin'
    };

    // Initialize documents array if it doesn't exist
    if (!caseData.documents) {
      caseData.documents = [];
    }
    
    caseData.documents.push(document);
    await caseData.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        ...document,
        _id: document.document_id
      },
      case_num: caseNum
    });
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({
      message: 'Server error while uploading document',
      error: err.message
    });
  }
});

// 8. Download document
// Admin version of document download route - reuses existing functionality with admin authentication
app.get('/api/document/:documentId/download/courtadmin', authenticateToken, async (req, res) => {
  try {
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can download documents'
      });
    }

    const { documentId } = req.params;

    // Find the admin
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    // Find the case containing the document
    const caseWithDocument = await LegalCase.findOne({
      'documents.document_id': documentId,
      'for_office_use_only.court_allotted': admin.court_name
    });

    if (!caseWithDocument) {
      return res.status(404).json({
        message: 'Document not found or not assigned to your court'
      });
    }

    // Find the specific document
    const document = caseWithDocument.documents.find(d => d.document_id === documentId);

    if (!document) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Get the full file path
    let filePath = document.file_path;
    
    // Ensure the path is accessible
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(filePath);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // Fallback - try checking if it's in the uploads directory by filename
      const fallbackPath = path.join(uploadDir2, path.basename(filePath));
      
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath;
      } else {
        return res.status(404).json({
          message: 'Document file not found on server'
        });
      }
    }

    // Set correct content type based on mime type
    const contentType = document.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Set content disposition to suggest filename
    const safeFilename = encodeURIComponent(document.file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    
    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
        
        if (!res.headersSent) {
          res.status(500).json({
            message: 'Error serving file',
            error: err.message
          });
        }
      }
    });
  } catch (err) {
    console.error('Error downloading document:', err);
    res.status(500).json({
      message: 'Server error while downloading document',
      error: err.message
    });
  }
});

// 9. Get a specific case details
app.get('/api/case/:caseNum/courtadmin', authenticateToken, async (req, res) => {
  try {
    // Verify if the user is an admin
    if (!req.user.admin_id) {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can view case details'
      });
    }

    const { caseNum } = req.params;

    // Find the admin
    const admin = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!admin) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }

    // Find the case and verify it's assigned to this admin's court
    const caseData = await LegalCase.findOne({
      case_num: caseNum,
      'for_office_use_only.court_allotted': admin.court_name
    });

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found or not assigned to your court'
      });
    }

    res.status(200).json({
      message: 'Case fetched successfully',
      case: caseData
    });
  } catch (err) {
    console.error('Error fetching case details:', err);
    res.status(500).json({
      message: 'Server error while fetching case details'
    });
  }
});






// Admin Routes for Video Meeting Management

app.post('/api/courtadmin/case/:caseNum/video-meeting', authenticateToken, async (req, res) => {
  try {
    // Verify if user is admin
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can add meeting links'
      });
    }
    
    const { caseNum } = req.params;
    const { meetingLink, startDateTime, endDateTime } = req.body;
    
    // Validate required fields
    if (!meetingLink || !startDateTime || !endDateTime) {
      return res.status(400).json({
        message: 'Meeting link, start date/time, and end date/time are required'
      });
    }
    
    // Validate dates
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        message: 'Invalid date format'
      });
    }
    
    if (end <= start) {
      return res.status(400).json({
        message: 'End date/time must be after start date/time'
      });
    }
    
    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found'
      });
    }
    
    // Check if the admin is authorized to handle this case
    const adminData = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!adminData) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }
    
    // Verify that the case is assigned to the admin's district
    if (caseData.for_office_use_only && 
        caseData.for_office_use_only.court_allotted !== adminData.court_name) {
      return res.status(403).json({
        message: 'Access denied: Not able to handle this case '
      });
    }
    
    // Add/update video meeting details
    caseData.videoMeeting = {
      meetingLink,
      startDateTime: start,
      endDateTime: end,
      isActive: true,
      createdBy: req.user.admin_id,
      createdAt: new Date()
    };
    
    // Save the updated case
    await caseData.save();

    // Collection of notification promises
    const notificationPromises = [];

    // If there's a plaintiff party_id, fetch and notify them
    if (caseData.plaintiff_details && caseData.plaintiff_details.party_id) {
      try {
        const plaintiffData = await Litigant.findOne({party_id: caseData.plaintiff_details.party_id });
        if (plaintiffData && plaintiffData.contact && plaintiffData.contact.email && 
            plaintiffData.contact.email !== caseData.plaintiff_details.email) { // Avoid duplicate emails
          
          // Send email with meeting details
          notificationPromises.push(
            sendVideoMeetingNotification({
              name: plaintiffData.full_name,
              email: plaintiffData.contact.email
            }, caseData, 'plaintiff', meetingLink, start, end)
          );
        }
      } catch (error) {
        console.error('Error fetching plaintiff data:', error);
        // Continue execution, don't block the response for this error
      }
    }

    // If there's a plaintiff advocate_id, fetch and notify them
    if (caseData.plaintiff_details && caseData.plaintiff_details.advocate_id) {
      try {
        const plaintiffAdvocate = await Advocate.findOne({ advocate_id: caseData.plaintiff_details.advocate_id });
        if (plaintiffAdvocate && plaintiffAdvocate.contact && plaintiffAdvocate.contact.email) {
          // Send email with meeting details
          notificationPromises.push(
            sendVideoMeetingNotification({
              name: plaintiffAdvocate.name,
              email: plaintiffAdvocate.contact.email
            }, caseData, 'plaintiff_advocate', meetingLink, start, end)
          );
        }
      } catch (error) {
        console.error('Error fetching plaintiff advocate data:', error);
        // Continue execution, don't block the response for this error
      }
    }
    
    // If there's a respondent party_id, fetch and notify them
    if (caseData.respondent_details && caseData.respondent_details.party_id) {
      try {
        const respondentData = await Litigant.findOne({party_id: caseData.respondent_details.party_id });
        if (respondentData && respondentData.contact && respondentData.contact.email && 
            respondentData.contact.email !== caseData.respondent_details.email) { // Avoid duplicate emails
          
          // Send email with meeting details
          notificationPromises.push(
            sendVideoMeetingNotification({
              name: respondentData.name,
              email: respondentData.contact.email
            }, caseData, 'respondent', meetingLink, start, end)
          );
        }
      } catch (error) {
        console.error('Error fetching respondent data:', error);
        // Continue execution, don't block the response for this error
      }
    }

    // If there's a respondent advocate_id, fetch and notify them
    if (caseData.respondent_details && caseData.respondent_details.advocate_id) {
      try {
        const respondentAdvocate = await Advocate.findOne({ advocate_id: caseData.respondent_details.advocate_id });
        if (respondentAdvocate && respondentAdvocate.contact && respondentAdvocate.contact.email) {
          // Send email with meeting details
          notificationPromises.push(
            sendVideoMeetingNotification({
              name: respondentAdvocate.name,
              email: respondentAdvocate.contact.email
            }, caseData, 'respondent_advocate', meetingLink, start, end)
          );
        }
      } catch (error) {
        console.error('Error fetching respondent advocate data:', error);
        // Continue execution, don't block the response for this error
      }
    }
    
    // Wait for all notification emails to be sent
    await Promise.all(notificationPromises);
    
    res.status(201).json({
      message: 'Video meeting link added successfully',
      videoMeeting: caseData.videoMeeting
    });
    
  } catch (err) {
    console.error('Error adding video meeting:', err);
    res.status(500).json({
      message: 'Server error while adding video meeting'
    });
  }
});

// Admin Route: Update or deactivate a meeting
app.put('/api/courtadmin/case/:caseNum/video-meeting', authenticateToken, async (req, res) => {
  try {
    // Verify if user is admin
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can update meeting details'
      });
    }
    
    const { caseNum } = req.params;
    const { meetingLink, startDateTime, endDateTime, isActive } = req.body;
    
    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found'
      });
    }
    
    // Check if the admin is authorized to handle this case
    const adminData = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!adminData) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }
    
    // Verify that the case is assigned to the admin's district
    if (caseData.for_office_use_only && 
        caseData.for_office_use_only.court_allotted !== adminData.court_name) {
      return res.status(403).json({
        message: 'Access denied: This case is not allocated to your district'
      });
    }
    
    // Check if video meeting exists
    if (!caseData.videoMeeting) {
      return res.status(404).json({
        message: 'No video meeting found for this case'
      });
    }
    
    // Update fields if provided
    if (meetingLink) caseData.videoMeeting.meetingLink = meetingLink;
    
    if (startDateTime) {
      const start = new Date(startDateTime);
      if (isNaN(start)) {
        return res.status(400).json({
          message: 'Invalid start date/time format'
        });
      }
      caseData.videoMeeting.startDateTime = start;
    }
    
    if (endDateTime) {
      const end = new Date(endDateTime);
      if (isNaN(end)) {
        return res.status(400).json({
          message: 'Invalid end date/time format'
        });
      }
      caseData.videoMeeting.endDateTime = end;
    }
    
    // Ensure end time is after start time
    if (caseData.videoMeeting.endDateTime <= caseData.videoMeeting.startDateTime) {
      return res.status(400).json({
        message: 'End date/time must be after start date/time'
      });
    }
    
    // Update active status if provided
    if (isActive !== undefined) {
      caseData.videoMeeting.isActive = isActive;
    }
    
    // Save the updated case
    await caseData.save();
    
    res.status(200).json({
      message: 'Video meeting updated successfully',
      videoMeeting: caseData.videoMeeting
    });
    
  } catch (err) {
    console.error('Error updating video meeting:', err);
    res.status(500).json({
      message: 'Server error while updating video meeting'
    });
  }
});

// Admin Route: Get video meeting details for a case
app.get('/api/courtadmin/case/:caseNum/video-meeting', authenticateToken, async (req, res) => {
  try {
    // Verify if user is admin
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({
        message: 'Access denied: Only court administrators can view meeting details'
      });
    }
    
    const { caseNum } = req.params;
    
    // Find the case
    const caseData = await LegalCase.findOne({ case_num: caseNum });
    
    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found'
      });
    }
    
    // Check if the admin is authorized to handle this case
    const adminData = await CourtAdmin.findOne({ admin_id: req.user.admin_id });
    
    if (!adminData) {
      return res.status(404).json({
        message: 'Admin profile not found'
      });
    }
    
    // Verify that the case is assigned to the admin's district
    if (caseData.for_office_use_only && 
        caseData.for_office_use_only.court_allotted !== adminData.court_name) {
      return res.status(403).json({
        message: 'Access denied: This case is not allocated to your district'
      });
    }
    
    // Check if video meeting exists
    if (!caseData.videoMeeting) {
      return res.status(404).json({
        message: 'No video meeting found for this case'
      });
    }
    
    // Return meeting details
    res.status(200).json({
      meetingLink: caseData.videoMeeting.meetingLink,
      startDateTime: caseData.videoMeeting.startDateTime,
      endDateTime: caseData.videoMeeting.endDateTime,
      isActive: caseData.videoMeeting.isActive,
      createdBy: caseData.videoMeeting.createdBy,
      createdAt: caseData.videoMeeting.createdAt
    });
    
  } catch (err) {
    console.error('Error fetching video meeting:', err);
    res.status(500).json({
      message: 'Server error while fetching video meeting'
    });
  }
});

// Admin Route: Get all cases for the admin (filtered by district)

// Function to send video meeting notification emails without OTP








 PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Site Server is live on ${PORT}`);
});
