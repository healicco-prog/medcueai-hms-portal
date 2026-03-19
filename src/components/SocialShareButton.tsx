import React, { useState, useRef, useEffect } from 'react';
import { Share2, X, Check, Copy, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface SocialShareButtonProps {
  /** The main text message to share */
  shareText?: string;
  /** Optional subject line for email */
  emailSubject?: string;
  /** Custom button className override */
  className?: string;
  /** Compact mode — icon only, no label */
  compact?: boolean;
}

// SVG icons for social platforms
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XTwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const shareOptions = [
  {
    name: 'WhatsApp',
    icon: WhatsAppIcon,
    color: 'text-green-500',
    hoverBg: 'hover:bg-green-50',
    getUrl: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    name: 'LinkedIn',
    icon: LinkedInIcon,
    color: 'text-blue-700',
    hoverBg: 'hover:bg-blue-50',
    getUrl: (text: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://medcueai.com')}&summary=${encodeURIComponent(text)}`,
  },
  {
    name: 'X (Twitter)',
    icon: XTwitterIcon,
    color: 'text-slate-900',
    hoverBg: 'hover:bg-slate-50',
    getUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
  {
    name: 'Facebook',
    icon: FacebookIcon,
    color: 'text-blue-600',
    hoverBg: 'hover:bg-blue-50',
    getUrl: (text: string) => `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`,
  },
];

const DEFAULT_SHARE_TEXT = `🏥 Transforming healthcare with AI — using MedCueAI for smarter clinical decisions, prescription audits & pharmacovigilance. Check it out!\n\n🔗 https://medcueai.com\n\n#MedCueAI #HealthcareAI #ClinicalDecisionSupport #DigitalHealth`;

export const SocialShareButton: React.FC<SocialShareButtonProps> = ({
  shareText = DEFAULT_SHARE_TEXT,
  emailSubject = 'Check out MedCueAI — AI-powered Healthcare Platform',
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = (getUrl: (text: string) => string) => {
    window.open(getUrl(shareText), '_blank', 'noopener,noreferrer,width=600,height=500');
    setIsOpen(false);
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareText)}`;
    setIsOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={className || `flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
          isOpen
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5'
        }`}
        title="Share on social media"
      >
        <Share2 size={18} />
        {!compact && <span>Share</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <span className="text-sm font-bold text-slate-700">Share via</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Social Options */}
            <div className="p-2">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => handleShare(option.getUrl)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${option.hoverBg} transition-colors group`}
                >
                  <div className={`${option.color} transition-transform group-hover:scale-110`}>
                    <option.icon />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{option.name}</span>
                </button>
              ))}

              <div className="h-px bg-slate-100 my-1" />

              {/* Email */}
              <button
                onClick={handleEmail}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 transition-colors group"
              >
                <div className="text-orange-500 transition-transform group-hover:scale-110">
                  <Mail size={20} />
                </div>
                <span className="text-sm font-medium text-slate-700">Email</span>
              </button>

              {/* Copy */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-violet-50 transition-colors group"
              >
                <div className={`transition-transform group-hover:scale-110 ${copied ? 'text-emerald-500' : 'text-violet-500'}`}>
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {copied ? 'Copied!' : 'Copy Text'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialShareButton;
