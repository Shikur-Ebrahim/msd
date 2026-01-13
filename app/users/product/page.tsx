"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    Home,
    Wallet,
    Ship,
    Users,
    Bell,
    TrendingUp,
    Loader2,
    Shield,
    Package,
    ChevronLeft,
    Star,
    Sparkles,
    Zap,
    Clock,
    ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserProductsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Product State
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [fetchingProducts, setFetchingProducts] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        });

        // Fetch Products - Smaller price at the top
        const qProducts = query(collection(db, "Products"), orderBy("price", "asc"));
        const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
            setFetchingProducts(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeProducts();
        };
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400 absolute inset-0 m-auto" />
                </div>
            </div>
        );
    }

    const filteredProducts = products.filter(p => {
        if (activeCategory === "ALL") return true;

        const normalize = (c: string) => {
            if (!c) return "A";
            const val = c.toLowerCase().replace("level ", "").trim().toUpperCase();
            if (val === "1") return "A";
            if (val === "2") return "B";
            if (val === "3") return "C";
            return val;
        };

        return normalize(p.category) === normalize(activeCategory);
    });

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white pb-44 overflow-x-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-amber-900/10 blur-[100px] rounded-full"></div>
            </div>

            {/* Premium Glass Header */}
            <header className="fixed top-0 left-0 right-0 h-24 bg-[#0a0a0b]/40 backdrop-blur-3xl z-50 px-6 flex items-center justify-between border-b border-white/5 mx-auto max-w-lg">
                <div className="flex items-center gap-5">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push("/users/welcome")}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all shadow-xl"
                    >
                        <ChevronLeft size={22} strokeWidth={2.5} />
                    </motion.button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight leading-tight">Store</h1>
                        <span className="text-[10px] font-medium text-purple-400 tracking-wider">Zen Products</span>
                    </div>
                </div>
                <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    className="w-12 h-12 relative p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md"
                >
                    <img src="/zen-3d-logo.png" alt="Zen Logo" className="w-full h-full object-contain drop-shadow-lg" />
                </motion.div>
            </header>

            <main className="pt-32 px-6 max-w-lg mx-auto relative z-10">
                <div className="space-y-10">

                    {/* Elite Category Navigation */}
                    <div className="bg-black/40 p-1.5 rounded-[2rem] border border-white/5 flex gap-1 justify-between items-center max-w-full overflow-x-auto no-scrollbar">
                        {[
                            { id: "ALL", label: "ALL" },
                            { id: "Level A", label: "LEVEL A" },
                            { id: "Level B", label: "LEVEL B" },
                            { id: "Level C", label: "LEVEL C" },
                            { id: "VIP", label: "VIP" }
                        ].map((cat, idx) => (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex-1 py-3 rounded-2xl text-[8px] font-bold tracking-wider transition-all市场 whitespace-nowrap市场 ${activeCategory === cat.id
                                    ? "bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)] scale-[1.02]"
                                    : "text-white/30 hover:text-white/60"
                                    }`}
                            >
                                {cat.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Boutique Grid */}
                    <div className="pb-20">
                        {fetchingProducts ? (
                            <div className="py-32 flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 border-2 border-white/5 border-t-white/40 rounded-full animate-spin"></div>
                                <p className="text-[11px] font-bold text-white/30 tracking-widest">Loading Items</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-24 flex flex-col items-center justify-center bg-white/5 rounded-[3rem] border border-white/5 italic text-white/20"
                            >
                                <Package size={48} className="mb-6 opacity-10" />
                                <p className="text-[10px] font-bold tracking-widest">No products in {activeCategory}</p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {filteredProducts.map((product, idx) => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                                            onClick={() => router.push(`/users/product/${product.id}`)}
                                            className="group relative bg-[#13141a] rounded-[2.5rem] p-7 border border-white/10 active:scale-[0.98] transition-all cursor-pointer overflow-hidden shadow-2xl"
                                        >
                                            {/* Luxury Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                            {/* Tracking Bar - Premium Top Position */}
                                            {product.showTracking && (
                                                <div className="absolute top-0 left-0 right-0 z-20 p-4">
                                                    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-xl">
                                                        <div className="flex justify-between items-end mb-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
                                                                </div>
                                                                <span className="text-[9px] font-black text-fuchsia-400 uppercase tracking-widest text-shadow-glow">Selling Fast</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-white">
                                                                <span className="text-fuchsia-400">{Math.min(100, Math.round(((product.trackingCurrent || 0) / (product.trackingTarget || 100)) * 100))}%</span>
                                                                <span className="text-white/40 ml-1">Sold</span>
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(100, ((product.trackingCurrent || 0) / (product.trackingTarget || 100)) * 100)}%` }}
                                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                                className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.5)]"
                                                            ></motion.div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Product Image Stage */}
                                            <div className="aspect-[16/10] w-full rounded-[2rem] overflow-hidden bg-[#0a0a0b] relative shadow-2xl border border-white/5 group-hover:border-white/20 transition-all duration-500">
                                                {product.imageUrl ? (
                                                    <motion.img
                                                        whileHover={{ scale: 1.1 }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/10">
                                                        <Package size={52} strokeWidth={1} />
                                                    </div>
                                                )}

                                                {/* Category Badge Floating */}
                                                <div className="absolute top-5 right-5 px-4 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full">
                                                    <span className="text-[9px] font-bold text-purple-400 tracking-wider">{(product.category || "LEVEL A").toUpperCase()}</span>
                                                </div>
                                            </div>

                                            <div className="mt-8 space-y-8">
                                                {/* Header Info */}
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{product.name}</h3>
                                                        <div className="flex items-center gap-1.5 text-white/30">
                                                            <Star size={10} className="text-amber-500" fill="currentColor" />
                                                            <span className="text-[9px] font-medium tracking-wide">Best Choice</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-medium text-white/30 tracking-wider block mb-1">Price</span>
                                                        <span className="text-2xl font-bold text-white">
                                                            {product.price?.toLocaleString()}
                                                            <span className="text-[10px] ml-1.5 text-white/40 font-bold uppercase">ETB</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* ROI Stats Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                                <Zap size={12} />
                                                            </div>
                                                            <span className="text-[9px] font-bold text-white/40 tracking-wider">Daily Profit</span>
                                                        </div>
                                                        <p className="text-xl font-bold text-emerald-400 leading-none">
                                                            {product.dailyIncome?.toLocaleString()}
                                                            <span className="text-[9px] ml-1 font-medium text-emerald-900/50">ETB</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                                <Clock size={12} />
                                                            </div>
                                                            <span className="text-[9px] font-bold text-white/40 tracking-wider">Duration</span>
                                                        </div>
                                                        <p className="text-xl font-bold text-blue-400 leading-none">
                                                            {product.contractPeriod}
                                                            <span className="text-[9px] ml-1 font-medium text-blue-900/50">DAYS</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* CTA Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="w-full h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl hover:shadow-purple-600/20 transition-all border border-purple-400/20 group/btn"
                                                >
                                                    <span className="text-[12px] font-bold text-white tracking-widest ml-6">BUY PRODUCT</span>
                                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform mr-1">
                                                        <ArrowUpRight size={18} />
                                                    </div>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Elite Floating Footer Tab Hint */}
            <div className="fixed bottom-32 left-0 right-0 pointer-events-none flex justify-center z-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-2xl border border-white/5 px-6 py-2.5 rounded-full flex items-center gap-3"
                >
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">Zen Perfumier Elite Catalog</span>
                </motion.div>
            </div>
        </div>
    );
}
