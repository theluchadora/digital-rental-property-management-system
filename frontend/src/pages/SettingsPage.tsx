import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, Globe, Save, Loader2 } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api-error-handler";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC+3"); // East Africa time
  const [currency, setCurrency] = useState("etb"); // Ethiopian Birr default
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = () => {
    // Save preferences to localStorage
    const preferences = {
      emailNotif,
      pushNotif,
      smsNotif,
      language,
      timezone,
      currency,
    };
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    
    toast({ 
      title: "Settings Saved", 
      description: "Your preferences have been updated." 
    });
  };

  // Load saved preferences on mount
  useState(() => {
    const savedPrefs = localStorage.getItem("userPreferences");
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setEmailNotif(prefs.emailNotif ?? true);
      setPushNotif(prefs.pushNotif ?? true);
      setSmsNotif(prefs.smsNotif ?? false);
      setLanguage(prefs.language ?? "en");
      setTimezone(prefs.timezone ?? "UTC+3");
      setCurrency(prefs.currency ?? "etb");
    }
  });

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Call the delete endpoint
      await authApi.deleteAccount();
      
      // Clear session and logout
      await logout();
      
      toast({ 
        title: "Account Deleted", 
        description: "Your account has been permanently deleted." 
      });
      
      // Navigate to home page
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({ 
        title: "Delete Failed", 
        description: getApiErrorMessage(error) || "Failed to delete account. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
      <p className="text-muted-foreground mt-1 text-sm">Manage your account preferences and configurations.</p>

      {/* Notifications */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Browser push notifications</p>
            </div>
            <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">SMS Notifications</p>
              <p className="text-xs text-muted-foreground">Text message alerts</p>
            </div>
            <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="am">Amharic</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC-5">Eastern (UTC-5)</SelectItem>
                  <SelectItem value="UTC+3">East Africa (UTC+3)</SelectItem>
                  <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                  <SelectItem value="UTC-8">Pacific (UTC-8)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Currency Display</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="etb">ETB (Br)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm" disabled>Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Login History</p>
              <p className="text-xs text-muted-foreground">View recent login activity</p>
            </div>
            <Button variant="outline" size="sm" disabled>View</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="mt-6 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <DeleteConfirmDialog
              title="Delete Account?"
              description="This will permanently delete your account, all properties, leases, and data. This action cannot be undone."
              onConfirm={handleDeleteAccount}
              triggerLabel={isDeleting ? "Deleting..." : "Delete Account"}
              triggerVariant="destructive"
              disabled={isDeleting}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Save className="mr-2 h-4 w-4" /> Save Settings
        </Button>
      </div>
    </div>
  );
}