"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { ChevronLeft, Landmark, Loader2, Copy, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function RegularContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";
    const methodId = searchParams.get("methodId");

    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes
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
            } catch (error) { toast.error("Failed to load details"); }
            finally { setLoading(false); }
        };
        fetchMethod();
    }, [methodId]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return {
            m: String(m).padStart(2, '0'),
            s: String(s).padStart(2, '0')
        };
    };

    const { m, s } = formatTime(timeLeft);

    const handleCopy = (text: string, type: 'account' | 'name') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (type === 'account') {
            setCopiedAccount(true);
            setTimeout(() => setCopiedAccount(false), 2000);
        } else {
            setCopiedName(true);
            setTimeout(() => setCopiedName(false), 2000);
        }
        toast.success("Copied");
    };

    const handleSubmit = async () => {
        if (!smsContent.trim()) {
            toast.error("Please enter the FT code or SMS");
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) return;

            await addDoc(collection(db, "RechargeReview"), {
                paymentMethod: "regular",
                bankName: method?.bankName || "",
                amount: Number(amount),
                FTcode: smsContent,
                accountHolderName: method?.holderName || "",
                accountNumber: method?.accountNumber || "",
                status: "Under Review",
                userId: user.uid,
                timestamp: new Date()
            });

            toast.success("Submitted!");
            router.push("/users/transaction-pending?theme=regular");
        } catch (error) {
            toast.error("Error submitting");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFF] text-slate-900 pb-40 font-sans">
            {/* Header - Mint Green */}
            <div className="bg-[#10B981] pt-12 pb-16 px-6 rounded-b-[3rem] relative overflow-hidden">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => router.back()}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20 active:scale-90 transition-all"
                        >
                            <ChevronLeft className="text-white" size={28} />
                        </button>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Deposit</h1>
                        <div className="w-12" />
                    </div>

                    {/* Timer Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 flex items-center justify-between border border-white/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                <Clock className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">ORDER</p>
                                <p className="text-white text-lg font-bold">Remaining</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-white/20 px-4 py-2 rounded-xl text-center min-w-[60px]">
                                <span className="text-white text-2xl font-bold">{m}</span>
                                <p className="text-white/40 text-[10px] uppercase font-bold">MIN</p>
                            </div>
                            <div className="bg-white/20 px-4 py-2 rounded-xl text-center min-w-[60px]">
                                <span className="text-white text-2xl font-bold">{s}</span>
                                <p className="text-white/40 text-[10px] uppercase font-bold">SEC</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-lg mx-auto px-6 -mt-8 space-y-8">
                {/* Step 1: Instruction Card */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-800 ml-2">Step 1</h3>
                    <div className="bg-[#000000] rounded-[2.5rem] p-8 shadow-xl">
                        <p className="text-white text-sm leading-relaxed font-medium">
                            Please copy the account number below and transfer the money using this account number. The transfer amount must be the same as the selected deposit amount. After the transfer, please send the FT code or the full transaction message in the FT send section. If the transfer amount does not match, the system will block the deposit.
                        </p>
                    </div>
                </div>

                {/* Amount Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 space-y-2">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">ORDER AMOUNT</span>
                    <p className="text-4xl font-black text-[#10B981]">
                        ETB {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                {/* Bank Details Card */}
                <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm font-medium">Payment Channel</span>
                            <button
                                onClick={() => router.push('/users/payment-method')}
                                className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-xs font-medium"
                            >
                                switch
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                {method?.bankName || "Commercial Bank of Ethiopia (CBE)"}
                            </h2>
                            <div className="w-14 h-14 rounded-2xl bg-white p-2 border border-slate-50 shadow-sm flex items-center justify-center">
                                {method?.bankLogoUrl ? (
                                    <img src={method.bankLogoUrl} alt="Bank" className="w-full h-full object-contain" />
                                ) : (
                                    <Landmark size={28} className="text-emerald-500" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-50">
                        <div className="space-y-3">
                            <span className="text-slate-400 text-sm font-medium">Account Name</span>
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-lg font-bold text-slate-900 flex-1 leading-tight">
                                    {method?.holderName || "Loading..."}
                                </p>
                                <button
                                    onClick={() => handleCopy(method?.holderName, 'name')}
                                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${copiedName ? 'bg-emerald-500 text-white' : 'bg-[#E7FFF2] text-[#10B981]'
                                        }`}
                                >
                                    {copiedName ? "copied" : "copy"}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="text-slate-400 text-sm font-medium">Account Number</span>
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight flex-1">
                                    {method?.accountNumber || "Loading..."}
                                </p>
                                <button
                                    onClick={() => handleCopy(method?.accountNumber, 'account')}
                                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${copiedAccount ? 'bg-emerald-500 text-white' : 'bg-[#E7FFF2] text-[#10B981]'
                                        }`}
                                >
                                    {copiedAccount ? "copied" : "copy"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2 Section */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-800 ml-2">Step 2</h3>
                    <p className="text-blue-600 font-bold text-lg leading-tight ml-2">
                        Paste payment sms Or enter TID: FT*****
                    </p>
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <textarea
                            value={smsContent}
                            onChange={(e) => setSmsContent(e.target.value)}
                            className="w-full h-32 bg-transparent text-slate-900 text-sm font-medium placeholder:text-slate-300 resize-none outline-none"
                            placeholder="Dear Mr your Account 1**********1122 has been debited wth ETB 350,000.00. etc..."
                        />
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={!smsContent.trim()}
                        className={`w-full h-18 rounded-2xl font-bold text-base uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-xl ${smsContent.trim()
                            ? 'bg-[#E8F0ED] text-[#5A8B7B]'
                            : 'bg-slate-100 text-slate-400'
                            }`}
                    >
                        I HAVE TRANSFERRED
                    </button>
                    <p className="text-center mt-6 text-slate-300 text-[10px] font-bold tracking-widest uppercase">Secured by MSD System</p>
                </div>
            </main>
        </div>
    );
}

export default function RegularBankDetailPage() {
    return (
        <Suspense fallback={null}>
            <RegularContent />
        </Suspense>
    );
}
