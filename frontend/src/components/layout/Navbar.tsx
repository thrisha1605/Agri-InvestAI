import { Link, useNavigate } from 'react-router-dom';
import { Sprout, LogOut, User, Wallet, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/auth';
import { NotificationCenter } from '@/components/NotificationCenter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function Navbar() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const dashboardPath = user?.role === 'FARMER' ? '/farmer/dashboard' : user?.role === 'INVESTOR' ? '/investor/dashboard' : user?.role === 'AGRI_PARTNER' ? '/partner/dashboard' : '/admin/dashboard';
  const walletPath = user?.role === 'FARMER' ? '/farmer/wallet' : user?.role === 'INVESTOR' ? '/investor/wallet' : user?.role === 'AGRI_PARTNER' ? '/partner/wallet' : '/admin/dashboard';
  const profilePath = user?.role === 'FARMER' ? '/farmer/profile' : user?.role === 'INVESTOR' ? '/investor/profile' : user?.role === 'AGRI_PARTNER' ? '/partner/profile' : '/admin/profile';

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:text-primary/90 transition-colors">
            <Sprout className="h-7 w-7" />
            <span className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">AgriInvest AI</span>
          </Link>

          <div className="flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link to="/" className="text-sm font-medium hover:text-primary">Home</Link>
                <Link to="/about" className="text-sm font-medium hover:text-primary">About Us</Link>
                <Link to="/projects" className="text-sm font-medium hover:text-primary">Projects</Link>
                <Link to="/faq" className="text-sm font-medium hover:text-primary">FAQ</Link>
                <Button asChild variant="ghost"><Link to="/admin/login">Admin</Link></Button>
                <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
                <Button asChild><Link to="/register">Get Started</Link></Button>
              </>
            ) : (
              <>
                <Link to={dashboardPath} className="text-sm font-medium hover:text-primary">Dashboard</Link>
                <Link to="/projects" className="text-sm font-medium hover:text-primary">Projects</Link>
                {user?.role === 'ADMIN' && (
                  <>
                    <Link to="/admin/projects" className="text-sm font-medium hover:text-primary">Project Approvals</Link>
                    <Link to="/admin/partner-requests" className="text-sm font-medium hover:text-primary">Partner Requests</Link>
                    <Link to="/admin/withdrawal-requests" className="text-sm font-medium hover:text-primary">Withdrawals</Link>
                  </>
                )}
                {user?.role === 'FARMER' && <Link to="/farmer/soil-ph" className="text-sm font-medium hover:text-primary">Soil pH</Link>}
                {user?.role === 'INVESTOR' && <Link to="/investor/portfolio" className="text-sm font-medium hover:text-primary">Portfolio</Link>}
                {user?.role === 'AGRI_PARTNER' && <Link to="/partner/available-projects" className="text-sm font-medium hover:text-primary">Available Projects</Link>}
                <Link to="/faq" className="text-sm font-medium hover:text-primary">FAQ</Link>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div>
                      <span className="text-sm font-medium">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-primary font-semibold mt-1">{user?.role.replace('_', ' ')}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.role !== 'ADMIN' && (
                      <DropdownMenuItem onClick={() => navigate(walletPath)}>
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Wallet</span>
                        <span className="ml-auto text-xs font-semibold text-primary">₹{(user?.walletBalance || 0).toLocaleString('en-IN')}</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate(profilePath)}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
