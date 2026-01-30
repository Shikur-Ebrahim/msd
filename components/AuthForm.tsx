"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, Eye, EyeOff, ChevronDown, AlertCircle, Send, UserX, ShieldAlert, ArrowRight, User, Phone, Lock, Globe } from "lucide-react";
import { countries, phoneValidationRules } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthForm() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"login" | "register">("register");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
        country: "Ethiopia",
        phonePrefix: "+251",
        phoneNumber: "",
        fullName: "",
    });

    const [supportLink, setSupportLink] = useState<string | null>(null);
    const [isAccountBlocked, setIsAccountBlocked] = useState(false);

    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === "phoneNumber") {
            if (activeTab === "login") {
                setFormData((prev) => ({ ...prev, [name]: value }));
                return;
            }

            const numericValue = value.replace(/\D/g, "");
            const rules = phoneValidationRules[formData.country];

            if (!rules) {
                setFormData((prev) => ({ ...prev, [name]: numericValue }));
                return;
            }

            if (numericValue.length === 0) {
                setFormData((prev) => ({ ...prev, [name]: "" }));
                return;
            }

            if (rules.startsWith && !rules.startsWith.includes(numericValue[0])) {
                return;
            }

            const maxLength = Array.isArray(rules.length) ? rules.length[1] : rules.length;

            if (numericValue.length <= maxLength) {
                setFormData((prev) => ({ ...prev, [name]: numericValue }));
            }
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === "country") {
            const selectedCountry = countries.find((c) => c.name === value);
            if (selectedCountry) {
                setFormData((prev) => ({ ...prev, country: value, phonePrefix: selectedCountry.prefix, phoneNumber: "" }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (activeTab === "register") {
                const phoneNumber = formData.phoneNumber.replace(/\D/g, "");
                const rules = phoneValidationRules[formData.country];

                if (rules) {
                    if (Array.isArray(rules.length)) {
                        if (phoneNumber.length < rules.length[0] || phoneNumber.length > rules.length[1]) {
                            throw new Error(rules.errorMsg);
                        }
                    } else {
                        if (phoneNumber.length !== rules.length) {
                            throw new Error(rules.errorMsg);
                        }
                    }

                    if (rules.startsWith && !rules.startsWith.includes(phoneNumber[0])) {
                        throw new Error(rules.errorMsg);
                    }
                }

                const fullPhoneNumber = `${formData.phonePrefix}${formData.phoneNumber}`;
                const sanitizedPhone = fullPhoneNumber.replace(/\+/g, "").replace(/\s/g, "");
                const generatedEmail = `${sanitizedPhone}@msd.app`;

                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, formData.password);
                const user = userCredential.user;

                let inviterData = {
                    inviterA: "",
                    inviterB: "",
                    inviterC: "",
                    inviterD: ""
                };

                const searchParams = new URLSearchParams(window.location.search);
                const refParam = searchParams.get("ref");
                let refCode = refParam || localStorage.getItem("msd_ref");

                if (refParam) {
                    localStorage.setItem("msd_ref", refParam);
                }

                if (refCode) {
                    let normalizedRef = refCode.trim();
                    let foundInviter: any = null;

                    const uidDocSnap = await getDoc(doc(db, "users", normalizedRef));
                    if (uidDocSnap.exists()) {
                        foundInviter = uidDocSnap.data();
                    } else {
                        let phoneSearch = normalizedRef;
                        if (/^\d+$/.test(phoneSearch)) {
                            phoneSearch = "+" + phoneSearch;
                        }

                        const q = query(collection(db, "users"), where("phoneNumber", "==", phoneSearch));
                        const querySnapshot = await getDocs(q);
                        if (!querySnapshot.empty) {
                            foundInviter = querySnapshot.docs[0].data();
                        }
                    }

                    if (foundInviter) {
                        inviterData.inviterA = foundInviter.uid;
                        inviterData.inviterB = foundInviter.inviterA || "";
                        inviterData.inviterC = foundInviter.inviterB || "";
                        inviterData.inviterD = foundInviter.inviterC || "";
                    }
                }

                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: generatedEmail,
                    country: formData.country,
                    phoneNumber: fullPhoneNumber,
                    vip: 0,
                    balance: 0,
                    Recharge: 0,
                    totalRecharge: 0,
                    totalWithdrawal: 0,
                    teamIncome: 0,
                    taskIncome: 0,
                    teamSize: 0,
                    investedTeamSize: 0,
                    teamAssets: 0,
                    totalIncome: 0,
                    dailyIncome: 0,
                    inviterA: inviterData.inviterA,
                    inviterB: inviterData.inviterB,
                    inviterC: inviterData.inviterC,
                    inviterD: inviterData.inviterD,
                    createdAt: new Date().toISOString(),
                });

                const invitersToUpdate = [
                    { uid: inviterData.inviterA, level: "Level A" },
                    { uid: inviterData.inviterB, level: "Level B" },
                    { uid: inviterData.inviterC, level: "Level C" },
                    { uid: inviterData.inviterD, level: "Level D" }
                ].filter(i => i.uid);

                for (const inviter of invitersToUpdate) {
                    const inviterRef = doc(db, "users", inviter.uid);
                    await updateDoc(inviterRef, {
                        teamSize: increment(1)
                    });

                    const notifRef = doc(collection(db, "UserNotifications"));
                    await setDoc(notifRef, {
                        userId: inviter.uid,
                        type: "registration",
                        level: inviter.level,
                        message: `New user registered successfully in your ${inviter.level}.`,
                        fromUser: fullPhoneNumber || "A new member",
                        createdAt: Timestamp.now(),
                        read: false
                    });
                }

                setActiveTab("login");
                setFormData({ ...formData, password: "", confirmPassword: "" });

            } else {
                const input = formData.phoneNumber.trim();
                let userCredential;

                if (input.includes("@")) {
                    userCredential = await signInWithEmailAndPassword(auth, input, formData.password);
                } else {
                    const fullPhoneNumber = `${formData.phonePrefix}${input}`;
                    const sanitizedPhone = fullPhoneNumber.replace(/\+/g, "").replace(/\s/g, "");
                    const generatedEmail = `${sanitizedPhone}@msd.app`;

                    userCredential = await signInWithEmailAndPassword(auth, generatedEmail, formData.password);
                }

                const user = userCredential.user;
                const idTokenResult = await user.getIdTokenResult(true);
                const isAdmin = !!idTokenResult.claims.admin;

                if (input.includes("@") && !isAdmin) {
                    await auth.signOut();
                    throw new Error("Unauthorized access.");
                }

                if (isAdmin) {
                    document.cookie = "is_admin=true; path=/; max-age=86400; SameSite=Strict";
                    router.push("/admin");
                    return;
                }

                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().isBlocked) {
                    await auth.signOut();
                    const tgSnap = await getDoc(doc(db, "telegram_links", "active"));
                    if (tgSnap.exists()) {
                        setSupportLink(tgSnap.data().teamLink || null);
                    }
                    setIsAccountBlocked(true);
                    setError("Your account has been restricted. Please contact support.");
                    setLoading(false);
                    return;
                }

                document.cookie = "is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                router.push("/users/welcome");
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/network-request-failed' || err.message?.includes('network')) {
                setError("Connection lost. Please check your internet.");
                return;
            }
            if (!err.message?.includes("restricted") && !error?.includes("restricted")) {
                setSupportLink(null);
            }
            if (
                err.code === 'auth/invalid-credential' ||
                err.code === 'auth/user-not-found' ||
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/invalid-email'
            ) {
                setError("Incorrect email or password.");
            }
            else if (err.code === 'auth/email-already-in-use') {
                setError("This phone number is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            }
            else {
                setError(err.message || "An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-green-100/20 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[480px] min-h-screen md:min-h-0 flex flex-col justify-center relative z-10 px-4 md:px-0"
            >
                {/* Main Content Area */}
                <div className="flex flex-col min-h-[90vh] md:min-h-0">

                    {/* Logo Section */}
                    <div className="pt-20 pb-10 px-8 text-center">
                        <div className="flex justify-center mb-10">
                            <div className="w-44 h-44 relative group">
                                <div className="absolute inset-0 bg-blue-50/50 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-1000"></div>
                                <div className="w-full h-full rounded-2xl bg-white border border-blue-100 shadow-md relative z-10 flex items-center justify-center p-4 overflow-hidden">
                                    <img
                                        src="/msd-logo.png"
                                        alt="MSD Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-blue-900 tracking-tight mb-2">
                                {activeTab === "register" ? "Register" : "Login"}
                            </h1>
                            <p className="text-xs text-blue-600/60 font-medium">
                                {activeTab === "register" ? "Create your account" : "Sign in to continue"}
                            </p>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-blue-50/50 p-1.5 rounded-[2rem] border border-blue-100/50 mb-10">
                            {(["login", "register"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-4 rounded-2xl text-[12px] font-bold transition-all duration-500 capitalize ${activeTab === tab
                                        ? "bg-white text-blue-900 shadow-md scale-[1.02]"
                                        : "text-blue-900/40 hover:text-blue-900/60"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="px-8 pb-16">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 15 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -15 }}
                                transition={{ duration: 0.4 }}
                            >
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mb-8 p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
                                    >
                                        <AlertCircle size={18} className="flex-shrink-0" />
                                        <span className="font-semibold">{error}</span>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Country Selector */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                            className="w-full px-5 py-5 rounded-2xl bg-white border border-blue-100 text-left flex items-center justify-between hover:border-blue-200 transition-all outline-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                {formData.country && (
                                                    <div className="relative w-6 h-4 rounded-sm overflow-hidden border border-blue-100">
                                                        <Image
                                                            src={countries.find(c => c.name === formData.country)?.flag || ""}
                                                            alt={formData.country}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    </div>
                                                )}
                                                <span className="text-blue-900 font-bold">{formData.country}</span>
                                            </div>
                                            <ChevronDown size={18} className={`text-blue-900/40 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isCountryDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute z-50 w-full mt-2 bg-white border border-blue-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto no-scrollbar"
                                                >
                                                    {countries.map((c) => (
                                                        <button
                                                            key={c.code}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, country: c.name, phonePrefix: c.prefix, phoneNumber: "" }));
                                                                setIsCountryDropdownOpen(false);
                                                            }}
                                                            className="w-full px-5 py-4 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left"
                                                        >
                                                            <div className="relative w-7 h-5 rounded-sm overflow-hidden border border-blue-50">
                                                                <Image src={c.flag} alt={c.name} fill className="object-cover" unoptimized />
                                                            </div>
                                                            <span className="text-blue-900 font-bold">{c.name}</span>
                                                            <span className="ml-auto text-xs text-blue-900/30">{c.prefix}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Input Fields */}
                                    <div className="space-y-6">
                                        <div className="flex bg-white border border-blue-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-200 transition-all">
                                            <div className="px-5 flex items-center bg-blue-50 font-black text-blue-900/40 text-[10px] tracking-widest border-r border-blue-100 min-w-[80px] justify-center uppercase">
                                                {formData.phonePrefix}
                                            </div>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                required
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                className="w-full px-5 py-5 bg-transparent outline-none text-blue-900 font-bold placeholder:text-blue-900/40"
                                                placeholder={activeTab === "login" ? "Email or Phone" : "Phone Number"}
                                            />
                                        </div>

                                        {activeTab === "register" && (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    required
                                                    className="w-full px-5 py-5 rounded-2xl bg-white border border-blue-100 outline-none text-blue-900 font-bold placeholder:text-blue-900/40 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all"
                                                    placeholder="Full Name"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                required
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full px-5 py-5 rounded-2xl bg-white border border-blue-100 outline-none text-blue-900 font-bold placeholder:text-blue-900/40 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all pr-14"
                                                placeholder="Password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-900/30 hover:text-blue-900 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {activeTab === "register" && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="overflow-hidden"
                                            >
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="confirmPassword"
                                                    required={activeTab === "register"}
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    className="w-full px-5 py-5 rounded-2xl bg-white border border-blue-100 outline-none text-blue-900 font-bold placeholder:text-blue-900/40 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all"
                                                    placeholder="Confirm Password"
                                                />
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-16 bg-orange-500 text-white rounded-[1.5rem] font-bold text-sm transition-all shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                                                <span>Loading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{activeTab === "register" ? "Register" : "Login"}</span>
                                                <ArrowRight size={18} strokeWidth={3} />
                                            </>
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>

                {/* Account Status Modal/Message */}
                <AnimatePresence>
                    {isAccountBlocked && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-10 px-8 text-center bg-white py-8 rounded-[2.5rem] border border-blue-100 shadow-xl"
                        >
                            <ShieldAlert size={32} className="mx-auto text-orange-500 mb-4" />
                            <p className="text-blue-900 font-bold text-sm mb-6">Account Restricted</p>
                            {supportLink && (
                                <button
                                    onClick={() => window.open(supportLink.startsWith('http') ? supportLink : `https://t.me/${supportLink.replace('@', '')}`, '_blank')}
                                    className="px-10 py-4 bg-orange-500 text-white rounded-full font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                                >
                                    Contact Support
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
