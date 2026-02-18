import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendAssignmentReminder } from '@/lib/email';
import { Assignment } from '@/lib/firestore';

/**
 * Cron Job API Route - Smart Assignment Reminders
 * 
 * Logic:
 * - Runs every hour
 * - High Priority: Sends email 24h before (Day Before) AND Morning of due date
 * - Medium Priority: Sends email Morning of due date
 * - Low Priority: Sends email 2 hours before deadline
 * 
 * Timezone assumption: UTC+1 (West Africa Time) for "Morning" check (8 AM)
 */
export async function GET(request: NextRequest) {
    try {
        // Security: Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Starting smart assignment reminder check...');

        const now = new Date();
        // Look ahead 48 hours to catch "Day Before" reminders
        const futureWindow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // Query assignments due in the next 48 hours that are not completed
        // Note: You might need to update your Firestore Index to support this wider range if needed
        const assignmentsRef = collection(db, 'assignments');
        const q = query(
            assignmentsRef,
            where('completed', '==', 'false'), // Note: Ensure this matches your firestore type (boolean vs string)
            where('dueDate', '>=', Timestamp.fromDate(now)),
            where('dueDate', '<=', Timestamp.fromDate(futureWindow))
        );

        /* 
         * TEST MODE: IMMEDIATE ALERT
         * Checks for High Priority assignments created in the last 15 minutes.
         * Uncomment to enable "Rapid Testing" on production.
         */
        // const testWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago
        // const testQ = query(
        //     assignmentsRef,
        //     where('priority', '==', 'high'),
        //     where('createdAt', '>=', Timestamp.fromDate(testWindow))
        // );
        // const testSnapshot = await getDocs(testQ);
        // if (!testSnapshot.empty) {
        //     console.log('TEST MODE: Found recently created high priority assignments');
        //     // Merge these into the main results or process them separately
        //     // For simplicity in this test, we can just process them using the same loop below
        //     // by adding them to querySnapshot.docs (if possible) or handling logic here.
        // }

        // END TEST MODE 

        const querySnapshot = await getDocs(q);

        // Group assignments by type and user
        // We might send multiple emails to the same user if they have different types of reminders
        const remindersToSend: Map<string, {
            email: string;
            name: string;
            type: 'morning' | 'tomorrow' | 'urgent';
            assignments: Assignment[];
        }> = new Map();

        // Helper to generate a unique key for grouping (UserId + Type)
        const getKey = (userId: string, type: string) => `${userId}-${type}`;

        // Get current hour in UTC+1 (Nigeria/West Africa)
        // new Date().getUTCHours() returns UTC hour. Add 1 for WAT.
        // 8 AM WAT = 7 AM UTC
        const currentHourUTC = now.getUTCHours();
        const isMorningCheck = currentHourUTC === 7; // 7 AM UTC = 8 AM WAT

        // Process each assignment
        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
            const dueDate = data.dueDate.toDate();
            const timeDiffMs = dueDate.getTime() - now.getTime();
            const hoursLeft = timeDiffMs / (1000 * 60 * 60);
            const minutesSinceCreation = data.createdAt ? (now.getTime() - data.createdAt.toDate().getTime()) / (1000 * 60) : 999999;

            let reminderType: 'morning' | 'tomorrow' | 'urgent' | null = null;

            // NEW ASSIGNMENT ALERT (Test Mechanism)
            // If High Priority & Created < 60 mins ago -> Send Immediate Confirmation
            if (data.priority === 'high' && minutesSinceCreation < 60) {
                reminderType = 'urgent'; // Triggers immediate email
            }

            // SMART PRIORITY LOGIC (Standard Rules)
            else if (data.priority === 'high') {
                // High Priority Logic
                if (hoursLeft >= 23 && hoursLeft <= 25) {
                    reminderType = 'tomorrow'; // Day before (~24h)
                } else if (hoursLeft < 24 && isMorningCheck) {
                    reminderType = 'morning'; // Morning of due date
                }
            } else if (data.priority === 'medium') {
                // Medium Priority Logic
                if (hoursLeft < 24 && isMorningCheck) {
                    reminderType = 'morning'; // Morning of due date
                }
            } else if (data.priority === 'low') {
                // Low Priority Logic
                if (hoursLeft >= 1.5 && hoursLeft <= 2.5) {
                    reminderType = 'urgent'; // ~2 hours before
                }
            }

            // If a rule matched, add to list
            if (reminderType) {
                const userInfo = await getUserInfo(data.userId);

                if (userInfo && userInfo.email) {
                    const key = getKey(data.userId, reminderType);

                    if (!remindersToSend.has(key)) {
                        remindersToSend.set(key, {
                            email: userInfo.email,
                            name: userInfo.name || 'Student',
                            type: reminderType,
                            assignments: [],
                        });
                    }

                    // Manual mapping
                    const assignment: Assignment = {
                        id: docSnapshot.id,
                        userId: data.userId,
                        title: data.title,
                        course: data.course,
                        description: data.description || '',
                        dueDate: dueDate,
                        priority: data.priority,
                        completed: data.completed,
                        createdAt: data.createdAt?.toDate(),
                    };

                    remindersToSend.get(key)!.assignments.push(assignment);
                }
            }
        }

        // Send emails
        const emailResults = [];
        for (const [key, data] of remindersToSend) {
            console.log(`Sending '${data.type}' reminder to ${data.email} with ${data.assignments.length} assignments`);

            const result = await sendAssignmentReminder({
                userEmail: data.email,
                userName: data.name,
                assignments: data.assignments,
                type: data.type,
            });

            emailResults.push({
                email: data.email,
                type: data.type,
                count: data.assignments.length,
                success: result.success,
                error: result.error ? String(result.error) : undefined
            });
        }

        console.log('Cron job completed successfully');

        return NextResponse.json({
            success: true,
            message: 'Smart reminders processed',
            stats: {
                totalAssignmentsChecked: querySnapshot.size,
                emailsSent: emailResults.filter(r => r.success).length,
                typesTriggered: emailResults.map(r => r.type),
            },
            results: emailResults,
        });

    } catch (error: any) {
        console.error('Error in cron job:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message || 'Unknown error',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

/**
 * Get user information from Firestore users collection
 */
async function getUserInfo(userId: string): Promise<{ email: string; name: string; emailNotifications: boolean } | null> {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.emailNotifications === false) return null;
            return {
                email: data.email,
                name: data.name || 'Student',
                emailNotifications: data.emailNotifications ?? true
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}
