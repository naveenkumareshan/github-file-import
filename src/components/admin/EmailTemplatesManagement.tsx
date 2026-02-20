
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, Mail } from 'lucide-react';
import { emailTemplatesService, EmailTemplate } from '@/api/emailTemplatesService';
import { toast } from '@/hooks/use-toast';

const EmailTemplatesManagement = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    category: 'notification' as 'booking' | 'reminder' | 'welcome' | 'password_reset' | 'notification',
    variables: [] as Array<{ name: string; description: string; required: boolean }>
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await emailTemplatesService.getEmailTemplates();
      if (response.success) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      category: 'notification',
      variables: []
    });
  };

  const createSampleTemplates = async () => {
    const sampleTemplates = [
      {
        name: 'welcome',
        subject: 'Welcome to Inhalestays , {{recipientName}}!',
        category: 'welcome' as const,
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Inhalestays </title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; font-size: 28px; margin: 0;">Welcome to Inhalestays !</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 20px; margin-top: 0;">Hello {{recipientName}}!</h2>
            <p style="color: #666; line-height: 1.6; margin: 15px 0;">
                Thank you for joining our community at Inhalestays . We're excited to have you aboard and look forward to providing you with an exceptional experience.
            </p>
        </div>
        
        <div style="margin: 20px 0;">
            <h3 style="color: #2c5530; font-size: 18px;">What you can do now:</h3>
            <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>Book cabin spaces for focused study sessions</li>
                <li>Reserve hostel accommodations for longer stays</li>
                <li>Access our convenient laundry services</li>
                <li>Manage all your bookings from one place</li>
                <li>Leave reviews and connect with our community</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{siteUrl}}" style="background-color: #2c5530; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Get Started Now
            </a>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #2c5530; margin: 0; font-size: 14px; text-align: center;">
                <strong>Need help?</strong> Our support team is here to assist you. Feel free to reach out anytime!
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
                © {{currentYear}} {{siteName}}. All rights reserved.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                You received this email because you signed up for an account at {{siteName}}.
            </p>
        </div>
    </div>
</body>
</html>`,
        textContent: `Welcome to Inhalestays, {{recipientName}}!

Thank you for joining our community. We're excited to have you aboard!

What you can do now:
- Book cabin spaces for focused study sessions
- Reserve hostel accommodations for longer stays
- Access our convenient laundry services
- Manage all your bookings from one place

Get started: {{siteUrl}}

Need help? Our support team is here to assist you.

© {{currentYear}} {{siteName}}. All rights reserved.`
      },
      {
        name: 'password_reset',
        subject: 'Reset Your Password - {{siteName}}',
        category: 'password_reset' as const,
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; font-size: 24px; margin: 0;">Password Reset Request</h1>
        </div>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
            <p style="color: #333; line-height: 1.6; margin: 0;">
                We received a request to reset the password for your {{siteName}} account associated with this email address.
            </p>
        </div>
        
        <div style="margin: 20px 0;">
            <p style="color: #666; line-height: 1.6;">
                If you made this request, click the button below to reset your password:
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Reset Your Password
            </a>
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #666; margin: 0; font-size: 14px;">
                <strong>Can't click the button?</strong> Copy and paste this link into your browser:
            </p>
            <p style="background-color: #ffffff; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; margin: 10px 0 0 0; border: 1px solid #e5e7eb;">
                {{resetUrl}}
            </p>
        </div>
        
        <div style="background-color: #fef3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Important:</strong> This password reset link will expire in 10 minutes for security reasons.
            </p>
        </div>
        
        <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
                © {{currentYear}} {{siteName}}. All rights reserved.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                This email was sent to {{recipientEmail}} regarding your {{siteName}} account.
            </p>
        </div>
    </div>
</body>
</html>`,
        textContent: `Password Reset Request - {{siteName}}

We received a request to reset the password for your {{siteName}} account.

If you made this request, click the link below to reset your password:
{{resetUrl}}

IMPORTANT: This link will expire in 10 minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

© {{currentYear}} {{siteName}}. All rights reserved.`
      },
      {
        name: 'booking_reminder',
        subject: 'Your {{bookingType}} expires in {{daysUntilExpiry}} day{{daysUntilExpiry === 1 ? "" : "s"}} - {{siteName}}',
        category: 'reminder' as const,
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Expiry Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; font-size: 24px; margin: 0;">Booking Expiry Reminder</h1>
        </div>
        
        <div style="background-color: #fef3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 20px; margin-top: 0;">Hello {{recipientName}}!</h2>
            <p style="color: #92400e; line-height: 1.6; margin: 15px 0;">
                Your <strong>{{bookingType}}</strong> is expiring in <strong>{{daysUntilExpiry}} day{{daysUntilExpiry === 1 ? "" : "s"}}</strong>.
            </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #2c5530; font-size: 18px; margin-top: 0;">Booking Details:</h3>
            <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li><strong>Booking ID:</strong> {{bookingId}}</li>
                <li><strong>Location:</strong> {{location}}</li>
                <li><strong>Start Date:</strong> {{startDate}}</li>
                <li><strong>End Date:</strong> {{endDate}}</li>
                <li><strong>Amount Paid:</strong> ₹{{totalPrice}}</li>
            </ul>
        </div>
        
        <div style="margin: 20px 0;">
            <p style="color: #666; line-height: 1.6;">
                Don't worry! You can easily extend your booking to continue enjoying our services without any interruption.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{renewUrl}}" style="background-color: #2c5530; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Renew Your Booking
            </a>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #2c5530; margin: 0; font-size: 14px; text-align: center;">
                <strong>Benefits of Renewing:</strong><br>
                • Continue using your preferred space<br>
                • No booking fee for renewals<br>
                • Seamless transition without interruption
            </p>
        </div>
        
        <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance with renewal, our support team is here to help. You can also visit your dashboard to manage all your bookings.
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
                © {{currentYear}} {{siteName}}. All rights reserved.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                This reminder was sent to {{recipientEmail}} regarding your booking.
            </p>
        </div>
    </div>
</body>
</html>`,
        textContent: `Booking Expiry Reminder - {{siteName}}

Hello {{recipientName}},

Your {{bookingType}} is expiring in {{daysUntilExpiry}} day(s).

Booking Details:
- Booking ID: {{bookingId}}
- Location: {{location}}
- Start Date: {{startDate}}
- End Date: {{endDate}}
- Amount Paid: ₹{{totalPrice}}

Don't worry! You can easily extend your booking to continue enjoying our services without any interruption.

Renew your booking: {{renewUrl}}

Benefits of Renewing:
• Continue using your preferred space
• No booking fee for renewals
• Seamless transition without interruption

If you have any questions, our support team is here to help.

© {{currentYear}} {{siteName}}. All rights reserved.`
      },
      {
          name: 'booking_confirmation',
          subject: 'Booking Confirmed - {{bookingType}} #{{bookingId}}',
          category: 'booking',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
              <p>Dear {{userName}},</p>
              <p>Your {{bookingType}} booking has been confirmed. Here are the details:</p>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Booking Details</h3>
                <p><strong>Booking ID:</strong> {{bookingId}}</p>
                <p><strong>Location:</strong> {{location}}</p>
                <p><strong>Start Date:</strong> {{startDate}}</p>
                <p><strong>End Date:</strong> {{endDate}}</p>
                {{#if roomNumber}}<p><strong>Room:</strong> {{roomNumber}}</p>{{/if}}
                {{#if seatNumber}}<p><strong>Seat:</strong> {{seatNumber}}</p>{{/if}}
                {{#if totalPrice}}<p><strong>Total Amount:</strong> ₹{{totalPrice}}</p>{{/if}}
              </div>

              <p>Thank you for choosing {{siteName}}. We look forward to serving you!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/bookings" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  View Booking
                </a>
              </div>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">© {{currentYear}} {{siteName}}. All rights reserved.</p>
            </div>
          `,
          variables: [
            { name: 'userName', description: 'Customer name', required: true },
            { name: 'bookingId', description: 'Booking ID', required: true },
            { name: 'bookingType', description: 'Type of booking (cabin/hostel)', required: true },
            { name: 'location', description: 'Booking location', required: true },
            { name: 'startDate', description: 'Start date', required: true },
            { name: 'endDate', description: 'End date', required: true },
            { name: 'totalPrice', description: 'Total price', required: false },
            { name: 'roomNumber', description: 'Room number', required: false },
            { name: 'seatNumber', description: 'Seat number', required: false }
          ]
        },
    ];

    try {
      for (const template of sampleTemplates) {
        await emailTemplatesService.createEmailTemplate(template);
      }
      toast({
        title: "Success",
        description: "Sample email templates created successfully"
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sample templates",
        variant: "destructive"
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await emailTemplatesService.createEmailTemplate(formData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Email template created successfully"
        });
        setIsCreateModalOpen(false);
        resetForm();
        loadTemplates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create email template",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate) return;
    
    try {
      const response = await emailTemplatesService.updateEmailTemplate(selectedTemplate._id, formData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Email template updated successfully"
        });
        setIsEditModalOpen(false);
        setSelectedTemplate(null);
        resetForm();
        loadTemplates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      const response = await emailTemplatesService.deleteEmailTemplate(template._id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Email template deleted successfully"
        });
        loadTemplates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email template",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || '',
      category: template.category,
      variables: template.variables || []
    });
    setIsEditModalOpen(true);
  };

  const openPreviewModal = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'booking': return 'bg-blue-100 text-blue-800';
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
      case 'welcome': return 'bg-green-100 text-green-800';
      case 'password_reset': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  function decodeHtml(html: string) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading email templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <div className="flex space-x-2">
          {/* <Button variant="outline" onClick={createSampleTemplates}>
            <Mail className="h-4 w-4 mr-2" />
            Add Sample Templates
          </Button> */}
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Template Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., welcome_email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking">Booking</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="password_reset">Password Reset</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Email subject (you can use {{variables}})"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">HTML Content</label>
                  <Textarea
                    value={formData.htmlContent}
                    onChange={(e) => setFormData({...formData, htmlContent: e.target.value})}
                    placeholder="HTML email content (you can use {{variables}})"
                    rows={10}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Text Content (Optional)</label>
                  <Textarea
                    value={formData.textContent}
                    onChange={(e) => setFormData({...formData, textContent: e.target.value})}
                    placeholder="Plain text fallback"
                    rows={5}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Template</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                </div>
                <div className="flex space-x-2">
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => openPreviewModal(template)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditModal(template)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(template)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {/* Same form fields as create modal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., welcome_email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="password_reset">Password Reset</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Email subject (you can use {{variables}})"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">HTML Content</label>
              <Textarea
                value={formData.htmlContent}
                onChange={(e) => setFormData({...formData, htmlContent: e.target.value})}
                placeholder="HTML email content (you can use {{variables}})"
                rows={10}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Text Content (Optional)</label>
              <Textarea
                value={formData.textContent}
                onChange={(e) => setFormData({...formData, textContent: e.target.value})}
                placeholder="Plain text fallback"
                rows={5}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Template</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <strong>Subject:</strong> {selectedTemplate.subject}
              </div>
              <div>
                <strong>HTML Content:</strong>
                <div 
                  className="border rounded p-4 max-h-96 overflow-auto"
                   dangerouslySetInnerHTML={{ __html: decodeHtml(selectedTemplate.htmlContent) }}
                />
                
              </div>
              {selectedTemplate.textContent && (
                <div>
                  <strong>Text Content:</strong>
                  <pre className="border rounded p-4 max-h-32 overflow-auto text-sm">
                    {selectedTemplate.textContent}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplatesManagement;