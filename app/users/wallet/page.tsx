"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs, orderBy, limit, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    ArrowRight,
    Shield,
    History,
    Gem,
    Activity,
    Coins,
    ClipboardList,
    Star,
    ArrowLeftRight,
    Banknote,
    Loader2,
    ChevronLeft,
    RefreshCcw
} from "lucide-react";

export default function WalletPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cardBgImage, setCardBgImage] = useState<string | null>(null);
    const [productImages, setProductImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isResetting, setIsResetting] = useState(false);

    const [refreshing, setRefreshing] = useState(false);
    const [hasRateUpdate, setHasRateUpdate] = useState(false);
    const [lastSeenRateUpdate, setLastSeenRateUpdate] = useState<number>(0);

    const fetchProductData = async (uid: string) => {
        try {
            const ordersRef = collection(db, "UserOrders");
            const q = query(
                ordersRef,
                where("userId", "==", uid)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Sort client-side to avoid needing a composite index
                const docs = [...querySnapshot.docs].sort((a, b) => {
                    const timeA = a.data().createdAt?.seconds || 0;
                    const timeB = b.data().createdAt?.seconds || 0;
                    return timeB - timeA;
                });

                // Fetch images for ALL products
                const imagePromises = docs.map(async (orderDoc) => {
                    const orderData = orderDoc.data();
                    if (orderData.productId) {
                        const productRef = doc(db, "Products", orderData.productId);
                        const productSnap = await getDoc(productRef);
                        if (productSnap.exists()) {
                            return productSnap.data().imageUrl || null;
                        }
                    }
                    return null;
                });

                const resolvedImages = await Promise.all(imagePromises);
                const validImages = resolvedImages.filter((img): img is string => img !== null);

                setProductImages(validImages);

                // Keep cardBgImage logic for potential backward compatibility or other uses, 
                // setting it to the most recent product image
                if (validImages.length > 0) {
                    setCardBgImage(validImages[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching product data:", error);
        }
    };

    const handleRefresh = async () => {
        if (!user) return;
        setRefreshing(true);
        await fetchProductData(user.uid);
        // Simulate a small delay for visual feedback if fetch is too fast
        await new Promise(resolve => setTimeout(resolve, 500));
        setRefreshing(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Real-time subscription to user data
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeData = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                    // Get last seen rate update timestamp
                    const lastSeen = doc.data().lastSeenRateUpdate || 0;
                    setLastSeenRateUpdate(lastSeen);
                }
                setLoading(false);
            });

            // Real-time subscription to currency rates
            const ratesRef = doc(db, "Settings", "currency");
            const unsubscribeRates = onSnapshot(ratesRef, (doc) => {
                if (doc.exists()) {
                    const rateData = doc.data();
                    const lastUpdate = rateData.lastUpdated || 0;

                    // Check if there's a new update that user hasn't seen
                    if (lastUpdate > lastSeenRateUpdate && lastSeenRateUpdate > 0) {
                        setHasRateUpdate(true);
                    }
                }
            });

            // Fetch product images
            await fetchProductData(currentUser.uid);

            return () => {
                unsubscribeData();
                unsubscribeRates();
            };
        });

        return () => unsubscribe();
    }, [router, lastSeenRateUpdate]);

    // Auto-slide effect for product images
    useEffect(() => {
        if (productImages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => prev + 1);
        }, 3000);

        return () => clearInterval(interval);
    }, [productImages.length]);

    const hasImages = productImages.length > 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6">
                <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
                <p className="mt-8 text-[10px] font-black tracking-[0.4em] text-[#D4AF37]/30 uppercase italic">Uplink Gateway...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-[#D4AF37]/30 flex flex-col overflow-hidden select-none">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-[40%] bg-gradient-to-b from-[#D4AF37]/5 to-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.02),transparent_70%)]"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-[60] bg-black/90 backdrop-blur-2xl border-b border-white/5 px-6 h-28 flex items-center justify-between max-w-lg mx-auto shadow-2xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all active:scale-90"
                    >
                        <ChevronLeft size={26} strokeWidth={3} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Capital Hub</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Shield className="text-[#D4AF37]" size={12} />
                            <span className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em]">Vault Secured</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-14 h-14 flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#D4AF37]/20 to-transparent text-[#D4AF37] border border-[#D4AF37]/30 shadow-2xl active:scale-90 transition-all disabled:opacity-50"
                >
                    <RefreshCcw size={26} strokeWidth={2.5} className={refreshing ? "animate-spin" : ""} />
                </button>
            </header>

            <main className="flex-1 px-6 py-10 space-y-12 overflow-y-auto pb-32 no-scrollbar z-10 max-w-lg mx-auto w-full">

                {/* 1. Premium Balance Card */}
                <section className="relative animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="group relative bg-[#D4AF37] h-56 rounded-[3.5rem] shadow-[0_30px_60px_rgba(212,175,55,0.2)] flex flex-col justify-between p-10 overflow-hidden">
                        {/* Dynamic Background with Auto-Slide */}
                        {hasImages && (
                            <div className="absolute inset-0 z-0">
                                <div
                                    className="flex h-full w-full opacity-20 grayscale brightness-50"
                                    style={{
                                        transform: `translateX(-${currentImageIndex * 100}%)`,
                                        transition: isResetting ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {[...productImages, productImages[0]].map((img, index) => (
                                        <div
                                            key={index}
                                            className="flex-shrink-0 w-full h-full bg-cover bg-center"
                                            style={{ backgroundImage: `url(${img})` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>

                        {/* Card Content */}
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-black/10 backdrop-blur-md border border-black/5">
                                    <Gem size={14} className="text-black" strokeWidth={3} />
                                    <span className="text-[10px] font-black text-black uppercase tracking-[0.4em] italic">Platinum Asset</span>
                                </div>
                                <Shield className="text-black/30" size={24} strokeWidth={2.5} />
                            </div>

                            <div className="space-y-3">
                                <p className="text-[11px] font-black text-black/40 uppercase tracking-[0.5em] italic">Available Liquidity</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-black text-black tracking-tighter italic drop-shadow-lg">
                                        {Number(userData?.balance || 0).toLocaleString()}
                                    </span>
                                    <span className="text-sm font-black text-black/60 uppercase tracking-widest italic font-mono">ETB</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Unified Grid Section */}
                <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <header className="flex items-center gap-5 px-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]"></div>
                        <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em] italic">Capital Protocols</h3>
                        <div className="flex-1 h-px bg-white/5"></div>
                    </header>

                    <div className="grid grid-cols-3 gap-6">
                        {/* Recharge */}
                        <button
                            onClick={() => router.push("/users/recharge")}
                            className="flex flex-col items-center gap-4 group"
                        >
                            <div className="w-24 h-24 rounded-[2.5rem] bg-[#0F0F0F] border border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-all shadow-2xl">
                                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <img
                                    src="/assets/wallet_recharge_3d.png"
                                    alt="Recharge"
                                    className="w-14 h-14 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-mono group-hover:text-[#D4AF37] transition-colors">Recharge</span>
                        </button>

                        {/* Withdraw */}
                        <button
                            onClick={() => router.push("/users/withdraw")}
                            className="flex flex-col items-center gap-4 group"
                        >
                            <div className="w-24 h-24 rounded-[2.5rem] bg-[#0F0F0F] border border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-all shadow-2xl">
                                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <img
                                    src="/assets/wallet_withdraw_3d.png"
                                    alt="Withdraw"
                                    className="w-14 h-14 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-mono group-hover:text-[#D4AF37] transition-colors">Withdraw</span>
                        </button>

                        {/* Exchange */}
                        <button
                            onClick={() => router.push("/users/exchange")}
                            className="flex flex-col items-center gap-4 group"
                        >
                            <div className="w-24 h-24 rounded-[2.5rem] bg-[#0F0F0F] border border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-all shadow-2xl">
                                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <img
                                    src="/assets/wallet_exchange_3d.png"
                                    alt="Exchange"
                                    className="w-14 h-14 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:rotate-180 transition-transform duration-700"
                                />
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-mono group-hover:text-[#D4AF37] transition-colors">Exchange</span>
                        </button>

                        {/* Team Income */}
                        <button
                            onClick={() => router.push("/users/team")}
                            className="flex flex-col items-center gap-4 group"
                        >
                            <div className="w-24 h-24 rounded-[2.5rem] bg-[#0F0F0F] border border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-all shadow-2xl">
                                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <img
                                    src="/assets/team_income_3d.png"
                                    alt="Team"
                                    className="w-14 h-14 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 bg-[#D4AF37] text-black font-black text-[8px] px-2 py-0.5 rounded-full italic">LIVE</div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-mono group-hover:text-[#D4AF37] transition-colors">Team</span>
                                <span className="text-[9px] font-black text-[#D4AF37] italic">{Number(userData?.teamIncome || 0).toLocaleString()}</span>
                            </div>
                        </button>

                        {/* Zen Stars */}
                        <button
                            onClick={() => router.push("/users/tasks")}
                            className="flex flex-col items-center gap-4 group"
                        >
                            <div className="w-24 h-24 rounded-[2.5rem] bg-[#0F0F0F] border border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-all shadow-2xl">
                                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Star className="w-12 h-12 text-[#D4AF37] fill-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-[spin_6s_linear_infinite]" />
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#D4AF37]/10 rounded-full blur-xl border border-white/5"></div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-mono group-hover:text-[#D4AF37] transition-colors">Stars</span>
                                <span className="text-[9px] font-black text-[#D4AF37] italic">{Number(userData?.stars || 0).toLocaleString()}</span>
                            </div>
                        </button>

                        {/* Exchange Rates */}
                        <button
                            onClick={() => router.push("/users/currency-rates")}
                            className="flex flex-col items-center gap-4 group"
                        >
                            <div className="w-24 h-24 rounded-[2.5rem] bg-[#0F0F0F] border border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-all shadow-2xl">
                                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <ArrowLeftRight className="w-12 h-12 text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                                {hasRateUpdate && (
                                    <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
                                )}
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-mono group-hover:text-[#D4AF37] transition-colors leading-tight text-center">Rates</span>
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
}
