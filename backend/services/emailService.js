
const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');
const EmailJob = require('../models/EmailJob');
const he = require('he');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Replace template variables with actual values
const replaceTemplateVariables = (content, variables) => {
  let processedContent = content;
  
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, variables[key] || '');
  });
  
  return processedContent;
};

// Send email using template
const sendEmailWithTemplate = async (templateName, recipientEmail, recipientName, variables = {}) => {
  try {
    const template = await EmailTemplate.findOne({ name: templateName, isActive: true });
    
    if (!template) {
      throw new Error(`Email template '${templateName}' not found or inactive`);
    }

    // Add default variables
    const allVariables = {
      recipientName: recipientName || 'User',
      recipientEmail,
      currentYear: new Date().getFullYear(),
      siteName: 'Inhalestays',
      siteUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      ...variables
    };

    const subject = replaceTemplateVariables(template.subject, allVariables);
    const htmlContent = replaceTemplateVariables(template.htmlContent, allVariables);
    const textContent = template.textContent ? replaceTemplateVariables(template.textContent, allVariables) : null;

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME }" <${process.env.EMAIL_FROM || 'noreply@inhalestays.com'}>`,
      to: recipientEmail,
      subject,
      html:  he.decode(htmlContent)
    };

    if (textContent) {
      mailOptions.text = template.textContent ? he.decode(template.textContent) : null;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Template email sent:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending template email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    const variables = {
      resetUrl,
      resetToken
    };

    // Try to use template first, fallback to hardcoded email
    try {
      return await sendEmailWithTemplate('password_reset', email, '', variables);
    } catch (templateError) {
      console.log('Template not found, using fallback email');
      
      const transporter = createTransporter();
      
      const mailOptions = {
         from: `"${process.env.EMAIL_FROM_NAME }" <${process.env.EMAIL_FROM || 'noreply@inhalestays.com'}>`,
        to: email,
        subject: 'Password Reset Request - Iinhalestays',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You have requested to reset your password for your Inhalestays account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${resetUrl}
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 10 minutes for security reasons.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} Inhalestays. All rights reserved.
            </p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    const variables = {
      userName: name
    };

    // Try to use template first, fallback to hardcoded email
    try {
      return await sendEmailWithTemplate('welcome', email, name, variables);
    } catch (templateError) {
      console.log('Template not found, using fallback email');
      
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME }" <${process.env.EMAIL_FROM || 'noreply@inhalestays.com'}>`,
        to: email,
        subject: 'Welcome to Inhalestays!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Inhalestays, ${name}!</h2>
            <p>Thank you for joining our community. We're excited to have you aboard!</p>
            <p>You can now access all our services including:</p>
            <ul>
              <li>Book cabin spaces</li>
              <li>Reserve hostel accommodations</li>
              <li>Access laundry services</li>
              <li>Manage your bookings</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Get Started
              </a>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} Inhalestays. All rights reserved.
            </p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send booking reminder email
const sendBookingReminderEmail = async (email, name, bookingDetails) => {
  try {
    const variables = {
      userName: name,
      bookingType: bookingDetails.type,
      bookingId: bookingDetails.id,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      location: bookingDetails.location || 'Your booked location',
      daysUntilExpiry: bookingDetails.daysUntilExpiry || 0,
      days: Number(bookingDetails.daysUntilExpiry)=== 1 ? "" : "s",
      totalPrice: bookingDetails.totalPrice || 0,
    };

    return await sendEmailWithTemplate('booking_reminder', email, name, variables);
  } catch (error) {
    console.error('Error sending booking reminder email:', error);
    return { success: false, error: error.message };
  }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (email, name, bookingDetails) => {
  try {
    const variables = {
      userName: name,
      bookingType: bookingDetails.bookingType,
      bookingId: bookingDetails.id,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      totalPrice: bookingDetails.amount,
      location: bookingDetails.location || 'Your booked location',
      roomName: bookingDetails.roomName,
      amount : bookingDetails.amount,
      supportEmail : bookingDetails.supportEmail
    };

    return await sendEmailWithTemplate('booking_confirmation', email, name, variables);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};
// Send booking failed email
const sendBookingFailedEmail = async (email, name, bookingDetails, errorMessage) => {
  try {
    const variables = {
      userName: name,
      bookingType: bookingDetails.type,
      bookingId: bookingDetails.id,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      totalPrice: bookingDetails.totalPrice,
      location: bookingDetails.location || 'Your booking location',
      roomNumber: bookingDetails.roomNumber,
      seatNumber: bookingDetails.seatNumber,
      errorMessage: errorMessage || 'An unexpected error occurred during booking processing'
    };

    return await sendEmailWithTemplate('booking_failed', email, name, variables);
  } catch (error) {
    console.error('Error sending booking failed email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendBookingReminderEmail,
  sendBookingConfirmationEmail,
  sendBookingFailedEmail,
  sendEmailWithTemplate
};
