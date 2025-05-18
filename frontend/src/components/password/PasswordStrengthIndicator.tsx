interface PasswordStrengthIndicatorProps {
    strength: 'weak' | 'okay' | 'strong';
}

export default function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
    const getStrengthColor = (strength: string) => {
        switch (strength) {
            case 'weak':
                return 'bg-red-500';
            case 'okay':
                return 'bg-orange-500';
            case 'strong':
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
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
                return 'Vulnerable';
            case 'okay':
                return 'Moderate';
            case 'strong':
                return 'Secure';
            default:
                return 'Unknown';
        }
    };

    return (
        <div className="mt-2">
            <div className="w-full bg-slate-800/70 rounded-full h-2.5 mb-2 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full ${getStrengthColor(strength)} ${getStrengthWidth(strength)} transition-all duration-700 ease-in-out shadow-glow`}
                    style={{
                        boxShadow: strength === 'weak'
                            ? '0 0 8px rgba(239, 68, 68, 0.5)'
                            : strength === 'okay'
                                ? '0 0 8px rgba(249, 115, 22, 0.5)'
                                : '0 0 8px rgba(34, 197, 94, 0.5)'
                    }}
                ></div>
            </div>
            <div className="flex justify-between text-xs">
                <p className="text-gray-400">
                    Password strength:
                    <span className={
                        strength === 'strong' ? 'text-green-400 ml-1 font-medium' :
                            strength === 'okay' ? 'text-orange-400 ml-1 font-medium' :
                                'text-red-400 ml-1 font-medium'
                    }>
                        {getStrengthText(strength)}
                    </span>
                </p>
                <span className={
                    strength === 'strong' ? 'text-green-400 font-medium' :
                        strength === 'okay' ? 'text-orange-400 font-medium' :
                            'text-red-400 font-medium'
                }>
                    {getStrengthDescription(strength)}
                </span>
            </div>
        </div>
    );
}
