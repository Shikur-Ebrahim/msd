"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import {
    CreditCard,
    Search,
    TrendingUp,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Loader2,
    Menu,
    Calendar,
    BadgeCheck,
    History,
    Users
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

interface RechargeDoc {
    id: string;
    FTcode: string;
    accountHolderName: string;
    accountNumber: string;
    amount: number;
    bankName: string;
    paymentMethod: string;
    phoneNumber: string;
    status: string;
    timestamp: any;
    userId: string;
    verifiedAt?: any;
}

interface GroupedUser {
    userId: string;
    phoneNumber: string;
    totalAmount: number;
    recharges: RechargeDoc[];
    lastRechargeAt: any;
}

export default function RechargeUsersPage() {
    const [groupedUsers, setGroupedUsers] = useState<GroupedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const q = query(
            collection(db, "RechargeReview"),
            where("status", "==", "verified")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recharges = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RechargeDoc[];

            // Group by userId
            const groups: { [key: string]: GroupedUser } = {};

            recharges.forEach(rec => {
                const key = rec.userId || rec.phoneNumber;
                if (!groups[key]) {
                    groups[key] = {
                        userId: rec.userId,
                        phoneNumber: rec.phoneNumber,
                        totalAmount: 0,
                        recharges: [],
                        lastRechargeAt: rec.timestamp
                    };
                }
                groups[key].recharges.push(rec);
                groups[key].totalAmount += (rec.amount || 0);

                // Track latest recharge for sorting
                if (rec.timestamp?.seconds > (groups[key].lastRechargeAt?.seconds || 0)) {
                    groups[key].lastRechargeAt = rec.timestamp;
                }
            });

            // Convert to array and sort by total amount or latest recharge
            const sortedGroups = Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
            setGroupedUsers(sortedGroups);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleExpand = (userId: string) => {
        const newExpanded = new Set(expandedUsers);
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
        } else {
            newExpanded.add(userId);
        }
        setExpandedUsers(newExpanded);
    };

    const filteredUsers = groupedUsers.filter(user =>
        user.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        totalUsers: groupedUsers.length,
        totalRecharges: groupedUsers.reduce((acc, u) => acc + u.recharges.length, 0),
        totalVolume: groupedUsers.reduce((acc, u) => acc + u.totalAmount, 0)
    };

    return (
        <div className="min-h-screen bg-[#F8F9FD] flex">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <Menu size={24} className="text-gray-600" />
                        </button>
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                            Manager / <span className="text-indigo-600">Recharge Users</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 p-1 rounded-full border-2 border-indigo-100 overflow-hidden">
                            <img src="/logo.png" alt="Admin" className="w-full h-full object-contain" />
                        </div>
                    </div>
                </header>

                <main className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
                    {/* Stats Horizontal Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Users</p>
                                <p className="text-xl font-black text-gray-900 leading-none">{stats.totalUsers}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <History size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Recharges</p>
                                <p className="text-xl font-black text-gray-900 leading-none">{stats.totalRecharges}</p>
                            </div>
                        </div>
                        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 p-4 rounded-2xl shadow-lg shadow-indigo-600/20 text-white flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest leading-none mb-1">Verified Volume</p>
                                <p className="text-xl font-black leading-none truncate">ETB {stats.totalVolume.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by phone number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium text-gray-900 shadow-sm"
                        />
                    </div>

                    {/* Grouped User List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-indigo-600" size={40} />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Recharges...</p>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.userId}
                                    className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all"
                                >
                                    <div
                                        onClick={() => toggleExpand(user.userId)}
                                        className="p-4 md:p-6 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-gray-50 bg-gray-100 flex-shrink-0">
                                            <img
                                                src="/avator profile.jpg"
                                                alt="User"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-black text-gray-900 truncate">
                                                    {user.phoneNumber || "Unknown"}
                                                </h3>
                                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                                    <BadgeCheck size={10} />
                                                    Verified
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">
                                                {user.recharges.length} {user.recharges.length === 1 ? 'Recharge' : 'Recharges'}
                                            </p>
                                        </div>
                                        <div className="text-right px-4 hidden sm:block">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Recharged</p>
                                            <p className="font-black text-indigo-600">ETB {user.totalAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                                            {expandedUsers.has(user.userId) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {/* Expandable History */}
                                    {expandedUsers.has(user.userId) && (
                                        <div className="px-4 pb-6 md:px-6 animate-in slide-in-from-top-2 duration-200">
                                            <div className="border-t border-gray-50 pt-6 space-y-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <CreditCard size={12} />
                                                    Recharge History
                                                </p>
                                                {user.recharges.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map((rec) => (
                                                    <div key={rec.id} className="bg-gray-50/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-100/50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100">
                                                                <CheckCircle2 size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">ETB {rec.amount.toLocaleString()}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    {rec.FTcode ? `FT: ${rec.FTcode}` : rec.bankName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                                                            <div className="flex flex-col md:items-end">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <Calendar size={10} />
                                                                    {rec.timestamp?.toDate ? rec.timestamp.toDate().toLocaleDateString() : 'N/A'}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-gray-400">
                                                                    {rec.timestamp?.toDate ? rec.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </p>
                                                            </div>
                                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl border border-indigo-50 shadow-sm">
                                                                {rec.paymentMethod}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
                                <CreditCard size={48} className="mb-4 opacity-20" />
                                <p className="font-bold uppercase tracking-widest text-[10px]">No verified recharges found</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
