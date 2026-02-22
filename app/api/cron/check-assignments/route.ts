import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendDailyDigest } from '@/lib/email';


export async function GET(request: NextRequest) {
    try {
        // Security: Verify cron secret (Vercel sends this automatically for cron jobs)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const now = new Date();
        console.log(`Daily Digest cron started at ${now.toISOString()}`);

        // ============================================================
        // Time boundaries (all in UTC, displayed in WAT = UTC+1)
        // ============================================================

        // "Today" in WAT: We consider assignments due from now until end of today
        const todayStart = new Date(now);
        const todayEnd = new Date(now);
        todayEnd.setUTCHours(23, 59, 59, 999);

        // "Tomorrow" in WAT
        const tomorrowStart = new Date(todayEnd.getTime() + 1);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setUTCHours(23, 59, 59, 999);

        // "This Week" = day after tomorrow through 7 days from now
        const weekStart = new Date(tomorrowEnd.getTime() + 1);
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // "Overdue" = anything before now that isn't completed
        // Look back up to 30 days to catch long-overdue assignments
        const overdueStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // ============================================================
        // Query Firestore for ALL incomplete assignments (using Admin SDK)
        // ============================================================
        // We need to get everything from overdueStart to weekEnd
        const assignmentsRef = adminDb.collection('assignments');
        const snapshot = await assignmentsRef
            .where('completed', '==', false)
            .where('dueDate', '>=', overdueStart)
            .where('dueDate', '<=', weekEnd)
            .get();

        console.log(` Found ${snapshot.size} incomplete assignments in the next 7 days + overdue`);

        if (snapshot.empty) {
            console.log('No assignments to report. Exiting.');
            return NextResponse.json({
                success: true,
                message: 'No assignments found — no emails to send',
                stats: { totalChecked: 0, emailsSent: 0 },
            });
        }

        // ============================================================
        // Group assignments by user, then by category
        // ============================================================
        interface AssignmentEntry {
            title: string;
            course: string;
            dueDate: Date;
            priority: 'high' | 'medium' | 'low';
        }

        interface UserDigest {
            userId: string;
            overdue: AssignmentEntry[];
            dueToday: AssignmentEntry[];
            dueTomorrow: AssignmentEntry[];
            dueThisWeek: AssignmentEntry[];
        }

        const userDigests: Map<string, UserDigest> = new Map();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const dueDate: Date = data.dueDate.toDate();
            const userId: string = data.userId;

            // Initialize user digest if not exists
            if (!userDigests.has(userId)) {
                userDigests.set(userId, {
                    userId,
                    overdue: [],
                    dueToday: [],
                    dueTomorrow: [],
                    dueThisWeek: [],
                });
            }

            const entry: AssignmentEntry = {
                title: data.title,
                course: data.course,
                dueDate,
                priority: data.priority,
            };

            // Categorize the assignment
            if (dueDate < now) {
                // Overdue
                userDigests.get(userId)!.overdue.push(entry);
            } else if (dueDate >= now && dueDate <= todayEnd) {
                // Due today
                userDigests.get(userId)!.dueToday.push(entry);
            } else if (dueDate >= tomorrowStart && dueDate <= tomorrowEnd) {
                // Due tomorrow
                userDigests.get(userId)!.dueTomorrow.push(entry);
            } else if (dueDate >= weekStart && dueDate <= weekEnd) {
                // Due this week
                userDigests.get(userId)!.dueThisWeek.push(entry);
            }
        }

        console.log(`${userDigests.size} user(s) have assignments to report`);

        // ============================================================
        // Look up user info and send emails
        // ============================================================
        const emailResults = [];

        for (const [userId, digest] of userDigests) {
            const totalForUser = digest.overdue.length + digest.dueToday.length + digest.dueTomorrow.length + digest.dueThisWeek.length;

            if (totalForUser === 0) continue;

            // Get user info from Firestore (Admin SDK)
            const userInfo = await getUserInfo(userId);

            if (!userInfo) {
                console.log(`  Skipping user ${userId}: profile not found`);
                continue;
            }

            if (!userInfo.emailNotifications) {
                console.log(`  Skipping ${userInfo.email}: notifications disabled`);
                continue;
            }

            console.log(`  Sending digest to ${userInfo.email}:`);
            console.log(`     Overdue: ${digest.overdue.length}`);
            console.log(`     Due Today: ${digest.dueToday.length}`);
            console.log(`     Due Tomorrow: ${digest.dueTomorrow.length}`);
            console.log(`     This Week: ${digest.dueThisWeek.length}`);

            try {
                const result = await sendDailyDigest({
                    userEmail: userInfo.email,
                    userName: userInfo.name,
                    overdue: digest.overdue,
                    dueToday: digest.dueToday,
                    dueTomorrow: digest.dueTomorrow,
                    dueThisWeek: digest.dueThisWeek,
                });

                emailResults.push({
                    email: userInfo.email,
                    success: result.success,
                    skipped: result.skipped || false,
                    stats: {
                        overdue: digest.overdue.length,
                        dueToday: digest.dueToday.length,
                        dueTomorrow: digest.dueTomorrow.length,
                        dueThisWeek: digest.dueThisWeek.length,
                    },
                });
            } catch (emailError) {
                console.error(`  Failed to send to ${userInfo.email}:`, emailError);
                emailResults.push({
                    email: userInfo.email,
                    success: false,
                    error: String(emailError),
                });
            }
        }

        const sent = emailResults.filter(r => r.success).length;
        const failed = emailResults.filter(r => !r.success).length;

        console.log(`\nCron completed: ${sent} emails sent, ${failed} failed`);

        return NextResponse.json({
            success: true,
            message: 'Daily digest processed',
            stats: {
                totalAssignmentsChecked: snapshot.size,
                usersProcessed: userDigests.size,
                emailsSent: sent,
                emailsFailed: failed,
            },
            results: emailResults,
        });

    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Get user info using Firebase Admin SDK (bypasses security rules)
 */
async function getUserInfo(userId: string): Promise<{
    email: string;
    name: string;
    emailNotifications: boolean;
} | null> {
    try {
        const userDoc = await adminDb.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return null;
        }

        const data = userDoc.data()!;
        return {
            email: data.email || '',
            name: data.name || 'Student',
            emailNotifications: data.emailNotifications !== false, // default true
        };
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
}
