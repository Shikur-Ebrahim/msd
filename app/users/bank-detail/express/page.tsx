"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { ChevronLeft, Clock, Copy, ShieldCheck, Activity, Info, Loader2, Landmark, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function ExpressContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";
    const methodId = searchParams.get("methodId");

    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(1500);
    const [smsContent, setSmsContent] = useState("");
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [copiedName, setCopiedName] = useState(false);

    useEffect(() => {
        const fetchMethod = async () => {
            if (!methodId) return;
            try {
                const docRef = doc(db, "paymentMethods", methodId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setMethod(docSnap.data());
            } catch (error) { toast.error("Protocol linking failed"); }
            finally { setLoading(false); }
        };
        fetchMethod();
    }, [methodId]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const { m, s } = { m: Math.floor(timeLeft / 60), s: timeLeft % 60 };

    const handleCopy = (text: string, type: 'account' | 'name') => {
        navigator.clipboard.writeText(text);
        if (type === 'account') {
            setCopiedAccount(true);
            setTimeout(() => setCopiedAccount(false), 2000);
        } else {
            setCopiedName(true);
            setTimeout(() => setCopiedName(false), 2000);
        }
        toast.success("Protocol Data Copied");
    };

    const handleSubmit = async () => {
        if (!smsContent.trim()) {
            toast.error("Security Key required");
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Session Expired");
                return;
            }

            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userPhone = userDocSnap.exists() ? userDocSnap.data()?.phoneNumber : "";

            await addDoc(collection(db, "RechargeReview"), {
                paymentMethod: "express",
                bankName: method?.bankName || "",
                phoneNumber: userPhone || user.phoneNumber || "",
                amount: Number(amount),
                FTcode: smsContent,
                accountHolderName: method?.holderName || "",
                accountNumber: method?.accountNumber || "",
                status: "Under Review",
                userId: user.uid,
                timestamp: new Date()
            });

            toast.success("Settlement Dispatched");
            router.push("/users/transaction-pending?theme=express");
        } catch (error) {
            console.error(error);
            toast.error("Network Dispatch Failure");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-blue-900 pb-44 font-sans selection:bg-blue-100 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50/30 blur-[100px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="bg-blue-900 text-white pt-10 pb-20 px-6 rounded-b-[4rem] relative shadow-2xl z-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="flex items-center justify-between mb-10 max-w-lg mx-auto relative z-10">
                    <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 active:scale-90 transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-black uppercase tracking-widest italic leading-none">Express Funding</h1>
                    <div className="w-12" />
                </div>

                <div className="max-w-md mx-auto relative z-10">
                    <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-6 flex items-center justify-between border border-white/10 shadow-xl">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center relative">
                                <Clock size={28} className="text-white/60" />
                                <div className="absolute inset-0 rounded-2xl border-2 border-green-500 animate-ping opacity-20"></div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">Window Status</p>
                                <p className="font-black text-xs uppercase tracking-widest text-green-400">Time Sensitive</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl min-w-[70px] text-center border border-white/10">
                                <span className="font-black text-2xl block leading-none tabular-nums italic">{String(m).padStart(2, '0')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1 block">Min</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl min-w-[70px] text-center border border-white/10">
                                <span className="font-black text-2xl block leading-none tabular-nums italic text-orange-400">{String(s).padStart(2, '0')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1 block">Sec</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-6 -mt-10 relative z-30 max-w-lg mx-auto space-y-12 pb-20">
                {/* Step 1: Transfer Protocol */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-900 flex items-center justify-center text-white shadow-lg">
                            <Landmark size={20} />
                        </div>
                        <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter italic">Transfer Protocol</h2>
                    </div>

                    <div className="bg-orange-500 p-8 rounded-[3rem] shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <p className="text-white text-[11px] font-black leading-relaxed uppercase tracking-wider relative z-10">
                            Authorized personnel: initiate ETB transfer to the clinical account below. <span className="text-blue-900 bg-white px-1">Exact match</span> required for automated verification. Discrepancies will result in protocol suspension.
                        </p>
                    </div>

                    <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-blue-900/5 border border-blue-50 space-y-10">
                        {/* Amount */}
                        <div className="border-b border-blue-50 pb-8 relative group">
                            <label className="text-[9px] font-black text-blue-900/30 uppercase tracking-[0.3em] mb-2 block">Settlement Amount</label>
                            <div className="text-blue-900 text-5xl font-black tracking-tighter italic leading-none">
                                ETB {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="w-12 h-1 bg-green-500 mt-4 rounded-full group-hover:w-24 transition-all"></div>
                        </div>

                        {/* Payment Channel */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-blue-900/30 uppercase tracking-[0.3em]">Target Institution</label>
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-100 italic">Verified Channel</span>
                            </div>
                            <div className="flex items-center justify-between bg-blue-50/30 p-6 rounded-[2rem] border border-blue-50">
                                <span className="font-black text-blue-900 text-lg uppercase tracking-tight italic">{method?.bankName || "Commercial Bank of Ethiopia"}</span>
                                <div className="w-12 h-12 rounded-2xl bg-white p-2 border border-blue-100 shadow-sm">
                                    {method?.bankLogoUrl ? (
                                        <img src={method.bankLogoUrl} alt="Bank" className="w-full h-full object-contain" />
                                    ) : (
                                        <Landmark size={24} className="text-blue-900/10" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Holder Details */}
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-blue-900/30 uppercase tracking-[0.3em] ml-2">Clinical Recipient</label>
                                <div className="flex items-center justify-between gap-6 bg-white p-4 rounded-[2rem] border border-blue-50 group hover:border-blue-200 transition-all">
                                    <span className="font-black text-blue-900 text-base leading-tight uppercase pl-4 truncate">{method?.holderName || "Loading..."}</span>
                                    <button
                                        onClick={() => handleCopy(method?.holderName, 'name')}
                                        className="bg-blue-900 text-white px-8 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 active:scale-95 transition-all shadow-lg shadow-blue-900/20 shrink-0"
                                    >
                                        {copiedName ? "Sync'd" : "Copy"}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-blue-900/30 uppercase tracking-[0.3em] ml-2">Secure Account ID</label>
                                <div className="flex flex-col gap-6 bg-blue-900 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-12 -mt-12"></div>
                                    <span className="font-black text-white text-3xl tracking-[0.2em] font-mono break-all leading-none">{method?.accountNumber || "Loading..."}</span>
                                    <button
                                        onClick={() => handleCopy(method?.accountNumber, 'account')}
                                        className="w-full bg-white/10 backdrop-blur-md text-white py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] border border-white/20 hover:bg-white/20 transition-all active:scale-95 mt-2"
                                    >
                                        {copiedAccount ? "Verified" : "Capture ID"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Step 2: Protocol Key */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6 pb-20"
                >
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter italic">Verification Key</h2>
                    </div>

                    <p className="text-blue-900/40 font-black text-[10px] px-2 leading-relaxed uppercase tracking-[0.2em]">
                        Transmit the <span className="text-orange-600 font-extrabold">Transaction ID (FT Code)</span> or complete clinical message for gateway authorization.
                    </p>

                    <div className="relative group">
                        <div className="absolute -inset-4 bg-blue-50 rounded-[3rem] opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl"></div>
                        <textarea
                            value={smsContent}
                            onChange={(e) => setSmsContent(e.target.value)}
                            className="w-full h-44 bg-white rounded-[2.5rem] p-8 text-blue-900 font-black text-xs uppercase tracking-widest placeholder:text-blue-900/10 border border-blue-50 shadow-2xl shadow-blue-900/5 resize-none focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 outline-none transition-all placeholder:italic relative z-10"
                            placeholder="TRANSMIT TRANSACTION DATA OR FT-CODE HERE..."
                        />
                    </div>
                </motion.section>
            </main>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/90 backdrop-blur-2xl border-t border-blue-50 z-[40] pb-[100px]">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!smsContent.trim()}
                        className={`w-full h-24 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] transition-all relative overflow-hidden group active:scale-95 disabled:grayscale disabled:opacity-20 shadow-2xl ${smsContent.trim()
                            ? 'bg-blue-900 text-white shadow-blue-900/30'
                            : 'bg-blue-50 text-blue-900/20'
                            }`}
                    >
                        {smsContent.trim() && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        )}
                        <span className="relative z-10 flex items-center justify-center gap-4">
                            {smsContent.trim() ? <Activity size={20} className="animate-pulse" /> : <ShieldCheck size={20} />}
                            SUBMIT PROTOCOL
                        </span>
                    </button>
                    <p className="text-center mt-6 text-[9px] font-black text-blue-900/20 uppercase tracking-[0.5em] italic">Encrypted Pipeline Active</p>
                </div>
            </div>

            <WelcomeNotification />
        </div>
    );
}

function WelcomeNotification() {
    const [show, setShow] = useState(true);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-blue-900/80 backdrop-blur-md animate-in fade-in duration-500">
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[3.5rem] p-12 max-w-sm w-full shadow-3xl text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                <div className="space-y-8">
                    <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600 border border-blue-100 shadow-inner">
                        <Landmark size={40} className="animate-in zoom-in duration-500" />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-3xl font-black text-blue-900 uppercase tracking-tight italic">Secure Transfer</h3>
                        <p className="text-blue-900/40 text-[10px] font-black leading-relaxed uppercase tracking-widest px-2">
                            Initialize the clinical funding protocol by transferring the exact ETA amount to the provided account. Capture the Transaction ID (FT-Code) to authorize node activation.
                        </p>
                    </div>

                    <button
                        onClick={() => setShow(false)}
                        className="w-full bg-blue-900 text-white font-black py-6 rounded-[2rem] uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-blue-900/20 active:scale-95 transition-all"
                    >
                        Acknowledge Protocol
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function ExpressBankDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        }>
            <ExpressContent />
        </Suspense>
    );
}
