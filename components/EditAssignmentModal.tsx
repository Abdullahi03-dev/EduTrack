"use client";

import { useState, useEffect } from "react";
import { updateAssignment, Assignment } from "@/lib/firestore";
import { toast } from "sonner";

interface EditAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
}

export default function EditAssignmentModal({ isOpen, onClose, assignment }: EditAssignmentModalProps) {
    const [title, setTitle] = useState("");
    const [course, setCourse] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [dueTime, setDueTime] = useState("23:59");
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Initialize state when assignment changes or modal opens
    useEffect(() => {
        if (assignment && isOpen) {
            setTitle(assignment.title);
            setCourse(assignment.course);
            setDescription(assignment.description || "");

            // Format Date
            const date = new Date(assignment.dueDate);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            setDueDate(`${yyyy}-${mm}-${dd}`);

            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            setDueTime(`${hours}:${minutes}`);

            setPriority(assignment.priority);
            setError("");
        }
    }, [assignment, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment?.id) return;

        setError("");
        setLoading(true);

        // Validation
        if (!title.trim() || !course.trim() || !dueDate) {
            setError("Please fill in all required fields");
            setLoading(false);
            return;
        }

        try {
            // Combine date and time
            const dueDateTimeString = `${dueDate}T${dueTime}`;
            const dueDateObj = new Date(dueDateTimeString);

            // Update assignment in Firestore
            const result = await updateAssignment(
                assignment.id,
                {
                    title: title.trim(),
                    course: course.trim(),
                    description: description.trim(),
                    dueDate: dueDateObj,
                    priority
                }
            );

            if (result.success) {
                toast.success("Assignment updated successfully!");
                onClose();
            } else {
                setError("Failed to update assignment. Please try again.");
                toast.error("Failed to update assignment");
            }
        } catch (err) {
            console.error("Error updating assignment:", err);
            setError("An error occurred. Please try again.");
            toast.error("An error occurred while updating assignment");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !assignment) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">
                            Edit Assignment
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <span className="material-icons-outlined">close</span>
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Assignment Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Organic Chemistry Lab Report"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all"
                                required
                            />
                        </div>

                        {/* Course */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Course Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                placeholder="e.g., CHEM 201"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Description <span className="text-slate-400 text-xs">(Optional)</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add notes, requirements, or details about this assignment..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all resize-none"
                            />
                        </div>

                        {/* Due Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Due Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 transition-all"
                                />
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Priority Level
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPriority('high')}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${priority === 'high'
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    High
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPriority('medium')}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${priority === 'medium'
                                        ? 'bg-yellow-500 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Medium
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPriority('low')}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${priority === 'low'
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Low
                                </button>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-lg">save</span>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
