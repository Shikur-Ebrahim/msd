"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    getDoc,
    runTransaction,
    collection,
    serverTimestamp,
    increment,
    setDoc,
    query,
    where,
    getDocs,
    Timestamp
} from "firebase/firestore";
import {
    ChevronLeft,
    Clock,
    TrendingUp,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Zap,
    Anchor,
    Award,
    X,
    Sparkles,
    ArrowRight,
    Wallet,
    Info,
    History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserProductDetailPage() {
    const router = useRouter();
    const { id } = useParams();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) setUserId(user.uid);
            else setUserId(null);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "Products", id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handlePurchase = async () => {
        if (!userId) {
            router.push("/");
            return;
        }

        if (isBuying) return;
        setIsBuying(true);
        setStatusMsg(null);

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Get User Data
                const userRef = doc(db, "users", userId);
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("User profile error");

                const userData = userSnap.data();
                const rechargeBalance = Number(userData.Recharge || 0);

                // 2. Validate Funds
                if (rechargeBalance < product.price) {
                    throw new Error("INSUFFICIENT_FUNDS");
                }

                // 3. Purchase Limit Check
                const ordersRef = collection(db, "UserOrders");
                const q = query(ordersRef, where("userId", "==", userId), where("productId", "==", product.id));
                const existingOrdersSnap = await getDocs(q);
                if (existingOrdersSnap.size >= (product.purchaseLimit || 1)) {
                    throw new Error("PURCHASE_LIMIT_REACHED");
                }

                // 4. Record Investment
                const orderRef = doc(collection(db, "UserOrders"));
                transaction.set(orderRef, {
                    userId,
                    productId: product.id,
                    productName: product.name,
                    price: product.price,
                    dailyIncome: product.dailyIncome,
                    contractPeriod: product.contractPeriod,
                    remainingDays: product.contractPeriod,
                    totalProfit: product.totalProfit,
                    principalIncome: product.principalIncome,
                    status: "active",
                    purchaseDate: serverTimestamp(),
                    lastSync: serverTimestamp()
                });

                // 5. Deduct Balance from "Recharge" field and Update Daily Income Rate
                transaction.update(userRef, {
                    Recharge: rechargeBalance - product.price,
                    dailyIncome: increment(product.dailyIncome)
                });
            });

            setStatusMsg({ type: "success", text: "SUCCESS_PARTNER" });
        } catch (error: any) {
            if (!["INSUFFICIENT_FUNDS", "PURCHASE_LIMIT_REACHED", "User profile error"].includes(error.message)) {
                console.error("System Purchase error:", error);
            }
            if (error.message === "INSUFFICIENT_FUNDS") {
                setStatusMsg({ type: "error", text: "INSUFFICIENT_FUNDS_SPECIAL" });

                try {
                    const rechargeReviewRef = collection(db, "RechargeReview");
                    const q = query(
                        rechargeReviewRef,
                        where("userId", "==", userId),
                        where("status", "==", "Under Review")
                    );
                    const snap = await getDocs(q);
                    const targetPath = !snap.empty ? "/users/transaction-pending" : "/users/recharge";
                    setTimeout(() => router.push(targetPath), 3000);
                } catch (queryError) {
                    console.error("Redirection query failed:", queryError);
                    setTimeout(() => router.push("/users/recharge"), 3000);
                }
                return;
            }

            let msg = "Transaction Failed";
            if (error.message === "PURCHASE_LIMIT_REACHED") msg = `Limit reached: ${product.purchaseLimit} items max.`;
            setStatusMsg({ type: "error", text: msg });
        } finally {
            setIsBuying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f4f4f5] flex flex-col items-center justify-center p-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center">
                        <Zap className="text-slate-900 animate-pulse" size={24} />
                    </div>
                </div>
                <p className="mt-8 text-slate-400 font-bold tracking-widest text-[10px]">Loading product details</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#f4f4f5] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 border border-slate-200 shadow-sm">
                    <AlertCircle size={48} className="text-slate-300" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">Product not found</h1>
                <p className="text-slate-500 max-w-xs mb-10 text-[10px] font-medium tracking-wide leading-relaxed">The requested item could not be found in the store.</p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-bold tracking-widest text-[10px] shadow-xl transition-all"
                >
                    Back to Store
                </motion.button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f4f5] text-slate-900 pb-56 overflow-hidden">
            {/* Soft Ambient Textures */}
            <div className="fixed inset-0 pointer-events-none opacity-40">
                <div className="absolute top-0 right-0 w-full h-[60%] bg-gradient-to-b from-slate-200 to-transparent"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-80 h-80 bg-slate-200/50 blur-[120px] rounded-full"></div>
            </div>

            {/* Premium Pencil Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl px-6 h-24 flex items-center gap-6 border-b border-slate-200 max-w-lg mx-auto">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.back()}
                    className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-colors"
                >
                    <ChevronLeft size={24} strokeWidth={3} />
                </motion.button>
                <div className="flex flex-col flex-1 truncate">
                    <h1 className="text-xl font-bold tracking-tight leading-none text-slate-900">{product.name}</h1>
                    <span className="text-[9px] font-medium text-slate-400 tracking-wider mt-1">Product Details</span>
                </div>
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                    <img src="/zen-3d-logo.png" alt="Zen" className="w-6 h-6 object-contain brightness-0 invert" />
                </div>
            </header>

            <main className="pt-32 px-6 max-w-lg mx-auto space-y-10 relative z-10">
                {/* Hero Asset Presentation */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative group"
                >
                    <div className="aspect-[1.2/1] rounded-[3rem] overflow-hidden bg-white shadow-2xl border border-slate-200 relative group-hover:shadow-slate-300 transition-all duration-500">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-100 gap-6">
                                <Award size={84} strokeWidth={1} />
                                <span className="text-[10px] font-medium tracking-wider">Product Image</span>
                            </div>
                        )}

                        {/* Floating Identification */}
                        <div className="absolute top-8 left-8">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="px-6 py-2.5 bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center gap-3"
                            >
                                <ShieldCheck size={14} className="text-slate-900" />
                                {product.category || "LEVEL A"}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Boutique Data Matrix - Pencil Theme */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[2.5rem] p-10 border border-slate-200 space-y-10 relative shadow-xl overflow-hidden"
                >
                    {/* Primary Grid: Financials */}
                    <div className="grid grid-cols-2 gap-y-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Wallet size={12} className="text-slate-300" />
                                <span className="text-[10px] font-medium text-slate-400 tracking-wider">Price</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 leading-none">
                                {product.price?.toLocaleString()}
                                <span className="text-xs ml-2 text-slate-400 font-medium tracking-wide">ETB</span>
                            </p>
                        </div>
                        <div className="space-y-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-medium text-slate-400 tracking-wider">Daily Profit</span>
                                <TrendingUp size={12} className="text-slate-900" />
                            </div>
                            <p className="text-3xl font-bold text-slate-900 leading-none">
                                {product.dailyIncome?.toLocaleString()}
                                <span className="text-xs ml-2 text-slate-400 font-medium tracking-wide">ETB</span>
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-slate-300" />
                                <span className="text-[10px] font-medium text-slate-400 tracking-wider">Duration</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 leading-none">
                                {product.contractPeriod}
                                <span className="text-xs ml-2 text-slate-400 font-medium tracking-wide">Days</span>
                            </p>
                        </div>
                        <div className="space-y-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-medium text-slate-400 tracking-wider">Profit %</span>
                                <Zap size={12} className="text-slate-900" />
                            </div>
                            <p className="text-3xl font-bold text-slate-900 leading-none">
                                {product.dailyRate}%
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Projected ROI */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={12} className="text-slate-900" />
                            <span className="text-[10px] font-medium text-slate-400 tracking-wider">Total Return</span>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-400 tracking-wide">Total Profit</span>
                                <span className="text-2xl font-bold text-slate-900">{product.principalIncome?.toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span></span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Manuscript: Technical Details */}
                <div className="space-y-8 pt-4">
                    <header className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Description</h2>
                        <div className="h-px flex-1 bg-slate-200"></div>
                    </header>

                    <div className="text-slate-500 text-[11px] leading-relaxed space-y-6 font-bold uppercase tracking-[0.05em]">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 shrink-0 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300">
                                <Info size={16} />
                            </div>
                            <p className="flex-1">
                                This product is designed to provide stable income in the Zen system.
                                Members get daily earnings and full support throughout the contract period.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-900 mb-2">
                                <History size={12} />
                                <span className="text-[10px]">Technical Specifications</span>
                            </div>
                            <p className="text-[10px] grid grid-cols-2 gap-x-4 gap-y-2">
                                <span className="text-slate-400">Price:</span> <span className="text-slate-900">{product.price?.toLocaleString()} ETB</span>
                                <span className="text-slate-400">Profit:</span> <span className="text-slate-900">{product.dailyIncome?.toLocaleString()} ETB</span>
                                <span className="text-slate-400">Days:</span> <span className="text-slate-900">{product.contractPeriod} Days</span>
                                <span className="text-slate-400">Rate:</span> <span className="text-slate-900">{product.dailyRate}%</span>
                                <span className="text-slate-400">Total:</span> <span className="text-slate-900">{product.totalProfit?.toLocaleString()} ETB</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Limits Grid */}
                <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                            <ShieldCheck size={18} />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest text-slate-900">Purchase Limit</span>
                    </div>
                    <div className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl">
                        {product.purchaseLimit || 1} ITEMS
                    </div>
                </div>
            </main>

            {/* Interaction Bar - Fixed Layout & Attractive Style */}
            <div className="fixed bottom-0 left-0 right-0 p-8 pt-10 bg-gradient-to-t from-white via-white/95 to-transparent z-[150]">
                <div className="max-w-lg mx-auto">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isBuying}
                        className={`w-full h-20 py-6 rounded-[2rem] font-bold text-[14px] tracking-widest transition-all flex items-center justify-center gap-4 ${isBuying
                            ? "bg-slate-100 text-slate-400"
                            : "bg-slate-900 text-white shadow-[0_25px_50px_rgba(0,0,0,0.2)] active:scale-95"
                            }`}
                    >
                        {isBuying ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <Zap size={18} fill="currentColor" />
                                BUY PRODUCT
                                <ArrowRight size={18} />
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Elite Confirmation Modal - Pencil Theme */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end justify-center p-0"
                    >
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setShowConfirmModal(false)}
                        ></div>

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-white rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] p-10 space-y-10 border-t border-slate-200 overflow-hidden"
                        >
                            <header className="flex items-center justify-between relative z-10 font-bold">
                                <div className="space-y-1 text-slate-900">
                                    <h2 className="text-2xl tracking-tight">Order Information</h2>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    <X size={24} />
                                </motion.button>
                            </header>

                            <div className="relative min-h-[340px] flex flex-col justify-center">
                                {statusMsg ? (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="space-y-8"
                                    >
                                        {statusMsg.text === "INSUFFICIENT_FUNDS_SPECIAL" ? (
                                            <div className="bg-red-50 rounded-[2.5rem] p-10 border border-red-100 text-center space-y-6">
                                                <div className="w-20 h-20 bg-white shadow-sm border border-red-50 rounded-[1.8rem] flex items-center justify-center mx-auto">
                                                    <X className="text-red-500" size={32} strokeWidth={3} />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-red-900 text-xl font-black uppercase tracking-tight">Access Denied</h3>
                                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
                                                        Wallet liquidity insufficient. <br />Redirecting to funding gateway...
                                                    </p>
                                                </div>
                                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden w-40 mx-auto">
                                                    <motion.div
                                                        initial={{ width: "100%" }}
                                                        animate={{ width: 0 }}
                                                        transition={{ duration: 3, ease: "linear" }}
                                                        className="h-full bg-red-500"
                                                    ></motion.div>
                                                </div>
                                            </div>
                                        ) : statusMsg.text === "SUCCESS_PARTNER" ? (
                                            <div className="bg-slate-900 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden">
                                                {/* Textures */}
                                                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] brightness-0 invert"></div>

                                                <div className="relative z-10 space-y-6">
                                                    <div className="w-20 h-20 bg-white/10 rounded-[1.8rem] flex items-center justify-center mx-auto backdrop-blur-xl border border-white/20">
                                                        <Sparkles className="text-white" size={36} fill="white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-white text-2xl font-bold tracking-tight">Purchase Successful</h3>
                                                        <p className="text-white/40 text-[10px] font-medium tracking-wide">
                                                            You are now a owner of this product in <br />
                                                            <span className="text-white">Zen Store</span>
                                                        </p>
                                                    </div>
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => router.push("/users/welcome")}
                                                        className="w-full py-5 bg-white text-black rounded-2xl font-bold text-[11px] tracking-widest shadow-xl"
                                                    >
                                                        Go Back
                                                    </motion.button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`p-8 rounded-[2rem] flex items-center gap-5 font-black uppercase tracking-widest text-[10px] border shadow-sm ${statusMsg.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-900 border-emerald-100'
                                                : 'bg-red-50 text-red-900 border-red-100'
                                                }`}>
                                                {statusMsg.type === 'success' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertCircle size={24} className="text-red-500" />}
                                                {statusMsg.text}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="space-y-10">
                                        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
                                            {[
                                                { label: "Product Name", value: product.name },
                                                { label: "Price", value: `${product.price?.toLocaleString()} ETB`, highlight: true },
                                                { label: "Duration", value: `${product.contractPeriod} Days` },
                                                { label: "Total Profit", value: `${product.totalProfit?.toLocaleString()} ETB`, color: "text-slate-900" },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-end border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-slate-400 tracking-wider block">{item.label}</span>
                                                        <span className={`text-sm font-bold tracking-tight ${item.color || "text-slate-900"}`}>{item.value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center px-4">
                                            <span className="text-xl font-bold tracking-tight text-slate-900">Total Price</span>
                                            <span className="text-3xl font-bold text-slate-900">{product.price?.toLocaleString()} <span className="text-xs text-slate-300 ml-1 font-medium">ETB</span></span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!statusMsg && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handlePurchase}
                                    disabled={isBuying}
                                    className="w-full h-20 bg-slate-900 text-white rounded-[2rem] font-bold text-[14px] tracking-widest shadow-[0_25px_50px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-4 relative overflow-hidden group"
                                >
                                    {isBuying ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        <>
                                            <span className="relative z-10">CONFIRM</span>
                                            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                    <motion.div
                                        className="absolute inset-0 bg-white/10 translate-x-[-100%]"
                                        animate={{ translateX: isBuying ? "0%" : "-100%" }}
                                    />
                                </motion.button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Add local animation for progress bar
const style = `
@keyframes progress-shrink {
    0% { transform: scaleX(1); }
    100% { transform: scaleX(0); }
}
.animate-progress-shrink {
    animation: progress-shrink 3s linear forwards;
}
`;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = style;
    document.head.appendChild(styleSheet);
}
