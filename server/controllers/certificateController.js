import CertificateRequest from '../models/CertificateRequest.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { QuizResult } from '../models/QuizResult.js';
import { Quiz } from '../models/Quiz.js';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

// Helper function to validate ObjectId (for courses only)
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && (id + '').length === 24;
};

// Create email transporter
// Create email transporter - UPDATED with better configuration
const createTransporter = () => {
  try {
    // For Gmail with App Password
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    });
  } catch (error) {
    console.error('❌ Error creating email transporter:', error);
    return null;
  }
};

// Generate beautiful certificate email HTML
const generateCertificateEmailHTML = (user, course, certificateRequest) => {
  const currentYear = new Date().getFullYear();
  const issueDate = new Date(certificateRequest.approvedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .congratulations {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .congratulations h2 {
            color: #2c5aa0;
            font-size: 1.8em;
            margin-bottom: 10px;
        }
        
        .certificate-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 30px;
            margin: 20px 0;
            border-left: 5px solid #667eea;
        }
        
        .certificate-card h3 {
            color: #2c5aa0;
            margin-bottom: 20px;
            font-size: 1.4em;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .detail-label {
            font-weight: 600;
            color: #495057;
        }
        
        .detail-value {
            color: #2c5aa0;
            font-weight: 500;
        }
        
        .achievement {
            background: #e7f3ff;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        
        .achievement-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 35px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 1.1em;
            margin: 20px 0;
            transition: transform 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .instructions h4 {
            color: #856404;
            margin-bottom: 10px;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #6c757d;
            font-size: 0.9em;
        }
        
        .certificate-id {
            background: #2c5aa0;
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            text-align: center;
            margin: 15px 0;
        }
        
        @media (max-width: 600px) {
            .header h1 { font-size: 2em; }
            .content { padding: 20px; }
            .detail-row { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎓 Certificate Awarded</h1>
            <p>Congratulations on Your Achievement!</p>
        </div>
        
        <div class="content">
            <div class="congratulations">
                <h2>Dear ${user.name},</h2>
                <p>We are thrilled to inform you that your certificate has been approved!</p>
            </div>
            
            <div class="certificate-card">
                <h3>📋 Certificate Details</h3>
                
                <div class="detail-row">
                    <span class="detail-label">Student Name:</span>
                    <span class="detail-value">${user.name}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Course Completed:</span>
                    <span class="detail-value">${course.courseTitle}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Date Issued:</span>
                    <span class="detail-value">${issueDate}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Certificate Year:</span>
                    <span class="detail-value">${currentYear}</span>
                </div>
                
                <div class="certificate-id">
                    Certificate ID: ${certificateRequest.certificateId}
                </div>
            </div>
            
            <div class="achievement">
                <div class="achievement-icon">🏆</div>
                <h3>Outstanding Achievement!</h3>
                <p>Your dedication and hard work have paid off. This certificate recognizes your successful completion of the course and demonstrates your commitment to learning and professional development.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/my-enrollments" class="cta-button">
                    View Your Certificate
                </a>
            </div>
            
            <div class="instructions">
                <h4>📝 Next Steps</h4>
                <p>• You can download your certificate from your student dashboard</p>
                <p>• Share your achievement on professional networks</p>
                <p>• Add this certification to your resume and LinkedIn profile</p>
                <p>• Keep this certificate for your professional records</p>
            </div>
            
            <p style="text-align: center; margin-top: 30px; color: #666;">
                <strong>Best regards,</strong><br>
                The Education Team<br>
                <em>Learning Management System</em>
            </p>
        </div>
        
        <div class="footer">
            <p>© ${currentYear} Learning Management System. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// Actual email sending function
// Actual email sending function - COMPLETE IMPLEMENTATION
const sendCertificateEmail = async (user, course, certificateRequest) => {
  try {
    console.log('🔧 Starting email sending process...');
    
    // Check if email credentials are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials not configured in environment variables');
      console.log('ℹ️ Please set EMAIL_USER and EMAIL_PASS in your .env file');
      return false;
    }

    console.log('✅ Email credentials found in environment');

    const transporter = createTransporter();
    if (!transporter) {
      console.error('❌ Failed to create email transporter');
      return false;
    }

    console.log('✅ Email transporter created successfully');

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified - ready to send emails');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      return false;
    }

    const mailOptions = {
      from: `"Learning Management System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🎉 Certificate of Completion - ${course.courseTitle}`,
      html: generateCertificateEmailHTML(user, course, certificateRequest),
      text: `Congratulations ${user.name}! Your certificate for "${course.courseTitle}" has been approved. Certificate ID: ${certificateRequest.certificateId}. Login to your account to view and download your certificate.`
    };

    console.log(`📧 Attempting to send email to: ${user.email}`);
    console.log(`📧 Using sender: ${process.env.EMAIL_USER}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${user.email}`);
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📧 Response: ${result.response}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error command:', error.command);
    
    // Provide helpful debugging information
    if (error.code === 'EAUTH') {
      console.error('🔑 Authentication failed. Check your email credentials.');
      console.error('🔑 For Gmail, make sure to use an App Password, not your regular password.');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection failed. Check your internet connection.');
    } else if (error.code === 'EENVELOPE') {
      console.error('📫 Envelope error. Check the recipient email address.');
    }
    
    return false;
  }
};

// Apply for certificate
export const applyForCertificate = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.body;

        console.log(`[applyForCertificate] User: ${userId}, Course: ${courseId}`);

        if (!isValidObjectId(courseId)) {
            console.error(`❌ Invalid courseId format: ${courseId}`);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid course ID format' 
            });
        }

        const user = await User.findById(userId);
        console.log(`[applyForCertificate] User found:`, user ? 'Yes' : 'No');
        
        if (!user) {
            console.log(`❌ User not found: ${userId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log(`✅ User found: ${user.name}, Email: ${user.email}`);

        const isEnrolled = user.enrolledCourses && user.enrolledCourses.includes(courseId);
        console.log(`[applyForCertificate] Is user enrolled:`, isEnrolled);
        
        if (!isEnrolled) {
            return res.json({ 
                success: false, 
                message: 'You are not enrolled in this course' 
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.json({ 
                success: false, 
                message: 'Course not found' 
            });
        }

        const quiz = await Quiz.findOne({ courseId });
        if (!quiz) {
            return res.json({ 
                success: false, 
                message: 'No quiz found for this course' 
            });
        }

        const quizResult = await QuizResult.findOne({
            userId: userId,
            quizId: quiz._id,
            passed: true
        }).sort({ attemptNumber: -1 });

        if (!quizResult) {
            return res.json({ 
                success: false, 
                message: 'You need to pass the quiz to apply for certificate' 
            });
        }

        const existingRequest = await CertificateRequest.findOne({
            userId: userId,
            courseId
        });

        if (existingRequest) {
            return res.json({ 
                success: false, 
                message: `Certificate request already ${existingRequest.status}` 
            });
        }

        const certificateRequest = new CertificateRequest({
            userId: userId,
            courseId,
            quizResultId: quizResult._id
        });

        await certificateRequest.save();

        console.log(`✅ Certificate request created: ${certificateRequest._id}`);

        res.json({ 
            success: true, 
            message: 'Certificate application submitted successfully',
            request: certificateRequest
        });

    } catch (error) {
        console.error('[applyForCertificate] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get certificate requests for educator
export const getCertificateRequests = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const { courseId } = req.params;

        console.log(`[getCertificateRequests] Educator: ${educatorId}, Course: ${courseId}`);

        if (!isValidObjectId(courseId)) {
            console.error(`❌ Invalid courseId format: ${courseId}`);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid course ID format' 
            });
        }

        const course = await Course.findOne({ _id: courseId, educator: educatorId });
        if (!course) {
            console.log(`❌ Course not found or unauthorized: ${courseId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found or unauthorized' 
            });
        }

        console.log(`✅ Course found: ${course.courseTitle}`);

        const requests = await CertificateRequest.find({ courseId })
            .populate('quizResultId', 'score totalPoints percentage passed')
            .sort({ createdAt: -1 });

        const populatedRequests = await Promise.all(
            requests.map(async (request) => {
                const user = await User.findById(request.userId);
                return {
                    ...request.toObject(),
                    userId: user ? {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        profilePicture: user.imageUrl
                    } : {
                        name: 'Unknown User',
                        email: 'No email',
                        profilePicture: null
                    }
                };
            })
        );

        console.log(`📊 Found ${populatedRequests.length} certificate requests`);

        res.json({ 
            success: true, 
            requests: populatedRequests,
            course: {
                _id: course._id,
                courseTitle: course.courseTitle,
                courseThumbnail: course.courseThumbnail
            }
        });

    } catch (error) {
        console.error('[getCertificateRequests] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Approve certificate
export const approveCertificate = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const { requestId } = req.body;

        console.log(`[approveCertificate] Educator: ${educatorId}, Request: ${requestId}`);

        if (!isValidObjectId(requestId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request ID format' 
            });
        }

        const certificateRequest = await CertificateRequest.findById(requestId)
            .populate('courseId');

        if (!certificateRequest) {
            return res.status(404).json({ 
                success: false, 
                message: 'Certificate request not found' 
            });
        }

        const course = await Course.findOne({ 
            _id: certificateRequest.courseId, 
            educator: educatorId 
        });

        if (!course) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized to approve this certificate' 
            });
        }

        const user = await User.findById(certificateRequest.userId);
        if (!user) {
            console.log(`❌ User not found: ${certificateRequest.userId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found for certificate notification' 
            });
        }

        console.log(`✅ User found: ${user.name}, Email: ${user.email}`);

        certificateRequest.status = 'approved';
        certificateRequest.approvedAt = new Date();
        certificateRequest.certificateUrl = `/certificates/${certificateRequest.certificateId}.pdf`;

        await certificateRequest.save();

        console.log(`✅ Certificate approved for user: ${user.email}`);

        // Send actual email
        const emailSent = await sendCertificateEmail(user, course, certificateRequest);

        res.json({ 
            success: true, 
            message: emailSent 
                ? 'Certificate approved and notification email sent successfully!' 
                : 'Certificate approved but email notification failed',
            emailSent,
            certificate: certificateRequest
        });

    } catch (error) {
        console.error('[approveCertificate] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's certificate status for a course
export const getCertificateStatus = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.params;

        console.log(`[getCertificateStatus] User: ${userId}, Course: ${courseId}`);

        const certificateRequest = await CertificateRequest.findOne({
            userId: userId,
            courseId
        });

        res.json({ 
            success: true, 
            certificateRequest 
        });

    } catch (error) {
        console.error('[getCertificateStatus] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get quiz completion stats for educator courses
export const getQuizCompletionStats = async (req, res) => {
    try {
        const educatorId = req.auth.userId;

        const courses = await Course.find({ educator: educatorId });

        const stats = await Promise.all(courses.map(async (course) => {
            const quiz = await Quiz.findOne({ courseId: course._id });
            
            if (!quiz) {
                return {
                    courseId: course._id,
                    studentsPassedQuiz: 0,
                    totalEnrolled: course.enrolledStudents.length
                };
            }

            const passedStudents = await QuizResult.distinct('userId', {
                quizId: quiz._id,
                passed: true
            });

            return {
                courseId: course._id,
                studentsPassedQuiz: passedStudents.length,
                totalEnrolled: course.enrolledStudents.length
            };
        }));

        res.json({ 
            success: true, 
            stats 
        });

    } catch (error) {
        console.error('[getQuizCompletionStats] Error:', error);
        res.json({ success: false, message: error.message });
    }
};