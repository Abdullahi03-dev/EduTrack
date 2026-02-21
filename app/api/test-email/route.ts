import { NextRequest, NextResponse } from 'next/server';
import { sendDailyDigest } from '@/lib/email';

/**
 * Test Email Endpoint
 * Sends a sample daily digest email for testing purposes.
 * Only available in development mode.
 */
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
        const { email, name } = body;

        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email and name are required' },
                { status: 400 }
            );
        }

        // Sample data showing all 4 categories
        const now = new Date();

        const result = await sendDailyDigest({
            userEmail: email,
            userName: name,
            overdue: [
                {
                    title: 'Literature Essay Draft',
                    course: 'ENG 201',
                    dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    priority: 'high',
                },
            ],
            dueToday: [
                {
                    title: 'Calculus Problem Set #5',
                    course: 'MATH 201',
                    dueDate: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
                    priority: 'high',
                },
                {
                    title: 'Chemistry Lab Report',
                    course: 'CHEM 101',
                    dueDate: new Date(now.getTime() + 10 * 60 * 60 * 1000), // 10 hours from now
                    priority: 'medium',
                },
            ],
            dueTomorrow: [
                {
                    title: 'History Research Paper',
                    course: 'HIST 301',
                    dueDate: new Date(now.getTime() + 30 * 60 * 60 * 1000), // ~30 hours
                    priority: 'high',
                },
                {
                    title: 'Physics Worksheet',
                    course: 'PHY 102',
                    dueDate: new Date(now.getTime() + 36 * 60 * 60 * 1000), // ~36 hours
                    priority: 'low',
                },
            ],
            dueThisWeek: [
                {
                    title: 'Group Project Presentation',
                    course: 'BUS 401',
                    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
                    priority: 'medium',
                },
                {
                    title: 'Biology Lab Analysis',
                    course: 'BIO 201',
                    dueDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days
                    priority: 'low',
                },
            ],
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Test digest email sent to ${email}`,
                data: result.data,
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to send email', details: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in test email:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
