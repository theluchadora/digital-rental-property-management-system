import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Save, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error-handler";
import { uploadProfileImage } from "@/lib/cloudinary";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false); // Add this state
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  // Load existing profile picture
  useEffect(() => {
    if (user?.profileImageUrl) {
      setAvatarPreview(user.profileImageUrl);
    }
  }, [user]);

  // Validate form fields
  const validateForm = () => {
    const errors = {
      firstName: "",
      lastName: "",
      phoneNumber: "",
    };
    let isValid = true;

    if (!form.firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    } else if (form.firstName.length < 2) {
      errors.firstName = "First name must be at least 2 characters";
      isValid = false;
    }

    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    } else if (form.lastName.length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
      isValid = false;
    }

    if (form.phoneNumber) {
      const cleanPhone = form.phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (!/^(\+251|0)[97]\d{8}$/.test(cleanPhone)) {
        errors.phoneNumber = "Please enter a valid Ethiopian phone number (e.g., 0912345678 or +251912345678)";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ 
          title: "Invalid file type", 
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive" 
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ 
          title: "File too large", 
          description: "Please select an image under 5MB",
          variant: "destructive" 
        });
        return;
      }
      
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setSelectedFile(file);
      setRemoveImage(false); // Reset remove flag when new file selected
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setSelectedFile(null);
    setRemoveImage(true); // Set flag to remove image on save
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    // Validate form
    if (!validateForm()) {
      toast({ 
        title: "Validation Error", 
        description: "Please fix the errors before saving.",
        variant: "destructive" 
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let profileImageUrl = user.profileImageUrl;
      
      // Check if we need to remove the image
      if (removeImage) {
        profileImageUrl = "";
        console.log("Removing profile image");
      } 
      // Upload to Cloudinary if a new file is selected
      else if (selectedFile) {
        setIsUploading(true);
        try {
          const cloudinaryUrl = await uploadProfileImage(selectedFile, user.id);
          profileImageUrl = cloudinaryUrl;
          setIsUploading(false);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          toast({ 
            title: "Upload failed", 
            description: "Failed to upload image to Cloudinary. Please try again.",
            variant: "destructive" 
          });
          setIsLoading(false);
          setIsUploading(false);
          return;
        }
      }
      
      // Prepare update data
      const updateData: any = {
        firstName: form.firstName,
        lastName: form.lastName,
      };
      
      if (form.middleName) {
        updateData.middleName = form.middleName;
      }
      
      if (form.phoneNumber) {
        updateData.phoneNumber = form.phoneNumber.replace(/[\s\-\(\)]/g, '');
      }
      
      // Always include profileImageUrl if it changed (including removal)
      if (profileImageUrl !== user.profileImageUrl) {
        updateData.profileImageUrl = profileImageUrl;
      }
    
      
      // Update profile
      const response = await authApi.updateProfile(updateData);
      const updatedUser = response.data;
      
      // Update user in context
      updateUser(updatedUser);
      
      // Clear states
      setSelectedFile(null);
      setRemoveImage(false);
      
      toast({ 
        title: "Profile updated", 
        description: "Your profile has been updated successfully." 
      });
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ 
        title: "Error", 
        description: getApiErrorMessage(error),
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to user data
    setForm({
      firstName: user?.firstName || "",
      middleName: user?.middleName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    });
    
    // Reset avatar to original
    if (user?.profileImageUrl) {
      setAvatarPreview(user.profileImageUrl);
    } else {
      setAvatarPreview(null);
    }
    setSelectedFile(null);
    setRemoveImage(false); // Reset remove flag
    setFormErrors({ firstName: "", lastName: "", phoneNumber: "" });
    
    toast({ 
      title: "Changes cancelled", 
      description: "Your profile changes have been discarded." 
    });
  };

  const hasChanges = () => {
    return (
      form.firstName !== user?.firstName ||
      form.middleName !== (user?.middleName || "") ||
      form.lastName !== user?.lastName ||
      form.phoneNumber !== (user?.phoneNumber || "") ||
      selectedFile !== null ||
      removeImage !== false // Check if we're removing the image
    );
  };

  const isSaving = isLoading || isUploading;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">User Profile</h1>
      <p className="text-muted-foreground mt-1 text-sm">Manage your personal information and account settings.</p>

      <Card className="mt-6 md:mt-8">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar" 
                  className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary text-xl md:text-2xl font-bold text-primary-foreground">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isSaving}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow hover:bg-secondary/90 transition-colors disabled:opacity-50"
                type="button"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isSaving}
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-base md:text-lg">
                {user?.firstName} {user?.middleName ? user.middleName + " " : ""}{user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs uppercase tracking-wider text-secondary mt-1">{user?.role}</p>
            </div>
            {(user?.profileImageUrl || avatarPreview) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isSaving}
                className="text-destructive hover:text-destructive"
                type="button"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input 
                value={form.firstName} 
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className={formErrors.firstName ? "border-destructive" : ""}
                disabled={isSaving}
              />
              {formErrors.firstName && (
                <p className="text-xs text-destructive">{formErrors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input 
                value={form.middleName} 
                onChange={(e) => setForm({ ...form, middleName: e.target.value })} 
                placeholder="Optional"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input 
                value={form.lastName} 
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className={formErrors.lastName ? "border-destructive" : ""}
                disabled={isSaving}
              />
              {formErrors.lastName && (
                <p className="text-xs text-destructive">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={form.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support for assistance.</p>
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              value={form.phoneNumber} 
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="0912345678 or +251912345678"
              className={formErrors.phoneNumber ? "border-destructive" : ""}
              disabled={isSaving}
            />
            {formErrors.phoneNumber && (
              <p className="text-xs text-destructive">{formErrors.phoneNumber}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Ethiopian format: 0912345678 or +251912345678
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${user?.accountStatus === "ACTIVE" ? "bg-green-500" : "bg-yellow-500"}`} />
                <span className={`text-sm font-medium ${user?.accountStatus === "ACTIVE" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                  {user?.accountStatus || "Active"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {user?.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString("en-US", { 
                      month: "long", 
                      day: "numeric", 
                      year: "numeric" 
                    })
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving || !hasChanges()}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={handleSaveProfile}
              disabled={isSaving || !hasChanges()}
              type="button"
            >
              {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isLoading && !isUploading && <Save className="mr-2 h-4 w-4" />}
              {isUploading ? "Uploading..." : isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}