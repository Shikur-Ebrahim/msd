"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    orderBy
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    Plus,
    Building2,
    User,
    Hash,
    ShieldCheck,
    Loader2,
    ChevronDown,
    Lock,
    History,
    X,
    CreditCard
} from "lucide-react";
import { toast } from "sonner";

export default function UserBankPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"list" | "connect" | "notification">("list");
    const [linkedBank, setLinkedBank] = useState<any>(null);
    const [availableBanks, setAvailableBanks] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        bankName: "",
        holderName: "",
        accountNumber: "",
        bankLogoUrl: ""
    });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Fetch linked bank
            const bankRef = doc(db, "Bank", currentUser.uid);
            const unsubscribeBank = onSnapshot(bankRef, (doc) => {
                setLinkedBank(doc.exists() ? doc.data() : null);
                setLoading(false);
            });

            // Fetch available withdrawal banks
            const banksQuery = query(collection(db, "withdrawalBanks"), orderBy("createdAt", "desc"));
            const unsubscribeAvailable = onSnapshot(banksQuery, (snapshot) => {
                const banks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAvailableBanks(banks);
            });

            // Fetch user data for phone number
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                }
            });

            return () => {
                unsubscribeBank();
                unsubscribeAvailable();
                unsubscribeUser();
            };
        });

        return () => unsubscribeAuth();
    }, [router]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.bankName || !formData.holderName || !formData.accountNumber) {
            toast.error("Please fill all fields");
            return;
        }

        // Check if bank is already linked logic
        if (linkedBank) {
            setView("notification");
            return;
        }

        setSubmitting(true);
        try {
            await setDoc(doc(db, "Bank", user.uid), {
                ...formData,
                uid: user.uid,
                phoneNumber: userData?.phoneNumber || "",
                status: "verified",
                linkedAt: new Date().toISOString()
            });
            toast.success("Bank account linked successfully!");
            setView("list");
        } catch (error) {
            console.error(error);
            toast.error("Failed to link bank account");
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-blue-900 font-sans selection:bg-blue-500/30 overflow-hidden relative">
            {/* Medical Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50/30 blur-[100px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-2xl z-50 px-6 py-6 flex items-center justify-between border-b border-blue-50">
                    <button
                        onClick={() => view === "connect" ? setView("list") : router.back()}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-blue-100 text-blue-900 active:scale-90 transition-all shadow-sm"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-black uppercase tracking-widest text-blue-900 leading-none">
                        {view === "list" ? "Clinical Payee" : "Register Payee"}
                    </h1>
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 italic font-black text-xs">
                        MSD
                    </div>
                </header>

                <main className="flex-1 px-6 py-4 pb-44">
                    {view === "list" ? (
                        linkedBank ? (
                            /* Linked State */
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                                <div className="flex items-center justify-between px-2 pt-28">
                                    <h3 className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em]">Verified Accounts (1)</h3>
                                    <button
                                        onClick={() => setView("connect")}
                                        className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-3 transition-all bg-orange-50 px-5 py-2.5 rounded-2xl border border-orange-100 shadow-xl shadow-orange-900/5"
                                    >
                                        <Plus size={14} strokeWidth={3} /> Change Payee
                                    </button>
                                </div>

                                {/* Premium Bank Card */}
                                <div className="bg-white rounded-[3.5rem] p-10 border border-blue-50 shadow-xl shadow-blue-900/5 relative overflow-hidden group/bank">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                    <div className="flex items-center gap-6 mb-12">
                                        <div className="w-20 h-20 rounded-[1.8rem] bg-blue-50 border border-blue-100 flex items-center justify-center p-3 shadow-inner group-hover/bank:scale-105 transition-all">
                                            {linkedBank.bankLogoUrl ? (
                                                <img src={linkedBank.bankLogoUrl} className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(30,58,138,0.1)]" alt="Bank" />
                                            ) : (
                                                <Building2 className="text-blue-900/20" size={36} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-2xl font-black text-blue-900 tracking-tight leading-none mb-3 truncate">{linkedBank.bankName}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Medical Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-10 bg-blue-900 rounded-[2.5rem] shadow-xl shadow-blue-900/20 space-y-10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16"></div>

                                        <div className="space-y-3 relative z-10">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Health ID (Account)</p>
                                            <p className="text-2xl font-black tracking-[0.2em] text-white font-mono break-all leading-none">
                                                {linkedBank.accountNumber}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 relative z-10 pt-10 border-t border-white/10">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Holder Name</p>
                                                <p className="text-xs font-black text-white truncate uppercase">{linkedBank.holderName}</p>
                                            </div>
                                            <div className="space-y-2 text-right">
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Type</p>
                                                <p className="text-xs font-black text-white uppercase italic">Standard Bio-Payee</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="h-full flex flex-col items-center justify-center pt-32 pb-16 text-center space-y-12 animate-in zoom-in-95 duration-1000">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-blue-500 rounded-[4rem] blur-[60px] opacity-10 group-hover:opacity-20 transition-all"></div>
                                    <div className="relative w-56 h-56 bg-white rounded-[4rem] border border-blue-50 flex items-center justify-center p-12 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                                        <div className="relative">
                                            <CreditCard size={80} className="text-blue-900/10 relative z-10 stroke-[1.2]" />
                                            <div className="absolute -bottom-6 -right-6 bg-green-500 p-5 rounded-[2rem] border-8 border-white shadow-xl shadow-green-500/20">
                                                <Plus size={24} strokeWidth={3} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 max-w-xs mx-auto">
                                    <h2 className="text-3xl font-black tracking-tight text-blue-900 uppercase">Payee Profile</h2>
                                    <p className="text-[11px] font-black text-blue-900/30 uppercase tracking-[0.2em] leading-relaxed">Securely register your medical payout account to receive clinical refunds instantly.</p>
                                </div>

                                <button
                                    onClick={() => setView("connect")}
                                    className="w-full py-7 bg-blue-900 text-white rounded-[2.2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                                >
                                    <ShieldCheck size={20} />
                                    <span>Register New Payee</span>
                                </button>
                            </div>
                        )
                    ) : view === "notification" ? (
                        /* Already Connected Warning */
                        <div className="h-full flex flex-col items-center justify-center py-32 text-center space-y-12 animate-in zoom-in-95 duration-700">
                            <div className="w-28 h-28 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shadow-xl shadow-orange-900/5">
                                <ShieldCheck size={48} className="text-orange-500" />
                            </div>

                            <div className="space-y-6 max-w-xs mx-auto px-4">
                                <h3 className="text-3xl font-black text-blue-900 uppercase tracking-tight">Active Payee</h3>
                                <p className="text-[11px] font-black text-blue-900/30 uppercase tracking-[0.2em] leading-relaxed">
                                    A clinical payee is already registered. To modify receiving accounts, please submit a medical protocol request toTelegram support.
                                </p>
                            </div>

                            <button
                                onClick={() => router.push("/users/service")}
                                className="w-full py-7 bg-orange-500 text-white rounded-[2.2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-orange-900/20 active:scale-95 transition-all"
                            >
                                Contact Medical Liaison
                            </button>
                        </div>
                    ) : (
                        /* Connect Form State */
                        <div className="space-y-12 animate-in fade-in slide-in-from-top-6 duration-1000 max-w-sm mx-auto w-full pt-32 pb-44">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-blue-50 text-blue-600 border border-blue-100 shadow-xl shadow-blue-900/5">
                                    <Lock size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tight">Bio-Security</h2>
                                    <p className="text-[10px] font-black text-blue-900/30 uppercase tracking-[0.4em]">Clinical Account Registration</p>
                                </div>
                            </div>

                            <form onSubmit={handleConnect} className="space-y-10">
                                <div className="space-y-8">
                                    {/* Bank Selector */}
                                    <div className="space-y-4 relative">
                                        <label className="text-[10px] font-black text-blue-900/30 uppercase tracking-[0.2em] ml-4">Medical Provider</label>
                                        <div
                                            onClick={() => setShowBankDropdown(!showBankDropdown)}
                                            className="relative w-full h-[5.5rem] rounded-[2rem] bg-white border border-blue-50 hover:border-blue-200 transition-all shadow-xl shadow-blue-900/5 cursor-pointer flex items-center px-8 gap-6 group"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-900/20 group-hover:text-blue-600 transition-all border border-blue-100 p-2 shadow-inner">
                                                {formData.bankLogoUrl ? (
                                                    <img src={formData.bankLogoUrl} className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(30,58,138,0.1)]" alt="Selected" />
                                                ) : (
                                                    <Building2 size={28} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                {formData.bankName ? (
                                                    <p className="font-black text-lg text-blue-900 leading-none">{formData.bankName}</p>
                                                ) : (
                                                    <p className="font-black text-lg text-blue-900/10 uppercase tracking-widest leading-none">Choose Bank</p>
                                                )}
                                            </div>
                                            <ChevronDown className={`text-blue-900/20 transition-transform duration-500 ${showBankDropdown ? "rotate-180" : ""}`} size={24} />
                                        </div>

                                        {showBankDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-6 p-4 bg-white rounded-[3rem] border border-blue-50 shadow-2xl shadow-blue-900/20 z-50 max-h-80 overflow-y-auto animate-in slide-in-from-top-6 fade-in duration-500 scrollbar-hide">
                                                {availableBanks.map((bank) => (
                                                    <button
                                                        key={bank.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                bankName: bank.name,
                                                                bankLogoUrl: bank.logoUrl || ""
                                                            });
                                                            setShowBankDropdown(false);
                                                        }}
                                                        className={`w-full flex items-center gap-6 p-5 rounded-[1.8rem] transition-all group mb-2 last:mb-0 border ${formData.bankName === bank.name ? 'bg-blue-900 border-blue-900 shadow-xl shadow-blue-900/10' : 'hover:bg-blue-50 border-transparent'}`}
                                                    >
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-2.5 transition-all shadow-inner border ${formData.bankName === bank.name ? 'bg-white border-white/10' : 'bg-blue-50 border-blue-100 group-hover:bg-white'}`}>
                                                            {bank.logoUrl ? (
                                                                <img src={bank.logoUrl} className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(30,58,138,0.1)]" alt={bank.name} />
                                                            ) : (
                                                                <Building2 size={24} className={formData.bankName === bank.name ? 'text-blue-900' : 'text-blue-900/20'} />
                                                            )}
                                                        </div>
                                                        <span className={`text-sm font-black text-left flex-1 tracking-tight uppercase ${formData.bankName === bank.name ? "text-white" : "text-blue-900/60"}`}>
                                                            {bank.name}
                                                        </span>
                                                        {formData.bankName === bank.name && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Holder Name */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-blue-900/30 uppercase tracking-[0.2em] ml-4">Recipient Name</label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[1.2rem] bg-blue-50 flex items-center justify-center text-blue-900/20 group-focus-within:text-blue-600 transition-all border border-blue-100">
                                                <User size={24} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="ENTER FULL NAME"
                                                value={formData.holderName}
                                                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                                                className="w-full h-[5.5rem] pl-20 pr-8 rounded-[2rem] bg-white border border-blue-50 focus:border-blue-900 focus:ring-4 focus:ring-blue-900/5 outline-none font-black text-lg text-blue-900 placeholder:text-blue-900/10 transition-all uppercase tracking-tight"
                                            />
                                        </div>
                                    </div>

                                    {/* Account Number */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-blue-900/30 uppercase tracking-[0.2em] ml-4">Clinical ID Number</label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[1.2rem] bg-blue-50 flex items-center justify-center text-blue-900/20 group-focus-within:text-blue-600 transition-all border border-blue-100">
                                                <Hash size={24} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="ACCOUNT NUMBER"
                                                value={formData.accountNumber}
                                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                                className="w-full h-[5.5rem] pl-20 pr-8 rounded-[2rem] bg-white border border-blue-50 focus:border-blue-900 focus:ring-4 focus:ring-blue-900/5 outline-none font-black text-lg text-blue-900 placeholder:text-blue-900/10 transition-all tracking-[0.2em] font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-[5.5rem] bg-blue-900 text-white rounded-[2.2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 mt-12 transition-all hover:bg-blue-800"
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin" size={28} />
                                    ) : (
                                        <>
                                            <span>Secure Registration</span>
                                            <ShieldCheck size={22} className="opacity-80" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </main>

                {/* Footer Component */}
                <footer className="p-10 text-center relative z-10 mt-auto">
                    <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                        <Lock size={14} className="text-blue-900/60" />
                        <span className="text-[10px] font-black text-blue-900/40 tracking-[0.25em] uppercase">Clinical Bio-Network Secured</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
