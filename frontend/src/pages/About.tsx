import { Card, CardContent } from '@/components/ui/card';
import { Brain, Leaf, TrendingUp, Users, Shield, Wallet } from 'lucide-react';

export function About() {
  const features = [
    { icon: Brain, title: 'Farmer AI support', description: 'Crop recommendation, simplified crop prediction and soil guidance.' },
    { icon: TrendingUp, title: 'Investor funding flow', description: 'Approved farmer projects are shown to investors with funding transparency.' },
    { icon: Users, title: 'Agri-partner support', description: 'Helpers can request work on live projects and farmers can review them.' },
    { icon: Wallet, title: 'Wallet based flow', description: 'Funding, salary and withdrawal details are tracked in wallet pages.' },
    { icon: Shield, title: 'Admin approval', description: 'Admin verifies users, approves projects and manages requests.' },
    { icon: Leaf, title: 'Practical agriculture workflow', description: 'One platform for farmers, investors, agri-partners and admin.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">About AgriInvest AI</h1>
          <p className="text-xl leading-relaxed opacity-90">AgriInvest AI helps farmers create verified projects, lets investors fund them, and allows agri-partners to work on active projects. Admin controls approval, verification and release flow.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-none bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
