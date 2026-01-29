"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Download,
    ChevronLeft,
    Smartphone,
    ShieldCheck,
    Zap,
    Star,
    CheckCircle2,
    Loader2,
    Shield,
    Share2,
    MoreVertical,
    Activity,
    CloudDownload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DownloadAppPage() {
    const router = useRouter();

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstruction, setShowInstruction] = useState(false);
    const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed'>('idle');

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleDownload = async () => {
        if (!deferredPrompt) {
            setShowInstruction(true);
            return;
        }

        try {
            setInstallStatus('installing');
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setInstallStatus('installed');
            } else {
                setInstallStatus('idle');
                setShowInstruction(true);
            }
            setDeferredPrompt(null);
        } catch (error) {
            console.error('Error during installation:', error);
            setInstallStatus('idle');
            setShowInstruction(true);
        }
    };


    return (
        <div className="min-h-screen bg-white text-blue-900 flex flex-col font-sans relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50/30 blur-[100px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-3xl px-6 h-20 flex items-center justify-between border-b border-blue-50 max-w-lg mx-auto">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-blue-100 text-blue-900 transition-all active:scale-95 shadow-sm">
                        <ChevronLeft size={22} className="text-blue-900" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-blue-900 tracking-tight leading-none uppercase">Digital Gateway</h1>
                        <span className="text-[10px] font-black text-blue-900/40 tracking-[0.2em] uppercase mt-1">MSD App Store</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-lg mx-auto w-full relative z-10 overflow-y-auto pb-32">
                {/* Hero App Branding Section */}
                <section className="px-6 py-12 flex gap-8 items-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-28 h-28 shrink-0 rounded-[2.5rem] bg-white border border-blue-100 p-5 shadow-2xl shadow-blue-900/5 overflow-hidden relative group"
                    >
                        <img src="/msd-logo.png" alt="MSD App" className="w-full h-full object-contain relative z-10" />
                        <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </motion.div>
                    <div className="flex flex-col">
                        <div className="bg-green-50 text-green-600 w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mb-3 border border-green-100">Official Clinical Release</div>
                        <h1 className="text-3xl font-black tracking-tighter text-blue-900 leading-none mb-3">MSD Portal</h1>
                        <p className="text-[10px] font-black text-blue-900/30 uppercase tracking-[0.15em]">Secure Medical Operation Terminal</p>
                    </div>
                </section>

                {/* Metrics */}
                <section className="px-6">
                    <div className="bg-blue-50/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-blue-100 grid grid-cols-3 gap-6 shadow-inner">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span className="text-lg font-black text-blue-900">4.9</span>
                                <Star size={12} fill="#1E3A8A" className="text-blue-900" />
                            </div>
                            <span className="text-[9px] text-blue-900/40 font-black uppercase tracking-widest">Medical Grade</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 border-x border-blue-100">
                            <Activity size={20} className="text-blue-600" />
                            <span className="text-[9px] text-blue-900/40 font-black uppercase tracking-widest">Verified 24/7</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-950 text-white flex items-center justify-center">
                                <span className="text-[10px] font-black italic">A</span>
                            </div>
                            <span className="text-[9px] text-blue-900/40 font-black uppercase tracking-widest">Class I Sec</span>
                        </div>
                    </div>
                </section>

                {/* Info Text */}
                <section className="px-10 py-10 text-center">
                    <p className="text-[11px] font-black text-blue-900/40 uppercase tracking-widest leading-relaxed">
                        Authorized digital terminal for high-priority medicine distribution and clinical finance management.
                    </p>
                </section>

                {/* Primary Action Section */}
                <section className="px-6 space-y-4">
                    {installStatus === 'idle' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleDownload}
                            className="w-full h-18 py-6 bg-orange-500 rounded-[1.8rem] flex items-center justify-center gap-4 shadow-xl shadow-orange-500/20 group transition-all"
                        >
                            <CloudDownload size={24} className="text-white group-hover:translate-y-1 transition-transform" strokeWidth={2.5} />
                            <span className="text-sm font-black text-white tracking-[0.25em] uppercase">Authorize Access</span>
                        </motion.button>
                    )}

                    {installStatus === 'installing' && (
                        <div className="w-full h-18 py-6 bg-blue-50 rounded-[1.8rem] border border-blue-100 flex items-center justify-center gap-4">
                            <Loader2 size={24} className="text-blue-600 animate-spin" strokeWidth={2.5} />
                            <span className="text-sm font-black text-blue-900/40 tracking-[0.15em] uppercase">Booting Gateway...</span>
                        </div>
                    )}

                    {installStatus === 'installed' && (
                        <button
                            onClick={() => router.push('/users/welcome')}
                            className="w-full h-18 py-6 bg-green-600 rounded-[1.8rem] flex items-center justify-center gap-4 shadow-xl shadow-green-600/20"
                        >
                            <CheckCircle2 size={24} className="text-white" strokeWidth={3} />
                            <span className="text-sm font-black text-white tracking-[0.25em] uppercase">Launch Terminal</span>
                        </button>
                    )}
                </section>

                {/* Manual Instructions Info */}
                {showInstruction && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-blue-950/20 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-3xl relative border border-blue-50"
                        >
                            <button
                                onClick={() => setShowInstruction(false)}
                                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center hover:bg-blue-50 rounded-full transition-colors"
                            >
                                <ChevronLeft size={20} className="rotate-180" />
                            </button>

                            <div className="space-y-10">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-orange-50 flex items-center justify-center border border-orange-100">
                                        <Smartphone size={36} className="text-orange-500" />
                                    </div>
                                    <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight">Installation Protocol</h2>
                                    <p className="text-[10px] font-black text-blue-900/30 uppercase tracking-widest mt-2">Manual deployment required</p>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { step: "01", text: "Tap browser menu button", icon: <Share2 size={12} /> },
                                        { step: "02", text: "Select 'Add to Home Screen'", icon: <MoreVertical size={12} /> },
                                        { step: "03", text: "Authorize deployment", icon: <CheckCircle2 size={12} /> }
                                    ].map((s, i) => (
                                        <div key={i} className="flex gap-5 items-center">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                                <span className="text-xs font-black text-blue-600">{s.step}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">{s.text}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowInstruction(false)}
                                    className="w-full h-16 bg-blue-900 hover:bg-blue-950 rounded-[1.5rem] text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-900/10"
                                >
                                    Understood
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>

            {/* Bottom Logistics */}
            <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none opacity-20">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-900">Secure Download</span>
            </div>
        </div>
    );
}
