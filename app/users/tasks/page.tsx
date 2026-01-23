"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    ChevronLeft,
    RefreshCcw,
    Trophy,
    Gamepad2,
    Star,
    Zap,
    Lock,
    Play,
    CheckCircle2,
    Loader2,
    X,
    RotateCw,
    Info,
    Sparkles,
    HandMetal,
    ArrowRight,
    Wallet
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
    id: string;
    name: string;
    type: string;
    reward_type: 'fixed' | 'random';
    reward_value: number | { min: number; max: number };
    daily_limit: number;
    is_active: boolean;
    icon: string;
    color: string;
    description: string;
    accent: string;
}

const DEFAULT_TASKS: Task[] = [
    { id: 'spin_wheel', name: 'Lucky Spin', type: 'spin', reward_type: 'random', reward_value: { min: 5, max: 100 }, daily_limit: 5, is_active: true, icon: '🎡', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Spin the golden wheel for instant stars.' },
    { id: 'scratch_card', name: 'Magic Scratch', type: 'scratch', reward_type: 'random', reward_value: { min: 10, max: 150 }, daily_limit: 3, is_active: true, icon: '🃏', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Scratch and reveal your hidden treasure.' },
    { id: 'mini_quiz', name: 'Brain IQ', type: 'quiz', reward_type: 'fixed', reward_value: 20, daily_limit: 10, is_active: true, icon: '🧠', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Answer correctly to win instant rewards.' },
    { id: 'memory_card', name: 'Memory Match', type: 'memory', reward_type: 'random', reward_value: { min: 15, max: 200 }, daily_limit: 3, is_active: true, icon: '🧩', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Match the symbols to claim the prize.' },
    { id: 'daily_checklist', name: 'Daily Check', type: 'checklist', reward_type: 'fixed', reward_value: 50, daily_limit: 1, is_active: true, icon: '📅', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Sign in daily to claim your bonus.' },
    { id: 'word_scramble', name: 'Word Master', type: 'word', reward_type: 'fixed', reward_value: 30, daily_limit: 5, is_active: true, icon: '📚', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Unscramble the word to earn stars.' },
    { id: 'math_rush', name: 'Math Rush', type: 'math', reward_type: 'random', reward_value: { min: 20, max: 80 }, daily_limit: 10, is_active: true, icon: '➕', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Solve quick math problems.' },
    { id: 'treasure_hunt', name: 'Vault Hunt', type: 'treasure', reward_type: 'random', reward_value: { min: 50, max: 500 }, daily_limit: 2, is_active: true, icon: '💎', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Pick a chest to find hidden stars.' },
    { id: 'coin_flip', name: 'Flip N Win', type: 'coin', reward_type: 'fixed', reward_value: 15, daily_limit: 15, is_active: true, icon: '🪙', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Guess Head or Tail for stars.' },
    { id: 'rps_battle', name: 'RPS Battle', type: 'rps', reward_type: 'fixed', reward_value: 25, daily_limit: 10, is_active: true, icon: '✂️', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Win Rock Paper Scissors vs AI.' },
    { id: 'number_guess', name: 'Number Guru', type: 'guess', reward_type: 'random', reward_value: { min: 10, max: 100 }, daily_limit: 8, is_active: true, icon: '🔢', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Guess the lucky number from 1-10.' },
    { id: 'color_tap', name: 'Color Dash', type: 'color', reward_type: 'fixed', reward_value: 20, daily_limit: 12, is_active: true, icon: '🎨', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Tap the color that matches the prompt.' },
    { id: 'fast_clicker', name: 'Fast Tap', type: 'clicker', reward_type: 'random', reward_value: { min: 5, max: 150 }, daily_limit: 5, is_active: true, icon: '⚡', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Tap as fast as you can!' },
    { id: 'dice_roller', name: 'Lucky Dice', type: 'dice', reward_type: 'random', reward_value: { min: 10, max: 120 }, daily_limit: 7, is_active: true, icon: '🎲', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Roll the dice for star rewards.' },
    { id: 'slot_machine', name: 'Star Slots', type: 'slots', reward_type: 'random', reward_value: { min: 10, max: 1000 }, daily_limit: 3, is_active: true, icon: '🎰', color: 'from-[#D4AF37] to-[#AA8B24]', accent: 'bg-[#D4AF37]/10 text-[#D4AF37]', description: 'Spin the slots for a huge jackpot!' }
];

// --- Mini Game Components ---

const SpinWheel = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const sectors = useState(() => {
        if (config.reward_type === 'fixed') {
            const val = config.reward_value as number;
            return [val, val, val, val, val, val, val, val];
        }
        const { min, max } = config.reward_value as { min: number; max: number };
        return Array.from({ length: 8 }, () => Math.floor(Math.random() * (max - min + 1)) + min);
    })[0];

    const spin = () => {
        if (spinning) return;
        setSpinning(true);
        const extraDegrees = Math.floor(Math.random() * 360) + 2160;
        const newRotation = rotation + extraDegrees;
        setRotation(newRotation);

        setTimeout(() => {
            setSpinning(false);
            const actualRotation = newRotation % 360;
            const winningIndex = (6 - Math.round(actualRotation / 45) % 8 + 8) % 8;
            onComplete(sectors[winningIndex]);
        }, 3000);
    };

    return (
        <div className="flex flex-col items-center gap-10 py-6">
            <div className="relative w-72 h-72">
                <div className="absolute top-0 left-1/2 -ml-3.5 -mt-6 w-7 h-10 bg-[#D4AF37] z-30 clip-path-triangle shadow-[0_4px_10px_rgba(212,175,55,0.4)]"></div>
                <div className="w-full h-full rounded-full border-[10px] border-[#1A1A1A] shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden transition-transform duration-[3000ms] cubic-bezier(0.13, 0.99, 0.3, 1) ring-1 ring-[#D4AF37]/20" style={{ transform: `rotate(${rotation}deg)` }}>
                    {sectors.map((val, i) => (
                        <div
                            key={i}
                            className="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-end pr-12"
                            style={{
                                transform: `rotate(${i * 45}deg)`,
                                backgroundColor: i % 2 === 0 ? '#0A0A0A' : '#141414'
                            }}
                        >
                            <div className="flex flex-col items-center justify-center transform -rotate-90 translate-x-6">
                                <span className="text-[12px] font-black text-[#D4AF37] leading-none mb-1">{val}</span>
                                <Star size={10} className="text-[#D4AF37]" fill="currentColor" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#1A1A1A] rounded-full border-4 border-[#D4AF37] shadow-2xl flex items-center justify-center z-20">
                    <Star size={24} className="text-[#D4AF37] fill-[#D4AF37]" />
                </div>
            </div>
            <button onClick={spin} disabled={spinning} className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 text-xs ${spinning ? 'bg-slate-800 text-slate-500' : 'bg-[#D4AF37] text-black shadow-[#D4AF37]/20'}`}>
                {spinning ? 'Spinning...' : 'Run Protocol'}
            </button>
        </div>
    );
};

const ScratchCard = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scratched, setScratched] = useState(false);
    const [reward] = useState(() => {
        if (config.reward_type === 'fixed') return config.reward_value as number;
        const { min, max } = config.reward_value as { min: number; max: number };
        return Math.floor(Math.random() * (max - min + 1)) + min;
    });
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#1A1A1A'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#D4AF3733'; for (let i = 0; i < 500; i++) ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        ctx.font = 'black 12px sans-serif'; ctx.fillStyle = '#D4AF37'; ctx.textAlign = 'center'; ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2 + 5);
    }, []);

    const scratch = (e: any) => {
        if (scratched) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left);
        const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top);
        ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill();
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let clearPixels = 0; for (let i = 3; i < imageData.data.length; i += 4) if (imageData.data[i] === 0) clearPixels++;
        if (clearPixels > (canvas.width * canvas.height) * 0.45) {
            setScratched(true);
            setTimeout(() => onComplete(reward), 1000);
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 py-6">
            <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2 border-[#D4AF37]/20">
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4">
                    <Trophy size={56} className="text-[#D4AF37] animate-bounce" />
                    <div className="text-center">
                        <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{reward}</span>
                        <span className="text-xs font-black text-[#D4AF37] ml-2 uppercase tracking-widest">Stars</span>
                    </div>
                </div>
                <canvas ref={canvasRef} width={400} height={225} className="absolute inset-0 cursor-crosshair touch-none mix-blend-normal" onMouseDown={() => setIsDrawing(true)} onMouseUp={() => setIsDrawing(false)} onMouseMove={(e) => isDrawing && scratch(e)} onTouchStart={() => setIsDrawing(true)} onTouchEnd={() => setIsDrawing(false)} onTouchMove={(e) => isDrawing && scratch(e)} />
            </div>
            <p className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.4em] animate-pulse">Manual Decryption in Progress</p>
        </div>
    );
};

const MiniQuiz = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const questions = [
        { q: "What is 25 + 75?", a: "100", o: ["90", "100", "110", "120"] },
        { q: "The 'Golden Ratio' is around?", a: "1.618", o: ["1.414", "1.618", "3.141", "2.718"] },
        { q: "Wealth asset 'XAU' is?", a: "Gold", o: ["Silver", "Gold", "Oil", "Zen"] },
        { q: "Zen protocol uses?", a: "Stars", o: ["Coins", "Tokens", "Stars", "Credits"] }
    ];
    const [currentQ] = useState(questions[Math.floor(Math.random() * questions.length)]);
    const [selected, setSelected] = useState<string | null>(null);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const checkAnswer = (opt: string) => {
        if (selected) return; setSelected(opt);
        if (opt === currentQ.a) setTimeout(() => onComplete(reward), 1000);
        else { toast.error("ACCESS_DENIED"); setTimeout(() => onComplete(0), 1000); }
    };

    return (
        <div className="flex flex-col gap-8 py-6 w-full">
            <div className="bg-[#1A1A1A] rounded-[2rem] p-10 text-center border border-[#D4AF37]/10 shadow-inner">
                <h4 className="text-2xl font-black text-white italic tracking-tighter leading-tight uppercase">{currentQ.q}</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {currentQ.o.map((opt) => (
                    <button key={opt} onClick={() => checkAnswer(opt)} className={`p-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all border-2 active:scale-98 text-xs ${selected === opt ? opt === currentQ.a ? 'bg-[#D4AF37] border-[#D4AF37] text-black' : 'bg-red-500/10 border-red-500 text-red-500' : 'bg-black border-white/5 text-white/40 hover:border-[#D4AF37]/30 hover:text-white'}`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

const MemoryGame = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const icons = ['🔥', '💎', '🚀', '👑'];
    const [cards, setCards] = useState(() => [...icons, ...icons].sort(() => Math.random() - 0.5));
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const handleFlip = (i: number) => {
        if (flipped.length === 2 || solved.includes(i) || flipped.includes(i)) return;
        const newFlipped = [...flipped, i]; setFlipped(newFlipped);
        if (newFlipped.length === 2) {
            if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
                const newSolved = [...solved, ...newFlipped]; setSolved(newSolved);
                setFlipped([]);
                if (newSolved.length === cards.length) setTimeout(() => onComplete(reward), 1000);
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    return (
        <div className="grid grid-cols-2 gap-6 py-6 max-w-[280px] mx-auto">
            {cards.map((icon, i) => (
                <button
                    key={i}
                    onClick={() => handleFlip(i)}
                    className={`aspect-square rounded-[2rem] flex items-center justify-center text-4xl transition-all duration-500 transform active:scale-90 border-2 ${flipped.includes(i) || solved.includes(i) ? 'bg-[#D4AF37] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] rotate-0' : 'bg-black border-white/10 rotate-180'}`}
                >
                    {(flipped.includes(i) || solved.includes(i)) ? icon : <Star className="text-white/10" size={24} />}
                </button>
            ))}
        </div>
    );
};

const WordMaster = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const words = ["GOLD", "VAULT", "STARS", "FORTUNE", "ELITE"];
    const [word] = useState(() => words[Math.floor(Math.random() * words.length)]);
    const [scrambled] = useState(() => word.split('').sort(() => Math.random() - 0.5).join(''));
    const [guess, setGuess] = useState("");
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const check = () => {
        if (guess.toUpperCase() === word) onComplete(reward);
        else toast.error("DECRYPTION_FAILED");
    };

    return (
        <div className="flex flex-col items-center gap-8 py-6">
            <div className="bg-[#1A1A1A] px-10 py-8 rounded-[2rem] border border-[#D4AF37]/20 text-4xl font-black tracking-[0.6em] text-[#D4AF37] shadow-inner mb-4 italic truncate max-w-full text-center">{scrambled}</div>
            <input value={guess} onChange={(e) => setGuess(e.target.value)} className="w-full bg-black border-2 border-white/10 rounded-2xl p-6 text-center font-black text-xl text-white outline-none focus:border-[#D4AF37] transition-all uppercase tracking-widest placeholder:text-white/5" placeholder="DECIPHER..." />
            <button onClick={check} className="w-full py-6 bg-[#D4AF37] text-black rounded-3xl font-black uppercase tracking-[0.4em] text-xs shadow-2xl active:scale-[0.98]">Confirm Sequence</button>
        </div>
    );
};

const MathRush = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const [num1] = useState(Math.floor(Math.random() * 50) + 1);
    const [num2] = useState(Math.floor(Math.random() * 50) + 1);
    const [ans, setAns] = useState("");
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const check = () => {
        if (parseInt(ans) === num1 + num2) onComplete(reward);
        else toast.error("CALCULATION_ERROR");
    };

    return (
        <div className="flex flex-col items-center gap-8 py-6">
            <div className="text-5xl font-black text-white italic tracking-tighter">{num1} <span className="text-[#D4AF37]">+</span> {num2}</div>
            <input type="number" value={ans} onChange={(e) => setAns(e.target.value)} className="w-full bg-black border-2 border-white/10 rounded-2xl p-6 text-center font-black text-2xl text-white outline-none focus:border-[#D4AF37] transition-all" placeholder="RESULT" />
            <button onClick={check} className="w-full py-6 bg-[#D4AF37] text-black rounded-3xl font-black uppercase tracking-[0.4em] text-xs shadow-2xl active:scale-[0.98]">Validate Entry</button>
        </div>
    );
};

const TreasureHunt = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const [reward] = useState(() => config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min);
    return (
        <div className="grid grid-cols-3 gap-6 py-12">
            {[1, 2, 3].map(i => (
                <button key={i} onClick={() => onComplete(reward)} className="aspect-square bg-[#1A1A1A] rounded-[2rem] border-2 border-white/5 flex items-center justify-center text-4xl hover:border-[#D4AF37]/40 hover:bg-black transition-all active:scale-90 shadow-2xl group">
                    <span className="group-hover:scale-125 transition-transform duration-500">🎁</span>
                </button>
            ))}
        </div>
    );
};

const CoinFlip = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const [flipping, setFlipping] = useState(false);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const flip = () => {
        setFlipping(true);
        setTimeout(() => onComplete(Math.random() > 0.5 ? reward : 0), 1500);
    };

    return (
        <div className="flex flex-col items-center gap-10 py-6">
            <div className={`w-36 h-36 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B6B1A] border-[6px] border-[#3D2E0B] shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center justify-center text-6xl text-black font-black italic relative overflow-hidden ${flipping ? 'animate-[bounce_0.5s_infinite]' : ''}`}>
                <div className="absolute inset-0 bg-white/20 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                $
            </div>
            <button onClick={flip} disabled={flipping} className="w-full py-6 bg-black text-[#D4AF37] border-2 border-[#D4AF37]/40 rounded-3xl font-black uppercase tracking-[0.5em] text-xs shadow-2xl active:scale-95 transition-all">Strike Coin</button>
        </div>
    );
};

const RPSBattle = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const options = ["ROCK", "PAPER", "SCISSORS"];
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const play = (choice: string) => {
        const ai = options[Math.floor(Math.random() * 3)];
        if (choice === ai) onComplete(Math.floor(reward / 2));
        else if ((choice === "ROCK" && ai === "SCISSORS") || (choice === "PAPER" && ai === "ROCK") || (choice === "SCISSORS" && ai === "PAPER")) onComplete(reward);
        else onComplete(5);
    };

    return (
        <div className="grid grid-cols-1 gap-4 py-6 w-full">
            {["🪨", "📄", "✂️"].map((icon, i) => (
                <button key={i} onClick={() => play(options[i])} className="w-full py-6 bg-black border border-white/10 rounded-2xl flex items-center justify-between px-10 hover:border-[#D4AF37]/40 hover:bg-[#1A1A1A] transition-all active:scale-[0.98] group">
                    <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{icon}</span>
                    <span className="text-xs font-black text-white/40 group-hover:text-[#D4AF37] tracking-[0.4em]">{options[i]}</span>
                </button>
            ))}
        </div>
    );
};

const NumberGuess = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const [target] = useState(Math.floor(Math.random() * 10) + 1);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    return (
        <div className="grid grid-cols-5 gap-3 py-6">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => n === target ? onComplete(reward) : toast.error("MISS")} className="aspect-square bg-black border-2 border-white/5 rounded-2xl font-black text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all active:scale-90">{n}</button>
            ))}
        </div>
    );
};

const ColorTap = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const colors = ["GOLD", "WHITE", "BRONZE", "BLACK"];
    const [target] = useState(colors[Math.floor(Math.random() * 4)]);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    return (
        <div className="flex flex-col items-center gap-8 py-6">
            <p className="text-lg font-black text-white tracking-[0.2em] uppercase">Target: <span className="text-[#D4AF37]">{target}</span></p>
            <div className="grid grid-cols-2 gap-6">
                {colors.map(c => (
                    <button key={c} onClick={() => c === target ? onComplete(reward) : onComplete(0)} className={`w-20 h-20 rounded-[2rem] shadow-2xl border-4 transition-all active:scale-90 ${c === 'GOLD' ? 'bg-[#D4AF37] border-white/20' : c === 'WHITE' ? 'bg-white border-black/10' : c === 'BRONZE' ? 'bg-[#8B6B1A] border-white/10' : 'bg-black border-white/10'}`}></button>
                ))}
            </div>
        </div>
    );
};

const FastClicker = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const [clicks, setClicks] = useState(0);
    const [timer, setTimer] = useState(5);
    const [active, setActive] = useState(false);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    useEffect(() => {
        let interval: any;
        if (active && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
        else if (timer === 0) onComplete(clicks >= 30 ? reward : Math.floor(clicks * 1.2));
        return () => clearInterval(interval);
    }, [active, timer]);

    return (
        <div className="flex flex-col items-center gap-10 py-6">
            <div className="flex justify-between w-full font-black text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.4em]"><span>Load: {clicks}</span><span>Uplink: {timer}s</span></div>
            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-[#D4AF37] transition-all shadow-[0_0_15px_#D4AF37]" style={{ width: `${(timer / 5) * 100}%` }}></div></div>
            <button onClick={() => { if (!active) setActive(true); setClicks(c => c + 1); }} disabled={timer === 0} className="w-40 h-40 rounded-full bg-[#D4AF37] text-black font-black text-3xl shadow-[0_0_50px_rgba(212,175,55,0.2)] active:scale-95 transition-all outline-none border-[12px] border-black ring-4 ring-[#D4AF37]/20 uppercase tracking-tighter italic">Tap!</button>
        </div>
    );
};

const DiceRoller = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const [rolling, setRolling] = useState(false);
    const [result, setResult] = useState(1);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const roll = () => {
        setRolling(true);
        setTimeout(() => {
            const res = Math.floor(Math.random() * 6) + 1;
            setResult(res); setRolling(false); onComplete(Math.floor(reward * (res / 3)));
        }, 1000);
    };

    return (
        <div className="flex flex-col items-center gap-10 py-6">
            <div className={`w-28 h-28 bg-[#1A1A1A] border-4 border-[#D4AF37] rounded-[2.5rem] flex items-center justify-center text-6xl text-[#D4AF37] shadow-2xl ${rolling ? 'animate-spin' : ''}`}>{result}</div>
            <button onClick={roll} disabled={rolling} className="w-full py-6 bg-[#D4AF37] text-black rounded-3xl font-black uppercase tracking-[0.5em] text-xs shadow-2xl active:scale-95">Roll Golden Dice</button>
        </div>
    );
};

const SlotMachine = ({ config, onComplete }: { config: Task, onComplete: (reward: number) => void }) => {
    const emojis = ['👑', '💎', '🔥', '⭐'];
    const [slots, setSlots] = useState(['👑', '👑', '👑']);
    const [rolling, setRolling] = useState(false);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).max;

    const spin = () => {
        setRolling(true);
        const interval = setInterval(() => setSlots([emojis[Math.floor(Math.random() * 4)], emojis[Math.floor(Math.random() * 4)], emojis[Math.floor(Math.random() * 4)]]), 80);
        setTimeout(() => {
            clearInterval(interval); setRolling(false);
            const final = [emojis[Math.floor(Math.random() * 4)], emojis[Math.floor(Math.random() * 4)], emojis[Math.floor(Math.random() * 4)]];
            setSlots(final);
            if (final[0] === final[1] && final[1] === final[2]) onComplete(reward);
            else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) onComplete(Math.floor(reward / 10));
            else onComplete(5);
        }, 2000);
    };

    return (
        <div className="flex flex-col items-center gap-10 py-6">
            <div className="flex gap-5 p-8 bg-black rounded-[2.5rem] shadow-2xl border border-white/5">
                {slots.map((s, i) => (
                    <div key={i} className="w-16 h-24 bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-black">{s}</div>
                ))}
            </div>
            <button onClick={spin} disabled={rolling} className="w-full py-6 bg-gradient-to-r from-[#AA8B24] via-[#D4AF37] to-[#AA8B24] text-black rounded-3xl font-black uppercase tracking-[0.4em] text-xs shadow-2xl active:scale-95">Pull Lever</button>
        </div>
    );
};

export default function TasksPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [taskStats, setTaskStats] = useState<any>({});
    const [isClaiming, setIsClaiming] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) { router.push("/"); return; }
            setUser(currentUser);
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeData = onSnapshot(userRef, (doc) => {
                if (doc.exists()) { setUserData(doc.data()); setTaskStats(doc.data().task_stats || {}); }
                setLoading(false);
            });
            return () => unsubscribeData();
        });

        const unsubscribeConfig = onSnapshot(doc(db, "Settings", "tasks"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const activeConfigs = DEFAULT_TASKS.map(task => ({
                    ...task,
                    ...(data[task.id] || {})
                })).filter(t => t.is_active);
                setTasks(activeConfigs);
            } else {
                setTasks(DEFAULT_TASKS.filter(t => t.is_active));
            }
        });

        return () => {
            unsubscribe();
            unsubscribeConfig();
        };
    }, [router]);

    const claimReward = async (taskId: string, amount: number) => {
        if (!user || isClaiming) { setActiveTask(null); return; }
        if (amount <= 0) { setActiveTask(null); return; }
        setIsClaiming(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const key = `${taskId}_${todayStr}`;
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                stars: increment(amount),
                [`task_stats.${key}`]: increment(1)
            });
            toast.success(`Received ${amount} Zen Stars!`, { icon: '✨' });
        } catch (error) { console.error(error); toast.error("REWARD_UPLINK_FAILURE"); }
        finally { setIsClaiming(false); setActiveTask(null); }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A]">
            <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
            <p className="mt-8 text-[10px] font-black tracking-[0.4em] text-[#D4AF37]/30 uppercase">Initializing Gateway</p>
        </div>
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const getRemainingPlays = (taskId: string, limit: number) => {
        const key = `${taskId}_${todayStr}`;
        return Math.max(0, limit - (taskStats[key] || 0));
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col text-white select-none font-sans overflow-hidden">
            {/* Premium Gold Header */}
            <header className="px-6 pt-12 pb-8 flex items-center justify-between bg-black border-b border-white/5 z-50">
                <button onClick={() => router.push("/users/welcome")} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all active:scale-90">
                    <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
                <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Partner Program</p>
                    <h1 className="text-xl font-black uppercase tracking-widest italic">Zen.Tasks</h1>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">
                    <Gamepad2 size={24} />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-10 pb-20 space-y-12 no-scrollbar relative">
                {/* Visual Ambient */}
                <div className="fixed top-32 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none"></div>

                {/* Star Wallet - Gold Overhaul */}
                <section className="relative overflow-hidden bg-black rounded-[3rem] p-10 border border-white/5 shadow-2xl group animate-in fade-in slide-in-from-top-6 duration-700">
                    {/* Metalic Reflection */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px]"></div>

                    <div className="relative z-10 flex flex-col gap-8">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]/40">Accumulated Assets</span>
                            </div>
                            <Star size={24} className="text-[#D4AF37] fill-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                        </div>

                        <div className="flex items-baseline gap-4">
                            <span className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                {Number(userData?.stars || 0).toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em] font-mono italic">Stars</span>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Mining Status</p>
                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px] uppercase tracking-tighter italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Sync_Stable
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Premium Level</p>
                                <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-[11px] uppercase tracking-tighter italic">
                                    <Sparkles size={12} className="fill-current" />
                                    Gold_Partner
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tasks Grid */}
                <section className="space-y-8">
                    <header className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"></div>
                            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em]">Active Circuits</h3>
                        </div>
                        <RefreshCcw size={18} className="text-white/10 hover:text-[#D4AF37] transition-colors" />
                    </header>

                    <div className="grid grid-cols-2 gap-5">
                        {tasks.map((task) => {
                            const remaining = getRemainingPlays(task.id, task.daily_limit);
                            const locked = remaining === 0;
                            return (
                                <button
                                    key={task.id}
                                    disabled={locked}
                                    onClick={() => setActiveTask(task)}
                                    className={`relative aspect-[0.85/1] rounded-[3rem] p-8 flex flex-col items-center justify-between transition-all duration-500 group border overflow-hidden shadow-2xl ${locked ? 'bg-black border-white/5 opacity-40 grayscale pointer-events-none' : 'bg-black border-white/10 active:scale-95 hover:border-[#D4AF37]/40 active:border-[#D4AF37]'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="relative z-10 w-full flex justify-between items-center">
                                        <div className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none ${locked ? 'bg-white/5 text-white/20' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
                                            {locked ? 'VOID' : `${remaining}/${task.daily_limit}`}
                                        </div>
                                        {locked ? <Lock size={12} className="text-white/20" /> : <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></div>}
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center gap-4">
                                        <span className="text-5xl filter transition-all duration-700 group-hover:scale-125 group-hover:-rotate-12 drop-shadow-2xl">{task.icon}</span>
                                        <div className="text-center">
                                            <p className="text-[11px] font-black uppercase tracking-tight text-white mb-1">{task.name}</p>
                                            <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.2em] italic opacity-40">Earn Yield</p>
                                        </div>
                                    </div>

                                    <div className={`relative z-10 w-full h-12 rounded-2xl flex items-center justify-center transition-all ${locked ? 'bg-white/5' : 'bg-[#1A1A1A] group-hover:bg-[#D4AF37] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] shadow-xl shadow-black'}`}>
                                        {locked ? <CheckCircle2 size={16} className="text-white/10" /> : <Play size={16} fill="currentColor" className="text-white group-hover:text-black transition-colors" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Game Modal Overhaul - Dark & Gold */}
            <AnimatePresence>
                {activeTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-2xl px-6"
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.8 }}
                            className="w-full max-w-sm bg-black rounded-[4rem] p-10 relative shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5"
                        >
                            <button onClick={() => setActiveTask(null)} className="absolute top-10 right-10 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-[#D4AF37] transition-all">
                                <X size={24} strokeWidth={3} />
                            </button>

                            <div className="text-center flex flex-col items-center mb-10 mt-4">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-[#1A1A1A] border-2 border-[#D4AF37]/20 flex items-center justify-center text-5xl shadow-2xl mb-8 transform rotate-3">{activeTask.icon}</div>
                                <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white mb-3 leading-none">{activeTask.name}</h3>
                                <p className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">{activeTask.description}</p>
                            </div>

                            <div className="relative">
                                {activeTask.type === 'spin' && <SpinWheel config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'scratch' && <ScratchCard config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'quiz' && <MiniQuiz config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'memory' && <MemoryGame config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'word' && <WordMaster config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'math' && <MathRush config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'treasure' && <TreasureHunt config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'coin' && <CoinFlip config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'rps' && <RPSBattle config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'guess' && <NumberGuess config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'color' && <ColorTap config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'clicker' && <FastClicker config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'dice' && <DiceRoller config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'slots' && <SlotMachine config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} />}
                                {activeTask.type === 'checklist' && <div className="flex flex-col items-center gap-10 py-10"><div className="w-48 h-48 rounded-full bg-black border-[10px] border-[#1A1A1A] flex flex-col items-center justify-center gap-4 shadow-inner relative"><div className="absolute inset-0 bg-[#D4AF37]/5 rounded-full animate-pulse"></div><HandMetal size={64} className="text-[#D4AF37] drop-shadow-[0_0_15px_#D4AF37]" /><span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/40">Active_Link</span></div><button onClick={() => claimReward(activeTask.id, (activeTask.reward_value as number) || 50)} className="w-full py-6 bg-[#D4AF37] text-black rounded-3xl font-black uppercase tracking-[0.4em] text-xs shadow-2xl active:scale-95 italic">Collect Asset</button></div>}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Claiming Overlay - Premium */}
            <AnimatePresence>
                {isClaiming && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl"
                    >
                        <div className="flex flex-col items-center gap-8">
                            <div className="relative">
                                <RotateCw className="w-16 h-16 animate-spin text-[#D4AF37]" strokeWidth={3} />
                                <Star size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#D4AF37] fill-[#D4AF37] animate-pulse" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white italic">Synchronizing Assets...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(200%) skewX(-15deg); }
                }
                .clip-path-triangle {
                    clip-path: polygon(50% 100%, 0 0, 100% 0);
                }
                ::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
