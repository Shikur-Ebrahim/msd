"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Bell,
    Calendar,
    Clock,
    MessageSquare,
    Save,
    ShieldAlert,
    ToggleLeft,
    ToggleRight,
    Loader2,
    Eye
} from "lucide-react";

export default function WeekendNotificationSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [isEnabled, setIsEnabled] = useState(false);
    const [targetDays, setTargetDays] = useState<string[]>(["Saturday"]);
    const [maxViews, setMaxViews] = useState(1);
    const [title, setTitle] = useState("Weekend Special!");
    const [message, setMessage] = useState("Don't miss out on our exclusive weekend products.");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "SystemSettings", "weekendProductNotification");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setIsEnabled(data.isEnabled ?? false);
                    setTargetDays(data.targetDays || (data.targetDay ? [data.targetDay] : ["Saturday"]));
                    setMaxViews(data.maxViews ?? 1);
                    setTitle(data.title ?? "Weekend Special!");
                    setMessage(data.message ?? "Don't miss out on our exclusive weekend products.");
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "SystemSettings", "weekendProductNotification"), {
                isEnabled,
                targetDays, // Array of days
                maxViews: Number(maxViews),
                title,
                message,
                updatedAt: new Date()
            });
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (day: string) => {
        if (targetDays.includes(day)) {
            setTargetDays(prev => prev.filter(d => d !== day));
        } else {
            setTargetDays(prev => [...prev, day]);
        }
    };

    const daysOfWeek = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-blue-900 tracking-tight">Weekend Notification</h1>
                        <p className="text-gray-500 mt-2">Configure when and how the weekend product alert appears to users.</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                        <Bell size={24} />
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-blue-50 overflow-hidden">
                    <div className="p-8 space-y-8">

                        {/* Enable Toggle */}
                        <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900">Notification Status</h3>
                                    <p className="text-xs text-gray-500 font-medium">Toggle this off to hide the alert completely.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEnabled(!isEnabled)}
                                className={`transition-colors duration-300 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}
                            >
                                {isEnabled ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                            </button>
                        </div>

                        {/* Timing Configuration */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} />
                                Active Days
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {daysOfWeek.map(d => {
                                    const isActive = targetDays.includes(d);
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => toggleDay(d)}
                                            className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                }`}
                                        >
                                            {d.substring(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium pl-1">
                                Notification time is automatically synchronized with the earliest product start time for strictly selected days.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Eye size={14} />
                                Max Views / Day
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={maxViews}
                                onChange={(e) => setMaxViews(Number(e.target.value))}
                                className="w-full h-14 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-bold text-blue-900 transition-all"
                            />
                        </div>

                        {/* Content Configuration */}
                        <div className="space-y-6 pt-4 border-t border-gray-100">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={14} />
                                    Notification Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Weekend Sales Live!"
                                    className="w-full h-14 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-bold text-blue-900 transition-all placeholder:font-normal"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    Message Body
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="e.g. Check out our new high-yield products..."
                                    className="w-full h-32 px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-medium text-blue-900 transition-all resize-none placeholder:font-normal"
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-14 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Configuration
                                </>
                            )}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}
