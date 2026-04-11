import { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatInput({ onSendMessage, disabled }) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    return (
        <form 
            onSubmit={handleSubmit}
            className="flex items-center w-full"
        >
            <div className="relative flex-1 group">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How are you friends?"
                    disabled={disabled}
                    className={cn(
                        "w-full bg-slate-50 border border-slate-200 rounded-full py-4 px-8 pr-16 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />
                <button
                    type="submit"
                    disabled={disabled || !message.trim()}
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        message.trim() && !disabled 
                            ? "bg-primary text-white hover:bg-primary/90" 
                            : "bg-slate-100 text-slate-300"
                    )}
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            </div>
        </form>
    );
}
