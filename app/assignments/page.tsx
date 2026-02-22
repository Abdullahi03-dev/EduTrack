"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { logOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { subscribeToAssignments, toggleAssignmentStatus, deleteAssignment, Assignment } from "@/lib/firestore";
import AddAssignmentModal from "@/components/AddAssignmentModal";
import EditAssignmentModal from "@/components/EditAssignmentModal";
import AssignmentCard from "@/components/AssignmentCard";
import { toast } from "sonner";

function AssignmentsContent() {
    const { user } = useAuth();
    const router = useRouter();

    // State management
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit & Delete State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);

    // Filter and search state
    const [filter, setFilter] = useState<'today' | 'week' | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Subscribe to real-time Firestore updates
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToAssignments(user.uid, (data) => {
            setAssignments(data);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [user]);

    // Memoized handlers to prevent re-creation on every render
    const handleLogout = useCallback(async () => {
        await logOut();
        router.push("/");
    }, [router]);

    const handleToggleStatus = useCallback(async (id: string | undefined, currentStatus: boolean) => {
        if (!id) return;
        try {
            await toggleAssignmentStatus(id, currentStatus);
            toast.success(currentStatus ? "Assignment marked as incomplete" : "Assignment completed!");
        } catch (error) {
            toast.error("Failed to update assignment status");
            console.error(error);
        }
    }, []);

    const handleDelete = useCallback(async (id: string | undefined) => {
        if (!id) return;

        toast.custom((t) => (
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 max-w-md">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="material-icons-outlined text-red-600 text-xl">warning</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">Delete Assignment?</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            This action cannot be undone. The assignment will be permanently deleted.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    toast.dismiss(t);
                                }}
                                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    toast.dismiss(t);
                                    try {
                                        await deleteAssignment(id);
                                        toast.success("Assignment deleted successfully");
                                    } catch (error) {
                                        toast.error("Failed to delete assignment");
                                        console.error(error);
                                    }
                                }}
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ), {
            duration: Infinity,
            position: 'top-center',
        });
    }, []);

    const handleEditOpen = useCallback((assignment: Assignment) => {
        setAssignmentToEdit(assignment);
        setIsEditModalOpen(true);
    }, []);

    const getInitials = useCallback((name: string | null | undefined, email: string | null | undefined) => {
        if (name) {
            return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return "U";
    }, []);

    // Memoized helper functions
    const getStatus = useCallback((assignment: Assignment) => {
        if (assignment.completed) return 'Completed';
        const now = new Date();
        const diff = assignment.dueDate.getTime() - now.getTime();
        const hoursDiff = diff / (1000 * 60 * 60);

        if (diff < 0) return 'Overdue';
        if (hoursDiff <= 24) return 'Due Soon';
        return 'Pending';
    }, []);

    const formatDate = useCallback((date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }, []);

    // Memoized filtering logic - only recalculates when dependencies change
    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            // Search Filter (searches title, course, and description)
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                assignment.title.toLowerCase().includes(searchLower) ||
                assignment.course.toLowerCase().includes(searchLower) ||
                (assignment.description && assignment.description.toLowerCase().includes(searchLower));

            if (!matchesSearch) return false;

            // Time Filter
            const now = new Date();
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

            if (filter === 'today') {
                // Show overdue items + items due today
                return assignment.dueDate <= endOfToday;
            }
            if (filter === 'week') {
                // Show overdue items + items due within next 7 days
                return assignment.dueDate <= endOfWeek;
            }
            return true;
        });
    }, [assignments, searchQuery, filter]);

    return (
        <div className="min-h-screen bg-white">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col bg-white border-r border-slate-100">
                <div className="flex flex-col flex-1 p-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-10">
                        <Image src="/edutracker.jpg" alt="EduTracker Logo" width={32} height={32} className="rounded-lg object-cover" />
                        <span className="font-bold text-lg text-slate-900">
                            Edu<span className="text-primary">Tracker</span>
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">dashboard</span>
                            Dashboard
                        </Link>
                        <Link href="/assignments" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                            <span className="material-icons-outlined text-xl">assignment</span>
                            Assignments
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
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
                            <Image src="/edutracker.jpg" alt="EduTracker Logo" width={32} height={32} className="rounded-lg object-cover" />
                            <span className="font-bold text-lg text-slate-900">
                                Edu<span className="text-primary">Tracker</span>
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
                        <Link href="/assignments" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                            <span className="material-icons-outlined text-xl">assignment</span>
                            Assignments
                        </Link>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                            <span className="material-icons-outlined text-xl">settings</span>
                            Settings
                        </a>
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
                            <Image src="/edutracker.jpg" alt="EduTracker Logo" width={28} height={28} className="rounded-lg object-cover" />
                            <span className="font-bold text-slate-900">EduTracker</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                            {getInitials(user?.displayName, user?.email)}
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-8 max-w-5xl mx-auto">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
                            <p className="text-slate-500 text-sm">Manage and track your academic tasks</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-primary/20"
                        >
                            <span className="material-icons-outlined">add</span>
                            Add Assignment
                        </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined">search</span>
                            <input
                                type="text"
                                placeholder="Search assignments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 transition-all"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
                            <button
                                onClick={() => setFilter('today')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setFilter('week')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                All
                            </button>
                        </div>
                    </div>

                    {/* Filter Status Info */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                        <span>Showing {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-12">
                            <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <p className="text-slate-600">Loading assignments...</p>
                        </div>
                    )}

                    {/* Assignment List */}
                    {!loading && (
                        <div className="space-y-3">
                            {filteredAssignments.map((assignment) => (
                                <AssignmentCard
                                    key={assignment.id}
                                    assignment={assignment}
                                    onToggleStatus={handleToggleStatus}
                                    onEdit={handleEditOpen}
                                    onDelete={handleDelete}
                                    getStatus={getStatus}
                                    formatDate={formatDate}
                                />
                            ))}

                            {filteredAssignments.length === 0 && !loading && (
                                <div className="text-center py-12 px-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-icons-outlined text-3xl text-slate-300">assignment</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">No assignments found</h3>
                                    <p className="text-slate-500 mb-4">
                                        {searchQuery || filter !== 'all'
                                            ? 'Try adjusting your search or filters'
                                            : 'Get started by adding your first assignment!'}
                                    </p>
                                    {!searchQuery && filter === 'all' && (
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            <span className="material-icons-outlined">add</span>
                                            Add Your First Assignment
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Assignment Modal */}
            <AddAssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={user?.uid || ''}
            />

            {/* Edit Assignment Modal */}
            <EditAssignmentModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                assignment={assignmentToEdit}
            />
        </div>
    );
}

export default function Assignments() {
    return (
        <ProtectedRoute>
            <AssignmentsContent />
        </ProtectedRoute>
    );
}
