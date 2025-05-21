import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
    strength: 'weak' | 'okay' | 'strong';
}

export default function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
    const getStrengthColor = (strength: string) => {
        switch (strength) {
            case 'weak':
                return 'from-red-600 to-red-400';
            case 'okay':
                return 'from-orange-600 to-orange-400';
            case 'strong':
                return 'from-emerald-600 to-emerald-400';
            default:
                return 'from-gray-600 to-gray-400';
        }
    };

    const getStrengthWidth = (strength: string) => {
        switch (strength) {
            case 'weak':
                return 'w-1/3';
            case 'okay':
                return 'w-2/3';
            case 'strong':
                return 'w-full';
            default:
                return 'w-0';
        }
    };

    const getStrengthText = (strength: string) => {
        return strength.charAt(0).toUpperCase() + strength.slice(1);
    };

    const getStrengthDescription = (strength: string) => {
        switch (strength) {
            case 'weak':
                return 'High risk - easily guessable';
            case 'okay':
                return 'Better but could be stronger';
            case 'strong':
                return 'Excellent protection';
            default:
                return 'Unknown strength';
        }
    };

    const getStrengthIcon = (strength: string) => {
        switch (strength) {
            case 'weak':
                return <ShieldAlert className="w-5 h-5 text-red-400" />;
            case 'okay':
                return <Shield className="w-5 h-5 text-orange-400" />;
            case 'strong':
                return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
            default:
                return <Shield className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <motion.div 
            className="mt-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="w-full bg-slate-800/70 rounded-full h-3 mb-4 overflow-hidden">
                <motion.div
                    className={`h-3 rounded-full bg-gradient-to-r ${getStrengthColor(strength)} ${getStrengthWidth(strength)}`}
                    initial={{ width: 0 }}
                    animate={{ width: getStrengthWidth(strength).replace('w-', '').replace('full', '100%') }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        {getStrengthIcon(strength)}
                    </motion.div>
                    <div>
                        <p className="text-sm font-medium">
                            <span className={
                                strength === 'strong' ? 'text-emerald-400' :
                                strength === 'okay' ? 'text-orange-400' :
                                'text-red-400'
                            }>
                                {getStrengthText(strength)}
                            </span>
                            <span className="text-slate-400 ml-1">Password</span>
                        </p>
                        <p className={
                            `text-xs ${strength === 'strong' ? 'text-emerald-500/70' :
                            strength === 'okay' ? 'text-orange-500/70' :
                            'text-red-500/70'}`
                        }>
                            {getStrengthDescription(strength)}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
