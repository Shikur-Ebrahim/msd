"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, X, Trophy, Crown, Sparkles, Star, Gem, Medal } from "lucide-react";

interface VipCelebrationCardProps {
    vipLevel: number;
    text: string;
    imageUrl: string;
    onClose: () => void;
}

const THEMES: Record<number, {
    primary: string;
    secondary: string;
    accent: string;
    icon: any;
    label: string;
    glow: string;
    shadow: string;
}> = {
    1: {
        primary: "from-blue-100 to-blue-200",
        secondary: "bg-blue-600",
        accent: "text-blue-900",
        icon: Medal,
        label: "Certified Associate",
        glow: "rgba(37, 99, 235, 0.2)",
        shadow: "shadow-blue-600/20"
    },
    2: {
        primary: "from-green-100 to-green-200",
        secondary: "bg-green-600",
        accent: "text-green-900",
        icon: Star,
        label: "Medical Specialist",
        glow: "rgba(22, 163, 74, 0.2)",
        shadow: "shadow-green-600/20"
    },
    3: {
        primary: "from-blue-200 to-blue-300",
        secondary: "bg-blue-800",
        accent: "text-blue-900",
        icon: Trophy,
        label: "Senior Consultant",
        glow: "rgba(30, 58, 138, 0.2)",
        shadow: "shadow-blue-800/20"
    },
    4: {
        primary: "from-orange-100 top-orange-200",
        secondary: "bg-orange-500",
        accent: "text-orange-900",
        icon: Gem,
        label: "Chief of Medicine",
        glow: "rgba(249, 115, 22, 0.2)",
        shadow: "shadow-orange-500/20"
    },
    5: {
        primary: "from-green-200 to-green-400",
        secondary: "bg-green-700",
        accent: "text-green-950",
        icon: Crown,
        label: "Healthcare Director",
        glow: "rgba(21, 128, 61, 0.2)",
        shadow: "shadow-green-700/20"
    }
};

const DEFAULT_THEME = {
    primary: "from-blue-900 via-blue-950 to-black",
    secondary: "bg-blue-900",
    accent: "text-blue-100",
    icon: Crown,
    label: "Medical Board Executive",
    glow: "rgba(30, 58, 138, 0.5)",
    shadow: "shadow-blue-900/40"
};

export default function VipCelebrationCard({ vipLevel, text, imageUrl, onClose }: VipCelebrationCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const theme = THEMES[vipLevel] || DEFAULT_THEME;
    const Icon = theme.icon;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 overflow-hidden"
                >
                    {/* Medical Backdrop */}
                    <div
                        className="absolute inset-0 bg-white/95 backdrop-blur-3xl"
                        onClick={onClose}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1],
                            }}
                            transition={{ duration: 5, repeat: Infinity }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div className="w-[80vw] h-[80vw] rounded-full" style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }} />
                        </motion.div>
                    </div>

                    {/* Celebration Content */}
                    <motion.div
                        initial={{ scale: 0.8, y: 100, rotateX: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, rotateX: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 50, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                        className={`relative w-full max-w-xl bg-white rounded-[3.5rem] overflow-hidden shadow-2xl ${theme.shadow} border-4 border-blue-50`}
                    >
                        {/* High-End Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 z-30 w-12 h-12 rounded-2xl bg-blue-50/50 backdrop-blur-2xl flex items-center justify-center text-blue-900 hover:bg-blue-100 transition-all border border-blue-100 active:scale-90 shadow-xl"
                        >
                            <X size={24} strokeWidth={3} />
                        </button>

                        {/* Visual Experience Header */}
                        <div className="relative aspect-[16/11] overflow-hidden">
                            <motion.img
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 1.5 }}
                                src={imageUrl}
                                alt="Celebration"
                                className="w-full h-full object-cover"
                            />

                            {/* Layered Overlays for Depth */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-white via-transparent to-blue-900/20`} />
                            <div className={`absolute inset-0 bg-gradient-to-br ${theme.primary} mix-blend-overlay opacity-60`} />

                            {/* Animated Level Badge */}
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="absolute top-0 left-0 right-0 pt-16 flex flex-col items-center"
                            >
                                <div className={`relative ${theme.secondary} px-10 py-3 rounded-full shadow-2xl border-2 border-white/50 flex items-center gap-4 overflow-hidden group`}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <Icon className="text-white" size={22} fill="currentColor" />
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mb-1">Medical Standing</span>
                                        <span className="text-sm font-black text-white uppercase tracking-[0.1em]">TIER {vipLevel} ADVISOR</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floating Sparkles & Particles */}
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [-20, 20, -20],
                                        x: [-10, 10, -10],
                                        opacity: [0.2, 0.6, 0.2],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        duration: 3 + i,
                                        repeat: Infinity,
                                        delay: i * 0.5,
                                    }}
                                    className="absolute text-white pointer-events-none"
                                    style={{
                                        top: `${20 + (i * 12)}%`,
                                        left: `${15 + (i * 15)}%`,
                                    }}
                                >
                                    <Sparkles size={16 + (i * 2)} fill="currentColor" />
                                </motion.div>
                            ))}
                        </div>

                        {/* Messaging and Action */}
                        <div className="px-12 pt-14 pb-14 text-center space-y-10 relative">
                            {/* Theme-Specific Label */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="inline-flex items-center gap-3 px-6 py-2 rounded-xl bg-blue-50 border border-blue-100 shadow-sm"
                            >
                                <PartyPopper className="text-blue-900" size={16} />
                                <span className="text-[10px] font-black text-blue-900 uppercase tracking-[0.4em]">{theme.label}</span>
                            </motion.div>

                            <div className="space-y-4">
                                <h1 className="text-4xl font-black text-blue-900 tracking-tight flex flex-col leading-none">
                                    <span className="text-sm font-black text-green-600 uppercase tracking-[0.5em] mb-3">Health Milestone</span>
                                    PRACTICE EXCELLENCE!
                                </h1>
                                <p className="text-blue-900/60 font-bold leading-relaxed text-base px-4">
                                    {text}
                                </p>
                            </div>

                            {/* Mega Interactive Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className={`w-full bg-gradient-to-r ${theme.primary} text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl relative overflow-hidden group`}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20" />
                                <span className="relative z-10 flex items-center justify-center gap-4">
                                    <Trophy size={20} className="group-hover:rotate-12 transition-transform" />
                                    ACKNOWLEDGE STATUS
                                    <Crown size={20} className="group-hover:-rotate-12 transition-transform" />
                                </span>
                            </motion.button>
                        </div>

                        {/* Luxury Accents */}
                        <div className={`absolute -bottom-20 -right-20 w-80 h-80 ${theme.secondary} rounded-full blur-[100px] opacity-10`} />
                        <div className={`absolute -top-20 -left-20 w-80 h-80 ${theme.secondary} rounded-full blur-[100px] opacity-10`} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
