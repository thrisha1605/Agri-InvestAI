import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Sprout, TrendingUp, Shield, Wallet, Users } from 'lucide-react';

const FAQ_CATEGORIES = [
  {
    title: 'General',
    icon: HelpCircle,
    color: 'text-blue-600 bg-blue-100',
    faqs: [
      {
        question: 'What is AgriInvest AI?',
        answer: 'AgriInvest AI is a comprehensive agriculture investment platform that connects farmers with investors through AI-driven analytics. It provides crop recommendations, disease detection, ESG scoring, and transparent investment opportunities in verified agricultural projects.'
      },
      {
        question: 'How does the platform work?',
        answer: 'Farmers create projects with detailed farm information, get AI-based crop analysis, and list funding requirements. Investors browse verified projects, analyze risk-return profiles, ESG scores, and invest securely via Razorpay. Returns are distributed based on actual harvest yields.'
      },
      {
        question: 'Is AgriInvest AI available across India?',
        answer: 'Yes! Our platform supports agricultural projects across all Indian states. We have active projects in Punjab, Haryana, Maharashtra, Karnataka, Tamil Nadu, and 20+ other states.'
      },
    ]
  },
  {
    title: 'For Farmers',
    icon: Sprout,
    color: 'text-green-600 bg-green-100',
    faqs: [
      {
        question: 'How can I create a project on the platform?',
        answer: 'Register as a Farmer, complete your profile verification, then navigate to "Create Project". Enter land details, crop type, soil information, funding requirements, and upload farm photos. Our admin team reviews and approves within 48 hours.'
      },
      {
        question: 'What are the AI tools available for farmers?',
        answer: 'We provide two main AI tools: 1) Crop Prediction - recommends best crops based on your soil pH, rainfall, temperature, and NPK values with 98% accuracy. 2) Disease Detection - upload crop leaf images to identify diseases instantly with treatment suggestions.'
      },
      {
        question: 'How do I receive funding?',
        answer: 'Once your project is approved and goes live, investors can fund it. Money is transferred to your verified bank account. You can track funding progress in real-time on your dashboard. Settlement happens after harvest based on actual yields.'
      },
      {
        question: 'What happens if my crop fails?',
        answer: 'We recommend crop insurance for all projects. In case of natural disasters or extreme crop failure, documented losses are shared transparently with investors. Our risk assessment helps minimize such scenarios.'
      },
    ]
  },
  {
    title: 'For Investors',
    icon: TrendingUp,
    color: 'text-purple-600 bg-purple-100',
    faqs: [
      {
        question: 'What is the minimum investment amount?',
        answer: 'The minimum one-time investment is ₹10,000 per project. For SIP (Systematic Investment Plan), you can start with ₹5,000 per month. There is no maximum limit, but we recommend diversification across 5-8 projects.'
      },
      {
        question: 'How are ESG scores calculated?',
        answer: 'ESG scores (0-100) are based on: Environmental factors (40%) - water conservation, organic practices, carbon footprint; Social factors (30%) - farmer welfare, local employment; Governance (30%) - transparency, certifications, compliance. Scores above 85 indicate excellent sustainability.'
      },
      {
        question: 'What returns can I expect?',
        answer: 'Returns vary by crop type: Rice/Wheat (15-18% ROI), Cotton (18-22%), Vegetables (20-28%), Fruits (22-30%). Returns depend on market prices, yield quality, weather, and project execution. All projections are based on historical data and AI predictions.'
      },
      {
        question: 'How does the SIP investment work?',
        answer: 'Agricultural SIP allows monthly investments into a project. Choose your amount (min ₹5,000), duration (4-14 months), and payment date. Auto-debit happens monthly. Your total contribution determines your profit share at harvest. You can pause/stop SIP anytime.'
      },
      {
        question: 'How and when do I receive returns?',
        answer: 'Returns are distributed after harvest and crop sale. You will receive notifications about harvest progress. Profits are calculated based on actual revenue minus expenses, then distributed proportionally to your investment. Money is credited to your wallet within 7 days post-settlement.'
      },
    ]
  },
  {
    title: 'Payments & Security',
    icon: Shield,
    color: 'text-red-600 bg-red-100',
    faqs: [
      {
        question: 'Is my money safe?',
        answer: 'Yes. We use Razorpay, a PCI-DSS compliant payment gateway. All transactions are secured with 256-bit SSL encryption. Projects are admin-verified before going live. We maintain transparent fund tracking and escrow mechanisms.'
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept UPI, Credit/Debit Cards, Net Banking, and Wallets through Razorpay. All payments are in INR. International payments are currently not supported.'
      },
      {
        question: 'Can I get a refund?',
        answer: 'If a project fails to start within 30 days of reaching funding goal, or gets rejected by admin, full refunds are processed within 5-7 business days. Active project investments cannot be withdrawn mid-cycle.'
      },
      {
        question: 'What is the wallet feature?',
        answer: 'The wallet stores your returns, refunds, and allows easy reinvestment without bank transfers. You can withdraw wallet balance to your bank account anytime (processing within 2-3 business days) or use it for new investments instantly.'
      },
    ]
  },
  {
    title: 'Platform Features',
    icon: Users,
    color: 'text-orange-600 bg-orange-100',
    faqs: [
      {
        question: 'What is the AI Chatbot?',
        answer: 'Our AI Chatbot provides role-based assistance. Farmers get help with soil health, disease identification, irrigation, fertilizers. Investors get insights on ESG, risk analysis, portfolio diversification, SIP planning. It also supports image upload for crop analysis.'
      },
      {
        question: 'How does the matching engine work?',
        answer: 'Our AI matching engine connects suitable farmers, investors, and agri partners based on: crop type, location proximity, investment size, risk tolerance, ESG preferences, and historical success patterns. It sends personalized project recommendations.'
      },
      {
        question: 'What is Landless Farming (Agri Partner)?',
        answer: 'Agri Partners are agriculture students or enthusiasts without land who can collaborate with farmers. They provide expertise, labor, or project management in exchange for profit sharing. Our platform facilitates three-way partnerships: Farmer (land) + Investor (capital) + Partner (expertise).'
      },
      {
        question: 'How do I verify my account?',
        answer: 'After registration, verify your mobile via OTP (MSG91). Then submit KYC documents: Aadhaar card, PAN card, and bank details. Farmers need land ownership documents. Verification takes 24-48 hours. You can browse projects without verification but cannot invest or create projects.'
      },
    ]
  },
];

export function FAQ() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about AgriInvest AI
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {FAQ_CATEGORIES.map((category, categoryIdx) => (
            <Card key={categoryIdx} className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`h-10 w-10 ${category.color} rounded-lg flex items-center justify-center`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <span>{category.title}</span>
                  <Badge variant="outline">{category.faqs.length} Questions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.faqs.map((faq, faqIdx) => (
                    <AccordionItem key={faqIdx} value={`item-${categoryIdx}-${faqIdx}`}>
                      <AccordionTrigger className="text-left font-semibold">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="mt-12 bg-gradient-to-r from-green-600 to-green-700 text-white border-none">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="mb-6 opacity-90">
              Our support team is here to help you 24/7
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 px-6 py-3 rounded-lg">
                <p className="text-sm opacity-80">Email</p>
                <p className="font-semibold">thrishaanju2@gmail.com</p>
              </div>
              <div className="bg-white/10 px-6 py-3 rounded-lg">
                <p className="text-sm opacity-80">Phone</p>
                <p className="font-semibold">8951441328</p>
              </div>
              <div className="bg-white/10 px-6 py-3 rounded-lg">
                <p className="text-sm opacity-80">WhatsApp</p>
                <p className="font-semibold">+91 98765-43210</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
