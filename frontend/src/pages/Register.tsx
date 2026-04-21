import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { authService } from '@/lib/auth';
import { backendAuthService } from '@/lib/backendAuth';
import { UserRole } from '@/types';
import { Sprout } from 'lucide-react';
import { bootstrapSessionData } from '@/lib/sessionBootstrap';
import { userService } from '@/lib/users';
import { toast } from 'sonner';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-zA-Z])[A-Za-z0-9]{6,}$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  password: z.string().regex(PASSWORD_RULE, 'Min 6 chars, at least 1 capital letter, alphanumeric'),
  role: z.enum(['FARMER', 'INVESTOR', 'AGRI_PARTNER']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState<RegisterForm | null>(null);
  const [otpId, setOtpId] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'FARMER' as any }
  });

  // This helper generates a local OTP if the backend is offline
  const generateFallbackOtp = () => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mockId = "demo_" + Date.now();
    
    setOtpId(mockId);
    setOtpSent(true);
    setDemoOtp(randomOtp);
    setOtp(randomOtp); // Auto-fill for ease of testing
    setShowOtpPopup(true);
    
    toast.info('Using Demo OTP (Backend Offline)');
  };

  const showOtpOnScreen = (response: { otpId: string; otp?: string; message: string }) => {
    setOtpId(response.otpId);
    setOtpSent(true);
    // If backend provides the OTP in the response, show it
    if (response.otp) {
      setDemoOtp(response.otp);
      setOtp(response.otp);
      setShowOtpPopup(true);
      toast.success('OTP received from server.');
    } else {
      toast.success('OTP sent successfully.');
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setSubmitting(true);
    setFormData(data);

    try {
      // Try to get OTP from your Render Backend
      const response = await backendAuthService.requestOtp(data.phone);
      showOtpOnScreen(response);
    } catch (error) {
      console.error("Backend Error:", error);
      // FALLBACK: If backend fails, generate it locally so the user isn't stuck
      generateFallbackOtp();
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData) return;
    setSubmitting(true);

    try {
      // If it's a demo OTP, we skip the server and log them in locally
      if (otpId.startsWith("demo_")) {
          const mockUser = {
              id: otpId,
              name: formData.name,
              email: formData.email,
              role: formData.role as UserRole,
              phone: formData.phone
          };
          userService.upsertUser(mockUser);
          authService.login(mockUser, "mock_token_" + otpId);
      } else {
          // Normal server verification
          const res = await backendAuthService.register({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: formData.role as UserRole,
            otpId,
            otp,
          });
          userService.upsertUser(res.user);
          authService.login(res.user, res.token);
      }

      await bootstrapSessionData();
      toast.success('Account created successfully!');
      
      const dashboardPath =
        formData.role === 'FARMER'
          ? '/farmer/dashboard'
          : formData.role === 'INVESTOR'
            ? '/investor/dashboard'
            : '/partner/dashboard';
      navigate(dashboardPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData) return;
    setSubmitting(true);

    try {
      const response = await backendAuthService.requestOtp(formData.phone);
      showOtpOnScreen(response);
    } catch (error) {
      generateFallbackOtp();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center py-12 px-4">
      {/* SUCCESS POPUP */}
      <Dialog open={showOtpPopup} onOpenChange={setShowOtpPopup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>OTP Generated</DialogTitle>
            <DialogDescription>
              Use this code to complete your registration.
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
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            {!otpSent ? 'Join AgriInvest AI platform' : 'Enter the 6-digit code below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} placeholder="Your full name" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="your@email.com" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input id="phone" {...register('phone')} placeholder="9876543210" />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} placeholder="Min 6 chars, 1 Capital, numbers" />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select onValueChange={(value) => setValue('role', value as any)} defaultValue="FARMER">
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FARMER">Farmer</SelectItem>
                    <SelectItem value="INVESTOR">Investor</SelectItem>
                    <SelectItem value="AGRI_PARTNER">Agri-Partner</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Connecting...' : 'Send OTP'}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-sm text-gray-600">Your OTP code is:</p>
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
                {submitting ? 'Verifying...' : 'Verify & Create Account'}
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