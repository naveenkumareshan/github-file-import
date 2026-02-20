const emailService = require('./emailService');
const EmailJob = require('../models/EmailJob');
const EmailTemplate = require('../models/EmailTemplate');

class JobProcessor {
  constructor() {
    this.jobs = [];
    this.isProcessing = false;
    this.processingInterval = null;
  }

  // Add job to queue and save to database
  addJob(type, data, priority = 'normal', scheduledFor = null) {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      type,
      data,
      priority,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      scheduledFor: scheduledFor || new Date()
    };

    this.jobs.push(job);
    
    // Save to database
    this.saveJobToDatabase(job).catch(error => {
      console.error('Error saving job to database:', error);
    });
    
    console.log(`Job added: ${job.id} - ${type}`);
    
    if (!this.isProcessing) {
      this.startProcessing();
    }
    
    return job.id;
  }

  // Save job to database
  async saveJobToDatabase(job) {
    try {

      const subject = this.getJobSubject(job.type, job.data);
      const htmlContent = await this.getJobHtmlContent(job.type, job.data);

      const emailJob = new EmailJob({
        jobId: job.id,
        type: job.type,
        recipientEmail: job.data.email,
        recipientName: job.data.name || job.data.userName,
        subject: subject,
        htmlContent: htmlContent,
        variables: job.data,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        scheduledFor: job.scheduledFor,
        relatedBookingId: job.data.bookingId,
        relatedHostelBookingId: job.data.hostelBookingId
      });

      await emailJob.save();
    } catch (error) {
      console.error('Error saving job to database:', error);
    }
  }

  // Update job status in database
  async updateJobInDatabase(jobId, updates) {
    try {
      await EmailJob.findOneAndUpdate({ jobId }, updates);
    } catch (error) {
      console.error('Error updating job in database:', error);
    }
  }

  // Get job subject based on type
  getJobSubject(type, data) {
    switch (type) {
      case 'send_welcome_email':
        return 'Welcome to Inhalestays !';
      case 'send_password_reset_email':
        return 'Password Reset Request - Inhalestays ';
      case 'send_booking_reminder':
        return `${data.bookingDetails?.type || 'Your Booking'} expires in ${data.bookingDetails?.daysUntilExpiry || 0} day(s)`;
      case 'send_booking_confirmation':
        return `Booking Confirmed - ${data.bookingDetails?.type || 'Your Booking'}`;
      case 'send_booking_failed':
        return `Booking Failed - ${data.bookingDetails?.type || 'Your Booking'}`;
      default:
        return 'Notification from Inhalestays ';
    }
  }

  // Get job HTML content based on type
async getJobHtmlContent(type, data) {
    try {
      // Map job types to template names
      const templateMap = {
        'send_welcome_email': 'welcome',
        'send_password_reset_email': 'password_reset',
        'send_booking_reminder': 'booking_reminder',
        'send_booking_confirmation': 'booking_confirmation',
        'send_booking_failed': 'booking_failed'
      };

      const templateName = templateMap[type];
      if (!templateName) {
        return `<p>Email content for ${type}</p>`;
      }

      // Get template from database
      const template = await EmailTemplate.findOne({ name: templateName, isActive: true });
      
      if (!template) {
        // Return fallback content if template not found
        return this.getFallbackHtmlContent(type, data);
      }

      // Prepare variables for template
      const allVariables = {
        recipientName: data.name || data.userName || 'User',
        recipientEmail: data.email,
        currentYear: new Date().getFullYear(),
        siteName: 'Inhalestays',
        siteUrl: process.env.WEB_URL || 'http://localhost:5173',
        ...this.getTypeSpecificVariables(type, data)
      };

      // Replace template variables
      let htmlContent = template.htmlContent;
      Object.keys(allVariables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, allVariables[key] || '');
      });

      return htmlContent;

    } catch (error) {
      console.error('Error getting job HTML content:', error);
      return this.getFallbackHtmlContent(type, data);
    }
  }

  // Get type-specific variables for templates
  getTypeSpecificVariables(type, data) {
    switch (type) {
      case 'send_password_reset_email':
        return {
          resetUrl: data.resetUrl,
          resetToken: data.resetToken
        };
      case 'send_booking_reminder':
        return {
          userName: data.name,
          bookingType: data.bookingDetails?.type,
          bookingId: data.bookingDetails?.id,
          startDate: data.bookingDetails?.startDate,
          endDate: data.bookingDetails?.endDate,
          location: data.bookingDetails?.location || 'Your booked location',
          daysUntilExpiry: data.bookingDetails?.daysUntilExpiry || 0,
          days: Number(data.bookingDetails?.daysUntilExpiry) === 1 ? "" : "s",
          totalPrice: data.bookingDetails?.totalPrice || 0
        };
      case 'send_booking_confirmation':
        return {
          userName: data.name,
          bookingType: data.bookingDetails?.bookingType,
          bookingId: data.bookingDetails?.id,
          startDate: data.bookingDetails?.startDate,
          endDate: data.bookingDetails?.endDate,
          totalPrice: data.bookingDetails?.amount,
          location: data.bookingDetails?.location || 'Your booked location',
          roomName: data.bookingDetails?.roomName,
          amount: data.bookingDetails?.amount,
          supportEmail: data.bookingDetails?.supportEmail
        };
      case 'send_booking_failed':
        return {
          userName: data.name,
          bookingType: data.bookingDetails?.type,
          bookingId: data.bookingDetails?.id,
          startDate: data.bookingDetails?.startDate,
          endDate: data.bookingDetails?.endDate,
          totalPrice: data.bookingDetails?.totalPrice,
          location: data.bookingDetails?.location || 'Your booking location',
          roomNumber: data.bookingDetails?.roomNumber,
          seatNumber: data.bookingDetails?.seatNumber,
          errorMessage: data.errorMessage || 'An unexpected error occurred during booking processing'
        };
      default:
        return {};
    }
  }

  // Fallback HTML content if template not found
  getFallbackHtmlContent(type, data) {
    switch (type) {
      case 'send_welcome_email':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Inhalestays, ${data.name || 'User'}!</h2>
            <p>Thank you for joining our community. We're excited to have you aboard!</p>
          </div>
        `;
      case 'send_password_reset_email':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${data.resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
          </div>
        `;
      default:
        return `<p>Email content for ${type}</p>`;
    }
  }
  // Start processing jobs
  startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('Job processor started');
    
    this.processingInterval = setInterval(async () => {
      await this.processNextJob();
    }, 1000); // Process every second
  }

  // Stop processing jobs
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('Job processor stopped');
  }

  // Process next job in queue
  async processNextJob() {
    const now = new Date();
    const pendingJobs = this.jobs.filter(job => 
      job.status === 'pending' && 
      new Date(job.scheduledFor) <= now
    );
    
    if (pendingJobs.length === 0) {
      return;
    }

    // Sort by priority (high -> normal -> low) and creation time
    const sortedJobs = pendingJobs.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const job = sortedJobs[0];
    await this.executeJob(job);
  }

  // Execute individual job
  async executeJob(job) {
    job.status = 'processing';
    job.attempts++;
    job.startedAt = new Date();
    
    // Update in database
    await this.updateJobInDatabase(job.id, {
      status: 'processing',
      attempts: job.attempts,
      processedAt: job.startedAt
    });
    
    console.log(`Processing job: ${job.id} - ${job.type} (Attempt ${job.attempts})`);

    try {
      let result;
      
      switch (job.type) {
        case 'send_password_reset_email':
          result = await emailService.sendPasswordResetEmail(
            job.data.email,
            job.data.resetToken,
            job.data.resetUrl
          );
          break;
          
        case 'send_welcome_email':
          result = await emailService.sendWelcomeEmail(
            job.data.email,
            job.data.name
          );
          break;

        case 'send_booking_reminder':
          result = await emailService.sendBookingReminderEmail(
            job.data.email,
            job.data.name,
            job.data.bookingDetails
          );
          break;

        case 'send_booking_confirmation':
          result = await emailService.sendBookingConfirmationEmail(
            job.data.email,
            job.data.name,
            job.data.bookingDetails
          );
          break;

        case 'send_booking_failed':
          result = await emailService.sendBookingFailedEmail(
            job.data.email,
            job.data.name,
            job.data.bookingDetails,
            job.data.errorMessage
          );
          break;

        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      if (result.success) {
        job.status = 'completed';
        job.completedAt = new Date();
        job.result = result;
        
        // Update in database
        await this.updateJobInDatabase(job.id, {
          status: 'completed',
          completedAt: job.completedAt,
          emailResponse: result
        });
        
        console.log(`Job completed: ${job.id}`);
      } else {
        throw new Error(result.error || 'Job execution failed');
      }
      
    } catch (error) {
      console.error(`Job failed: ${job.id} -`, error.message);
      
      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        job.failedAt = new Date();
        job.error = error.message;
        
        // Update in database
        await this.updateJobInDatabase(job.id, {
          status: 'failed',
          failedAt: job.failedAt,
          error: error.message
        });
        
        console.log(`Job permanently failed: ${job.id}`);
      } else {
        job.status = 'pending';
        
        // Update in database
        await this.updateJobInDatabase(job.id, {
          status: 'pending'
        });
        
        console.log(`Job will be retried: ${job.id}`);
      }
    }
  }

  // Get job status
  getJobStatus(jobId) {
    return this.jobs.find(job => job.id === jobId);
  }

  // Get all jobs
  getAllJobs = async (req, res) => {
    try {
      const query = { ...req.query };
      
      // Remove fields that are not database fields
      const removeFields = ['includeInactive', 'page', 'limit'];
      removeFields.forEach(param => delete query[param]);
          
      // Create query string
      let queryStr = JSON.stringify(query);
      // Create operators ($gt, $lt, etc)
      queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
      
      // Finding resource
      let emailsJobsQuery = EmailJob.find(JSON.parse(queryStr));
      
      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const total = await EmailJob.countDocuments(JSON.parse(queryStr));
      
      emailsJobsQuery = emailsJobsQuery.skip(startIndex).limit(limit);
      
      // Executing query
      const jobs = await emailsJobsQuery;
      
      // Pagination result
      const pagination = {};
      
      if (endIndex < total) {
        pagination.next = {
          page: page + 1,
          limit
        };
      }
      
      if (startIndex > 0) {
        pagination.prev = {
          page: page - 1,
          limit
        };
      }
      res.status(200).json({
        success: true,
        count: jobs.length,
        pagination,
        data: jobs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  // Get jobs by status
  async getJobsByStatus(status) {
    return await EmailJob.find({status:status }).sort({ createdAt: -1 });;
    // return this.jobs.filter(job => job.status === status);
  }

  // Add booking reminder job
  addBookingReminderJob(email, name, bookingDetails, daysBeforeExpiry = 3) {
    const reminderDate = new Date(bookingDetails.endDate);
    reminderDate.setDate(reminderDate.getDate() - daysBeforeExpiry);
    
    return this.addJob(
      'send_booking_reminder',
      {
        email,
        name,
        bookingDetails: {
          ...bookingDetails,
          daysUntilExpiry: daysBeforeExpiry
        }
      },
      'normal',
      reminderDate
    );
  }

  // Add booking confirmation job
  addBookingConfirmationJob(email, name, bookingDetails) {
    return this.addJob(
      'send_booking_confirmation',
      {
        email,
        name,
        bookingDetails
      },
      'high'
    );
  }
  // Add booking failed job
  addBookingFailedJob(email, name, bookingDetails, errorMessage) {
    return this.addJob(
      'send_booking_failed',
      {
        email,
        name,
        bookingDetails,
        errorMessage
      },
      'high'
    );
  }
  // Clear completed jobs (older than 1 hour)
  clearOldJobs() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const initialCount = this.jobs.length;
    
    this.jobs = this.jobs.filter(job => {
      if (job.status === 'completed' && new Date(job.completedAt) < oneHourAgo) {
        return false;
      }
      if (job.status === 'failed' && new Date(job.failedAt) < oneHourAgo) {
        return false;
      }
      return true;
    });
    
    const removedCount = initialCount - this.jobs.length;
    if (removedCount > 0) {
      console.log(`Cleared ${removedCount} old jobs`);
    }
  }
}

// Create singleton instance
const jobProcessor = new JobProcessor();

// Start processing on module load
jobProcessor.startProcessing();

// Clear old jobs every hour
setInterval(() => {
  jobProcessor.clearOldJobs();
}, 60 * 60 * 1000);

module.exports = jobProcessor;