import express from 'express';
import { 
    applyForCertificate, 
    getCertificateRequests, 
    approveCertificate, 
    getCertificateStatus,
    getQuizCompletionStats
} from '../controllers/certificateController.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Student routes
router.post('/apply', applyForCertificate);
router.get('/status/:courseId', getCertificateStatus);

// Educator routes
router.get('/requests/:courseId', getCertificateRequests);
router.post('/approve', approveCertificate);
router.get('/stats', getQuizCompletionStats);

// Test email route
router.post('/test-email', async (req, res) => {
    try {
        const { toEmail } = req.body;
        
        if (!toEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        console.log('🧪 Testing email configuration...');
        console.log('📧 From:', process.env.EMAIL_USER);
        console.log('📧 To:', toEmail);

        // Check if credentials are set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
                success: false,
                message: 'Email credentials not configured. Check your .env file.'
            });
        }

        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify connection configuration
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        const testMailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Test Email - LMS System',
            text: 'This is a test email from your Learning Management System. If you receive this, your email configuration is working correctly!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2c5aa0;">✅ Test Email Successful</h2>
                    <p>This is a test email from your Learning Management System.</p>
                    <p>If you can read this, your email configuration is working correctly!</p>
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <strong>Configuration Details:</strong><br>
                        From: ${process.env.EMAIL_USER}<br>
                        To: ${toEmail}<br>
                        Service: Gmail SMTP<br>
                        Time: ${new Date().toLocaleString()}
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(testMailOptions);
        
        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', result.messageId);

        res.json({
            success: true,
            message: 'Test email sent successfully!',
            messageId: result.messageId
        });
        
    } catch (error) {
        console.error('❌ Test email failed:', error);
        
        let errorMessage = 'Failed to send test email: ' + error.message;
        
        if (error.code === 'EAUTH') {
            errorMessage = 'Authentication failed. Please check your email credentials in the .env file. Make sure you are using an App Password for Gmail.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Connection failed. Please check your internet connection and try again.';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message,
            code: error.code
        });
    }
});

export default router;