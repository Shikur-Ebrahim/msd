"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Package,
    Edit2,
    Trash2,
    X,
    UploadCloud,
    Loader2,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Clock,
    DollarSign,
    PartyPopper,
    Calendar,
    ChevronRight,
    Menu
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    addDoc
} from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const CATEGORIES = ["Weekend Special", "Flash Sale", "Limited Edition"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function WeekendProductsPage() {
    // --- State ---
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("Weekend Special");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        price: 0,
        dailyIncome: 0,
        contractPeriod: 0,
        category: "Weekend Special",
        description: "",
        purchaseLimit: 1,
        imageUrl: "",
        activeDays: [] as string[],
        startTime: "00:00",
        endTime: "23:59",
        salesTracker: 80, // Default 80%
        withdrawalDays: 30, // Default 30 days
        rewardPercent: 10, // Default 10%
    });

    // Calculated Fields (displayed in UI)
    const dailyRate = formData.price > 0 ? (formData.dailyIncome / formData.price) * 100 : 0;
    const totalProfit = formData.dailyIncome * formData.contractPeriod;
    const rewardAmount = (formData.price * formData.rewardPercent) / 100;

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    // Message State
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Effects ---
    useEffect(() => {
        const q = query(collection(db, "WeekendProducts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ["name", "category", "description", "imageUrl", "startTime", "endTime"].includes(name)
                ? value
                : Number(value)
        }));
    };

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            activeDays: prev.activeDays.includes(day)
                ? prev.activeDays.filter(d => d !== day)
                : [...prev.activeDays, day]
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus("Uploading...");

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: uploadData }
            );
            const data = await response.json();
            if (data.secure_url) {
                setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
                setUploadStatus("Success!");
            } else {
                setUploadStatus("Failed. Check Config.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus("Error occurred.");
        } finally {
            setIsUploading(false);
            setTimeout(() => setUploadStatus(null), 3000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMsg(null);

        try {
            const productData = {
                ...formData,
                dailyRate: Number(dailyRate.toFixed(2)),
                totalProfit: Number(totalProfit.toFixed(2)),
                rewardAmount: Number(rewardAmount.toFixed(2)),
                updatedAt: serverTimestamp(),
                createdAt: modalMode === "create" ? serverTimestamp() : editingProduct.createdAt
            };

            if (modalMode === "create") {
                await addDoc(collection(db, "WeekendProducts"), productData);
                setStatusMsg({ type: "success", text: "Weekend product created!" });
            } else {
                await setDoc(doc(db, "WeekendProducts", editingProduct.id), productData);
                setStatusMsg({ type: "success", text: "Weekend product updated!" });
            }

            setTimeout(() => {
                setIsModalOpen(false);
                resetForm();
            }, 1500);
        } catch (error: any) {
            console.error("Submit error:", error);
            setStatusMsg({ type: "error", text: error.message || "Failed to save product" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this weekend product?")) return;
        try {
            await deleteDoc(doc(db, "WeekendProducts", id));
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const openEditModal = (product: any) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price,
            dailyIncome: product.dailyIncome,
            contractPeriod: product.contractPeriod,
            category: product.category,
            description: product.description || "",
            purchaseLimit: product.purchaseLimit || 1,
            imageUrl: product.imageUrl || "",
            activeDays: product.activeDays || [],
            startTime: product.startTime || "00:00",
            endTime: product.endTime || "23:59",
            salesTracker: product.salesTracker || 80,
            withdrawalDays: product.withdrawalDays || 30,
            rewardPercent: product.rewardPercent || 10,
        });
        setModalMode("edit");
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            price: 0,
            dailyIncome: 0,
            contractPeriod: 0,
            category: "Weekend Special",
            description: "",
            purchaseLimit: 1,
            imageUrl: "",
            activeDays: [],
            startTime: "00:00",
            endTime: "23:59",
            salesTracker: 80,
            withdrawalDays: 30,
            rewardPercent: 10,
        });
        setEditingProduct(null);
        setModalMode("create");
        setStatusMsg(null);
    };

    const filteredProducts = products.filter(p => {
        const matchesCat = (p.category || "Weekend Special") === activeFilter;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="flex min-h-screen bg-[#FDFCFB]">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                {/* Navbar */}
                <header className="sticky top-0 bg-white/60 backdrop-blur-xl border-b border-orange-50 px-6 py-4 flex items-center justify-between z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 hover:bg-orange-50 rounded-xl transition-colors"
                    >
                        <Menu size={24} className="text-orange-600" />
                    </button>
                    <div className="hidden md:block">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
                            Admin / <span className="text-orange-500">Weekend Lab</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100 hidden sm:flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">System Active</span>
                        </div>
                        <div className="w-10 h-10 p-1 rounded-2xl border-2 border-orange-100 overflow-hidden bg-white hover:rotate-6 transition-transform">
                            <img src="/logo.png" alt="Admin" className="w-full h-full object-contain" />
                        </div>
                    </div>
                </header>

                <div className="p-8 lg:p-12 overflow-y-auto">
                    {/* Hero Section */}
                    <div className="relative mb-12">
                        <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <div className="flex items-center gap-3 text-orange-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3">
                                    <PartyPopper size={14} />
                                    <span>Weekly Collections</span>
                                </div>
                                <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4">
                                    Weekend <br /> <span className="text-orange-500">Products.</span>
                                </h1>
                                <p className="text-slate-500 font-medium max-w-md text-lg">
                                    Curate and schedule exclusive investment plans that only go live during your specified windows.
                                </p>
                            </div>

                            <button
                                onClick={() => { resetForm(); setModalMode("create"); setIsModalOpen(true); }}
                                className="group bg-slate-900 hover:bg-orange-500 text-white px-8 py-5 rounded-3xl font-black flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:shadow-orange-500/30 transition-all active:scale-95 w-fit"
                            >
                                <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                                CREATE COLLECTION
                            </button>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-50 mb-10 flex flex-col xl:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl w-full xl:w-auto overflow-x-auto no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveFilter(cat)}
                                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === cat
                                        ? "bg-white text-orange-600 shadow-lg shadow-orange-500/10 scale-105"
                                        : "text-slate-400 hover:text-slate-600"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full xl:w-96 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search collection..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-slate-50 border-0 outline-none focus:ring-2 focus:ring-orange-500/10 placeholder:text-slate-300 font-bold"
                            />
                        </div>
                    </div>

                    {/* Product Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6">
                            <div className="relative">
                                <Loader2 className="animate-spin text-orange-500 w-16 h-16" />
                                <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 animate-pulse"></div>
                            </div>
                            <p className="text-slate-400 font-black tracking-[0.4em] uppercase text-[10px]">Accessing Secure Vault...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-50">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Package className="text-slate-200 w-12 h-12" />
                            </div>
                            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">No items in {activeFilter}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="group bg-white rounded-[3.5rem] p-8 shadow-sm hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-500 relative flex flex-col">
                                    {/* Availability Tag */}
                                    <div className="absolute top-8 right-8 z-10">
                                        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={12} className="text-orange-400" />
                                            {product.startTime} - {product.endTime}
                                        </div>
                                    </div>

                                    {/* Image Section */}
                                    <div className="aspect-[16/11] bg-slate-50 rounded-[2.5rem] overflow-hidden mb-8 relative">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <Package size={64} strokeWidth={1} />
                                            </div>
                                        )}

                                        {/* Days indicators */}
                                        <div className="absolute bottom-4 left-4 right-4 flex gap-1">
                                            {DAYS.map(day => {
                                                const isActive = product.activeDays?.includes(day);
                                                return (
                                                    <div
                                                        key={day}
                                                        className={`flex-1 h-1 rounded-full ${isActive ? 'bg-orange-500' : 'bg-white/20'}`}
                                                        title={day}
                                                    ></div>
                                                );
                                            })}
                                        </div>

                                        <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-6 backdrop-blur-sm">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="w-16 h-16 bg-white text-slate-900 rounded-3xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all transform hover:-translate-y-2 hover:rotate-3 shadow-2xl"
                                            >
                                                <Edit2 size={24} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="w-16 h-16 bg-white text-rose-500 rounded-3xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all transform hover:-translate-y-2 hover:-rotate-3 shadow-2xl"
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="px-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{product.category}</span>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.contractPeriod} Days Cycle</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">{product.name}</h3>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Capital</p>
                                                <p className="text-xl font-black text-slate-900">{product.price?.toLocaleString()} <span className="text-xs opacity-40">ETB</span></p>
                                            </div>
                                            <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100/50">
                                                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1.5">Yield</p>
                                                <p className="text-xl font-black text-orange-600">{product.dailyIncome?.toLocaleString()} <span className="text-xs opacity-40">ETB</span></p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp size={18} className="text-orange-400" />
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Total Profit</span>
                                            </div>
                                            <span className="text-lg font-black text-orange-400">{product.totalProfit?.toLocaleString()} ETB</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 md:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-2xl h-full md:h-auto md:max-h-[94vh] md:rounded-[3.5rem] shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
                        {/* Modal Header */}
                        <div className="px-10 py-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
                            <div>
                                <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div>
                                    {modalMode === "create" ? "NEW PRODUCT" : "UPDATE PRODUCT"}
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                    Product Parameters
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-14 h-14 rounded-2xl bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center active:scale-90 shadow-sm border border-slate-100"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                            <form className="space-y-12">
                                {/* Visual Upload */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Product Identity</label>
                                    <div className="flex items-start gap-6">
                                        <div className="w-24 h-24 rounded-[2rem] bg-slate-50 overflow-hidden shrink-0 border-2 border-slate-100 relative group/img">
                                            {formData.imageUrl ? (
                                                <img src={formData.imageUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                    <Package size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="relative group/upload">
                                                <input
                                                    type="file"
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    accept="image/*"
                                                />
                                                <div className={`px-6 py-4 rounded-2xl border-2 border-dashed flex items-center gap-3 transition-all ${isUploading ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 group-hover/upload:border-orange-500 group-hover/upload:bg-orange-50'}`}>
                                                    {isUploading ? <Loader2 className="animate-spin text-orange-500" /> : <UploadCloud className="text-slate-400 group-hover/upload:text-orange-500" />}
                                                    <span className="text-sm font-black text-slate-500 group-hover/upload:text-orange-600">
                                                        {uploadStatus || "Upload product visual"}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium italic">Recommended ratio 16:11. PNG, JPG or WebP.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Core fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Label</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Item Name"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white outline-none transition-all font-black text-lg"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Collection</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white outline-none transition-all font-black text-lg appearance-none cursor-pointer"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Price (ETB)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white outline-none transition-all font-black text-xl"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Daily (ETB)</label>
                                        <input
                                            type="number"
                                            name="dailyIncome"
                                            value={formData.dailyIncome}
                                            onChange={handleInputChange}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white outline-none transition-all font-black text-xl text-orange-600"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Cycle (Days)</label>
                                        <input
                                            type="number"
                                            name="contractPeriod"
                                            value={formData.contractPeriod}
                                            onChange={handleInputChange}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white outline-none transition-all font-black text-xl"
                                        />
                                    </div>
                                </div>

                                {/* Scheduling System */}
                                <div className="space-y-6 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Activation Schedule</label>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map(day => {
                                            const active = formData.activeDays.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                                                >
                                                    {day.substring(0, 3)}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Start Time</p>
                                            <input
                                                type="time"
                                                name="startTime"
                                                value={formData.startTime}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-orange-500/50 font-black text-white"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">End Time</p>
                                            <input
                                                type="time"
                                                name="endTime"
                                                value={formData.endTime}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-orange-500/50 font-black text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking & Withdrawal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Sales Tracker (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="salesTracker"
                                                value={formData.salesTracker}
                                                onChange={handleInputChange}
                                                max="100"
                                                min="0"
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white outline-none transition-all font-black text-xl"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 px-1">Percentage to show when timed out</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Withdrawal Time</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="withdrawalDays"
                                                value={formData.withdrawalDays}
                                                onChange={handleInputChange}
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white outline-none transition-all font-black text-xl"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Days</span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 px-1">Days before withdrawal is allowed</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Reward Percent (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="rewardPercent"
                                                value={formData.rewardPercent}
                                                onChange={handleInputChange}
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white outline-none transition-all font-black text-xl text-orange-600"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                                        </div>
                                        <p className="text-[10px] text-orange-600 font-bold px-1 mt-2">
                                            Reward Amount: {rewardAmount.toLocaleString()} ETB
                                        </p>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-orange-50/50 rounded-[2rem] p-8 border border-orange-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected ROI</p>
                                        <p className="text-3xl font-black text-slate-900">{dailyRate.toFixed(2)}% <span className="text-xs text-orange-500 tracking-normal ml-2">DAILY PROFIT</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Yield</p>
                                        <p className="text-3xl font-black text-slate-900">{totalProfit.toLocaleString()} <span className="text-xs text-slate-400 tracking-normal ml-1">ETB</span></p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-10 py-10 border-t border-slate-50 bg-white shrink-0">
                            {statusMsg && (
                                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                    {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    {statusMsg.text}
                                </div>
                            )}
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-5 rounded-[2rem] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isUploading}
                                    className={`flex-1 px-10 py-5 rounded-[2rem] font-black text-white shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isSubmitting || isUploading ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-orange-600 shadow-orange-500/30 hover:bg-slate-900 hover:shadow-slate-900/30'}`}
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <>
                                            <ChevronRight size={20} />
                                            {modalMode === "create" ? "COMMIT TO VAULT" : "UPDATE ARCHIVE"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
