"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import {
    ChevronLeft,
    Crown,
    Users,
    Wallet,
    TrendingUp,
    Star,
    ShieldCheck,
    Loader2,
    Medal,
    Stethoscope,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserVipRulesPage() {
    const router = useRouter();
    const [vipRules, setVipRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "VipRules"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            rules.sort((a: any, b: any) => {
                const numA = parseInt(a.level?.replace(/\D/g, '') || "0");
                const numB = parseInt(b.level?.replace(/\D/g, '') || "0");
                return numA - numB;
            });

            setVipRules(rules);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-blue-900 font-sans relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50/30 blur-[100px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 bg-white/95 backdrop-blur-3xl border-b border-blue-50 px-6 h-20 flex items-center justify-between z-50 max-w-lg mx-auto">
                <button
                    onClick={() => router.back()}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-blue-100 text-blue-900 transition-all active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={22} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-black text-blue-900 tracking-tight leading-none uppercase">Clinical Protocols</h1>
                    <span className="text-[10px] font-black text-blue-900/40 tracking-[0.2em] uppercase mt-1">Medical Ranks</span>
                </div>
                <div className="w-11"></div>
            </header>

            <main className="px-6 py-10 space-y-12 relative z-10 pb-32 max-w-lg mx-auto">
                {/* Hero Section */}
                <div className="text-center space-y-4 px-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-blue-100 shadow-xl shadow-blue-900/5"
                    >
                        <Medal size={40} className="text-blue-600" strokeWidth={2.5} />
                    </motion.div>
                    <h2 className="text-3xl font-black text-blue-900 tracking-tight leading-tight uppercase">Expand Your Scope</h2>
                    <p className="text-[10px] font-black text-blue-900/30 uppercase tracking-[0.2em] leading-relaxed max-w-[260px] mx-auto">
                        Advance through medical tiers to unlock premium monthly stipends and clinical bonuses.
                    </p>
                </div>

                {/* Rules List */}
                <div className="space-y-8">
                    {vipRules.length > 0 ? (
                        vipRules.map((rule, idx) => (
                            <motion.div
                                key={rule.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-white rounded-[3rem] p-8 border border-blue-50 shadow-xl shadow-blue-900/5 hover:border-blue-100 transition-all duration-500"
                            >
                                <div className="space-y-8">
                                    <div className="flex flex-col sm:flex-row gap-8 items-center">
                                        {/* Tier Badge/Image */}
                                        <div className="w-32 h-32 shrink-0 flex items-center justify-center bg-blue-50/50 rounded-[2.5rem] border border-blue-50 group-hover:scale-105 transition-transform duration-700 p-2 overflow-hidden shadow-inner">
                                            <img
                                                src={rule.imageUrl}
                                                alt="tier"
                                                className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(30,58,138,0.15)]"
                                            />
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="flex-1 w-full grid grid-cols-2 gap-4">
                                            <div className="bg-blue-50/30 rounded-2xl p-5 border border-blue-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users size={14} className="text-blue-600" />
                                                    <span className="text-[9px] text-blue-900/40 font-black uppercase tracking-widest">Team Size</span>
                                                </div>
                                                <p className="text-xl font-black text-blue-900 leading-none">
                                                    {rule.investedTeamSize}
                                                </p>
                                            </div>

                                            <div className="bg-blue-50/30 rounded-2xl p-5 border border-blue-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Activity size={14} className="text-green-600" />
                                                    <span className="text-[9px] text-blue-900/40 font-black uppercase tracking-widest">Assets</span>
                                                </div>
                                                <p className="text-base font-black text-blue-900 leading-none truncate">
                                                    {Number(rule.totalTeamAssets).toLocaleString()}
                                                    <span className="text-[9px] ml-1 text-blue-900/20 uppercase">ETB</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rewards Tier Card */}
                                    <div className="bg-blue-900 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/20 space-y-6 relative overflow-hidden group/reward">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover/reward:bg-white/10 transition-colors"></div>

                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-white/5 pb-6">
                                            <div className="text-center sm:text-left">
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mb-1 block">Clinical Salary</span>
                                                <p className="text-2xl font-black text-white tracking-tight">
                                                    {Number(rule.monthlySalary).toLocaleString()}<span className="text-xs ml-2 text-white/40">ETB / Mo</span>
                                                </p>
                                            </div>
                                            <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/5">
                                                <span className="text-white text-[11px] font-black tracking-widest uppercase">Verified Tier</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mb-1 block">Loyalty Grant</span>
                                                <p className="text-lg font-black text-white/80 tracking-tight">
                                                    {Number(rule.yearlySalary5Year).toLocaleString()}<span className="text-[10px] ml-2 text-white/20">ETB</span>
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover/reward:scale-110 transition-transform">
                                                <Star size={20} fill="white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 text-blue-900/20 uppercase font-black tracking-widest text-xs">
                            No Tier Protocols Found
                        </div>
                    )}
                </div>

                {/* Regional Manager Highlight */}
                <div className="bg-orange-500 rounded-[3rem] p-10 text-center space-y-6 relative overflow-hidden shadow-2xl shadow-orange-500/20 group">
                    <div className="absolute inset-0 bg-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 space-y-5">
                        <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto backdrop-blur-md border border-white/30">
                            <Stethoscope size={32} className="text-white" />
                        </div>
                        <p className="text-sm font-black text-white leading-relaxed uppercase tracking-wide">
                            Achieve <span className="bg-white text-orange-600 px-3 py-0.5 rounded-lg mx-1">Tier V7</span> Status to qualify as <span className="underline decoration-white/30 underline-offset-4">Regional Clinical Manager</span>. Join the MSD Executive Council and receive annual dividends of:
                        </p>
                        <p className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                            9,000,000 <span className="text-lg font-bold opacity-60">ETB</span>
                        </p>
                    </div>
                </div>

                {/* Footer Logistics */}
                <div className="pt-10 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-900/20"></div>
                        <span className="text-[10px] font-black text-blue-900/20 uppercase tracking-[0.4em]">Protocol Version 4.0</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-900/20"></div>
                    </div>
                    <p className="text-[9px] text-blue-900/30 text-center font-black uppercase tracking-widest leading-relaxed max-w-[280px]">
                        Rewards are clinically verified and settled via automated protocol execution.
                    </p>
                </div>
            </main>
        </div>
    );
}
