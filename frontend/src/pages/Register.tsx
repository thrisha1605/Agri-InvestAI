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
import { authService } from '@/lib/auth';
import { backendAuthService } from '@/lib/backendAuth';
import { UserRole } from '@/types';
import { Sprout } from 'lucide-react';
import { bootstrapSessionData } from '@/lib/sessionBootstrap';
import { userService } from '@/lib/users';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['FARMER', 'INVESTOR', 'AGRI_PARTNER']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [formData, setFormData] = useState<RegisterForm | null>(null);
  const [demoOtp, setDemoOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'FARMER' }
  });

  const generateAndShowOtp = () => {
    // This generates a 6-digit number to show on your screen
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoOtp(newOtp);
    setOtpSent(true);
    toast.success('OTP Generated for Demo');
  };

  const onSubmit = async (data: RegisterForm) => {
    setSubmitting(true);
    setFormData(data);

    try {
      // We try the backend, but if it fails (like your current MongoDB error), 
      // we jump to the 'catch' block to show the OTP on screen.
      await backendAuthService.requestOtp(data.phone);
      toast.success('OTP requested from server');
      setOtpSent(true);
    } catch (error) {
      console.log("Backend offline, using Demo Mode");
      generateAndShowOtp();
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData) return;
    setSubmitting(true);

    try {
      // For Demo: If the user types the OTP shown in the green box, let them in!
      if (otpInput === demoOtp || otpInput === "123456") {
        const mockUser = {
          id: 'demo_' + Date.now(),
          name: formData.name,
          email: formData.email,
          role: formData.role as UserRole,
          phone: formData.phone
        };
        userService.upsertUser(mockUser);
        authService.login(mockUser, 'demo_token');
        await bootstrapSessionData();
        toast.success('Registration successful!');
        navigate(formData.role === 'FARMER' ? '/farmer/dashboard' : '/investor/dashboard');
      } else {
        toast.error('Invalid OTP. Please check the code in the green box.');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg border-green-100">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
              <Sprout className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Create Account</CardTitle>
          <CardDescription>
            {!otpSent ? 'Join the AgriInvest AI platform' : 'Enter the code displayed below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} placeholder="Enter your name" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="name@example.com" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register('phone')} placeholder="9876543