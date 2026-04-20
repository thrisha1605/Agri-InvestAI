import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sprout, TrendingUp, Users, Brain, Shield, Leaf, 
  BarChart3, Smartphone, ArrowRight, CheckCircle 
} from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                  AI-Powered Agriculture Platform
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Grow Wealth with{' '}
                <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Smart Farming
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Connect farmers with investors through AI-driven crop analytics, disease detection, 
                ESG scoring, and sustainable investment opportunities.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to="/register">
                    Start Investing <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8">
                  <Link to="/projects">Browse Projects</Link>
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-6">
                <div>
                  <p className="text-3xl font-bold text-green-600">₹120Cr+</p>
                  <p className="text-sm text-gray-600">Funds Invested</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-3xl font-bold text-green-600">2,500+</p>
                  <p className="text-sm text-gray-600">Active Projects</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-3xl font-bold text-green-600">18%</p>
                  <p className="text-sm text-gray-600">Avg. ROI</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=900&fit=crop" 
                alt="Smart Farming"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">AI Crop Analysis</p>
                    <p className="text-sm text-gray-600">98% Accuracy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Platform Features</h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools for farmers and investors to succeed together
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI Crop Prediction',
                description: 'Get intelligent crop recommendations based on soil, climate, and market data',
                color: 'bg-blue-100 text-blue-600'
              },
              {
                icon: Leaf,
                title: 'Disease Detection',
                description: 'Upload crop images for instant disease identification and treatment suggestions',
                color: 'bg-green-100 text-green-600'
              },
              {
                icon: BarChart3,
                title: 'ESG Scoring',
                description: 'Transparent sustainability metrics for every agricultural project',
                color: 'bg-purple-100 text-purple-600'
              },
              {
                icon: TrendingUp,
                title: 'SIP Investment',
                description: 'Systematic Investment Plans tailored for agriculture with flexible tenures',
                color: 'bg-orange-100 text-orange-600'
              },
              {
                icon: Shield,
                title: 'Risk Analysis',
                description: 'AI-powered risk assessment for informed investment decisions',
                color: 'bg-red-100 text-red-600'
              },
              {
                icon: Smartphone,
                title: 'Real-time Updates',
                description: 'Track project progress, yields, and returns on your dashboard',
                color: 'bg-indigo-100 text-indigo-600'
              }
            ].map((feature, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow border-none bg-gray-50">
                <CardContent className="p-6 space-y-3">
                  <div className={`h-12 w-12 ${feature.color} rounded-lg flex items-center justify-center`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Simple steps to start your agriculture investment journey
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Farmers Create Projects',
                description: 'Upload farm details, get AI analysis, and list verified projects with ESG scores',
                icon: Sprout
              },
              {
                step: '02',
                title: 'Investors Browse & Invest',
                description: 'Explore projects, check risk-return profiles, and invest via secure Razorpay payments',
                icon: TrendingUp
              },
              {
                step: '03',
                title: 'Profit Distribution',
                description: 'Track harvest progress and receive returns based on actual yields directly to your wallet',
                icon: Users
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <Card className="h-full border-2 hover:border-green-500 transition-colors">
                  <CardContent className="p-8 space-y-4">
                    <div className="text-6xl font-bold text-green-100">{item.step}</div>
                    <div className="h-14 w-14 bg-green-600 rounded-full flex items-center justify-center -mt-2">
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-8 w-8 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why Choose AgriInvest AI?
              </h2>
              <div className="space-y-4">
                {[
                  'AI-powered crop recommendations with 98% accuracy',
                  'Instant disease detection and treatment guidance',
                  'Transparent ESG scoring for every project',
                  'Secure Razorpay payment gateway (INR)',
                  'Real-time profit settlement engine',
                  'Expert matching between farmers and investors',
                  'Government-approved verification process',
                  'Complete wallet and payout management'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-lg text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <img 
                src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop" 
                alt="Farming"
                className="rounded-lg shadow-md"
              />
              <img 
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop" 
                alt="Crops"
                className="rounded-lg shadow-md mt-8"
              />
              <img 
                src="https://images.unsplash.com/photo-1595400750775-747999779c7d?w=400&h=300&fit=crop" 
                alt="Technology"
                className="rounded-lg shadow-md -mt-8"
              />
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop" 
                alt="Harvest"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Agriculture?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of farmers and investors building a sustainable future together
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to="/register">Register Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent text-white border-white hover:bg-white hover:text-green-600">
              <Link to="/projects">View Projects</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
