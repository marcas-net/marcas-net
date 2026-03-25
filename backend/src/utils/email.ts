import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendInvitationEmail = async (
  to: string,
  orgName: string,
  token: string,
  inviterName: string
) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const acceptUrl = `${frontendUrl}/accept-invitation/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">You've been invited to join ${orgName}</h2>
      <p>${inviterName} has invited you to join <strong>${orgName}</strong> on MarcasNet.</p>
      <p>Click the button below to accept the invitation:</p>
      <a href="${acceptUrl}" 
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Accept Invitation
      </a>
      <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
        This invitation expires in 7 days. If the button doesn't work, copy this link:<br/>
        <a href="${acceptUrl}">${acceptUrl}</a>
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MarcasNet" <noreply@marcasnet.com>',
      to,
      subject: `Invitation to join ${orgName} on MarcasNet`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return false;
  }
};
