/**
 * Email Service using Resend
 * Handles sending daily digest emails for assignment reminders.
 */

interface AssignmentForEmail {
  title: string;
  course: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
}

interface DailyDigestData {
  userEmail: string;
  userName: string;
  overdue: AssignmentForEmail[];
  dueToday: AssignmentForEmail[];
  dueTomorrow: AssignmentForEmail[];
  dueThisWeek: AssignmentForEmail[];
}

/**
 * Send a comprehensive daily digest email.
 * Groups assignments into Overdue, Due Today, Due Tomorrow, and Due This Week.
 */
export async function sendDailyDigest(data: DailyDigestData) {
  const { userEmail, userName, overdue, dueToday, dueTomorrow, dueThisWeek } = data;

  const totalCount = overdue.length + dueToday.length + dueTomorrow.length + dueThisWeek.length;

  if (totalCount === 0) {
    return { success: true, skipped: true, reason: 'No assignments to report' };
  }

  // Build subject line
  let subject = 'Your Daily Assignment Digest';
  if (overdue.length > 0) {
    subject = `${overdue.length} Overdue + ${dueToday.length + dueTomorrow.length + dueThisWeek.length} upcoming assignments`;
  } else if (dueToday.length > 0) {
    subject = `${dueToday.length} due today + ${dueTomorrow.length + dueThisWeek.length} upcoming`;
  }

  // Build each section
  const sections: string[] = [];

  if (overdue.length > 0) {
    sections.push(buildSection(
      'Overdue',
      'These assignments are past their deadline!',
      '#DC2626', '#FEF2F2',
      overdue,
      true
    ));
  }

  if (dueToday.length > 0) {
    sections.push(buildSection(
      'Due Today',
      'Complete these before end of day.',
      '#D97706', '#FFFBEB',
      dueToday,
      false
    ));
  }

  if (dueTomorrow.length > 0) {
    sections.push(buildSection(
      'Due Tomorrow',
      'Get a head start on these.',
      '#7C3AED', '#F5F3FF',
      dueTomorrow,
      false
    ));
  }

  if (dueThisWeek.length > 0) {
    sections.push(buildSection(
      'Due This Week',
      'Plan ahead for these upcoming deadlines.',
      '#2563EB', '#EFF6FF',
      dueThisWeek,
      false
    ));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Assignment Digest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 560px; margin: 0 auto; padding: 40px 16px;">
          
          <!-- Header Card -->
          <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 16px;">
            <div style="padding: 28px 28px 20px; border-bottom: 1px solid #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">EduTrack</h1>
                  </td>
                  <td align="right">
                    <span style="background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">Daily Digest</span>
                  </td>
                </tr>
              </table>
            </div>
            <div style="padding: 28px;">
              <p style="margin: 0 0 6px 0; font-size: 18px; font-weight: 600; color: #111827;">Good morning, ${userName}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Here's your assignment overview — <strong>${totalCount} assignment${totalCount !== 1 ? 's' : ''}</strong> need your attention.
              </p>
            </div>
          </div>

          <!-- Assignment Sections -->
          ${sections.join('\n')}

          <!-- CTA Button -->
          <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 16px; text-align: center;">
            <a href="${appUrl}/assignments" 
               style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Open Dashboard →
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 16px;">
            <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} EduTrack — Assignment reminders sent daily.
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
              To stop receiving these emails, disable notifications in <a href="${appUrl}/settings" style="color: #6b7280;">Settings</a>.
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
      console.error('Resend API Error:', errorText);
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Email sent to ${userEmail}:`, result);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error);
    return { success: false, error };
  }
}

// ============================================================
// Helper functions
// ============================================================

function buildSection(
  title: string,
  subtitle: string,
  accentColor: string,
  accentBg: string,
  assignments: AssignmentForEmail[],
  isOverdue: boolean
): string {
  // Sort: high → medium → low
  const sorted = [...assignments].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  const items = sorted.map(a => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td>
              <strong style="display: block; color: #111827; font-size: 14px; margin-bottom: 2px;">${a.title}</strong>
              <span style="color: #6b7280; font-size: 12px;">${a.course}</span>
            </td>
            <td align="right" valign="top" style="white-space: nowrap;">
              <span style="font-size: 11px; font-weight: 600; color: ${getPriorityColor(a.priority)}; background-color: ${getPriorityBg(a.priority)}; padding: 2px 8px; border-radius: 4px;">${a.priority.charAt(0).toUpperCase() + a.priority.slice(1)}</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 4px;">
              <span style="font-size: 12px; color: ${isOverdue ? '#DC2626' : '#6b7280'};">
                ${isOverdue ? 'Was due: ' : 'Due: '}${formatDate(a.dueDate)}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
    <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 16px;">
      <div style="padding: 16px 20px; background-color: ${accentBg}; border-bottom: 1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td>
              <strong style="font-size: 15px; color: ${accentColor};">${title}</strong>
              <span style="display: block; font-size: 12px; color: #6b7280; margin-top: 2px;">${subtitle}</span>
            </td>
            <td align="right" valign="top">
              <span style="background-color: ${accentColor}; color: #ffffff; font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 9999px;">${assignments.length}</span>
            </td>
          </tr>
        </table>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${items}
      </table>
    </div>
  `;
}

function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  const colors = { high: '#dc2626', medium: '#d97706', low: '#059669' };
  return colors[priority];
}

function getPriorityBg(priority: 'high' | 'medium' | 'low'): string {
  const colors = { high: '#fef2f2', medium: '#fffbeb', low: '#ecfdf5' };
  return colors[priority];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
