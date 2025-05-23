import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Check, RefreshCw, AlertCircle, Eye, EyeOff, Save, X } from "lucide-react";
import { toast } from "sonner";
import { updatePassword, calculatePasswordStrength, checkReusedPassword, ReusedPasswordResult, LoginItem } from "@/lib/passwordService";

interface EditPasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordUpdated: (updatedPassword: LoginItem) => void;
  password: LoginItem;
}

export default function EditPasswordForm({ 
  isOpen, 
  onClose, 
  onPasswordUpdated,
  password 
}: EditPasswordFormProps) {
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
  const [originalPassword, setOriginalPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Initialize form data when the password prop changes
  useEffect(() => {
    if (password) {
      setFormData({
        website: password.website || password.site,
        url: password.url || "",
        username: password.username,
        password: password.password,
        notes: password.notes || "",
      });
      setOriginalPassword(password.password);
      setPasswordStrength(password.strength);

    }
  }, [password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData(prev => ({ ...prev, password: newPassword }));
    
    // Set passwordChanged to true if the password is different from the original
    setPasswordChanged(newPassword !== originalPassword);
    
    if (newPassword) {
      const strength = calculatePasswordStrength(newPassword);
      setPasswordStrength(strength);
      
      // Check for password reuse if password is at least 4 characters
      if (newPassword.length >= 4 && newPassword !== originalPassword) {
        setIsCheckingReuse(true);
        try {
          const reusedInfo = await checkReusedPassword(newPassword, password.id);
          setReusedPasswordInfo(reusedInfo);
        } catch (error) {
          console.error("Error checking for password reuse:", error);
          setReusedPasswordInfo(null);
        } finally {
          setIsCheckingReuse(false);
        }
      } else {
        setReusedPasswordInfo(null);
      }
    } else {
      setPasswordStrength(null);
      setReusedPasswordInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.website || !formData.username || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Only include fields that have changed
      const updateData: Partial<LoginItem> = {};
      if (formData.website !== (password.website || password.site)) updateData.website = formData.website;
      if (formData.url !== password.url) updateData.url = formData.url;
      if (formData.username !== password.username) updateData.username = formData.username;
      if (passwordChanged) updateData.password = formData.password;
      if (formData.notes !== password.notes) updateData.notes = formData.notes;
      
      // If nothing changed, just close the dialog
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes were made");
        onClose();
        return;
      }

      // Call the API to update password
      const updatedPassword = await updatePassword(password.id, updateData);
      
      // If we updated the password field, we need to set the real password and strength
      if (updateData.password) {
        updatedPassword.password = formData.password;
        updatedPassword.strength = calculatePasswordStrength(formData.password);
      } else {
        updatedPassword.password = originalPassword;
        updatedPassword.strength = password.strength;
      }
      
      // Show appropriate success message based on password strength
      if (updateData.password && updatedPassword.strength === 'weak') {
        toast.success(
          <div>
            <p>Password for {formData.website} updated successfully.</p>
            <p className="text-xs mt-1">Note: This password is weak. Consider using a stronger password for better security.</p>
          </div>
        );
      } else {
        toast.success(`Password for ${formData.website} updated successfully`);
      }
      
      // Close the dialog
      onClose();
      
      // Notify parent component
      onPasswordUpdated(updatedPassword);
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRandomPassword = () => {
    // Generate a random password with good strength
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    // Ensure at least one character from each category
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData(prev => ({ ...prev, password }));
    setPasswordStrength(calculatePasswordStrength(password));
    setPasswordChanged(true);
    
    // Check for password reuse
    checkPasswordReuse(password);
  };

  const checkPasswordReuse = async (newPassword: string) => {
    if (newPassword.length < 4) return;
    
    setIsCheckingReuse(true);
    try {
      // Pass the current password ID to exclude it from the reuse check
      const reusedInfo = await checkReusedPassword(newPassword, password.id);
      setReusedPasswordInfo(reusedInfo);
    } catch (error) {
      console.error("Error checking for password reuse:", error);
      setReusedPasswordInfo(null);
    } finally {
      setIsCheckingReuse(false);
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

  const getStrengthColor = () => {
    if (!passwordStrength) return "bg-gray-300";
    
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "okay":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Password"
      description={`Update password details for ${formData.website}`}
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
              <div className="w-full h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${getStrengthColor()} transition-all duration-300`}
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
                <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white mr-1 sm:mr-2"></div>
                <span>Updating...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Update Password</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
