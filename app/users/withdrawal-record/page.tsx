"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    Loader2,
    Calendar,
    CheckCircle2,
    Clock,
    TrendingDown,
    Building2,
    ShieldCheck,
    History,
    AlertCircle,
    Copy,
    Check,
    Banknote,
    TrendingUp,
    XCircle,
    ArrowUpRight,
    Search,
    ShieldAlert,
    Wallet,
    Lock
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function WithdrawalRecordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }

            const q = query(
                collection(db, "Withdrawals"),
                where("userId", "==", currentUser.uid)
            );

            const unsubscribeDocs = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as any[];

                const sorted = data.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });

                setRecords(sorted);
                setLoading(false);
            });

            return () => unsubscribeDocs();
        });

        return () => unsubscribeAuth();
    }, [router]);

    const { pending, history, stats } = useMemo(() => {
        const p = records.filter(r => r.status === 'pending');
        const h = records.filter(r => r.status !== 'pending');

        return {
            pending: p,
            history: h,
            stats: {
                totalSettled: records
                    .filter(r => r.status === 'verified' || r.status === 'approved' || r.status === 'success')
                    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
                inPipeline: records
                    .filter(r => r.status === 'pending')
                    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
            }
        };
    }, [records]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6">
                <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
                <p className="mt-8 text-[10px] font-black tracking-[0.4em] text-[#D4AF37]/30 uppercase">Uplink Gateway...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-[#D4AF37]/30 pb-32">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-[40%] bg-gradient-to-b from-[#D4AF37]/5 to-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.02),transparent_70%)]"></div>
            </div>

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
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">History Log</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <ShieldCheck size={12} className="text-[#D4AF37]" />
                            <span className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em]">Audit Verified</span>
                        </div>
                    </div>
                </div>
                <div className="w-14 h-14 flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#D4AF37]/20 to-transparent text-[#D4AF37] border border-[#D4AF37]/30 shadow-2xl">
                    <History size={26} strokeWidth={2.5} />
                </div>
            </header>

            <main className="px-6 py-10 space-y-12 max-w-lg mx-auto relative z-10 w-full">
                {/* Refined Stats Block */}
                <section className="grid grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="group relative bg-[#D4AF37] p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(212,175,55,0.15)] flex flex-col justify-between h-44 overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center text-black">
                                <TrendingUp size={24} strokeWidth={3} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-black/50 uppercase tracking-[0.3em] mb-2">Released Volume</p>
                            <p className="text-2xl font-black text-black tracking-tighter leading-none italic break-words">
                                {stats.totalSettled.toLocaleString()} <span className="text-[11px] font-bold opacity-40 not-italic">ETB</span>
                            </p>
                        </div>
                    </div>

                    <div className="group relative bg-[#0F0F0F] p-8 rounded-[3rem] border border-[#D4AF37]/20 shadow-2xl flex flex-col justify-between h-44 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                                <Clock size={24} className="animate-pulse" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.3em] mb-2 font-mono">Pending Cycle</p>
                            <p className="text-2xl font-black text-white tracking-tighter leading-none italic break-words">
                                {stats.inPipeline.toLocaleString()} <span className="text-[11px] text-[#D4AF37]/60 not-italic">ETB</span>
                            </p>
                        </div>
                    </div>
                </section>

                <div className="space-y-16">
                    {/* Active Transactions */}
                    {pending.length > 0 && (
                        <div className="space-y-10">
                            <header className="flex items-center gap-5 px-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]"></div>
                                <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em]">Live Pipelines ({pending.length})</h3>
                                <div className="flex-1 h-px bg-white/5"></div>
                            </header>
                            <div className="space-y-10">
                                {pending.map(item => (
                                    <WithdrawalCard key={item.id} item={item} status="pending" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Historical Cycles */}
                    <div className="space-y-10">
                        <header className="flex items-center gap-5 px-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em]">Completed Cycles</h3>
                            <div className="flex-1 h-px bg-white/5"></div>
                        </header>
                        {history.length > 0 ? (
                            <div className="space-y-10">
                                {history.map(item => (
                                    <WithdrawalCard key={item.id} item={item} status={item.status} />
                                ))}
                            </div>
                        ) : pending.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-28 text-center space-y-8 animate-in fade-in duration-1000">
                                <div className="w-32 h-32 bg-[#0F0F0F] rounded-[3rem] shadow-2xl flex items-center justify-center text-[#D4AF37]/10 border border-white/5 transform -rotate-2">
                                    <Banknote size={64} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[14px] font-black text-white tracking-widest uppercase italic">Null Protocol</p>
                                    <p className="text-[10px] font-black text-[#D4AF37]/30 uppercase tracking-[0.4em] max-w-[200px] leading-relaxed mx-auto">No transaction data detected in local records</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    );
}

function WithdrawalCard({ item, status }: any) {
    const isPending = status === 'pending';
    const isSuccess = status === 'verified' || status === 'approved' || status === 'success';
    const isFailed = status === 'rejected' || status === 'failed';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-[4rem] bg-[#0A0A0A] border-[2px] shadow-3xl overflow-hidden group
                ${isPending ? 'border-[#D4AF37]/20 shadow-[#D4AF37]/5' :
                    isSuccess ? 'border-emerald-500/10' :
                        'border-red-500/10'}
            `}
        >
            {/* Status Ribbon Indicator */}
            <div className={`absolute top-0 left-0 right-0 h-2 ${isPending ? 'bg-[#D4AF37]' : isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

            <div className="relative p-10 space-y-10 z-10">
                {/* Header Information */}
                <div className="flex justify-between items-start gap-6">
                    <div className="space-y-5 flex-1 min-w-0">
                        <div className={`w-fit px-5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 italic
                            ${isPending ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' :
                                isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                                    'bg-red-500/10 text-red-500 border-red-500/10'}`}>
                            {isPending ? <Clock size={12} className="animate-pulse" strokeWidth={3} /> : isSuccess ? <CheckCircle2 size={12} strokeWidth={3} /> : <ShieldAlert size={12} strokeWidth={3} />}
                            {status === 'pending' ? 'Reviewing' : status}
                        </div>
                        <div className="flex items-baseline gap-2 mt-6 overflow-hidden">
                            <span className={`text-5xl font-black tracking-tighter italic truncate ${isPending ? 'text-white' : isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                                {Number(item.actualReceipt).toLocaleString()}
                            </span>
                            <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.25em] font-mono shrink-0">ETB Net</span>
                        </div>
                    </div>

                    <div className="w-20 h-20 rounded-[2.2rem] bg-white flex items-center justify-center p-4 shadow-2xl border border-white/5 group-hover:scale-105 transition-transform shrink-0">
                        {item.bankDetails?.bankLogoUrl ? (
                            <img src={item.bankDetails.bankLogoUrl} alt="Institution" className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="text-black/10" size={40} />
                        )}
                    </div>
                </div>

                {/* Financial Ledger - Strict Alignment */}
                <div className="space-y-4">
                    <div className="bg-black/50 rounded-2xl p-7 flex justify-between items-center border border-white/5 group-hover:border-[#D4AF37]/10 transition-all">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Requested Amount</span>
                        <span className="text-sm font-black text-white tabular-nums tracking-widest">{Number(item.amount).toLocaleString()} ETB</span>
                    </div>
                    <div className="bg-black/50 rounded-2xl p-7 flex justify-between items-center border border-white/5">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Platform Fee</span>
                        <span className="text-sm font-black text-red-500/80 tabular-nums italic tracking-widest">-{Number(item.fee).toLocaleString()} ETB</span>
                    </div>
                </div>

                {/* Secure Bank Endpoint */}
                <div className="space-y-5">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-3">
                            <Lock size={14} className="text-[#D4AF37]/50" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Destination Node</span>
                        </div>
                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/5 px-4 py-1.5 rounded-xl border border-[#D4AF37]/10 italic">{item.bankDetails?.bankName}</span>
                    </div>
                    <div className="bg-[#D4AF37] rounded-[2.5rem] p-9 shadow-[0_15px_40px_rgba(212,175,55,0.2)] flex flex-col items-center gap-4 relative overflow-hidden group/bank">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bank:opacity-100 transition-opacity duration-500"></div>
                        <span className="text-2xl font-black text-black tracking-[0.3em] font-mono leading-none break-all text-center relative z-10">
                            {item.bankDetails?.accountNumber}
                        </span>
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="w-1 h-1 rounded-full bg-black/20"></div>
                            <span className="text-[9px] font-black text-black/40 uppercase tracking-[0.5em] italic">Holder: {item.bankDetails?.holderName}</span>
                        </div>
                    </div>
                </div>

                {/* Verification Footer */}
                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                        <Calendar size={14} className="text-white/20" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(item.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {isSuccess ? (
                        <div className="flex items-center gap-3 text-emerald-400 font-black italic">
                            <CheckCircle2 size={16} strokeWidth={4} />
                            <span className="text-[10px] uppercase tracking-[0.4em]">Settled_Success</span>
                        </div>
                    ) : isPending ? (
                        <div className="flex items-center gap-3 text-[#D4AF37] font-black italic animate-pulse">
                            <ShieldCheck size={16} strokeWidth={4} />
                            <span className="text-[10px] uppercase tracking-[0.4em]">Review_Process</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-red-500 font-black italic">
                            <XCircle size={16} strokeWidth={4} />
                            <span className="text-[10px] uppercase tracking-[0.4em]">Log_Abort</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
