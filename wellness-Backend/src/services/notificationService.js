const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Initialize Twilio Client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

/**
 * Utility to format Date to readable string
 */
const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// HTML EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base wrapper — shared header, footer, and styling for all emails
 */
const baseTemplate = ({ previewText, headerColor, headerIcon, headerLabel, bodyContent }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${previewText}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background-color: #F0F4F8; color: #1A202C; }
    .email-wrapper { background-color: #F0F4F8; padding: 32px 16px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .email-header { background: ${headerColor}; padding: 40px 32px; text-align: center; }
    .email-header .icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .email-header .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 4px 14px; border-radius: 50px; margin-bottom: 14px; }
    .email-header h1 { color: #FFFFFF; font-size: 26px; font-weight: 700; line-height: 1.3; }
    .email-body { padding: 40px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #1A202C; margin-bottom: 10px; }
    .intro-text { font-size: 15px; color: #4A5568; line-height: 1.7; margin-bottom: 28px; }
    .detail-card { background: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; margin-bottom: 28px; }
    .detail-card-title { background: ${headerColor}; color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 10px 20px; }
    .detail-row { display: flex; align-items: flex-start; padding: 14px 20px; border-bottom: 1px solid #EDF2F7; }
    .detail-row:last-child { border-bottom: none; }
    .detail-icon { font-size: 18px; width: 28px; flex-shrink: 0; margin-top: 1px; }
    .detail-label { font-size: 11px; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 2px; }
    .detail-value { font-size: 15px; font-weight: 600; color: #1A202C; }
    .status-banner { border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; display: flex; align-items: center; gap: 14px; }
    .status-banner .status-icon { font-size: 28px; flex-shrink: 0; }
    .status-banner .status-text { font-size: 14px; font-weight: 500; line-height: 1.6; }
    .cta-btn { display: block; background: ${headerColor}; color: #FFFFFF !important; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 28px; }
    .divider { height: 1px; background: #EDF2F7; margin: 24px 0; }
    .note-box { background: #FFFBEB; border: 1px solid #F6E05E; border-left: 4px solid #D69E2E; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #744210; line-height: 1.6; }
    .email-footer { background: #F7FAFC; border-top: 1px solid #EDF2F7; padding: 28px 36px; text-align: center; }
    .footer-brand { font-size: 16px; font-weight: 700; color: #2D3748; margin-bottom: 6px; }
    .footer-tagline { font-size: 13px; color: #718096; margin-bottom: 16px; }
    .footer-links { margin-bottom: 16px; }
    .footer-links a { font-size: 12px; color: #4A90D9; text-decoration: none; margin: 0 8px; }
    .footer-copy { font-size: 11px; color: #A0AEC0; }
    @media (max-width: 600px) {
      .email-body { padding: 28px 20px; }
      .email-header { padding: 32px 20px; }
      .email-footer { padding: 24px 20px; }
      .email-header h1 { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">

      <!-- HEADER -->
      <div class="email-header">
        <span class="icon">${headerIcon}</span>
        <div class="badge">${headerLabel}</div>
        <h1>${previewText}</h1>
      </div>

      <!-- BODY -->
      <div class="email-body">
        ${bodyContent}
      </div>

      <!-- FOOTER -->
      <div class="email-footer">
        <div class="footer-brand">🌿 WellnessHub</div>
        <div class="footer-tagline">Your wellness journey, simplified.</div>
        <div class="footer-links">
          <a href="#">Help Center</a>
          <a href="#">Contact Us</a>
          <a href="#">Privacy Policy</a>
        </div>
        <div class="footer-copy">© ${new Date().getFullYear()} WellnessHub. All rights reserved.<br/>You're receiving this because you have an active booking with us.</div>
      </div>

    </div>
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const bookingConfirmationTemplate = ({ customerName, therapyName, centerName, therapistName, formattedTime }) =>
    baseTemplate({
        previewText: 'Your Booking is Confirmed!',
        headerColor: 'linear-gradient(135deg, #1A7A4A 0%, #2ECC71 100%)',
        headerIcon: '✅',
        headerLabel: 'Booking Confirmed',
        bodyContent: `
      <p class="greeting">Hi ${customerName} 👋</p>
      <p class="intro-text">Great news! Your therapy session has been <strong>successfully booked</strong>. We're excited to see you and help you on your wellness journey.</p>

      <div class="status-banner" style="background:#F0FFF4; border:1px solid #9AE6B4;">
        <span class="status-icon">🎉</span>
        <span class="status-text" style="color:#276749;"><strong>You're all set!</strong> Please arrive 10 minutes before your appointment. Bring any relevant medical documents if applicable.</span>
      </div>

      <div class="detail-card">
        <div class="detail-card-title">📋 Appointment Details</div>
        <div class="detail-row">
          <span class="detail-icon">💆</span>
          <div>
            <span class="detail-label">Service</span>
            <span class="detail-value">${therapyName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🏢</span>
          <div>
            <span class="detail-label">Center</span>
            <span class="detail-value">${centerName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">👨‍⚕️</span>
          <div>
            <span class="detail-label">Therapist</span>
            <span class="detail-value">${therapistName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <div>
            <span class="detail-label">Date & Time</span>
            <span class="detail-value">${formattedTime}</span>
          </div>
        </div>
      </div>

      <div class="note-box">
        ⚠️ <strong>Need to reschedule or cancel?</strong> Please do so at least 24 hours in advance through the app to avoid any cancellation fees.
      </div>

      <div class="divider"></div>
      <p style="font-size:14px; color:#718096; text-align:center;">Questions? Reply to this email or contact our support team.</p>
    `
    });

const bookingCancellationTemplate = ({ customerName, therapyName, centerName, formattedTime }) =>
    baseTemplate({
        previewText: 'Your Booking Has Been Cancelled',
        headerColor: 'linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)',
        headerIcon: '❌',
        headerLabel: 'Booking Cancelled',
        bodyContent: `
      <p class="greeting">Hi ${customerName},</p>
      <p class="intro-text">We're confirming that your booking has been <strong>successfully cancelled</strong> as per your request. We hope to see you again soon.</p>

      <div class="status-banner" style="background:#FFF5F5; border:1px solid #FEB2B2;">
        <span class="status-icon">🚫</span>
        <span class="status-text" style="color:#9B2335;"><strong>Cancellation Confirmed.</strong> If you did not request this cancellation, please contact our support team immediately.</span>
      </div>

      <div class="detail-card">
        <div class="detail-card-title">📋 Cancelled Appointment</div>
        <div class="detail-row">
          <span class="detail-icon">💆</span>
          <div>
            <span class="detail-label">Service</span>
            <span class="detail-value">${therapyName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🏢</span>
          <div>
            <span class="detail-label">Center</span>
            <span class="detail-value">${centerName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <div>
            <span class="detail-label">Was Scheduled For</span>
            <span class="detail-value">${formattedTime}</span>
          </div>
        </div>
      </div>

      <div style="text-align:center; margin-bottom: 24px;">
        <p style="font-size:15px; color:#4A5568; margin-bottom:16px;">Ready to book again? We'd love to have you back.</p>
        <a href="#" class="cta-btn" style="background: linear-gradient(135deg, #1A7A4A 0%, #2ECC71 100%);">Book a New Appointment</a>
      </div>

      <div class="divider"></div>
      <p style="font-size:14px; color:#718096; text-align:center;">If you have any questions about this cancellation, please contact us.</p>
    `
    });

const bookingRescheduleTemplate = ({ customerName, therapyName, centerName, formattedTime }) =>
    baseTemplate({
        previewText: 'Your Booking Has Been Rescheduled',
        headerColor: 'linear-gradient(135deg, #1A55A0 0%, #4A90D9 100%)',
        headerIcon: '🔄',
        headerLabel: 'Booking Rescheduled',
        bodyContent: `
      <p class="greeting">Hi ${customerName},</p>
      <p class="intro-text">Your appointment has been <strong>successfully rescheduled</strong>. Please take note of your new date and time below.</p>

      <div class="status-banner" style="background:#EBF8FF; border:1px solid #90CDF4;">
        <span class="status-icon">📆</span>
        <span class="status-text" style="color:#1A4971;"><strong>New time confirmed.</strong> Please update your calendar and arrive 10 minutes early.</span>
      </div>

      <div class="detail-card">
        <div class="detail-card-title">📋 Updated Appointment</div>
        <div class="detail-row">
          <span class="detail-icon">💆</span>
          <div>
            <span class="detail-label">Service</span>
            <span class="detail-value">${therapyName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🏢</span>
          <div>
            <span class="detail-label">Center</span>
            <span class="detail-value">${centerName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <div>
            <span class="detail-label">New Date & Time</span>
            <span class="detail-value">${formattedTime}</span>
          </div>
        </div>
      </div>

      <div class="note-box">
        ⚠️ <strong>Need to make another change?</strong> Please reschedule or cancel at least 24 hours in advance through the app.
      </div>

      <div class="divider"></div>
      <p style="font-size:14px; color:#718096; text-align:center;">If you didn't request this change, please contact us right away.</p>
    `
    });

const bookingReminderTemplate = ({ customerName, therapyName, centerName, therapistName, formattedTime }) =>
    baseTemplate({
        previewText: 'Reminder: Your Appointment is Tomorrow',
        headerColor: 'linear-gradient(135deg, #6B21A8 0%, #A855F7 100%)',
        headerIcon: '⏰',
        headerLabel: 'Appointment Reminder',
        bodyContent: `
      <p class="greeting">Hi ${customerName} 👋</p>
      <p class="intro-text">Just a friendly reminder that you have an appointment coming up <strong>tomorrow</strong>. We're looking forward to seeing you!</p>

      <div class="status-banner" style="background:#FAF5FF; border:1px solid #D6BCFA;">
        <span class="status-icon">🌿</span>
        <span class="status-text" style="color:#553C9A;"><strong>You're all set.</strong> Please arrive 10 minutes early and wear comfortable clothing for your session.</span>
      </div>

      <div class="detail-card">
        <div class="detail-card-title">📋 Tomorrow's Appointment</div>
        <div class="detail-row">
          <span class="detail-icon">💆</span>
          <div>
            <span class="detail-label">Service</span>
            <span class="detail-value">${therapyName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🏢</span>
          <div>
            <span class="detail-label">Center</span>
            <span class="detail-value">${centerName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">👨‍⚕️</span>
          <div>
            <span class="detail-label">Therapist</span>
            <span class="detail-value">${therapistName}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <div>
            <span class="detail-label">Date & Time</span>
            <span class="detail-value">${formattedTime}</span>
          </div>
        </div>
      </div>

      <div class="note-box">
        💡 <strong>Tip:</strong> Stay hydrated before your session and avoid heavy meals 1–2 hours before your therapy appointment.
      </div>

      <div class="divider"></div>
      <p style="font-size:14px; color:#718096; text-align:center;">Need to make changes? Please do so at least 24 hours in advance through the app.</p>
    `
    });

const passwordResetTemplate = ({ resetUrl }) =>
    baseTemplate({
        previewText: 'Reset Your Password',
        headerColor: 'linear-gradient(135deg, #B7410E 0%, #E8612C 100%)',
        headerIcon: '🔐',
        headerLabel: 'Security Alert',
        bodyContent: `
      <p class="greeting">Password Reset Requested</p>
      <p class="intro-text">We received a request to reset the password for your WellnessHub account. If you made this request, click the button below to set a new password.</p>

      <div class="status-banner" style="background:#FFFAF0; border:1px solid #FBD38D;">
        <span class="status-icon">⚠️</span>
        <span class="status-text" style="color:#7B341E;"><strong>This link expires in 1 hour.</strong> If you did not request a password reset, you can safely ignore this email — your password will not change.</span>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="cta-btn" style="background: linear-gradient(135deg, #B7410E 0%, #E8612C 100%); display:inline-block; max-width: 280px;">
          🔑 Reset My Password
        </a>
      </div>

      <div class="detail-card">
        <div class="detail-card-title">🛡️ Security Tips</div>
        <div class="detail-row">
          <span class="detail-icon">✅</span>
          <div>
            <span class="detail-label">Use a strong password</span>
            <span class="detail-value" style="font-weight:400; font-size:14px;">At least 8 characters with numbers and symbols.</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">✅</span>
          <div>
            <span class="detail-label">Don't reuse passwords</span>
            <span class="detail-value" style="font-weight:400; font-size:14px;">Use a unique password for WellnessHub.</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-icon">✅</span>
          <div>
            <span class="detail-label">Never share your password</span>
            <span class="detail-value" style="font-weight:400; font-size:14px;">Our team will never ask for it.</span>
          </div>
        </div>
      </div>

      <div style="background:#F7FAFC; border-radius:8px; padding:14px 18px; margin-bottom:20px;">
        <p style="font-size:12px; color:#718096; margin-bottom:6px; font-weight:600;">Or copy and paste this link into your browser:</p>
        <p style="font-size:12px; color:#4A90D9; word-break:break-all;">${resetUrl}</p>
      </div>

      <div class="divider"></div>
      <p style="font-size:13px; color:#718096; text-align:center;">If you didn't request this, please <a href="#" style="color:#E8612C;">contact our support team</a> immediately.</p>
    `
    });

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SERVICE — Same interface as before, now sends HTML emails
// ─────────────────────────────────────────────────────────────────────────────

const notificationService = {

    _sendEmail: async (to, subject, html) => {
        if (!to || !process.env.SMTP_HOST) return;
        try {
            await transporter.sendMail({
                from: `"WellnessHub" <${process.env.SMTP_FROM_EMAIL}>`,
                to,
                subject,
                html                           // ← html instead of text
            });
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Email Failure:`, error.message);
        }
    },

    _sendSMS: async (to, body) => {
        if (!to || !twilioClient || !process.env.TWILIO_PHONE_NUMBER) return;
        try {
            await twilioClient.messages.create({
                body,
                from: process.env.TWILIO_PHONE_NUMBER,
                to
            });
        } catch (error) {
            console.error(`[${new Date().toISOString()}] SMS Failure:`, error.message);
        }
    },

    // ── Booking Confirmation ─────────────────────────────────────────────────
    sendBookingConfirmation: async (data) => {
        try {
            const { customerName, customerPhone, customerEmail, therapyName, centerName, therapistName, appointmentStartTime } = data;
            const formattedTime = formatDateTime(appointmentStartTime);

            const subject = `Booking Confirmed — ${therapyName} at ${centerName}`;
            const html    = bookingConfirmationTemplate({ customerName, therapyName, centerName, therapistName, formattedTime });
            const sms     = `Hi ${customerName}, your ${therapyName} at ${centerName} is confirmed for ${formattedTime} with ${therapistName}.`;

            await Promise.all([
                notificationService._sendEmail(customerEmail, subject, html),
                notificationService._sendSMS(customerPhone, sms)
            ]);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Notification Service Error (Confirmation):`, error.message);
        }
    },

    // ── Booking Cancellation ─────────────────────────────────────────────────
    sendBookingCancellation: async (data) => {
        try {
            const { customerName, customerPhone, customerEmail, therapyName, centerName, appointmentStartTime } = data;
            const formattedTime = formatDateTime(appointmentStartTime);

            const subject = `Booking Cancelled — ${therapyName} at ${centerName}`;
            const html    = bookingCancellationTemplate({ customerName, therapyName, centerName, formattedTime });
            const sms     = `Hi ${customerName}, your ${therapyName} booking at ${centerName} on ${formattedTime} has been cancelled.`;

            await Promise.all([
                notificationService._sendEmail(customerEmail, subject, html),
                notificationService._sendSMS(customerPhone, sms)
            ]);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Notification Service Error (Cancellation):`, error.message);
        }
    },

    // ── Booking Reschedule ───────────────────────────────────────────────────
    sendBookingReschedule: async (data) => {
        try {
            const { customerName, customerPhone, customerEmail, therapyName, centerName, newAppointmentStartTime } = data;
            const formattedTime = formatDateTime(newAppointmentStartTime);

            const subject = `Booking Rescheduled — ${therapyName} at ${centerName}`;
            const html    = bookingRescheduleTemplate({ customerName, therapyName, centerName, formattedTime });
            const sms     = `Hi ${customerName}, your ${therapyName} at ${centerName} has been rescheduled to ${formattedTime}.`;

            await Promise.all([
                notificationService._sendEmail(customerEmail, subject, html),
                notificationService._sendSMS(customerPhone, sms)
            ]);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Notification Service Error (Reschedule):`, error.message);
        }
    },

    // ── Booking Reminder ─────────────────────────────────────────────────────
    sendBookingReminder: async (data) => {
        try {
            const { customerName, customerPhone, customerEmail, therapyName, centerName, therapistName, appointmentStartTime } = data;
            const formattedTime = formatDateTime(appointmentStartTime);

            const subject = `Reminder: Your ${therapyName} appointment is tomorrow`;
            const html    = bookingReminderTemplate({ customerName, therapyName, centerName, therapistName, formattedTime });
            const sms     = `Reminder: Hi ${customerName}, your ${therapyName} at ${centerName} is tomorrow at ${formattedTime} with ${therapistName}.`;

            await Promise.all([
                notificationService._sendEmail(customerEmail, subject, html),
                notificationService._sendSMS(customerPhone, sms)
            ]);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Notification Service Error (Reminder):`, error.message);
        }
    },

    // ── Password Reset ───────────────────────────────────────────────────────
    sendPasswordResetEmail: async (to, resetUrl) => {
        try {
            const subject = 'Password Reset Request — WellnessHub';
            const html    = passwordResetTemplate({ resetUrl });

            await notificationService._sendEmail(to, subject, html);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Notification Service Error (Password Reset):`, error.message);
        }
    }
};

module.exports = notificationService;