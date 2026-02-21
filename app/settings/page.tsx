"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { logOut } from "@/lib/auth";
import { getUserProfile, updateEmailNotificationPreference } from "@/lib/users";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

function SettingsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Notification Settings State
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [isLoadingPreference, setIsLoadingPreference] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load user's notification preference from Firestore on mount
    useEffect(() => {
        const loadPreference = async () => {
            if (!user) return;

            try {
                const profile = await getUserProfile(user.uid);
                if (profile) {
                    setEmailNotifications(profile.emailNotifications);
                }
            } catch (error) {
                console.error("Error loading notification preference:", error);
            } finally {
                setIsLoadingPreference(false);
            }
        };

        loadPreference();
    }, [user]);

    const handleLogout = async () => {
        await logOut();
        router.push("/");
    };

    const handleToggleNotifications = async () => {
        if (!user) return;

        setIsSaving(true);
        const newValue = !emailNotifications;

        try {
            const result = await updateEmailNotificationPreference(user.uid, newValue);

            if (result.success) {
                setEmailNotifications(newValue);
                toast.success(
                    newValue
                        ? "Email reminders enabled! You'll get daily digests."
                        : "Email reminders disabled. You won't receive digest emails."
                );
            } else {
                toast.error("Failed to update preference. Please try again.");
            }
        } catch (error) {
            console.error("Error toggling notifications:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
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

    return (
        <div className="min-h-screen bg-white">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col bg-white border-r border-slate-100">
                <div className="flex flex-col flex-1 p-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-10">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                            D
                        </div>
                        <span className="font-bold text-lg text-slate-900">
                            Deadline<span className="text-primary">Tracker</span>
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">dashboard</span>
                            Dashboard
                        </Link>
                        <Link href="/assignments" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">assignment</span>
                            Assignments
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                            <span className="material-icons-outlined text-xl">settings</span>
                            Settings
                        </Link>
                    </nav>

                    {/* User Profile */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                {getInitials(user?.displayName, user?.email)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {user?.displayName || "Student"}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors w-full px-3 py-2"
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
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                                D
                            </div>
                            <span className="font-bold text-lg text-slate-900">
                                Deadline<span className="text-primary">Tracker</span>
                            </span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-900">
                            <span className="material-icons-outlined">close</span>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">dashboard</span>
                            Dashboard
                        </Link>
                        <Link href="/assignments" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">assignment</span>
                            Assignments
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                            <span className="material-icons-outlined text-xl">settings</span>
                            Settings
                        </Link>
                    </nav>

                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                {getInitials(user?.displayName, user?.email)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {user?.displayName || "Student"}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors w-full px-3 py-2"
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
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 lg:hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-500 hover:text-slate-900"
                        >
                            <span className="material-icons-outlined text-2xl">menu</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                                D
                            </div>
                            <span className="font-bold text-slate-900">
                                DeadlineTracker
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                            {getInitials(user?.displayName, user?.email)}
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-8 max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                        <p className="text-slate-500 text-sm">Manage your preferences and account</p>
                    </div>

                    <div className="space-y-6">
                        {/* Account Section */}
                        <section className="bg-white border border-slate-100 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-400">person</span>
                                Account
                            </h2>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl">
                                    {getInitials(user?.displayName, user?.email)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-lg">
                                        {user?.displayName || "Student"}
                                    </p>
                                    <p className="text-slate-500">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-outlined text-lg">logout</span>
                                Sign Out
                            </button>
                        </section>

                        {/* Notifications Section */}
                        <section className="bg-white border border-slate-100 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-400">notifications</span>
                                Email Notifications
                            </h2>

                            <div className="flex items-center justify-between py-3">
                                <div className="flex-1 mr-4">
                                    <p className="font-medium text-slate-900">Daily Assignment Digest</p>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        Receive a morning email summarizing your overdue, due today, tomorrow, and upcoming assignments.
                                    </p>
                                </div>
                                {isLoadingPreference ? (
                                    <div className="w-11 h-6 rounded-full bg-slate-100 animate-pulse" />
                                ) : (
                                    <button
                                        id="email-notifications-toggle"
                                        onClick={handleToggleNotifications}
                                        disabled={isSaving}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${emailNotifications ? 'bg-primary' : 'bg-slate-200'
                                            } ${isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                        aria-checked={emailNotifications}
                                        role="switch"
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                )}
                            </div>

                            {/* Status indicator */}
                            <div className="mt-3 pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${emailNotifications ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    <p className="text-xs text-slate-500">
                                        {isLoadingPreference
                                            ? 'Loading...'
                                            : emailNotifications
                                                ? 'Reminders active — sent daily at 8:00 AM WAT'
                                                : 'Reminders paused — you will not receive emails'}
                                    </p>
                                </div>
                            </div>

                            {/* Info box */}
                            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    <strong className="text-slate-600">How it works:</strong> Every morning, you'll receive one email with all your assignments grouped by urgency — overdue, due today, due tomorrow, and due this week. Each assignment shows its priority level (High, Medium, Low).
                                </p>
                            </div>
                        </section>

                        {/* App Info Section */}
                        <section className="bg-white border border-slate-100 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-400">info</span>
                                About
                            </h2>
                            <div className="space-y-3 text-sm text-slate-600">
                                <div className="flex justify-between">
                                    <span>Version</span>
                                    <span className="font-mono text-slate-900">1.0.0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Theme</span>
                                    <span className="text-slate-900">Light Mode</span>
                                </div>
                                <div className="pt-2">
                                    <p className="text-xs text-slate-400 text-center">
                                        &copy; 2026 DeadlineTracker. All rights reserved.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function Settings() {
    return (
        <ProtectedRoute>
            <SettingsContent />
        </ProtectedRoute>
    );
}
