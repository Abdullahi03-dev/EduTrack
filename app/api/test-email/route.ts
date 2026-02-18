import { NextRequest, NextResponse } from 'next/server';
import { sendAssignmentReminder } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        // Security: Only allow in development
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
                { error: 'Test endpoint disabled in production' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { email, name, type = 'morning' } = body;

        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email and name are required' },
                { status: 400 }
            );
        }

        // Sample assignments for testing
        const sampleAssignments = [
            {
                title: 'Calculus Problem Set #5',
                course: 'MATH 201',
                dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
                priority: 'high' as const,
            },
            {
                title: 'Chemistry Lab Report',
                course: 'CHEM 101',
                dueDate: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
                priority: 'medium' as const,
            },
            {
                title: 'History Essay Draft',
                course: 'HIST 301',
                dueDate: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23 hours from now
                priority: 'low' as const,
            },
        ];

        console.log(`Sending test email to ${email}...`);

        const result = await sendAssignmentReminder({
            userEmail: email,
            userName: name,
            assignments: sampleAssignments,
            type: type as 'morning' | 'tomorrow' | 'urgent',
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Test email sent successfully to ${email}`,
                data: result.data,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to send email',
                    details: result.error,
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error(' Error in test email endpoint:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
