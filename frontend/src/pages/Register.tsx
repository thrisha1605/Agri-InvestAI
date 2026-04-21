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
import { UserRole } from '@/types';
import { Sprout } from 'lucide-react';
import { bootstrapSessionData } from '@/lib/sessionBootstrap';
import { userService } from '@/lib/users';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  password: z.string().min(6, 'Min 6 characters'),
  role: z.enum(['FARMER', 'INVESTOR', 'AGRI_PARTNER']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [formData, setFormData] = useState<RegisterForm | null>(null);
  const [demoOtp, setDemoOtp] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'FARMER' }
  });

  const onSubmit = async (data: RegisterForm) => {
    setFormData(data);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoOtp(newOtp);
    setOtpSent(true);
    toast.success("OTP Generated!");
  };

  const handleVerifyOTP = async () => {
    if (!formData || otpInput !== demoOtp) {
      toast.error("Invalid OTP code");
      return;
    }
    
    const mockUser = {
      id: "user_" + Date.now(),
      name: formData.name,
      email: formData.email,
      role: formData.role as UserRole,
      phone: formData.phone
    };

    userService.upsertUser(mockUser);
    authService.login(mockUser, "demo_token");
    await bootstrapSessionData();
    toast.success('Welcome to AgriInvest!');
    navigate(formData.role === 'FARMER' ? '/farmer/dashboard' : '/investor/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Sprout className="h-10 w-10 text-green-600 mx-auto mb-2" />
          <CardTitle>Create Account</CardTitle>
          <CardDescription>{!otpSent ? "Join AgriInvest" : "Verify your code"}</CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input {...register('name')} placeholder="Full Name" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              <Input {...register('email')} placeholder="Email" />
              <Input {...register('phone')} placeholder="Mobile Number" />
              <Input {...register('password')} type="password" placeholder="Password" />
              <Select onValueChange={(v) => setValue('role', v as any)}>
                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FARMER">Farmer</SelectItem>
                  <SelectItem value="INVESTOR">Investor</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full bg-green-600">Send OTP</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 border border-green-300 rounded text-center">
                <p className="text-sm text-green-800">YOUR OTP IS:</p>
                <p className="text-4xl font-bold text-green-700">{demoOtp}</p>
              </div>
              <Input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="Enter code" />
              <Button onClick={handleVerifyOTP} className="w-full bg-green-600">Verify & Login</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}