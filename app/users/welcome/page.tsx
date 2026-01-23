"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot, where, getDocs, limit, deleteDoc, writeBatch, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
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
    CheckCircle2,
    Coins,
    Star,
    PartyPopper
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import VipCelebrationCard from "@/components/VipCelebrationCard";
import { motion, AnimatePresence } from "framer-motion";

import { Suspense } from "react";

function WelcomeContent() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeNav, setActiveNav] = useState("home");
    const [banners, setBanners] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [mounted, setMounted] = useState(false);


    // Notification State
    const [userNotifs, setUserNotifs] = useState<any[]>([]);
    const [latestRecharge, setLatestRecharge] = useState<any>(null);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // VIP Celebration State
    const [showVipCeleb, setShowVipCeleb] = useState(false);
    const [vipCelebData, setVipCelebData] = useState<any>(null);

    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const tab = searchParams.get('tab');
        if (tab && ['home', 'product', 'team', 'wallet'].includes(tab)) {
            setActiveNav(tab);
        } else {
            setActiveNav('home');
        }
    }, [searchParams]);

    useEffect(() => {
        if (!user) return;

        // 1. Listen for User's Latest Recharge
        const qRecharge = query(
            collection(db, "RechargeReview"),
            where("userId", "==", user.uid)
        );

        const unsubscribeRec = onSnapshot(qRecharge, (snapshot) => {
            if (!snapshot.empty) {
                const recharges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Client-side sort to avoid index issues
                recharges.sort((a: any, b: any) => {
                    const timeA = a.timestamp?.toMillis?.() || 0;
                    const timeB = b.timestamp?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                const latest = recharges[0] as any;
                setLatestRecharge(latest);
                // Only trigger dot for 'Under Review' recharges
                if (latest.status === 'Under Review') {
                    setHasUnread(true);
                }
            }
        });

        // 2. Listen for User-Specific Reward Notifications
        const qUserNotifs = query(
            collection(db, "UserNotifications"),
            where("userId", "==", user.uid)
        );

        const unsubscribeNotifs = onSnapshot(qUserNotifs, async (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            // Client-side sort to avoid index requirements
            notifs.sort((a: any, b: any) => {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeB - timeA;
            });

            // Limit to top 25 most recent for display
            const limitedNotifs = notifs.slice(0, 25);

            setUserNotifs(limitedNotifs);

            // Sync unread dot with actual unread notifications
            const unreadNotifs = limitedNotifs.filter((n: any) => !n.read);
            const hasAnyUnread = unreadNotifs.length > 0;
            if (hasAnyUnread) {
                setHasUnread(true);
                setUnreadCount(unreadNotifs.length);
            } else {
                setUnreadCount(0);
            }

            // --- Auto-Cleanup Logic ---
            // If total notifications exceed 25, delete the older ones from the database
            if (notifs.length > 25) {
                const toDelete = notifs.slice(25);
                const batch = writeBatch(db);
                toDelete.forEach((notif) => {
                    const docRef = doc(db, "UserNotifications", notif.id);
                    batch.delete(docRef);
                });
                try {
                    await batch.commit();
                } catch (error) {
                    console.error("Error cleaning up old notifications:", error);
                }
            }
        });

        return () => {
            unsubscribeRec();
            unsubscribeNotifs();
        };
    }, [user]);

    const handleMarkAsRead = async (notif: any) => {
        if (notif.read === false) {
            try {
                const docRef = doc(db, "UserNotifications", notif.id);
                await updateDoc(docRef, { read: true });
            } catch (error) {
                console.error("Error marking as read:", error);
            }
        }
    };

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
                    const data = docSnap.data();
                    setUserData(data);

                    // --- VIP Celebration Logic ---
                    const currentVip = data.vip || 0;
                    const vipViews = data.vipViews || {};
                    const currentViews = vipViews[`level_${currentVip}`] || 0;

                    if (currentVip > 0 && currentViews < 3) {
                        const notifDoc = await getDoc(doc(db, "VipNotifications", `vip_${currentVip}`));
                        if (notifDoc.exists()) {
                            setVipCelebData({ ...notifDoc.data(), currentViews });
                            setShowVipCeleb(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        });

        // Fetch banners and notifications once
        const qBanners = query(collection(db, "banners"), orderBy("createdAt", "desc"));
        const unsubscribeBanners = onSnapshot(qBanners, (snapshot) => {
            const bannerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBanners(bannerData);
        });

        const qNotifs = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
        const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
            const notifData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifData);
        });

        // 3. Fetch all products
        const qProducts = query(collection(db, "Products"), orderBy("createdAt", "desc"));
        const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
            const productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productData);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeBanners();
            unsubscribeNotifs();
            unsubscribeProducts();
        };
    }, [router]);

    // Separate effect for banner interval to avoid redundant subscriptions
    useEffect(() => {
        if (banners.length <= 1) return;

        // Synchronize initial banner with the current hour
        const hourIndex = Math.floor(Date.now() / 3600000) % banners.length;
        setCurrentBannerIndex(hourIndex);

        const bannerInterval = setInterval(() => {
            setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
        }, 3600000); // 1 hour interval

        return () => clearInterval(bannerInterval);
    }, [banners.length]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    const handleRechargeClick = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                router.push("/users/recharge");
                return;
            }

            // Check for pending recharge
            const q = query(
                collection(db, "RechargeReview"),
                where("userId", "==", currentUser.uid),
                where("status", "==", "Under Review"),
                limit(1)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const pendingData = querySnapshot.docs[0].data();
                const theme = pendingData.paymentMethod || "regular";
                router.push(`/users/transaction-pending?theme=${theme}`);
            } else {
                router.push("/users/recharge");
            }
        } catch (error) {
            console.error("Error checking pending status:", error);
            router.push("/users/recharge");
        }
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#020202]">
                <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
                <p className="mt-8 text-[10px] font-black tracking-[0.4em] text-[#D4AF37]/30 uppercase italic">Initializing System...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#7B3F00] text-[#F5E6D3] pb-44 relative overflow-hidden" onClick={() => showNotifPanel && setShowNotifPanel(false)}>
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#F5E6D3]/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1A0F00]/40 blur-[100px] rounded-full"></div>
            </div>

            {/* Premium Top Bar */}
            <header className="fixed top-0 left-0 right-0 bg-[#7B3F00]/95 backdrop-blur-3xl z-40 px-6 py-5 flex items-center justify-between border-b border-[#F5E6D3]/10 shadow-lg">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ rotate: -10, scale: 0.9 }}
                        animate={{ rotate: 0, scale: 1 }}
                        className="w-12 h-12 relative rounded-full overflow-hidden border border-[#F5E6D3]/20 shadow-lg"
                    >
                        <img src="/zen-3d-logo.png" alt="Zen Logo" className="w-full h-full object-cover" />
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#F5E6D3]/60 uppercase tracking-widest leading-none mb-1">Account</span>
                        <span className="text-sm font-black text-[#F5E6D3] tracking-tight">
                            {userData?.email?.split('@')[0] || "User"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                setShowNotifPanel(!showNotifPanel);
                                setHasUnread(false);
                            }}
                            className="w-14 h-14 flex items-center justify-center rounded-[2rem] bg-[#D4AF37]/5 border border-[#D4AF37]/10 relative hover:bg-[#D4AF37]/10 transition-all active:scale-90"
                        >
                            <Bell size={26} className="text-[#D4AF37]" strokeWidth={2.5} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[#D4AF37] text-black text-[10px] font-black rounded-full border-2 border-black">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifPanel && (
                            <div className="absolute top-full right-0 mt-6 w-85 bg-[#0F0F0F] rounded-[3rem] shadow-2xl border border-[#D4AF37]/20 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
                                <div className="p-4 flex items-center justify-between border-b border-white/5 mb-4">
                                    <h4 className="text-[10px] font-black text-[#D4AF37]/60 uppercase tracking-[0.4em] italic">Intelligence Feed</h4>
                                    <span className="text-[9px] bg-[#D4AF37]/10 px-3 py-1 rounded-full font-black text-[#D4AF37] border border-[#D4AF37]/20 italic animate-pulse">LIVE NODE</span>
                                </div>
                                <div className="max-h-[420px] overflow-y-auto p-2 space-y-4 scrollbar-hide">
                                    {(() => {
                                        const allNotifs: any[] = [...userNotifs];
                                        if (latestRecharge) allNotifs.push({ ...latestRecharge, type: 'recharge' });
                                        allNotifs.sort((a, b) => ((b.createdAt || b.timestamp)?.toMillis?.() || 0) - ((a.createdAt || a.timestamp)?.toMillis?.() || 0));

                                        if (allNotifs.length === 0) return (
                                            <div className="py-20 text-center text-white/10 text-[10px] uppercase font-black tracking-[0.5em] italic">No active data streams</div>
                                        );

                                        return allNotifs.map((notif, idx) => {
                                            const isUnread = notif.read === false;
                                            const LEVEL_MAP: Record<string, string> = {
                                                "Level A": "1", "Level 1": "1", "Level B": "2", "Level 2": "2",
                                                "Level C": "3", "Level 3": "3", "Level D": "4", "Level 4": "4"
                                            };

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleMarkAsRead(notif)}
                                                    className={`p-4 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-5 ${isUnread ? "bg-[#D4AF37]/10 border-[#D4AF37]/20 shadow-[0_10px_30px_rgba(212,175,55,0.1)] translate-y-[-2px]" : "bg-white/5 border-white/5 opacity-60 hover:opacity-100 hover:bg-white/10"}`}
                                                >
                                                    <div className="w-12 h-12 rounded-2xl bg-black shrink-0 flex items-center justify-center overflow-hidden border border-[#D4AF37]/20 shadow-lg">
                                                        <img
                                                            src={notif.type === 'registration' ? encodeURI(`/level ${LEVEL_MAP[notif.level as string] || "1"}.jpg`) : "/zen-3d-logo.png"}
                                                            className="w-full h-full object-cover grayscale brightness-125"
                                                            alt="Notif"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[11px] font-black text-white line-clamp-1 uppercase tracking-tighter italic">{notif.message || notif.type.replace('_', ' ')}</p>
                                                        <p className="text-[10px] text-[#D4AF37] font-black mt-1 uppercase tracking-widest">{notif.amount ? `${Number(notif.amount).toLocaleString()} ETB` : "Success"}</p>
                                                    </div>
                                                    {isUnread && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full shadow-[0_0_15px_#D4AF37]"></div>}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-24 space-y-8 max-w-lg mx-auto pb-20 relative z-10">
                {activeNav === "home" ? (
                    <>
                        {/* Elite Banner Section - Premium Horizontal Slider Redesign */}
                        {banners.length > 0 && (
                            <section className="relative group/banners">
                                <div className="w-full aspect-[2/0.95] overflow-hidden bg-black/50 relative shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-y border-white/5">
                                    <div
                                        className="flex h-full"
                                        style={{
                                            width: `${(banners.length + 1) * 100}%`,
                                            transform: `translateX(-${(currentBannerIndex * 100) / (banners.length + 1)}%)`,
                                            transition: isResetting ? 'none' : 'transform 1.2s cubic-bezier(0.23, 1, 0.32, 1)'
                                        }}
                                        onTransitionEnd={() => {
                                            if (currentBannerIndex >= banners.length) {
                                                setIsResetting(true);
                                                setCurrentBannerIndex(0);
                                                setTimeout(() => setIsResetting(false), 50);
                                            }
                                        }}
                                    >
                                        {[...banners, banners[0]].map((banner, index) => (
                                            <div key={index} className="w-full h-full relative" style={{ width: `${100 / (banners.length + 1)}%` }}>
                                                <img src={banner?.url} alt="ZEN Collection" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent"></div>

                                                {/* Text Overlay for Banner */}
                                                <div className="absolute bottom-16 left-8 right-8 space-y-2">
                                                    <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.6em] italic drop-shadow-lg">Featured Protocol</span>
                                                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">{banner?.title || "Limited Assets"}</h2>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Curved Bottom Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none">
                                        <svg className="relative block w-full h-[40px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                                            <path d="M0,0 C150,80 350,80 600,40 C850,0 1050,0 1200,40 L1200,120 L0,120 Z" fill="#020202"></path>
                                        </svg>
                                    </div>

                                    {/* Pagination Dots */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                                        {banners.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-1 rounded-full transition-all duration-500 ${idx === currentBannerIndex % banners.length ? 'w-8 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'w-2 bg-white/10'}`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Content Wrap with original padding */}
                        <div className="px-6 space-y-4">


                            {/* Interactive Action Grid */}
                            <section className="space-y-8 pt-6">
                                <div className="flex items-center gap-5 px-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]"></div>
                                    <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em] italic">Capital Grid</h3>
                                    <div className="flex-1 h-px bg-white/5"></div>
                                </div>



                                {/* Modern Bento Hub - Golden Era Premium Redesign */}
                                <div className="grid grid-cols-6 gap-6">
                                    {/* Primary Action: Recharge */}
                                    <motion.button
                                        whileHover={{ scale: 1.02, translateY: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleRechargeClick}
                                        className="col-span-3 aspect-[1.1/1] bg-[#0F0F0F] rounded-[3rem] p-8 flex flex-col items-start justify-between border border-[#D4AF37]/20 relative overflow-hidden group shadow-2xl"
                                    >
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-4 group-hover:scale-110 transition-transform shadow-inner border border-[#D4AF37]/10">
                                            <Wallet size={32} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col items-start z-10">
                                            <span className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em] leading-none mb-2 italic">Protocol 01</span>
                                            <span className="text-lg font-black text-white tracking-tighter italic uppercase">Fill Vault</span>
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-8 -mt-8"></div>
                                    </motion.button>

                                    {/* Primary Action: Payouts */}
                                    <motion.button
                                        whileHover={{ scale: 1.02, translateY: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => router.push("/users/withdraw")}
                                        className="col-span-3 aspect-[1.1/1] bg-[#0F0F0F] rounded-[3rem] p-8 flex flex-col items-start justify-between border border-[#D4AF37]/20 relative overflow-hidden group shadow-2xl"
                                    >
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-4 group-hover:scale-110 transition-transform shadow-inner border border-[#D4AF37]/10">
                                            <Coins size={32} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col items-start z-10">
                                            <span className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em] leading-none mb-2 italic">Protocol 02</span>
                                            <span className="text-lg font-black text-white tracking-tighter italic uppercase">Liquify</span>
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-8 -mt-8"></div>
                                    </motion.button>

                                    {/* Secondary Action: Invite */}
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => router.push("/users/invite")}
                                        className="col-span-2 bg-[#0F0F0F] rounded-[2.2rem] p-5 flex flex-col items-center justify-center gap-4 border border-[#D4AF37]/10 group hover:border-[#D4AF37]/40 transition-all shadow-xl"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-all">
                                            <Users size={24} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-[0.3em] font-mono transition-colors">Nodes</span>
                                    </motion.button>

                                    {/* Secondary Action: VIP Rules */}
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => router.push("/users/vip-rules")}
                                        className="col-span-2 bg-[#0F0F0F] rounded-[2.2rem] p-5 flex flex-col items-center justify-center gap-4 border border-[#D4AF37]/10 group hover:border-[#D4AF37]/40 transition-all shadow-xl"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-all">
                                            <Shield size={24} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-[0.3em] font-mono transition-colors">Direct</span>
                                    </motion.button>

                                    {/* Secondary Action: Tasks */}
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => router.push("/users/tasks")}
                                        className="col-span-2 bg-[#0F0F0F] rounded-[2.2rem] p-5 flex flex-col items-center justify-center gap-4 border border-[#D4AF37]/10 group hover:border-[#D4AF37]/40 transition-all shadow-xl"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-all">
                                            <TrendingUp size={24} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-[0.3em] font-mono transition-colors">Audit</span>
                                    </motion.button>
                                </div>
                            </section>

                            {/* Direct Product Integration - Compact Mobile-First */}
                            <div className="space-y-6 pt-6 pb-12">
                                <div className="flex items-center gap-5 px-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]"></div>
                                    <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em] italic">Marketplace Nodes</h3>
                                    <div className="flex-1 h-px bg-white/5"></div>
                                </div>

                                <div className="space-y-10">
                                    {products.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => router.push(`/users/product/${product.id}`)}
                                            className="bg-[#0F0F0F] rounded-[4rem] p-8 shadow-2xl relative overflow-hidden group border border-[#D4AF37]/10 active:scale-[0.98] transition-all cursor-pointer"
                                        >
                                            {/* Sales Tracking Bar - Advanced Edition */}
                                            {product.showTracking && (
                                                <div className="mb-6">
                                                    <div className="bg-black/50 rounded-2-xl p-4 border border-[#D4AF37]/10 shadow-inner">
                                                        <div className="flex justify-between items-end mb-3 px-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                                                                </div>
                                                                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] italic">High Demand Load</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-white italic">
                                                                <span className="text-[#D4AF37]">{Math.min(100, Math.round(((product.trackingCurrent || 0) / (product.trackingTarget || 100)) * 100))}%</span>
                                                                <span className="text-white/20 ml-1">DEPLOYED</span>
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(100, ((product.trackingCurrent || 0) / (product.trackingTarget || 100)) * 100)}%` }}
                                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                                className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F5E6D3] to-[#D4AF37] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                                                            ></motion.div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Product Image Stage - Elite */}
                                            <div className="aspect-[2/1.1] w-full rounded-[2.5rem] overflow-hidden bg-black relative shadow-2xl border border-white/5">
                                                {product.imageUrl ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover grayscale brightness-110 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/5">
                                                        <Package size={64} strokeWidth={1} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                            </div>

                                            <div className="mt-8 space-y-6">
                                                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">{product.name}</h3>
                                                        <p className="text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-[0.4em] mt-1 shrink-0">Industrial Asset</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] block mb-1 font-mono">Cost Basis</span>
                                                        <span className="text-2xl font-black text-[#D4AF37] italic tracking-tighter">
                                                            {product.price?.toLocaleString()}
                                                            <span className="text-[11px] ml-2 text-[#D4AF37]/40 not-italic">ETB</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] block mb-2 italic">Yield /24h</span>
                                                        <p className="text-lg font-black text-white italic tracking-tighter">
                                                            {product.dailyIncome?.toLocaleString()}
                                                            <span className="text-[11px] ml-2 text-[#D4AF37] opacity-60">ETB</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] block mb-2 italic">Cycle Length</span>
                                                        <p className="text-lg font-black text-white italic tracking-tighter">
                                                            {product.contractPeriod}
                                                            <span className="text-[11px] ml-2 text-[#D4AF37] opacity-60">DAYS</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Button - Execution Grade */}
                                                <div className="pt-2">
                                                    <div className="w-full h-16 bg-[#D4AF37] rounded-[2rem] flex items-center justify-center shadow-[0_15px_40px_rgba(212,175,55,0.2)] group-hover:bg-[#F5E6D3] transition-all duration-500">
                                                        <span className="text-[11px] font-black text-black uppercase tracking-[0.5em] italic">Acquire Protocol</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-700">
                        <Loader2 size={32} className="animate-spin opacity-20" />
                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest">Loading...</p>
                    </div>
                )}
            </main>

            {/* VIP Celebration Overlay */}
            {
                showVipCeleb && vipCelebData && (
                    <VipCelebrationCard
                        vipLevel={vipCelebData.vipLevel}
                        text={vipCelebData.text}
                        imageUrl={vipCelebData.imageUrl}
                        onClose={async () => {
                            setShowVipCeleb(false);
                            if (user) {
                                try {
                                    await updateDoc(doc(db, "users", user.uid), {
                                        [`vipViews.level_${vipCelebData.vipLevel}`]: (vipCelebData.currentViews || 0) + 1
                                    });
                                } catch (err) { console.error(err); }
                            }
                        }}
                    />
                )
            }
        </div >
    );
}

export default function WelcomePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#7B3F00]">
                <Loader2 className="w-10 h-10 animate-spin text-[#F5E6D3]" />
            </div>
        }>
            <WelcomeContent />
        </Suspense>
    );
}
