import { motion } from "framer-motion";
import { X, ThumbsUp, ThumbsDown, Sparkles, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface InsightPoint {
    point: string;
    description: string;
}

interface Insights {
    summary: string;
    likes: InsightPoint[];
    dislikes: InsightPoint[];
}

interface ResultCardProps {
    transcription: string;
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    confidence: number;
    uncertainty?: number;
    language_used: string;
    insights?: Insights;
    isSpeaking?: boolean;
    onClose: () => void;
}

export function ResultCard({
    transcription,
    sentiment,
    confidence,
    uncertainty,
    language_used,
    insights,
    isSpeaking = false,
    onClose,
}: ResultCardProps) {
    const [displayedText, setDisplayedText] = useState("");

    // Typewriter effect
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index <= transcription.length) {
                setDisplayedText(transcription.slice(0, index));
                index++;
            } else {
                clearInterval(interval);
            }
        }, 30); // Adjust speed here

        return () => clearInterval(interval);
    }, [transcription]);

    // Determine sentiment color
    const getSentimentColor = (s: string) => {
        switch (s) {
            case 'Positive': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Negative': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none p-4"
        >
            <div className="relative w-full max-w-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Holographic header line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                            Analysis Complete
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium border",
                                getSentimentColor(sentiment)
                            )}>
                                {sentiment}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">
                                {Math.round(confidence * 100)}% Conf
                            </span>
                            {uncertainty !== undefined && (
                                <span className="text-xs text-zinc-600 font-mono border-l border-zinc-700 pl-2">
                                    {Math.round(uncertainty * 100)}% Uncertainty
                                </span>
                            )}
                            <span className="text-xs text-zinc-500 font-mono border-l border-zinc-700 pl-2 uppercase">
                                {language_used}
                            </span>
                            {isSpeaking && (
                                <span className="flex items-center gap-1 text-xs text-purple-400 border-l border-zinc-700 pl-2">
                                    <Volume2 className="w-3 h-3 animate-pulse" />
                                    Speaking...
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-zinc-500 hover:text-white transition-colors rounded hover:bg-white/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="min-h-[100px] font-mono text-sm leading-relaxed text-zinc-300 mb-6">
                    {displayedText}
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-2 h-4 ml-1 align-middle bg-blue-500"
                    />
                </div>


                {/* AI Insights Section */}
                {insights && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="border-t border-white/10 pt-6 space-y-4"
                    >
                        {/* Insights Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className={cn(
                                "w-4 h-4",
                                sentiment === 'Positive' ? "text-emerald-400" :
                                    sentiment === 'Negative' ? "text-rose-400" : "text-purple-400"
                            )} />
                            <h4 className={cn(
                                "text-xs font-bold tracking-[0.15em] uppercase",
                                sentiment === 'Positive' ? "text-emerald-400" :
                                    sentiment === 'Negative' ? "text-rose-400" : "text-purple-400"
                            )}>
                                AI Insights
                            </h4>
                        </div>

                        {/* Emotional Summary */}
                        <div className={cn(
                            "border rounded-lg p-4",
                            sentiment === 'Positive' ? "bg-emerald-500/10 border-emerald-500/20" :
                                sentiment === 'Negative' ? "bg-rose-500/10 border-rose-500/20" :
                                    "bg-purple-500/10 border-purple-500/20"
                        )}>
                            <p className="text-sm text-zinc-300 leading-relaxed italic">
                                "{insights.summary}"
                            </p>
                        </div>

                        {/* Likes and Dislikes Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Likes */}
                            {insights.likes.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                                            Likes
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {insights.likes.map((like, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + idx * 0.1 }}
                                                className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3"
                                            >
                                                <div className="text-xs font-semibold text-emerald-300 mb-1">
                                                    {like.point}
                                                </div>
                                                <div className="text-xs text-zinc-400">
                                                    {like.description}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dislikes */}
                            {insights.dislikes.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                                        <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">
                                            Dislikes
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {insights.dislikes.map((dislike, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + idx * 0.1 }}
                                                className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3"
                                            >
                                                <div className="text-xs font-semibold text-rose-300 mb-1">
                                                    {dislike.point}
                                                </div>
                                                <div className="text-xs text-zinc-400">
                                                    {dislike.description}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 rounded-br-lg" />
            </div>
        </motion.div>
    );
}
