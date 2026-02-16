import { db } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";

/**
 * Assignment Interface
 * Defines the structure of an assignment document
 */
export interface Assignment {
    id?: string;              // Firestore document ID (auto-generated)
    userId: string;           // Firebase Auth UID (links assignment to user)
    title: string;            // Assignment title
    course: string;           // Course code (e.g., "MATH 101")
    description?: string;     // Optional description/notes about the assignment
    dueDate: Date;            // Due date (stored as Timestamp in Firestore)
    priority: 'high' | 'medium' | 'low';  // Priority level
    completed: boolean;       // Completion status
    createdAt?: Date;         // Creation timestamp
}

/**
 * ADD Assignment
 * Creates a new assignment document in Firestore
 * 
 * @param userId - Firebase Auth UID of the current user
 * @param title - Assignment title
 * @param course - Course code
 * @param dueDate - Due date as JavaScript Date object
 * @param priority - Priority level (high/medium/low)
 * @param description - Optional description/notes about the assignment
 * @returns Promise with success status
 * 
 * Example:
 * await addAssignment(user.uid, "Math Homework", "MATH 101", new Date("2026-03-20"), "high");
 */
export const addAssignment = async (
    userId: string,
    title: string,
    course: string,
    dueDate: Date,
    priority: 'high' | 'medium' | 'low',
    description?: string
) => {
    try {
        await addDoc(collection(db, "assignments"), {
            userId,                              // Link to user
            title,
            course,
            description: description || '',      // Store description (empty string if not provided)
            dueDate: Timestamp.fromDate(dueDate), // Convert Date to Firestore Timestamp
            priority,
            completed: false,                     // Default to not completed
            createdAt: serverTimestamp()          // Server-side timestamp
        });
        return { success: true };
    } catch (error) {
        console.error("Error adding assignment:", error);
        return { success: false, error };
    }
};

/**
 * TOGGLE Assignment Completion Status
 * Marks an assignment as complete or incomplete
 * 
 * @param assignmentId - Firestore document ID
 * @param currentStatus - Current completion status
 * @returns Promise with success status
 * 
 * Example:
 * await toggleAssignmentStatus("abc123", false); // Marks as complete
 */
export const toggleAssignmentStatus = async (assignmentId: string, currentStatus: boolean) => {
    try {
        const assignmentRef = doc(db, "assignments", assignmentId);
        await updateDoc(assignmentRef, {
            completed: !currentStatus  // Toggle the status
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating assignment:", error);
        return { success: false, error };
    }
};

/**
 * DELETE Assignment
 * Permanently removes an assignment from Firestore
 * 
 * @param assignmentId - Firestore document ID
 * @returns Promise with success status
 * 
 * Example:
 * await deleteAssignment("abc123");
 */
export const deleteAssignment = async (assignmentId: string) => {
    try {
        const assignmentRef = doc(db, "assignments", assignmentId);
        await deleteDoc(assignmentRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting assignment:", error);
        return { success: false, error };
    }
};



/**
 * Update an existing assignment
 */
export const updateAssignment = async (
    assignmentId: string,
    updates: {
        title?: string;
        course?: string;
        description?: string;
        dueDate?: Date;
        priority?: 'high' | 'medium' | 'low';
    }
) => {
    try {
        const assignmentRef = doc(db, "assignments", assignmentId);

        // Convert Date to Timestamp if dueDate is being updated
        const updateData: any = { ...updates };
        if (updates.dueDate) {
            updateData.dueDate = Timestamp.fromDate(updates.dueDate);
        }

        await updateDoc(assignmentRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating assignment:", error);
        return { success: false, error };
    }
};
/**
 * SUBSCRIBE to Assignments (Real-time Listener)
 * Sets up a real-time listener for a user's assignments
 * 
 * How it works:
 * 1. Queries Firestore for assignments where userId matches
 * 2. Calls the callback function immediately with current data
 * 3. Calls the callback again whenever data changes
 * 4. Returns an unsubscribe function to clean up the listener
 * 
 * @param userId - Firebase Auth UID of the current user
 * @param callback - Function to call with updated assignments
 * @returns Unsubscribe function (call this to stop listening)
 * 
 * Example:
 * const unsubscribe = subscribeToAssignments(user.uid, (assignments) => {
 *   setAssignments(assignments); // Update React state
 * });
 * 
 * // Later, when component unmounts:
 * unsubscribe();
 */
export const subscribeToAssignments = (
    userId: string,
    callback: (assignments: Assignment[]) => void
) => {
    // Build the query
    const q = query(
        collection(db, "assignments"),
        where("userId", "==", userId),    // CRITICAL: Only get THIS user's assignments
        orderBy("dueDate", "asc")         // Sort by due date (earliest first)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const assignments: Assignment[] = [];

        // Convert Firestore documents to Assignment objects
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            assignments.push({
                id: doc.id,                      // Firestore document ID
                userId: data.userId,
                title: data.title,
                course: data.course,
                description: data.description || '',  // Include description
                dueDate: data.dueDate.toDate(),  // Convert Timestamp back to Date
                priority: data.priority,
                completed: data.completed,
                createdAt: data.createdAt?.toDate(),
            });
        });

        // Custom sorting: Priority (High > Medium > Low) then Due Date
        // Firestore can't sort by priority correctly because it's alphabetical
        // (high > low > medium), so we sort on the client side
        assignments.sort((a, b) => {
            const priorityOrder = { high: 1, medium: 2, low: 3 };

            // First, sort by priority
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }

            // If priority is the same, sort by due date
            return a.dueDate.getTime() - b.dueDate.getTime();
        });

        // Call the callback with sorted assignments
        callback(assignments);
    });

    // Return the unsubscribe function
    return unsubscribe;
};
