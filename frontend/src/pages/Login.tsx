import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { authService } from '@/lib/auth';
import { backendAuthService } from '@/lib/backendAuth';
import { Sprout } from 'lucide-react';
import { bootstrapSessionData } from '@/lib/sessionBootstrap';
import { userService } from '@/lib/users';
import { toast } from 'sonner';

const loginSchema = z.object({
  phoneOrEmail: z.string().min(3, 'Enter phone number or email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [target, setTarget] = useState('');
  const [formData, setFormData] = useState<LoginForm | null>(null);
  const [otpId, setOtpId] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const showOtpOnScreen = (response: { otpId: string; otp?: string; message: string }) => {
    setOtpId(response.otpId);
    setOtpSent(true);
    if (response.otp) {
      setDemoOtp(response.otp);
      setOtp(response.otp);
      setShowOtpPopup(true);
      toast.success('OTP sent and shown on screen.');
      return;
    }
    toast.success('OTP sent successfully.');
  };

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);

    try {
      const otpTarget = data.phoneOrEmail.trim();
      const response = await backendAuthService.requestOtp(otpTarget);
      setTarget(otpTarget);
      setFormData(data);
      showOtpOnScreen(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData) return;
    if (!otpId) {
      toast.error('Please request a new OTP.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await backendAuthService.login({
        identifier: formData.phoneOrEmail.trim(),
        password: formData.password,
        otpId,
        otp: otp.trim(),
      });

      userService.upsertUser(res.user);
      authService.login(res.user, res.token);
      await bootstrapSessionData();

      toast.success('Login successful!');
      const dashboardPath =
        res.user.role === 'FARMER'
          ? '/farmer/dashboard'
          : res.user.role === 'INVESTOR'
            ? '/investor/dashboard'
            : res.user.role === 'AGRI_PARTNER'
              ? '/partner/dashboard'
              : '/admin/dashboard';
      navigate(dashboardPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setSubmitting(true);

    try {
      const response = await backendAuthService.requestOtp(target);
      showOtpOnScreen(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend OTP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center py-12 px-4">
      <Dialog open={showOtpPopup} onOpenChange={setShowOtpPopup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>OTP Sent</DialogTitle>
            <DialogDescription>
              Use this OTP on the same screen to continue login.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Your OTP</p>
            <p className="text-3xl font-bold tracking-[0.35em] text-green-700">{demoOtp}</p>
          </div>
          <Button onClick={() => setShowOtpPopup(false)} className="w-full">
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
              <Sprout className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            {!otpSent ? 'Welcome back to AgriInvest AI' : 'Enter OTP to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneOrEmail">Phone or Email</Label>
                <Input id="phoneOrEmail" {...register('phoneOrEmail')} placeholder="9876543210 or your@email.com" />
                {errors.phoneOrEmail && <p className="text-sm text-red-500">{errors.phoneOrEmail.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} placeholder="Enter password" />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                Send OTP
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-sm text-gray-600">Popup closed? Your OTP is still here.</p>
                <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-green-700">{demoOtp}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  maxLength={6}
                />
              </div>

              <Button onClick={handleVerifyOTP} className="w-full" disabled={submitting}>
                Verify & Sign In
              </Button>

              <Button
                variant="outline"
                onClick={handleResendOtp}
                disabled={submitting}
                className="w-full"
              >
                Resend OTP
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
