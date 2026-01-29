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
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <Loader2 className="w-12 h-12 animate-spin text-green-600" />
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/40">Accessing archives...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-blue-900 font-sans selection:bg-blue-500/30 pb-32 overflow-hidden">
            {/* Medical Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-50/30 blur-[100px] rounded-full"></div>
            </div>

            {/* Premium Header */}
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-2xl z-50 px-6 py-6 flex items-center justify-between border-b border-blue-50">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-blue-100 text-blue-900 active:scale-90 transition-all shadow-sm"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 text-center">
                    <h1 className="text-xl font-black uppercase tracking-widest text-blue-900 leading-none">Refund Archives</h1>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                    <History size={24} />
                </div>
            </header>

            <main className="pt-32 px-6 space-y-12 max-w-lg mx-auto relative z-10 w-full">
                {/* Stats Ledger */}
                <section className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-6 duration-1000">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-blue-50 flex flex-col justify-center h-48 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-2xl -mr-12 -mt-12"></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] mb-4">Total Settled</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-blue-900 tracking-tighter tabular-nums">{stats.totalSettled.toLocaleString()}</span>
                                <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest">ETB</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-orange-900/5 border border-orange-50 flex flex-col justify-center h-48 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -mr-12 -mt-12"></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-orange-900/40 uppercase tracking-[0.2em] mb-4">In Pipeline</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-blue-900 tracking-tighter tabular-nums">{stats.inPipeline.toLocaleString()}</span>
                                <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest">ETB</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="space-y-16">
                    {/* Active Transactions */}
                    {pending.length > 0 && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-5 px-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] leading-none">Active Verifications ({pending.length})</h3>
                                <div className="flex-1 h-[1px] bg-orange-100"></div>
                            </div>
                            <div className="space-y-10">
                                {pending.map(item => (
                                    <WithdrawalCard key={item.id} item={item} status="pending" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Historical Cycles */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-5 px-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/20"></div>
                            <h3 className="text-[10px] font-black text-blue-900/20 uppercase tracking-[0.2em] leading-none">Settled Collections</h3>
                            <div className="flex-1 h-[1px] bg-blue-50"></div>
                        </div>
                        {history.length > 0 ? (
                            <div className="space-y-12">
                                {history.map(item => (
                                    <WithdrawalCard key={item.id} item={item} status={item.status} />
                                ))}
                            </div>
                        ) : pending.length === 0 ? (
                            <div className="py-24 text-center space-y-8 bg-blue-50/50 rounded-[4rem] border-2 border-dashed border-blue-100">
                                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mx-auto border border-blue-100">
                                    <Banknote size={40} className="text-blue-900/10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-black text-blue-900 uppercase tracking-widest">No archives found</p>
                                    <p className="text-[10px] text-blue-900/30 uppercase font-black tracking-widest">Your clinical account is empty.</p>
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
            className={`relative rounded-[3.5rem] bg-white border border-blue-50 shadow-xl shadow-blue-900/5 overflow-hidden group/card
                ${isPending ? 'border-orange-100 shadow-orange-900/5' :
                    isSuccess ? 'border-green-100 shadow-green-900/5' :
                        'border-red-100 shadow-red-900/5'}
            `}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 ${isPending ? 'bg-orange-50' : isSuccess ? 'bg-green-50' : 'bg-red-50'}`}></div>

            <div className="relative p-10 space-y-10 z-10">
                <div className="flex justify-between items-start gap-8">
                    <div className="space-y-6 flex-1 min-w-0">
                        <div className={`w-fit px-5 py-2 rounded-2xl border text-[10px] font-black tracking-widest flex items-center gap-3
                            ${isPending ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                isSuccess ? 'bg-green-50 text-green-600 border-green-100' :
                                    'bg-red-50 text-red-600 border-red-100'}`}>
                            {isPending ? <Clock size={14} className="animate-pulse" strokeWidth={2.5} /> : isSuccess ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <ShieldAlert size={14} strokeWidth={2.5} />}
                            <span className="uppercase">{status === 'pending' ? 'Verification' : status}</span>
                        </div>
                        <div className="flex items-baseline gap-3 mt-6">
                            <span className={`text-5xl font-black tracking-tighter tabular-nums truncate ${isPending ? 'text-blue-900' : isSuccess ? 'text-green-600' : 'text-red-500'}`}>
                                {Number(item.actualReceipt).toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-blue-900/20 uppercase tracking-widest shrink-0">ETB Net</span>
                        </div>
                    </div>

                    <div className="w-20 h-20 rounded-[1.8rem] bg-blue-50 flex items-center justify-center p-3 shadow-inner border border-blue-100 group-hover/card:scale-105 transition-transform shrink-0">
                        {item.bankDetails?.bankLogoUrl ? (
                            <img src={item.bankDetails.bankLogoUrl} alt="Bank" className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(30,58,138,0.1)]" />
                        ) : (
                            <Building2 className="text-blue-900/20" size={36} />
                        )}
                    </div>
                </div>

                {/* Financial Ledger */}
                <div className="space-y-4">
                    <div className="bg-blue-50/30 rounded-[1.5rem] p-8 flex justify-between items-center border border-blue-50">
                        <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em]">Gross Collection</span>
                        <span className="text-sm font-black text-blue-900 tabular-nums">{Number(item.amount).toLocaleString()} ETB</span>
                    </div>
                    <div className="bg-blue-50/30 rounded-[1.5rem] p-8 flex justify-between items-center border border-blue-50">
                        <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em]">Clinical Processing</span>
                        <span className="text-sm font-black text-red-500 tabular-nums">-{Number(item.fee).toLocaleString()} ETB</span>
                    </div>
                </div>

                {/* Destination Details */}
                <div className="space-y-5">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/20"></div>
                            <span className="text-[10px] font-black text-blue-900/20 uppercase tracking-widest">Medical Receiver</span>
                        </div>
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{item.bankDetails?.bankName}</span>
                    </div>
                    <div className="bg-blue-900 rounded-[2rem] p-10 shadow-xl shadow-blue-900/20 flex flex-col items-center gap-4 relative overflow-hidden group/bank">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <span className="text-2xl font-black text-white tracking-[0.2em] font-mono leading-none break-all text-center relative z-10">
                            {item.bankDetails?.accountNumber}
                        </span>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest relative z-10">{item.bankDetails?.holderName}</p>
                    </div>
                </div>

                {/* Verification Footer */}
                <div className="pt-8 border-t border-blue-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-blue-50/50 px-5 py-2 rounded-2xl border border-blue-50">
                        <Calendar size={14} className="text-blue-900/20" />
                        <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(item.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {isSuccess ? (
                            <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-widest">
                                <CheckCircle2 size={16} strokeWidth={3} />
                                <span>Clinically Settled</span>
                            </div>
                        ) : isPending ? (
                            <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest animate-pulse">
                                <Clock size={16} strokeWidth={3} />
                                <span>Verification</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest">
                                <XCircle size={16} strokeWidth={3} />
                                <span>Claim Rejected</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
