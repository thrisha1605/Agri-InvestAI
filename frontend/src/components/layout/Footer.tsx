import { Link } from 'react-router-dom';
import { Sprout, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sprout className="h-6 w-6 text-green-500" />
              <span className="font-bold text-xl text-white">AgriInvest AI</span>
            </div>
            <p className="text-sm">Connecting farmers, investors and agri-partners through one practical agriculture platform.</p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-green-500">About Us</Link></li>
              <li><Link to="/projects" className="hover:text-green-500">Browse Projects</Link></li>
              <li><Link to="/faq" className="hover:text-green-500">FAQ</Link></li>
              <li><Link to="/register" className="hover:text-green-500">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">How it works</h3>
            <ul className="space-y-2 text-sm">
              <li>Farmers upload verified projects</li>
              <li>Admin reviews and approves</li>
              <li>Investors fund approved projects</li>
              <li>Agri-partners support live projects</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-green-500" /><a href="mailto:thrishaanju2@gmail.com" className="hover:text-green-500">thrishaanju2@gmail.com</a></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-500" /><span>8951441328</span></li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-green-500 mt-0.5" /><span>CMR University, Bengaluru, Karnataka</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>© 2026 AgriInvest AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
