import { memo } from "react";
import { Assignment } from "@/lib/firestore";

interface AssignmentCardProps {
    assignment: Assignment;
    onToggleStatus: (id: string | undefined, currentStatus: boolean) => void;
    onEdit: (assignment: Assignment) => void;
    onDelete: (id: string | undefined) => void;
    getStatus: (assignment: Assignment) => string;
    formatDate: (date: Date) => string;
}

const AssignmentCard = memo(function AssignmentCard({
    assignment,
    onToggleStatus,
    onEdit,
    onDelete,
    getStatus,
    formatDate
}: AssignmentCardProps) {
    const status = getStatus(assignment);

    // Derived styles
    const priorityConfig = {
        high: { color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
        medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
        low: { color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' }
    }[assignment.priority];

    const statusConfig = {
        'Completed': 'text-slate-500 bg-slate-100',
        'Overdue': 'text-red-600 bg-red-50',
        'Due Soon': 'text-orange-600 bg-orange-50',
        'Pending': 'text-blue-600 bg-blue-50'
    }[status];

    return (
        <div className={`group bg-white border border-slate-100 rounded-xl p-4 transition-all hover:shadow-sm ${assignment.completed ? 'opacity-60' : ''}`}>
            {/* Header: Course & Status */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                        {assignment.course}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig}`}>
                        {status}
                    </span>
                </div>
                {/* Priority Dot (Minimalist) */}
                <div className="flex items-center gap-1.5" title={`${assignment.priority} priority`}>
                    <span className={`w-2 h-2 rounded-full ${priorityConfig.dot}`}></span>
                    <span className="text-xs text-slate-400 capitalize md:inline hidden">{assignment.priority}</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="mb-3">
                <h3 className={`text-base font-semibold text-slate-900 mb-1 ${assignment.completed ? 'line-through decoration-slate-400' : ''}`}>
                    {assignment.title}
                </h3>

                {/* Description */}
                {assignment.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                        {assignment.description}
                    </p>
                )}
            </div>

            {/* Footer: Date & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                {/* Due Date */}
                <div className={`flex items-center gap-1.5 text-xs font-medium ${status === 'Overdue' ? 'text-red-500' : 'text-slate-500'}`}>
                    <span className="material-icons-outlined text-base">event</span>
                    {formatDate(assignment.dueDate)}
                </div>

                {/* Minimalist Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(assignment); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Edit"
                    >
                        <span className="material-icons-outlined text-lg">edit</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(assignment.id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete"
                    >
                        <span className="material-icons-outlined text-lg">delete</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleStatus(assignment.id, assignment.completed); }}
                        className={`ml-1 p-1.5 rounded-lg border transition-all ${assignment.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-200 text-slate-400 hover:border-primary hover:text-primary'
                            }`}
                        title={assignment.completed ? "Mark Incomplete" : "Mark Complete"}
                    >
                        <span className="material-icons-outlined text-lg">
                            {assignment.completed ? 'check' : 'done'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
});

export default AssignmentCard;
