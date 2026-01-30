"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import {
    Loader2,
    Menu,
    RefreshCcw,
    Save,
    PartyPopper,
    DollarSign,
    Info
} from "lucide-react";
import { toast } from "sonner";

export default function WeekendBalanceSettingsPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        defaultBalance: 0,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            const isMaster = localStorage.getItem("admin_session") === "true";
            if (!user && !isMaster) {
                router.push("/");
            } else {
                fetchSettings();
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "GlobalSettings", "weekend");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSettings({
                    defaultBalance: data.defaultBalance ?? 0,
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "GlobalSettings", "weekend"), {
                defaultBalance: Number(settings.defaultBalance),
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast.success("Weekend balance settings updated successfully");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen w-full">
                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-xl px-6 py-6 flex items-center justify-between z-40 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Weekend Balance</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Default User Credits</p>
                        </div>
                    </div>

                    <button
                        onClick={fetchSettings}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                    >
                        <RefreshCcw size={20} />
                    </button>
                </header>

                <main className="p-4 sm:p-8 max-w-2xl mx-auto w-full space-y-10">
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <DollarSign size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Default Balance</h3>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border-2 border-slate-100 shadow-2xl shadow-slate-900/5 space-y-10">
                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <Info size={20} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-blue-900/60 uppercase tracking-wider leading-relaxed">
                                        One-Time Legacy Integration Logic
                                    </p>
                                    <p className="text-xs font-medium text-blue-900/40 leading-relaxed">
                                        This balance will be applied to users as a base "fixed" amount. Once a user receives this balance, it is locked to their profile. Future changes to this global setting will only affect new users or those who haven't encountered the balance yet.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Balance (ETB)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                        <PartyPopper size={24} className="text-orange-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={settings.defaultBalance}
                                        onChange={(e) => setSettings({ ...settings, defaultBalance: Number(e.target.value) })}
                                        className="w-full h-20 pl-16 pr-8 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-2xl font-black text-slate-900 tabular-nums"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full h-20 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/10 mt-10"
                            >
                                {saving ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Save Config</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
