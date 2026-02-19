"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, getGoogleRedirectResult } from "@/lib/auth";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Check for Google redirect result on mount
    useEffect(() => {
        const checkGoogleRedirect = async () => {
            try {
                const { user, error } = await getGoogleRedirectResult();
                if (error) {
                    // Only show error if not a normal "no redirect" case
                    if (error && !error.includes('No redirect')) {
                        setError(error);
                    }
                }
                // If user exists, AuthContext will handle the redirect via the useEffect below
            } catch (err) {
                console.error('Error checking redirect result:', err);
            } finally {
                setIsCheckingRedirect(false);
            }
        };

        checkGoogleRedirect();
    }, []);

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && !isCheckingRedirect && user) {
            if (user.emailVerified) {
                router.push("/dashboard");
            } else {
                router.push("/verify-email");
            }
        }
    }, [user, authLoading, isCheckingRedirect, router]);

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);

        try {
            // This will redirect to Google, then back to this page
            await signInWithGoogle();
            // No need to set loading to false - the redirect will handle it
        } catch (err: any) {
            setError(err.message || "Authentication failed");
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                // Sign in
                const { user, error } = await signInWithEmail(email, password);

                if (error) {
                    setError(error);
                    setLoading(false);
                }
                // AuthContext will handle the redirect through useEffect
            } else {
                // Sign up
                if (!name.trim()) {
                    setError("Please enter your full name");
                    setLoading(false);
                    return;
                }

                const { user, error } = await signUpWithEmail(email, password, name);

                if (error) {
                    setError(error);
                    setLoading(false);
                }
                // AuthContext will handle the redirect through useEffect
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed");
            setLoading(false);
        }
    };

    return (
        <div className="h-screen p-6 md:p-8 lg:p-15 flex items-center justify-center bg-white font-display text-slate-900 antialiased selection:bg-primary/20">
            <div className="w-full max-w-md lg:pt-35 lg:pb-15">
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">
                        {isLogin ? "Welcome back" : "Create an account"}
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        {isLogin ? "Sign in to access your dashboard." : "Get started with your free account."}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                    {/* Error Message */}
                    {error && (
                        <div className={`mb-4 p-3 rounded-lg text-sm ${error.includes("created") || error.includes("verify")
                            ? "bg-green-50 text-green-600 border border-green-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                            }`}>
                            {error}
                        </div>
                    )}

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900 font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        <span>{isLogin ? "Continue with Google" : "Sign up with Google"}</span>
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-slate-400">
                                {isLogin ? "Or continue with email" : "Or sign up with email"}
                            </span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form className="space-y-4" onSubmit={handleEmailAuth}>
                        {!isLogin && (
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-slate-700 mb-1.5"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full rounded-xl border-slate-200 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring-primary h-11 sm:text-sm px-4 outline-none ring-1 ring-transparent focus:ring-2 transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 mb-1.5"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-xl border-slate-200 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring-primary h-11 sm:text-sm px-4 outline-none ring-1 ring-transparent focus:ring-2 transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 mb-1.5"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-xl border-slate-200 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring-primary h-11 sm:text-sm px-4 outline-none ring-1 ring-transparent focus:ring-2 transition-all"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        {isLogin && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-white"
                                    />
                                    <label
                                        htmlFor="remember-me"
                                        className="ml-2 block text-sm text-slate-500"
                                    >
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a
                                        href="#"
                                        className="font-medium text-primary hover:text-primary/80"
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full justify-center rounded-xl border border-transparent bg-primary py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                isLogin ? "Sign in" : "Create Account"
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-4 text-center text-sm text-slate-500">
                    {isLogin ? "Not a member? " : "Already have an account? "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                        }}
                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        {isLogin ? "Start for free" : "Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
