/**
 * Email Service using Resend
 * Handles sending assignment reminder emails to users
 */

interface AssignmentReminderData {
  userEmail: string;
  userName: string;
  assignments: {
    title: string;
    course: string;
    dueDate: Date;
    priority: 'high' | 'medium' | 'low';
  }[];
  type: 'morning' | 'tomorrow' | 'urgent';
}

/**
 * Send assignment reminder email
 * @param data - User email, name, assignments, and reminder type
 */
export async function sendAssignmentReminder(data: AssignmentReminderData) {
  const { userEmail, userName, assignments, type } = data;

  // Design Tokens based on type
  let subject = '';
  let badgeText = '';
  let accentColor = '';
  let badgeBg = '';
  let introText = '';

  switch (type) {
    case 'urgent':
      subject = `Urgent: ${assignments.length} assignments due soon`;
      badgeText = 'Due Soon';
      accentColor = '#DC2626'; // Red 600
      badgeBg = '#FEF2F2'; // Red 50
      introText = `You have <strong>${assignments.length} assignments</strong> due in less than 2 hours. Please prioritize these tasks.`;
      break;
    case 'tomorrow':
      subject = `Upcoming: ${assignments.length} assignments due tomorrow`;
      badgeText = 'Heads Up';
      accentColor = '#7C3AED'; // Violet 600
      badgeBg = '#F5F3FF'; // Violet 50
      introText = `You have <strong>${assignments.length} assignments</strong> due tomorrow. Plan your time accordingly.`;
      break;
    case 'morning':
    default:
      subject = `Daily Digest: ${assignments.length} assignments due today`;
      badgeText = 'Today';
      accentColor = '#2563EB'; // Blue 600
      badgeBg = '#EFF6FF'; // Blue 50
      introText = `Good morning. You have <strong>${assignments.length} assignments</strong> due today.`;
      break;
  }

  // Format assignments into a clean minimal list
  const assignmentsList = assignments
    .map(
      (assignment) => `
      <li style="margin-bottom: 12px; padding: 16px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="display: flex; align-items: start; justify-content: space-between;">
          <div style="margin-bottom: 4px;">
             <strong style="display: block; color: #111827; font-size: 15px; margin-bottom: 4px;">${assignment.title}</strong>
             <span style="color: #6b7280; font-size: 13px;">${assignment.course}</span>
          </div>
          <span style="font-size: 12px; font-weight: 500; color: ${getPriorityColor(assignment.priority)}; background-color: ${getPriorityBg(assignment.priority)}; padding: 2px 8px; border-radius: 4px; white-space: nowrap;">
            ${(assignment.priority).charAt(0).toUpperCase() + assignment.priority.slice(1)}
          </span>
        </div>
        <div style="margin-top: 8px; font-size: 13px; color: #4b5563;">
           Due: ${formatDate(assignment.dueDate)}
        </div>
      </li>
    `
    )
    .join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assignment Reminder</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; }
        </style>
      </head>
      <body style="background-color: #f9fafb; padding: 40px 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
          
          <!-- Minimal Header -->
          <div style="padding: 32px 32px 24px; border-bottom: 1px solid #f3f4f6;">
             <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">EduTrack</h1>
                <span style="background-color: ${badgeBg}; color: ${accentColor}; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">${badgeText}</span>
             </div>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">Hi ${userName},</p>
            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.5;">
              ${introText}
            </p>

            <!-- Assignments List -->
            <ul style="list-style: none; padding: 0; margin: 0 0 24px 0;">
              ${assignmentsList}
            </ul>

            <!-- Minimal Button -->
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/assignments" 
               style="display: block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 0; border-radius: 6px; font-weight: 500; font-size: 14px; text-align: center; transition: background-color 0.2s;">
              View Dashboard
            </a>
          </div>

          <!-- Footer -->
          <div style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} EduTrack
            </p>
          </div>

        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'EduTrack <onboarding@resend.dev>',
        to: userEmail,
        subject: subject,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API Error Body:', errorText);
      throw new Error(`Resend API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Get text color based on priority
 */
function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  const colors = {
    high: '#dc2626',    // Red 600
    medium: '#d97706',  // Amber 600
    low: '#059669',     // Emerald 600
  };
  return colors[priority];
}

/**
 * Get background color based on priority
 */
function getPriorityBg(priority: 'high' | 'medium' | 'low'): string {
  const colors = {
    high: '#fef2f2',    // Red 50
    medium: '#fffbeb',  // Amber 50
    low: '#ecfdf5',     // Emerald 50
  };
  return colors[priority];
}

/**
 * Format date to readable string
 */
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}
