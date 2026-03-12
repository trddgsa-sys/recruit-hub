import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM ?? 'RecruitHub <noreply@recruithub.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function baseTemplate(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; font-size: 24px; margin: 0;">RecruitHub</h1>
        </div>
        ${content}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          You received this email because you have an account on RecruitHub.<br/>
          <a href="${APP_URL}" style="color: #4f46e5;">Visit RecruitHub</a>
        </p>
      </div>
    </div>
  `;
}

export async function sendApplicationSubmitted(opts: {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
}): Promise<void> {
  const html = baseTemplate(`
    <h2 style="color: #111827;">Application Submitted! 🎉</h2>
    <p style="color: #374151;">Hi ${opts.candidateName},</p>
    <p style="color: #374151;">
      Your application for <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong> has been successfully submitted.
    </p>
    <p style="color: #374151;">We'll notify you as your application progresses through the review process.</p>
    <a href="${APP_URL}/candidate/applications"
       style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
      View My Applications
    </a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Application submitted: ${opts.jobTitle} at ${opts.companyName}`,
    html,
  });
}

export async function sendStageChanged(opts: {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  newStage: string;
}): Promise<void> {
  const stageDisplay = opts.newStage.replace(/_/g, ' ');
  const html = baseTemplate(`
    <h2 style="color: #111827;">Application Update 📋</h2>
    <p style="color: #374151;">Hi ${opts.candidateName},</p>
    <p style="color: #374151;">
      Your application for <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong> has been updated.
    </p>
    <div style="background: #ede9fe; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: #4f46e5; font-weight: bold;">New Status: ${stageDisplay}</p>
    </div>
    <a href="${APP_URL}/candidate/applications"
       style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
      View Application
    </a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Application update: ${opts.jobTitle} — ${stageDisplay}`,
    html,
  });
}

export async function sendReferralCodeUsed(opts: {
  to: string;
  recruiterName: string;
  candidateName: string;
  code: string;
}): Promise<void> {
  const html = baseTemplate(`
    <h2 style="color: #111827;">Referral Code Used 🔗</h2>
    <p style="color: #374151;">Hi ${opts.recruiterName},</p>
    <p style="color: #374151;">
      Your referral code <strong>${opts.code}</strong> was just used by <strong>${opts.candidateName}</strong>.
    </p>
    <a href="${APP_URL}/recruiter/candidates"
       style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
      View Referred Candidates
    </a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Referral code ${opts.code} was used by ${opts.candidateName}`,
    html,
  });
}

export async function sendInterviewInvite(opts: {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDetails?: string;
}): Promise<void> {
  const html = baseTemplate(`
    <h2 style="color: #111827;">Interview Invitation 📅</h2>
    <p style="color: #374151;">Hi ${opts.candidateName},</p>
    <p style="color: #374151;">
      Congratulations! You've been invited for an interview for <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong>.
    </p>
    ${opts.interviewDetails ? `<div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="margin: 0; color: #166534;">${opts.interviewDetails}</p></div>` : ''}
    <a href="${APP_URL}/candidate/applications"
       style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
      View Application
    </a>
  `);

  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Interview invitation: ${opts.jobTitle} at ${opts.companyName}`,
    html,
  });
}
