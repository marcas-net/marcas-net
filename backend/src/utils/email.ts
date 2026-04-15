import nodemailer from 'nodemailer';
import logger from './logger';
import { invitationTemplate, welcomeTemplate, notificationTemplate, passwordResetTemplate } from './emailTemplates';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const from = process.env.SMTP_FROM || '"MarcasNet" <noreply@marcasnet.com>';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await transporter.sendMail({ from, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email', { to, subject, error });
    return false;
  }
}

export const sendInvitationEmail = (to: string, orgName: string, token: string, inviterName: string) => {
  const acceptUrl = `${frontendUrl}/accept-invitation/${token}`;
  return sendMail(to, `Invitation to join ${orgName} on MarcasNet`, invitationTemplate(orgName, inviterName, acceptUrl));
};

export const sendWelcomeEmail = (to: string, name: string) => {
  return sendMail(to, 'Welcome to MarcasNet!', welcomeTemplate(name, `${frontendUrl}/dashboard`));
};

export const sendNotificationEmail = (to: string, title: string, message: string, link?: string) => {
  const actionUrl = link ? `${frontendUrl}${link}` : undefined;
  return sendMail(to, title, notificationTemplate(title, message, actionUrl));
};

export const sendPasswordResetEmail = (to: string, name: string, token: string) => {
  const resetUrl = `${frontendUrl}/reset-password/${token}`;
  return sendMail(to, 'Reset Your MarcasNet Password', passwordResetTemplate(name, resetUrl));
};
