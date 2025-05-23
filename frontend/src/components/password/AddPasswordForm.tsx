import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Check, RefreshCw, AlertCircle, Eye, EyeOff, Save, X } from "lucide-react";
import { toast } from "sonner";
import { createPassword, calculatePasswordStrength, checkReusedPassword, ReusedPasswordResult, LoginItem } from "@/lib/passwordService";

interface AddPasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordAdded: (newPassword: LoginItem) => void;
}

export default function AddPasswordForm({ isOpen, onClose, onPasswordAdded }: AddPasswordFormProps) {
  const [formData, setFormData] = useState({
    website: "",
    url: "",
    username: "",
    password: "",
    notes: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'okay' | 'strong' | null>(null);
  const [reusedPasswordInfo, setReusedPasswordInfo] = useState<ReusedPasswordResult | null>(null);
  const [isCheckingReuse, setIsCheckingReuse] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Calculate password strength when password field changes
    if (name === "password") {
      setPasswordStrength(value ? calculatePasswordStrength(value) : null);
      checkPasswordReuse(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, password: value }));
    setPasswordStrength(value ? calculatePasswordStrength(value) : null);
    checkPasswordReuse(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.website || !formData.username || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Format URL if provided but missing protocol
      let formattedUrl = formData.url;
      if (formattedUrl && formattedUrl.trim() !== "") {
        // Check if URL already has a protocol
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          // Add https:// prefix if missing
          formattedUrl = `https://${formattedUrl}`;
        }
      }
      
      // Prepare data for API
      const passwordData = {
        website: formData.website,
        url: formattedUrl || undefined,
        username: formData.username,
        password: formData.password,
        notes: formData.notes || undefined,
      };

      // Call the API to create password
      const newPassword = await createPassword(passwordData);
      
      // Show appropriate success message based on password strength
      if (passwordStrength === 'weak') {
        toast.success(
          <div>
            <p>Password for {formData.website} added successfully.</p>
            <p className="text-xs mt-1">Note: This password is weak. Consider using a stronger password for better security.</p>
          </div>
        );
      } else {
        toast.success(`Password for ${formData.website} added successfully`);
      }
      
      // Reset form
      setFormData({
        website: "",
        url: "",
        username: "",
        password: "",
        notes: "",
      });
      setPasswordStrength(null);
      setReusedPasswordInfo(null);
      
      // Close the dialog
      onClose();
      
      // Notify parent component
      onPasswordAdded(newPassword);
    } catch (error) {
      console.error("Error adding password:", error);
      toast.error("Failed to add password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRandomPassword = () => {
    // Generate a random password with good strength
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
    let password = "";
    
    // Ensure at least one of each character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*()_-+="[Math.floor(Math.random() * 14)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData((prev) => ({ ...prev, password }));
    setPasswordStrength(calculatePasswordStrength(password));
    checkPasswordReuse(password);
  };

  const checkPasswordReuse = async (password: string) => {
    setIsCheckingReuse(true);
    try {
      const reusedPasswordResult = await checkReusedPassword(password);
      setReusedPasswordInfo(reusedPasswordResult);
    } catch (error) {
      console.error("Error checking password reuse:", error);
    } finally {
      setIsCheckingReuse(false);
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return "bg-gray-200";
    
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "okay":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  const getStrengthText = () => {
    if (!passwordStrength) return "";
    
    switch (passwordStrength) {
      case "weak":
        return (
          <div className="flex items-center text-red-500 text-sm mt-1">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Weak password (still allowed)
          </div>
        );
      case "okay":
        return (
          <div className="flex items-center text-yellow-500 text-sm mt-1">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Moderate password
          </div>
        );
      case "strong":
        return (
          <div className="flex items-center text-green-500 text-sm mt-1">
            <Check className="w-3 h-3 mr-1" />
            Strong password
          </div>
        );
      default:
        return "";
    }
  };

  const getReusedPasswordWarning = () => {
    if (!reusedPasswordInfo?.isReused) return null;
    
    return (
      <div className="flex items-start mt-2 p-2 bg-purple-900/30 border border-purple-500/50 rounded-md">
        <AlertCircle className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-purple-300 text-sm font-medium">Reused Password</p>
          <p className="text-purple-200 text-xs mt-1">
            This password is already used for {reusedPasswordInfo.usedIn.length} other account{reusedPasswordInfo.usedIn.length > 1 ? 's' : ''}:
          </p>
          <ul className="text-xs text-purple-300 mt-1 ml-2">
            {reusedPasswordInfo.usedIn.map((site, index) => (
              <li key={index}>• {site.website} ({site.username})</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Password"
      description="Store a new password in your vault"
      confirmText=""
      cancelText=""
      variant="info"
      icon={<Save className="h-5 w-5" />}
    >
      <form onSubmit={handleSubmit} className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
        <div className="space-y-1 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300">
            Website/Service Name*
          </label>
          <Input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. Google, Facebook, Twitter"
            required
          />
        </div>

        <div className="space-y-1 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300">
            URL (Optional)
          </label>
          <Input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. https://example.com"
          />
        </div>

        <div className="space-y-1 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300">
            Username/Email*
          </label>
          <Input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. user@example.com"
            required
          />
        </div>

        <div className="space-y-1 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300">
            Password*
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handlePasswordChange}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-16 sm:pr-20"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-gray-400 hover:text-white focus:outline-none p-1"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-white focus:outline-none p-1"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </button>
            </div>
          </div>
          {passwordStrength && (
            <>
              <div className="h-1 w-full bg-gray-700 rounded-full mt-2">
                <div
                  className={`h-1 rounded-full ${getStrengthColor()}`}
                  style={{
                    width:
                      passwordStrength === "weak"
                        ? "33%"
                        : passwordStrength === "okay"
                        ? "66%"
                        : "100%",
                    transition: "width 0.3s ease-in-out"
                  }}
                ></div>
              </div>
              <div className="mt-1 sm:mt-2">
                {getStrengthText()}
              </div>
              {isCheckingReuse && (
                <div className="text-xs text-gray-400 mt-1">Checking for password reuse...</div>
              )}
              <div className="mt-1 sm:mt-2">
                {getReusedPasswordWarning()}
              </div>
            </>
          )}
        </div>

        <div className="space-y-1 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Add notes about this password"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2 sm:space-x-3 pt-3 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-gray-300 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Save Password</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
