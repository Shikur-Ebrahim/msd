"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Package,
    Edit2,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Menu,
    BarChart3
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const CATEGORIES = ["LEVEL A", "LEVEL B", "LEVEL C", "VIP"];

export default function AdminProductTrackedPage() {
    // --- State ---
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("LEVEL A");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        showTracking: false,
        trackingTarget: 100,
        trackingCurrent: 0
    });

    // Message State
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Effects ---
    useEffect(() => {
        const q = query(collection(db, "Products"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : Number(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        setIsSubmitting(true);
        setStatusMsg(null);

        try {
            const productRef = doc(db, "Products", editingProduct.id);
            await updateDoc(productRef, {
                showTracking: formData.showTracking,
                trackingTarget: formData.trackingTarget,
                trackingCurrent: formData.trackingCurrent,
                updatedAt: serverTimestamp()
            });

            setStatusMsg({ type: "success", text: "Tracking settings updated!" });

            setTimeout(() => {
                setIsModalOpen(false);
                setEditingProduct(null);
                setStatusMsg(null);
            }, 1000);
        } catch (error: any) {
            console.error("Submit error:", error);
            setStatusMsg({ type: "error", text: error.message || "Failed to update tracking" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (product: any) => {
        setEditingProduct(product);
        setFormData({
            showTracking: product.showTracking || false,
            trackingTarget: product.trackingTarget || 100,
            trackingCurrent: product.trackingCurrent || 0
        });
        setIsModalOpen(true);
    };

    const filteredProducts = products.filter(p => {
        const matchesCat = (p.category || "LEVEL A") === activeFilter;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                {/* Navbar */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <Menu size={24} className="text-gray-600" />
                    </button>
                    <div className="hidden md:block">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                            Manager / <span className="text-indigo-600">Tracking</span>
                        </h2>
                    </div>
                    <div className="w-10 h-10 p-1 rounded-full border-2 border-indigo-100 overflow-hidden">
                        <img src="/logo.png" alt="Admin" className="w-full h-full object-contain" />
                    </div>
                </header>

                <div className="p-8 overflow-y-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
                                <span>Manager</span>
                                <span className="text-gray-300">/</span>
                                <span>Sales Tracking</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Product Progress <BarChart3 className="text-indigo-600 w-8 h-8" />
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Manage sales tracking bars for user display.</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveFilter(cat)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === cat
                                        ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100"
                                        : "text-slate-400 hover:text-slate-600"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-0 outline-none focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-400 font-medium"
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <Package className="text-slate-200 w-20 h-20 mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No products found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredProducts.map(product => {
                                const progress = product.trackingTarget > 0
                                    ? Math.min(100, Math.max(0, ((product.trackingCurrent || 0) / product.trackingTarget) * 100))
                                    : 0;

                                return (
                                    <div key={product.id} className="group bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-600/5 transition-all duration-300 flex flex-col">

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-full h-full p-4 text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${product.showTracking ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {product.showTracking ? 'Active' : 'Hidden'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{product.category}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-1">{product.name}</h3>
                                            </div>
                                        </div>

                                        {/* Tracking Preview */}
                                        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                                                <span className="text-sm font-black text-indigo-600">{progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-slate-400">
                                                <span>{product.trackingCurrent?.toLocaleString() || 0} Sold</span>
                                                <span>Target: {product.trackingTarget?.toLocaleString() || 100}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="mt-auto w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit2 size={16} />
                                            Update Tracking
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Tracking Settings</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-indigo-100 transition-all cursor-pointer" onClick={() => setFormData(p => ({ ...p, showTracking: !p.showTracking }))}>
                                <div>
                                    <h3 className="font-bold text-slate-900">Enable Tracking Bar</h3>
                                    <p className="text-xs text-slate-500 font-medium">Show progress bar on user styling.</p>
                                </div>
                                <div className={`w-12 h-7 rounded-full transition-colors relative ${formData.showTracking ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${formData.showTracking ? 'left-6' : 'left-1'}`}></div>
                                </div>
                                {/* Hidden checkbox for form logic if needed, but state handles it */}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Current Sales</label>
                                    <input
                                        type="number"
                                        name="trackingCurrent"
                                        value={formData.trackingCurrent}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-600/20 focus:bg-white outline-none font-bold text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Target Sales</label>
                                    <input
                                        type="number"
                                        name="trackingTarget"
                                        value={formData.trackingTarget}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-600/20 focus:bg-white outline-none font-bold text-slate-900"
                                    />
                                </div>
                            </div>

                            {statusMsg && (
                                <div className={`flex items-center gap-2 font-bold text-sm ${statusMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    {statusMsg.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <TrendingUp size={20} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
