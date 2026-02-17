"use client";

import { useState, useRef } from "react";
import { Paperclip, Send, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CommandDockProps {
    isRecording: boolean;
    isProcessing: boolean;
    onRecordToggle: () => void;
    onTextSubmit: (text: string) => void;
    onFileUpload: (file: File) => void;
}

export function CommandDock({
    isRecording,
    isProcessing,
    onRecordToggle,
    onTextSubmit,
    onFileUpload,
}: CommandDockProps) {
    const [inputValue, setInputValue] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (inputValue.trim()) {
            onTextSubmit(inputValue);
            setInputValue("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center"
        >
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 w-[500px] shadow-2xl shadow-black/50">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                >
                    <Paperclip className="w-5 h-5" />
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </button>

                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type or speak... (language auto-detected)"
                    className="flex-1 bg-transparent outline-none text-white placeholder-zinc-500 font-medium"
                    disabled={isProcessing}
                />

                <div className="relative">
                    <AnimatePresence mode="wait">
                        {inputValue.trim() ? (
                            <motion.button
                                key="send"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                onClick={handleSubmit}
                                disabled={isProcessing}
                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </motion.button>
                        ) : (
                            <motion.button
                                key="mic"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                onClick={onRecordToggle}
                                disabled={isProcessing}
                                className={cn(
                                    "p-2 rounded-full transition-all duration-300",
                                    isRecording
                                        ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isRecording ? (
                                    <div className="relative">
                                        <Square className="w-5 h-5 fill-current" />
                                        <span className="absolute inset-0 rounded-full animate-ping bg-red-500/50" />
                                    </div>
                                ) : (
                                    <Mic className="w-5 h-5" />
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
