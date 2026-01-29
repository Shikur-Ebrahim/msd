"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Lock,
    Loader2,
    CheckCircle2,
    Delete,
    ChevronLeft,
    ShieldCheck,
    Key,
    AlertCircle,
    Fingerprint,
    Shield,
    Activity
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function ChangePasswordContent() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const focusInput = () => inputRef.current?.focus();
        focusInput();
        window.addEventListener('click', focusInput);
        return () => window.removeEventListener('click', focusInput);
    }, []);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [step, setStep] = useState<"enter_old" | "create_new" | "confirm_new">("create_new");
    const [input, setInput] = useState("");
    const [tempNew, setTempNew] = useState("");
    const [hasExistingPass, setHasExistingPass] = useState(false);
    const [existingPass, setExistingPass] = useState("");

    const [shake, setShake] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            const userRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.withdrawalPassword) {
                    setHasExistingPass(true);
                    setExistingPass(data.withdrawalPassword);
                    setStep("enter_old");
                }
            }
            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, [router]);


    const handleAction = async () => {
        if (input.length !== 4) return;
        setSubmitting(true);
        setErrorMsg("");

        try {
            if (step === "enter_old") {
                if (input === existingPass) {
                    toast.success("Identity Protocol Verified");
                    setStep("create_new");
                    setInput("");
                } else {
                    triggerShake();
                    setErrorMsg("Invalid PIN! Medical authorization failed.");
                    setInput("");
                }
                setSubmitting(false);
            } else if (step === "create_new") {
                if (hasExistingPass && input === existingPass) {
                    setErrorMsg("New PIN must differ from current protocol.");
                    triggerShake();
                    setInput("");
                    setSubmitting(false);
                    return;
                }
                setTempNew(input);
                setStep("confirm_new");
                setInput("");
                setSubmitting(false);
            } else if (step === "confirm_new") {
                if (input === tempNew) {
                    await updateDoc(doc(db, "users", user.uid), {
                        withdrawalPassword: input
                    });
                    setSubmitting(false);
                    setShowSuccess(true);
                } else {
                    triggerShake();
                    setErrorMsg("Synchronization failed! PIN mismatch.");
                    setInput("");
                    setSubmitting(false);
                }
            }

        } catch (error) {
            console.error(error);
            toast.error("Clinical system error");
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (input.length === 4 && !submitting) {
            handleAction();
        }
    }, [input]);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6  relative font-sans overflow-hidden">
                {/* Ambient Background Glow */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50/30 blur-[100px] rounded-full"></div>
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm bg-white rounded-[3rem] p-12 border border-blue-50 shadow-3xl text-center relative z-10 overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>

                    <div className="w-28 h-28 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 size={56} className="text-green-600" strokeWidth={2.5} />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tight leading-none">Node Secured</h2>
                        <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] leading-relaxed">
                            Clinical disbursement PIN has been successfully re-encrypted.
                        </p>
                    </div>

                    <div className="w-full pt-10">
                        <button
                            onClick={() => router.back()}
                            className="w-full h-18 bg-blue-900 hover:bg-blue-950 text-white rounded-[1.8rem] text-sm font-black uppercase tracking-[0.25em] shadow-xl shadow-blue-900/10 transition-all active:scale-95"
                        >
                            Confirm & Path Back
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center p-6 relative font-sans overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50/30 blur-[100px] rounded-full"></div>
            </div>

            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 w-12 h-12 rounded-2xl bg-white shadow-xl shadow-blue-900/5 border border-blue-50 flex items-center justify-center hover:bg-blue-50 transition-all active:scale-95 z-50"
            >
                <ChevronLeft size={24} className="text-blue-900" />
            </button>

            {/* Header Content */}
            <div className="relative z-10 text-center mt-20 space-y-6 max-w-[280px]">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-100 shadow-lg shadow-blue-900/5">
                    <Fingerprint size={40} className="text-blue-600" strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tight leading-none">
                        {step === "enter_old" ? "Verify Identity" : step === "create_new" ? "Define PIN" : "Verify PIN"}
                    </h1>
                    <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] leading-relaxed">
                        {step === "enter_old" ? "Authorize clinical node via existing credential" : step === "create_new" ? "Construct new 4-digit disbursement key" : "Re-enter new credential to finalize encryption"}
                    </p>
                </div>
            </div>

            {/* Input Section */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-sm">
                <div
                    className={`relative flex gap-6 p-10 cursor-text transition-all duration-300 ${shake ? "animate-shake bg-red-50 rounded-[3rem]" : ""}`}
                    onClick={() => inputRef.current?.focus()}
                >
                    <input
                        ref={inputRef}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        value={input}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length <= 4) setInput(val);
                            if (val.length > 0) setErrorMsg("");
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text caret-transparent"
                        autoFocus
                    />

                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-6 h-6 rounded-full transition-all duration-500 border-2 ${i < input.length
                                ? "bg-orange-500 border-orange-600 scale-125 shadow-lg shadow-orange-500/20"
                                : "bg-blue-50 border-blue-100 scale-100"
                                }`}
                        ></div>
                    ))}
                </div>

                {/* Error Box */}
                <AnimatePresence>
                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 flex items-center gap-3 mt-4"
                        >
                            <AlertCircle size={14} className="text-red-500" />
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                {errorMsg}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Step Indicators */}
            <div className="pb-20 relative z-10 flex items-center gap-4">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${(step === "enter_old" && s === 1) || (step === "create_new" && s === 2) || (step === "confirm_new" && s === 3)
                                ? "bg-blue-900 w-8"
                                : "bg-blue-100"
                            }`}
                    />
                ))}
            </div>

            {/* Bottom Logistics */}
            <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none opacity-20 z-0">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-900">Secure Pin Entry</span>
            </div>
        </div>
    );
}

export default function ChangeWithdrawalPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        }>
            <ChangePasswordContent />
        </Suspense>
    );
}
