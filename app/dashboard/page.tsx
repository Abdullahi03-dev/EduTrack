"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { logOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeToAssignments, toggleAssignmentStatus, Assignment } from "@/lib/firestore";
import AddAssignmentModal from "@/components/AddAssignmentModal";

function DashboardContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Subscribe to real-time Firestore updates
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToAssignments(user.uid, (data) => {
            setAssignments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await logOut();
        router.push("/");
    };

    const handleToggleStatus = async (id: string | undefined, currentStatus: boolean) => {
        if (!id) return;
        await toggleAssignmentStatus(id, currentStatus);
    };

    const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
        if (name) {
            return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return "U";
    };

    // Calculate stats from real data
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const thisWeekCount = assignments.filter(a =>
        !a.completed && a.dueDate >= now && a.dueDate <= weekEnd
    ).length;

    const completedCount = assignments.filter(a => a.completed).length;

    const overdueCount = assignments.filter(a =>
        !a.completed && a.dueDate < now
    ).length;

    // Get upcoming assignments (not completed, sorted by due date)
    const upcomingAssignments = assignments
        .filter(a => !a.completed)
        .slice(0, 4); // Show max 4 on dashboard

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
                <div className="flex flex-col flex-1 p-6">
                    <div className="flex items-center gap-2 mb-10">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                            D
                        </div>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">
                            Deadline<span className="text-primary">Tracker</span>
                        </span>
                    </div>

                    <nav className="flex-1 space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                            <span className="material-icons-outlined text-xl">dashboard</span>
                            Dashboard
                        </Link>
                        <Link href="/assignments" className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">assignment</span>
                            Assignments
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">settings</span>
                            Settings
                        </Link>
                    </nav>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                {getInitials(user?.displayName, user?.email)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {user?.displayName || "Student"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-full px-3 py-2"
                        >
                            <span className="material-icons-outlined text-lg">logout</span>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-xl z-50 transform transition-transform duration-300 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                                D
                            </div>
                            <span className="font-bold text-lg text-slate-900 dark:text-white">
                                Deadline<span className="text-primary">Tracker</span>
                            </span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <span className="material-icons-outlined">close</span>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                            <span className="material-icons-outlined text-xl">dashboard</span>
                            Dashboard
                        </Link>
                        <Link href="/assignments" className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">assignment</span>
                            Assignments
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">settings</span>
                            Settings
                        </Link>
                    </nav>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                {getInitials(user?.displayName, user?.email)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {user?.displayName || "Student"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-full px-3 py-2"
                        >
                            <span className="material-icons-outlined text-lg">logout</span>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 lg:hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                            <span className="material-icons-outlined text-2xl">menu</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                                D
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">
                                DeadlineTracker
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                            {getInitials(user?.displayName, user?.email)}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            Welcome back, {user?.displayName || user?.email?.split("@")[0] || "Student"}!
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {loading ? "Loading..." : `You have ${thisWeekCount} assignment${thisWeekCount !== 1 ? 's' : ''} due this week`}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {/* This Week */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="material-icons-outlined text-primary text-xl">calendar_today</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">This Week</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                {loading ? "..." : thisWeekCount}
                            </p>
                        </div>

                        {/* Completed */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <span className="material-icons-outlined text-green-600 text-xl">check_circle</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Completed</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                {loading ? "..." : completedCount}
                            </p>
                        </div>

                        {/* Overdue */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <span className="material-icons-outlined text-red-500 text-xl">warning</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Overdue</p>
                            <p className="text-3xl font-bold text-red-500">
                                {loading ? "..." : overdueCount}
                            </p>
                        </div>
                    </div>

                    {/* Assignments Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Due Soon</h2>
                            <Link href="/assignments" className="text-sm text-primary hover:text-primary-dark font-medium">
                                View all
                            </Link>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <p className="text-slate-600 dark:text-slate-400">Loading assignments...</p>
                            </div>
                        ) : upcomingAssignments.length === 0 ? (
                            <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-icons-outlined text-3xl text-slate-300">assignment</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No assignments yet</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-4">
                                    Get started by adding your first assignment!
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <span className="material-icons-outlined">add</span>
                                    Add Assignment
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingAssignments.map((assignment) => {
                                    const priorityColor = {
                                        high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
                                        medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
                                        low: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                    }[assignment.priority];

                                    const priorityDot = {
                                        high: 'bg-red-500',
                                        medium: 'bg-yellow-500',
                                        low: 'bg-green-500'
                                    }[assignment.priority];

                                    return (
                                        <div key={assignment.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-primary/30 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            {assignment.course}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${priorityColor}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`}></span>
                                                            {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                                        {assignment.title}
                                                    </h3>
                                                    {assignment.description && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 line-clamp-1">
                                                            {assignment.description}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <span className="material-icons-outlined text-sm">event</span>
                                                        {formatDate(assignment.dueDate)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleStatus(assignment.id, assignment.completed)}
                                                    className="flex-shrink-0 w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary hover:text-white text-slate-400 transition-colors flex items-center justify-center"
                                                >
                                                    <span className="material-icons-outlined text-xl">done</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center lg:hidden"
            >
                <span className="material-icons-outlined text-2xl">add</span>
            </button>

            {/* Add Assignment Modal */}
            <AddAssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={user?.uid || ''}
            />
        </div>
    );
}

export default function Dashboard() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
