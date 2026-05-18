import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={logo} alt="Digital Estate" className="mx-auto mb-4 h-12 w-12" width={48} height={48} />
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll send you a link to reset your password</p>
        </div>

        {!sent ? (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Send Reset Link
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-secondary mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground">Check your email</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a reset link to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                Try another email
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="inline-flex items-center gap-1 text-secondary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
