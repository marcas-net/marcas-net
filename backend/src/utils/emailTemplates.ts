const brandColor = '#2563eb';
const bgColor = '#f8fafc';

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${bgColor};font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="background:${brandColor};padding:24px 32px;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">MarcasNet</h1>
      </div>
      <div style="padding:32px;">
        ${content}
      </div>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
      &copy; ${new Date().getFullYear()} MarcasNet. All rights reserved.
    </p>
  </div>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${brandColor};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">${text}</a>`;
}

export function invitationTemplate(orgName: string, inviterName: string, acceptUrl: string): string {
  return baseLayout(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:18px;">You've been invited!</h2>
    <p style="color:#475569;line-height:1.6;">
      <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on MarcasNet — the food &amp; nutrition collaboration platform.
    </p>
    ${button('Accept Invitation', acceptUrl)}
    <p style="color:#94a3b8;font-size:13px;margin-top:24px;">
      This invitation expires in 7 days. If the button doesn't work, copy this link:<br/>
      <a href="${acceptUrl}" style="color:${brandColor};word-break:break-all;">${acceptUrl}</a>
    </p>
  `);
}

export function welcomeTemplate(name: string, loginUrl: string): string {
  return baseLayout(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:18px;">Welcome to MarcasNet, ${name}!</h2>
    <p style="color:#475569;line-height:1.6;">
      Your account has been created. You can now collaborate with food producers, laboratories, universities, and regulators.
    </p>
    <p style="color:#475569;line-height:1.6;">Here's what you can do:</p>
    <ul style="color:#475569;line-height:1.8;padding-left:20px;">
      <li>Browse and join organizations</li>
      <li>Upload and manage documents</li>
      <li>Collaborate with team members</li>
    </ul>
    ${button('Go to Dashboard', loginUrl)}
  `);
}

export function notificationTemplate(title: string, message: string, actionUrl?: string): string {
  return baseLayout(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:18px;">${title}</h2>
    <p style="color:#475569;line-height:1.6;">${message}</p>
    ${actionUrl ? button('View Details', actionUrl) : ''}
  `);
}
