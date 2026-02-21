import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendDailyDigest } from '@/lib/email';

/**
 * TEST MODE: Trigger a digest email for recently created high-priority assignments.
 * Uses Firebase Admin SDK (bypasses Firestore security rules).
 * 
 * This endpoint is for testing the email system manually.
 * In development, you can bypass auth. In production, requires CRON_SECRET.
 */
export async function GET(request: NextRequest) {
    try {
        // Security: Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (process.env.NODE_ENV === 'production' && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🧪 Starting TEST MODE...');

        const now = new Date();
        const testWindow = new Date(now.getTime() - 60 * 60 * 1000); // Last 1 hour

        // Get recent incomplete assignments
        const snapshot = await adminDb.collection('assignments')
            .where('completed', '==', false)
            .where('createdAt', '>=', testWindow)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({
                message: 'No assignments created in the last hour',
                hint: 'Create a new assignment and try again',
            });
        }

        // Group by user
        const userAssignments: Map<string, {
            title: string;
            course: string;
            dueDate: Date;
            priority: 'high' | 'medium' | 'low';
        }[]> = new Map();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const userId = data.userId;

            if (!userAssignments.has(userId)) {
                userAssignments.set(userId, []);
            }

            userAssignments.get(userId)!.push({
                title: data.title,
                course: data.course,
                dueDate: data.dueDate.toDate(),
                priority: data.priority,
            });
        }

        const emailResults = [];

        for (const [userId, assignments] of userAssignments) {
            const userDoc = await adminDb.collection('users').doc(userId).get();

            if (!userDoc.exists) {
                console.log(`⏭️ User ${userId} not found, skipping`);
                continue;
            }

            const userData = userDoc.data()!;

            if (userData.emailNotifications === false) {
                console.log(`⏭️ ${userData.email} has notifications off, skipping`);
                continue;
            }

            console.log(`📧 Sending test digest to ${userData.email}`);

            const result = await sendDailyDigest({
                userEmail: userData.email,
                userName: userData.name || 'Student',
                overdue: [],
                dueToday: assignments,
                dueTomorrow: [],
                dueThisWeek: [],
            });

            emailResults.push({
                email: userData.email,
                success: result.success,
                count: assignments.length,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Test digest emails processed',
            results: emailResults,
        });

    } catch (error: any) {
        console.error('❌ Test mode error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
