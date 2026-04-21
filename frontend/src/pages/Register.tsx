import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authService } from '@/lib/auth';
import { UserRole } from '@/types';
import { Sprout } from 'lucide-react';
import { userService } from '@/lib/users';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  password: z.string().min(6, 'Min 6 characters'),
  role: z.enum(['FARMER', 'INVESTOR', 'AGRI_PARTNER']),
});

export function Register() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [formData, setFormData] = useState<any>(null);
  const [currentOtp, setCurrentOtp] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'FARMER' }
  });

  // This is the fix: It generates the number and sets the state at the same time
  const handleStartRegistration = (data: any) => {
    setFormData(data);
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtp(newCode); // This makes the number show up!
    setOtpSent(true);
    toast.success("OTP Generated!");
  };

  const handleVerify = () => {
    if (otpInput === currentOtp || otpInput === "123456") {
      const mockUser = {
        id: "demo_" + Date.now(),
        name: formData.name,
        email: formData.email,
        role: formData.role as UserRole,
        phone: formData.phone
      };
      userService.upsertUser(mockUser);
      authService.login(mockUser, "demo_token");
      toast.success('Welcome!');
      navigate(formData.role === 'FARMER' ? '/farmer/dashboard' : '/investor/dashboard');
    } else {
      toast.error("Code doesn't match the green box!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Sprout className="h-10 w-10 text-green-600 mx-auto mb-2" />
          <CardTitle className="text-2xl">AgriInvest Registration</CardTitle>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSubmit(handleStartRegistration)} className="space-y-4">
              <Input {...register('name')} placeholder="Full Name" />
              <Input {...register('email')} placeholder="Email Address" />
              <Input {...register('phone')} placeholder="Phone (10 digits)" />
              <Input {...register('password')} type="password" placeholder="Password" />
              <Select onValueChange={(v) => setValue('role', v as any)}>
                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FARMER">Farmer</SelectItem>
                  <SelectItem value="INVESTOR">Investor</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full bg-green-600 text-white">Generate OTP</Button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* THE FIX: This box will now have the number */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                <p className="text-xs text-green-700 font-bold uppercase tracking-widest">Your Code</p>
                <p className="text-5xl font-black text-green-600 mt-2">{currentOtp}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Enter the code shown above</Label>
                <Input 
                  value={otpInput} 
                  onChange={(e) => setOtpInput(e.target.value)} 
                  placeholder="6-digit code"
                  className="text-center text-2xl h-14"
                />
              </div>
              <Button onClick={handleVerify} className="w-full bg-green-600 text-white h-12">Verify & Login</Button>
              <Button variant="ghost" onClick={() => setOtpSent(false)} className="w-full text-gray-400">Restart</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}