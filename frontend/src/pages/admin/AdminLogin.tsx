import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/auth';
import { User } from '@/types';
import { Shield, AlertCircle } from 'lucide-react';

const adminLoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = (data: AdminLoginForm) => {
    // Demo admin credentials
    if (data.username === 'admin' && data.password === 'admin123') {
      const adminUser: User = {
        id: 'admin_001',
        name: 'Admin User',
        email: 'admin@agriinvest.ai',
        phone: '9999999999',
        role: 'ADMIN',
        verified: true,
        walletBalance: 0,
      };
      
      const token = `local_admin_session_${Date.now()}`;
      authService.login(adminUser, token);
      navigate('/admin/dashboard');
    } else {
      setError('Invalid admin credentials. Use username: admin, password: admin123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800/50 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Admin Portal</CardTitle>
          <CardDescription className="text-gray-400">
            Secure access for administrators only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Admin Username</Label>
              <Input 
                id="username" 
                placeholder="Enter admin username" 
                {...register('username')}
                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              {errors.username && <p className="text-sm text-red-400">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Admin Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter admin password" 
                {...register('password')}
                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
              <p className="text-xs text-blue-400">
                <strong>Demo Credentials:</strong><br />
                Username: admin<br />
                Password: admin123
              </p>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
              <Shield className="mr-2 h-4 w-4" />
              Admin Login
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
              ← Back to User Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
