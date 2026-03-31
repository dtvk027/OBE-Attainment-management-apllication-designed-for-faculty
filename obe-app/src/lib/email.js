import nodemailer from 'nodemailer';

// Since this is likely a college email testing environment, using basic secure SMTP settings.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a 6-digit recovery code email
 * @param {string} to - The target college email address
 * @param {string} code - The securely generated code
 */
export async function sendRecoveryEmail(to, code) {
  // If email configuration is missing, just log the code for development parsing
  if (!process.env.EMAIL_USER) {
    console.log(`\n\n=== DEVELOPMENT MODE SMS ===\nRecovery Code for ${to} is: ${code}\n============================\n\n`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"OBE System Admin" <admin@college.edu>',
    to,
    subject: 'Password Recovery Code - OBE Attainment System',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Recovery Request</h2>
        <p>A request was made to reset the password for your faculty account.</p>
        <p>Your one-time recovery code is:</p>
        <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px; color: #333;">${code}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <hr/>
        <small>Automated System. Do not reply.</small>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
