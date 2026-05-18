import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { propertyImages } from "@/data/mockData";
import type { UserRole } from "@/types/api";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
}

interface PasswordChecks {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "", 
    password: "", 
    confirmPassword: "",
    firstName: "", 
    middleName: "", 
    lastName: "", 
    phoneNumber: "",
    role: "TENANT" as UserRole,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength checks
  const passwordChecks: PasswordChecks = {
    minLength: form.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(form.password),
    hasLowerCase: /[a-z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(check => check === true);

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return emailRegex.test(email);
  };

  // Ethiopian phone number validation
  const isValidEthiopianPhone = (phone: string) => {
    if (!phone) return false;
    // Remove any spaces, dashes, or parentheses for validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Ethiopian phone regex: starts with +251 or 0, followed by 9 digits (starting with 9 or 7)
    const ethiopianPhoneRegex = /^(\+251|0)[97]\d{8}$/;
    return ethiopianPhoneRegex.test(cleanPhone);
  };

  // Simple phone number validation without aggressive formatting
  const validatePhoneNumber = (value: string) => {
    if (!value) return "Phone number is required";
    
    // Remove spaces for validation
    const cleanNumber = value.replace(/[\s\-\(\)]/g, '');
    
    // Check if it matches Ethiopian format
    if (!/^(\+251|0)[97]\d{8}$/.test(cleanNumber)) {
      return "Please enter a valid Ethiopian phone number (e.g., +251912345678 or 0912345678)";
    }
    return "";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Allow any input without restriction
    setForm(prev => ({ ...prev, phoneNumber: rawValue }));
    
    // Validate after user finishes typing (onBlur will handle the error)
    if (rawValue === "") {
      setErrors(prev => ({ ...prev, phoneNumber: "Phone number is required" }));
    } else {
      // Clear error while typing, will validate on blur
      setErrors(prev => ({ ...prev, phoneNumber: "" }));
    }
  };

  const handlePhoneBlur = (value: string) => {
    setTouched(prev => ({ ...prev, phoneNumber: true }));
    const error = validatePhoneNumber(value);
    setErrors(prev => ({ ...prev, phoneNumber: error }));
  };

  // Validate field on change or blur
  const validateField = (name: string, value: string) => {
    switch (name) {
      case "email":
        if (!value) return "Email is required";
        if (!isValidEmail(value)) return "Please enter a valid email address";
        return "";
      
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(value)) return "Password must contain at least one number";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Password must contain at least one special character";
        return "";
      
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== form.password) return "Passwords do not match";
        return "";
      
      case "firstName":
        if (!value) return "First name is required";
        if (value.length < 2) return "First name must be at least 2 characters";
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return "First name can only contain letters, spaces, hyphens, and apostrophes";
        return "";
      
      case "lastName":
        if (!value) return "Last name is required";
        if (value.length < 2) return "Last name must be at least 2 characters";
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return "Last name can only contain letters, spaces, hyphens, and apostrophes";
        return "";
      
      default:
        return "";
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    // Also validate confirm password when password changes
    if (name === "password" && form.confirmPassword) {
      const confirmError = validateField("confirmPassword", form.confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleFieldBlur = (name: string, value: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ["email", "password", "confirmPassword", "firstName", "lastName", "phoneNumber"];
    const touchedState: Record<string, boolean> = {};
    allFields.forEach(field => {
      touchedState[field] = true;
    });
    setTouched(touchedState);
    
    // Validate all fields
    const newErrors: FormErrors = {};
    let isValid = true;
    
    for (const field of allFields) {
      let error;
      if (field === "phoneNumber") {
        error = validatePhoneNumber(form.phoneNumber);
      } else {
        error = validateField(field, form[field as keyof typeof form] as string);
      }
      if (error) {
        newErrors[field as keyof FormErrors] = error;
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    
    if (!isValid) {
      return;
    }
    
    setGeneralError("");
    setIsLoading(true);
    
    try {
      // Clean phone number before sending to backend (remove spaces and special chars)
      const cleanPhoneNumber = form.phoneNumber.replace(/[\s\-\(\)]/g, '');
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        middleName: form.middleName || undefined,
        lastName: form.lastName,
        phoneNumber: cleanPhoneNumber,
        role: form.role,
      };
      await register(payload);
      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setGeneralError(error.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Image */}
      <div className="hidden w-1/2 lg:block relative">
        <img src={propertyImages[2]} alt="Property" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-3xl font-bold text-primary-foreground">Join Digital Estate</h2>
          <p className="mt-2 text-primary-foreground/80">Create your account and start managing or discovering premium properties.</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-8 lg:w-1/2 lg:px-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src={logo} alt="Digital Estate" className="mx-auto mb-4 h-12 w-12" width={48} height={48} />
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join the property management platform</p>
          </div>

          {generalError && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>I am a <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {(["OWNER", "TENANT"] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, role })}
                    className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                      form.role === role
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border text-muted-foreground hover:border-secondary/50"
                    }`}
                    disabled={isLoading}
                  >
                    {role === "OWNER" ? "Property Owner" : "Tenant"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input 
                  placeholder="John" 
                  value={form.firstName} 
                  onChange={(e) => handleFieldChange("firstName", e.target.value)}
                  onBlur={(e) => handleFieldBlur("firstName", e.target.value)}
                  className={touched.firstName && errors.firstName ? "border-destructive" : ""}
                  required 
                  disabled={isLoading}
                />
                {touched.firstName && errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Middle Name</Label>
                <Input 
                  placeholder="Optional" 
                  value={form.middleName} 
                  onChange={(e) => setForm({ ...form, middleName: e.target.value })} 
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input 
                  placeholder="Doe" 
                  value={form.lastName} 
                  onChange={(e) => handleFieldChange("lastName", e.target.value)}
                  onBlur={(e) => handleFieldBlur("lastName", e.target.value)}
                  className={touched.lastName && errors.lastName ? "border-destructive" : ""}
                  required 
                  disabled={isLoading}
                />
                {touched.lastName && errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Address <span className="text-destructive">*</span></Label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                value={form.email} 
                onChange={(e) => handleFieldChange("email", e.target.value)}
                onBlur={(e) => handleFieldBlur("email", e.target.value)}
                className={touched.email && errors.email ? "border-destructive" : ""}
                required 
                disabled={isLoading}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Phone Number <span className="text-destructive">*</span></Label>
              <Input 
                type="tel" 
                placeholder="0912345678 or +251912345678" 
                value={form.phoneNumber} 
                onChange={handlePhoneChange}
                onBlur={(e) => handlePhoneBlur(e.target.value)}
                className={touched.phoneNumber && errors.phoneNumber ? "border-destructive" : ""}
                required 
                disabled={isLoading}
              />
              {touched.phoneNumber && errors.phoneNumber && (
                <p className="text-xs text-destructive">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Min. 8 characters" 
                  value={form.password} 
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  onBlur={(e) => handleFieldBlur("password", e.target.value)}
                  className={touched.password && errors.password ? "border-destructive pr-10" : "pr-10"}
                  required 
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
              
              {/* Password strength indicator */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Password must contain:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <PasswordCheckItem 
                      text="At least 8 characters" 
                      isValid={passwordChecks.minLength} 
                    />
                    <PasswordCheckItem 
                      text="At least one uppercase letter" 
                      isValid={passwordChecks.hasUpperCase} 
                    />
                    <PasswordCheckItem 
                      text="At least one lowercase letter" 
                      isValid={passwordChecks.hasLowerCase} 
                    />
                    <PasswordCheckItem 
                      text="At least one number" 
                      isValid={passwordChecks.hasNumber} 
                    />
                    <PasswordCheckItem 
                      text="At least one special character" 
                      isValid={passwordChecks.hasSpecialChar} 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm your password" 
                  value={form.confirmPassword} 
                  onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                  onBlur={(e) => handleFieldBlur("confirmPassword", e.target.value)}
                  className={touched.confirmPassword && errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  required 
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" 
              disabled={isLoading || !isPasswordValid}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-secondary hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper component for password requirements
function PasswordCheckItem({ text, isValid }: { text: string; isValid: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {isValid ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={isValid ? "text-green-600" : "text-muted-foreground"}>{text}</span>
    </div>
  );
}