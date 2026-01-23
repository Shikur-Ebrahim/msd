"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { ChevronLeft, Lock, Eye, EyeOff, Shield, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                toast.error("All fields are required");
                setLoading(false);
                return;
            }

            if (newPassword.length < 6) {
                toast.error("New password must be at least 6 characters");
                setLoading(false);
                return;
            }

            if (newPassword !== confirmPassword) {
                toast.error("New passwords do not match");
                setLoading(false);
                return;
            }

            if (currentPassword === newPassword) {
                toast.error("New password must be different from current password");
                setLoading(false);
                return;
            }

            const user = auth.currentUser;
            if (!user || !user.email) {
                toast.error("Please login first");
                router.push("/");
                return;
            }

            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            // Create notification for password change
            await addDoc(collection(db, "UserNotifications"), {
                userId: user.uid,
                type: "password_change",
                message: "Password changed successfully",
                createdAt: new Date(),
                read: false
            });

            setSuccess(true);
            toast.success("Password changed successfully!");

            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Redirect to profile after 3 seconds to let them see the success message
            setTimeout(() => {
                router.push("/users/profile");
            }, 3000);

        } catch (error: any) {
            console.error("Password change error:", error);

            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error("Current password is incorrect");
            } else if (error.code === "auth/weak-password") {
                toast.error("Password is too weak");
            } else {
                toast.error("Failed to change password. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-[#D4AF37]/30 pb-32">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-[40%] bg-gradient-to-b from-[#D4AF37]/5 to-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.02),transparent_70%)]"></div>
            </div>

            {/* Success Overlay */}
            {success && (
                <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="w-full max-w-sm bg-[#0F0F0F] rounded-[3rem] p-10 shadow-2xl border border-[#D4AF37]/20 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#D4AF37]"></div>

                        {/* Success Icon */}
                        <div className="w-24 h-24 rounded-full bg-[#D4AF37]/10 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <div className="w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg relative z-10">
                                <Shield className="text-black" size={40} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-emerald-500 border-4 border-[#0F0F0F] flex items-center justify-center shadow-md">
                                <CheckCircle2 size={20} className="text-white" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Security Active!</h2>
                            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Protocol Updated</p>
                        </div>

                        <p className="text-[11px] text-white/40 leading-relaxed font-medium uppercase tracking-wider">
                            Your account is now protected with your new password. Returning to profile in a moment...
                        </p>

                        <div className="pt-4 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Header */}
            <header className="sticky top-0 z-[60] bg-black/90 backdrop-blur-2xl border-b border-white/5 px-6 h-28 flex items-center justify-between max-w-lg mx-auto shadow-2xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all active:scale-90"
                    >
                        <ChevronLeft size={26} strokeWidth={3} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Access Control</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Shield className="text-[#D4AF37]" size={12} />
                            <span className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em]">Security Node</span>
                        </div>
                    </div>
                </div>
                <div className="w-14 h-14 flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#D4AF37]/20 to-transparent text-[#D4AF37] border border-[#D4AF37]/30 shadow-2xl">
                    <Lock size={26} strokeWidth={2.5} />
                </div>
            </header>

            <main className="px-6 py-10 max-w-lg mx-auto relative z-10">
                {/* Info Card */}
                <div className="mb-12 group relative bg-[#0F0F0F] p-8 rounded-[3rem] border border-[#D4AF37]/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex items-start gap-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] flex-shrink-0 border border-[#D4AF37]/20">
                            <Shield size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2 leading-none">Security Protocol</h3>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed font-black italic">
                                Choose a strong password with at least 6 characters. Never share your password with anyone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handleChangePassword} className="space-y-10">
                    {/* Current Password */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em] pl-4">
                            Current Cipher Key
                        </label>
                        <div className="relative group/input">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]/30 transition-colors group-focus-within/input:text-[#D4AF37]">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-16 pl-16 pr-16 rounded-[2rem] bg-[#0A0A0A] border-2 border-white/5 focus:border-[#D4AF37]/30 focus:outline-none text-white font-mono tracking-widest transition-all shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#D4AF37] transition-colors"
                            >
                                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em] pl-4">
                            New Cipher Key
                        </label>
                        <div className="relative group/input">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]/30 transition-colors group-focus-within/input:text-[#D4AF37]">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-16 pl-16 pr-16 rounded-[2rem] bg-[#0A0A0A] border-2 border-white/5 focus:border-[#D4AF37]/30 focus:outline-none text-white font-mono tracking-widest transition-all shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#D4AF37] transition-colors"
                            >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em] pl-4">
                            Re-verify New Cipher
                        </label>
                        <div className="relative group/input">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]/30 transition-colors group-focus-within/input:text-[#D4AF37]">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-16 pl-16 pr-16 rounded-[2rem] bg-[#0A0A0A] border-2 border-white/5 focus:border-[#D4AF37]/30 focus:outline-none text-white font-mono tracking-widest transition-all shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#D4AF37] transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-[#0A0A0A] rounded-[2rem] p-7 border border-white/5 shadow-inner">
                        <p className="text-[9px] font-black text-white/20 mb-4 uppercase tracking-[0.4em] italic">System Compliance Matrix:</p>
                        <div className="grid grid-cols-1 gap-4">
                            <div className={`flex items-center gap-3 transition-colors ${newPassword.length >= 6 ? 'text-[#D4AF37]' : 'text-white/10'}`}>
                                <CheckCircle2 size={16} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Length Protocol (6+)</span>
                            </div>
                            <div className={`flex items-center gap-3 transition-colors ${newPassword && confirmPassword && newPassword === confirmPassword ? 'text-[#D4AF37]' : 'text-white/10'}`}>
                                <CheckCircle2 size={16} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Hash Match Verified</span>
                            </div>
                            <div className={`flex items-center gap-3 transition-colors ${newPassword && currentPassword && newPassword !== currentPassword ? 'text-[#D4AF37]' : 'text-white/10'}`}>
                                <CheckCircle2 size={16} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Unique Entropy Status</span>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-20 bg-[#D4AF37] hover:bg-[#B8860B] text-black font-black rounded-[2.5rem] uppercase tracking-[0.3em] transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_20px_50px_rgba(212,175,55,0.25)] flex items-center justify-center gap-4 group italic"
                    >
                        {loading ? (
                            <>
                                <div className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin"></div>
                                <span className="animate-pulse">Rewriting Cipher...</span>
                            </>
                        ) : (
                            <>
                                <Shield size={24} strokeWidth={3} />
                                <span>Execute Protocol</span>
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
