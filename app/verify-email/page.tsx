"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import Link from "next/link";

export default function VerifyEmailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [resendLoading, setResendLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        // If no user, redirect to auth
        if (!loading && !user) {
            router.push("/auth");
        }

        // If email is already verified, redirect to dashboard
        if (!loading && user?.emailVerified) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    useEffect(() => {
        // Countdown timer for resend button
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResendEmail = async () => {
        if (!user || countdown > 0) return;

        setResendLoading(true);
        setMessage("");

        try {
            await sendEmailVerification(user);
            setMessage("Verification email sent! Please check your inbox.");
            setCountdown(60); // 60 second cooldown
        } catch (error: any) {
            if (error.code === "auth/too-many-requests") {
                setMessage("Too many requests. Please try again later.");
            } else {
                setMessage("Failed to send email. Please try again.");
            }
        } finally {
            setResendLoading(false);
        }
    };

    const handleCheckVerification = async () => {
        if (!user) return;

        try {
            // Reload user to get latest emailVerified status
            await user.reload();

            if (user.emailVerified) {
                // Update cookies
                const token = await user.getIdToken(true); // Force refresh
                document.cookie = `authToken=${token};path=/;max-age=${7 * 24 * 60 * 60};SameSite=Lax`;
                document.cookie = `emailVerified=true;path=/;max-age=${7 * 24 * 60 * 60};SameSite=Lax`;

                router.push("/dashboard");
            } else {
                setMessage("Email not verified yet. Please check your inbox and click the verification link.");
            }
        } catch (error) {
            setMessage("Error checking verification status. Please try again.");
        }
    };

    const handleLogout = async () => {
        const { logOut } = await import("@/lib/auth");
        await logOut();
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen p-6 md:p-8 lg:p-8 flex items-center justify-center bg-white font-display text-slate-900 antialiased selection:bg-primary/20">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 mx-auto mb-4">
                        <span className="material-icons-outlined text-4xl">mark_email_unread</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Verify Your Email
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        We sent a verification link to
                    </p>
                    <p className="text-primary font-medium mt-1">
                        {user?.email}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-3 rounded-lg text-sm ${message.includes("sent") || message.includes("verified")
                            ? "bg-green-50 text-green-600 border border-green-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                            }`}>
                            {message}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                            <span className="material-icons-outlined text-primary mt-0.5">check_circle</span>
                            <p className="text-sm text-slate-600">
                                Check your email inbox (and spam folder)
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-icons-outlined text-primary mt-0.5">check_circle</span>
                            <p className="text-sm text-slate-600">
                                Click the verification link in the email
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-icons-outlined text-primary mt-0.5">check_circle</span>
                            <p className="text-sm text-slate-600">
                                Come back here and click "I've Verified My Email"
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleCheckVerification}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm shadow-primary/20"
                        >
                            I've Verified My Email
                        </button>

                        <button
                            onClick={handleResendEmail}
                            disabled={resendLoading || countdown > 0}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resendLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Sending...
                                </span>
                            ) : countdown > 0 ? (
                                `Resend Email (${countdown}s)`
                            ) : (
                                "Resend Verification Email"
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center space-y-3">
                    <button
                        onClick={handleLogout}
                        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Sign out
                    </button>
                    <div>
                        <Link
                            href="/"
                            className="text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
                        >
                            <span className="material-icons-outlined text-sm">arrow_back</span>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
