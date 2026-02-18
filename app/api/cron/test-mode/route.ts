import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendAssignmentReminder } from '@/lib/email';
import { Assignment } from '@/lib/firestore';


export async function GET(request: NextRequest) {
    try {
        // Security: Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Allow bypassing auth in development if needed
        if (process.env.NODE_ENV === 'production' && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Starting TEST MODE check...');

        const now = new Date();
        const testWindow = new Date(now.getTime() - 15 * 60 * 1000); // 15 mins ago

        // Query assignments created recently + High Priority
        const assignmentsRef = collection(db, 'assignments');
        const q = query(
            assignmentsRef,
            where('priority', '==', 'high'),
            where('createdAt', '>=', Timestamp.fromDate(testWindow))
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(' No recently created high priority assignments found.');
            return NextResponse.json({ message: 'No new high priority assignments found in last 15 mins' });
        }

        // Group by user
        const remindersToSend: Map<string, { email: string; name: string; assignments: Assignment[] }> = new Map();

        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();

            const userInfo = await getUserInfo(data.userId);
            if (userInfo && userInfo.email) {
                if (!remindersToSend.has(data.userId)) {
                    remindersToSend.set(data.userId, {
                        email: userInfo.email,
                        name: userInfo.name || 'Student',
                        assignments: [],
                    });
                }

                const assignment: Assignment = {
                    id: docSnapshot.id,
                    userId: data.userId,
                    title: data.title,
                    course: data.course,
                    description: data.description || '',
                    dueDate: data.dueDate.toDate(),
                    priority: data.priority,
                    completed: data.completed,
                    createdAt: data.createdAt?.toDate(),
                };

                remindersToSend.get(data.userId)!.assignments.push(assignment);
            }
        }

        // Send emails
        const emailResults = [];
        for (const [userId, data] of remindersToSend) {
            console.log(` Sending TEST alert to ${data.email}`);

            const result = await sendAssignmentReminder({
                userEmail: data.email,
                userName: data.name,
                assignments: data.assignments,
                type: 'urgent', // Always send as Urgent for this test
            });

            emailResults.push({
                email: data.email,
                count: data.assignments.length,
                success: result.success,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Test alerts processed',
            results: emailResults,
        });

    } catch (error: any) {
        console.error('Error in test job:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

async function getUserInfo(userId: string) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.emailNotifications === false) return null;
            return { email: data.email, name: data.name || 'Student' };
        }
        return null; // For testing, assume checking users works
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}
