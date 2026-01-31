"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    ChevronLeft,
    Loader2,
    Package,
    Clock,
    TrendingUp,
    PartyPopper,
    Zap,
    Sparkles,
    CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function CountdownTimer({ endTime }: { endTime: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const [endH, endM] = (endTime || "23:59").split(":").map(Number);
            const target = new Date();
            target.setHours(endH, endM, 0, 0);

            const diff = target.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft("Time Out");
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    return <span>{timeLeft}</span>;
}

export default function WeekendUserPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Product State
    const [products, setProducts] = useState<any[]>([]);
    const [fetchingProducts, setFetchingProducts] = useState(true);
    const [currentTimeState, setCurrentTimeState] = useState(new Date());

    useEffect(() => {
        const tick = setInterval(() => {
            setCurrentTimeState(new Date());
        }, 10000); // Check every 10 seconds

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

        // Fetch Weekend Products
        const qProducts = query(collection(db, "WeekendProducts"), orderBy("createdAt", "desc"));
        const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
            setFetchingProducts(false);
        });

        return () => {
            clearInterval(tick);
            unsubscribeAuth();
            unsubscribeProducts();
        };
    }, [router]);

    const filteredProducts = products
        .filter(product => {
            const now = currentTimeState;
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const currentDay = days[now.getDay()];

            // 1. Day Check Only
            return product.activeDays?.includes(currentDay);
        })
        .sort((a, b) => {
            const now = currentTimeState;
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const getEndTimeTotal = (timeStr: string) => {
                const [h, m] = (timeStr || "23:59").split(":").map(Number);
                return h * 60 + m;
            };

            const aEndTime = getEndTimeTotal(a.endTime);
            const bEndTime = getEndTimeTotal(b.endTime);

            const aIsExpired = currentTime > aEndTime;
            const bIsExpired = currentTime > bEndTime;

            if (aIsExpired && !bIsExpired) return 1;
            if (!aIsExpired && bIsExpired) return -1;
            return 0;
        });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-[#1A1A1A] pb-44 overflow-x-hidden">
            {/* Ambient Festive Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-50/50 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/30 blur-[100px] rounded-full"></div>
            </div>

            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-3xl z-40 px-6 flex items-center justify-between border-b border-orange-50 mx-auto max-w-lg">
                <div className="flex items-center gap-5">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push("/users/welcome")}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-orange-100 text-orange-600 hover:text-orange-700 transition-all shadow-sm"
                    >
                        <ChevronLeft size={22} strokeWidth={2.5} />
                    </motion.button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-tight leading-tight text-slate-900">Weekend Lab</h1>
                        <span className="text-[10px] font-black text-orange-500 tracking-[0.2em] uppercase">MSD EXCLUSIVE</span>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 5 }}
                    className="w-12 h-12 relative p-1 bg-white rounded-2xl border border-orange-100 shadow-sm flex items-center justify-center"
                >
                    <PartyPopper size={24} className="text-orange-500" />
                </motion.div>
            </header>

            <main className="pt-32 px-6 max-w-lg mx-auto relative z-10">
                <div className="space-y-12">

                    {/* Products Grid */}
                    <div className="pb-20">
                        {fetchingProducts ? (
                            <div className="py-32 flex flex-col items-center justify-center space-y-6">
                                <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Opening Vault</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-24 flex flex-col items-center justify-center bg-orange-50/20 rounded-[3rem] border-2 border-dashed border-orange-100 text-orange-900/40"
                            >
                                <CalendarDays size={48} className="mb-6 opacity-20" />
                                <p className="text-[10px] font-black tracking-widest uppercase">No products active right now</p>
                                <p className="text-[10px] mt-2 font-bold text-slate-400">Check back during the weekend!</p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 gap-10">
                                <AnimatePresence mode="popLayout">
                                    {filteredProducts.map((product, idx) => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                                            onClick={() => router.push(`/users/weekend/${product.id}`)}
                                            className="group relative bg-white rounded-[3rem] p-7 border border-slate-50 active:scale-[0.98] transition-all cursor-pointer overflow-hidden shadow-2xl shadow-slate-900/5 hover:shadow-orange-500/10 hover:border-orange-100"
                                        >
                                            {/* Product Image Stage */}
                                            <div className="aspect-[16/10] w-full rounded-[2.5rem] overflow-hidden bg-slate-50 relative shadow-inner border border-slate-100 group-hover:border-orange-200 transition-all duration-500">
                                                {product.imageUrl ? (
                                                    <motion.img
                                                        whileHover={{ scale: 1.1 }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                        <Package size={52} strokeWidth={1} />
                                                    </div>
                                                )}

                                                {/* Category Badge Floating */}
                                                <div className="absolute bottom-5 right-5 px-4 py-1.5 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-full shadow-sm">
                                                    <span className="text-[10px] font-black text-orange-600 tracking-[0.1em]">{product.category.toUpperCase()}</span>
                                                </div>

                                                {/* Reward/Bonus Badge */}
                                                {(product.rewardAmount > 0 || product.rewardPercent > 0) && (
                                                    <div className="absolute bottom-5 left-5 px-4 py-1.5 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-full shadow-sm flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        <span className="text-[10px] font-black text-emerald-600 tracking-[0.1em]">
                                                            +{(product.rewardAmount || (product.price * (product.rewardPercent || 0) / 100)).toLocaleString()} ETB
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-8 space-y-6">
                                                {/* Header Info */}
                                                <div className="flex justify-between items-start px-2">
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{product.name}</h3>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Special Offer</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Price</span>
                                                        <span className="text-2xl font-black text-slate-900">
                                                            {product.price?.toLocaleString()}
                                                            <span className="text-[10px] ml-1.5 text-slate-400 font-black tracking-tight">ETB</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Enhanced ROI & Timer Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Row 1 */}
                                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-2 group-hover:bg-orange-50/50 transition-colors">
                                                        <span className="text-[10px] font-bold text-slate-500">Daily Income</span>
                                                        <p className="text-xl font-black text-slate-900 leading-none">
                                                            {product.dailyIncome?.toLocaleString()}
                                                            <span className="text-[10px] ml-1.5 font-bold text-slate-400 uppercase">ETB</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-2 group-hover:bg-orange-50/50 transition-colors">
                                                        <span className="text-[10px] font-bold text-slate-500">Cycle Period</span>
                                                        <p className="text-xl font-black text-slate-900 leading-none">
                                                            {product.contractPeriod}
                                                            <span className="text-[10px] ml-1.5 font-bold text-slate-400 uppercase">Days</span>
                                                        </p>
                                                    </div>

                                                    {/* Row 2 (Highlight) */}
                                                    <div className="bg-orange-500 rounded-2xl p-5 flex flex-col gap-2 shadow-lg shadow-orange-500/20 group-hover:bg-orange-600 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp size={12} className="text-white/60" />
                                                            <span className="text-[9px] font-bold text-white/80">Total Profit</span>
                                                        </div>
                                                        <p className="text-xl font-black text-white leading-none">
                                                            {product.totalProfit?.toLocaleString() || (product.dailyIncome * product.contractPeriod).toLocaleString()}
                                                            <span className="text-[10px] ml-1.5 font-black text-white/60 uppercase">ETB</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl p-5 flex flex-col gap-2 shadow-lg shadow-teal-500/20 group-hover:from-emerald-700 group-hover:to-teal-600 transition-all duration-300">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={12} className="text-white/60" />
                                                            <span className="text-[9px] font-bold text-white/80">Time Remaining</span>
                                                        </div>
                                                        <div className="text-xl font-black text-white leading-none">
                                                            <CountdownTimer endTime={product.endTime} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sales Tracking Progress */}
                                                <div className="px-2 space-y-3">
                                                    {(() => {
                                                        const now = currentTimeState;
                                                        const currentTime = now.getHours() * 60 + now.getMinutes();
                                                        const [startH, startM] = (product.startTime || "00:00").split(":").map(Number);
                                                        const [endH, endM] = (product.endTime || "23:59").split(":").map(Number);
                                                        const startTotal = startH * 60 + startM;
                                                        const endTotal = endH * 60 + endM;
                                                        const isExpired = currentTime > endTotal;

                                                        const targetPercent = product.salesTracker || 80;
                                                        let currentPercent = targetPercent;

                                                        if (!isExpired && currentTime >= startTotal) {
                                                            const elapsed = currentTime - startTotal;
                                                            const duration = endTotal - startTotal;
                                                            currentPercent = Math.min(targetPercent, (elapsed / duration) * targetPercent);
                                                        }

                                                        return (
                                                            <>
                                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                                    <span className="text-slate-400">Sales Status</span>
                                                                    <span className="text-orange-600">{Math.round(currentPercent)}% SOLD</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${currentPercent}%` }}
                                                                        className={`h-full rounded-full ${isExpired ? 'bg-slate-400' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]'}`}
                                                                    />
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {
                                                    (() => {
                                                        const now = currentTimeState;
                                                        const currentTime = now.getHours() * 60 + now.getMinutes();
                                                        const [endH, endM] = (product.endTime || "23:59").split(":").map(Number);
                                                        const isExpired = currentTime > (endH * 60 + endM);

                                                        return (
                                                            <button
                                                                disabled={isExpired}
                                                                className={`w-full h-16 rounded-[1.5rem] flex items-center justify-center text-[11px] font-black tracking-[0.3em] uppercase transition-all active:scale-95 group-hover:translate-y-[-2px] ${isExpired
                                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                                    : "bg-slate-900 text-white hover:bg-orange-600 shadow-xl shadow-slate-900/10"
                                                                    }`}
                                                            >
                                                                {isExpired ? "TIME OUT" : "BUY"}
                                                            </button>
                                                        );
                                                    })()
                                                }
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
