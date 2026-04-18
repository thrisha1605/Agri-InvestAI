import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Project } from '@/types';
import { authService } from '@/lib/auth';
import { createInvestment } from '@/lib/appData';
import { createSip, syncRoleSipPlansFromBackend } from '@/lib/roleSip';
import { toast } from 'sonner';
import { 
  TrendingUp, Percent, Calendar, Wallet, CreditCard, 
  Smartphone, Building2, ArrowRight, CheckCircle2, 
  AlertCircle, Info, Calculator, Clock
} from 'lucide-react';

interface InvestmentModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (investment: any) => void;
  initialAmount?: number;
}

export function InvestmentModal({ project, isOpen, onClose, onSuccess, initialAmount }: InvestmentModalProps) {
  const user = authService.getCurrentUser();
  const [step, setStep] = useState(1);
  
  // Investment details
  const [investmentType, setInvestmentType] = useState<'ONETIME' | 'SIP'>('ONETIME');
  const defaultAmount = project.fundingGoal >= 500000 ? 50000 : 10000;
  const [amount, setAmount] = useState<number>(initialAmount ?? defaultAmount);
  const [sipMonthlyAmount, setSipMonthlyAmount] = useState(10000);
  const [sipDuration, setSipDuration] = useState(6);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'NETBANKING' | 'WALLET'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Record<string, any> | null>(null);
  const navigate = useNavigate();

  const minInvestment = 10000;
  const maxInvestment = project.fundingGoal - project.fundedAmount;
  const maxSipMonthly = Math.floor(maxInvestment / 3);

  const calculateReturns = (investAmount: number) => {
    const roi = project.expectedROI / 100;
    const expectedReturn = investAmount * roi;
    const totalReturn = investAmount + expectedReturn;
    return { expectedReturn, totalReturn };
  };

  const oneTimeReturns = calculateReturns(amount);
  const sipTotalInvestment = sipMonthlyAmount * sipDuration;
  const sipReturns = calculateReturns(sipTotalInvestment);

  const handleAmountChange = (value: number) => {
    if (value >= minInvestment && value <= maxInvestment) {
      setAmount(value);
    }
  };

  const handleClose = () => {
    setStep(1);
    setIsProcessing(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep(1);
    setIsProcessing(false);
    setReceipt(null);
    setAmount(initialAmount ?? defaultAmount);
    setSipMonthlyAmount(10000);
    setSipDuration(6);
    setPaymentMethod('UPI');
  }, [isOpen, initialAmount, defaultAmount]);

  const processPayment = async () => {
    setIsProcessing(true);

    const finalAmount = investmentType === 'ONETIME' ? amount : sipMonthlyAmount;
    if (finalAmount <= 0) {
      toast.error('Enter a valid amount before paying.');
      setIsProcessing(false);
      return;
    }

    try {
      if (!user) {
        throw new Error('Please login as investor to continue.');
      }

      const fakeOrderId = `order_${Date.now()}`;
      const fakePaymentId = `pay_${Date.now()}`;
      const fakeSignature = `sig_${Math.random().toString(36).slice(2)}`;

      if (investmentType === 'SIP') {
        await createSip({
          userId: user.id,
          projectId: project.id,
          amount: sipMonthlyAmount,
          role: user.role,
          tenureYears: sipDuration >= 24 ? 3 : 1,
          goalLabel: `SIP for ${project.title}`,
          termsAccepted: true,
          interval: 'MONTHLY',
          autoDebitEnabled: true,
        });
        await syncRoleSipPlansFromBackend(user.id).catch(() => undefined);
      } else {
        await createInvestment(user.id, {
          projectId: project.id,
          amount,
          paymentMethod,
        });
      }

      const transactionId = `INV${Date.now().toString().slice(-8)}`;
      setReceipt({
        transactionId,
        paymentId: fakePaymentId,
        orderId: fakeOrderId,
        amount: finalAmount,
        method: paymentMethod,
        date: new Date().toLocaleString('en-IN'),
        signature: fakeSignature,
      });

      setIsProcessing(false);
      setStep(4);
      toast.success('Payment successful!');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 mb-1">Investment Options</p>
            <p className="text-sm text-blue-700">
              Choose one-time investment for immediate participation or SIP for monthly investments
            </p>
          </div>
        </div>
      </div>

      <Tabs value={investmentType} onValueChange={(v) => setInvestmentType(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ONETIME">One-Time Investment</TabsTrigger>
          <TabsTrigger value="SIP">SIP (Monthly)</TabsTrigger>
        </TabsList>

        <TabsContent value="ONETIME" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Investment Amount</Label>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">₹{amount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-600">Min: ₹10,000 | Max: ₹{maxInvestment.toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <Slider
              value={[amount]}
              onValueChange={([value]) => handleAmountChange(value)}
              min={minInvestment}
              max={maxInvestment}
              step={5000}
              className="py-4"
            />

            <div className="grid grid-cols-4 gap-2">
              {[10000, 25000, 50000, 100000].map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAmountChange(preset)}
                  disabled={preset > maxInvestment}
                  className="text-xs"
                >
                  ₹{(preset / 1000)}K
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customAmount">Or enter custom amount</Label>
              <Input
                id="customAmount"
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(parseInt(e.target.value) || minInvestment)}
                min={minInvestment}
                max={maxInvestment}
                step={1000}
                className="text-lg font-semibold"
              />
            </div>
          </div>

          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-green-600" />
              Expected Returns
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">Investment</p>
                <p className="text-lg font-bold">₹{amount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Expected Profit</p>
                <p className="text-lg font-bold text-green-600">
                  +₹{oneTimeReturns.expectedReturn.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Return</p>
                <p className="text-lg font-bold text-blue-600">
                  ₹{oneTimeReturns.totalReturn.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">ROI</span>
                <Badge className="bg-green-600">{project.expectedROI}%</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="SIP" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Monthly Investment</Label>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">₹{sipMonthlyAmount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-600">Per month</p>
              </div>
            </div>
            
            <Slider
              value={[sipMonthlyAmount]}
              onValueChange={([value]) => setSipMonthlyAmount(value)}
              min={5000}
              max={maxSipMonthly}
              step={1000}
              className="py-4"
            />

            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 25000, 50000].map((preset) => (
                <Button
                  key={preset}
                  variant={sipMonthlyAmount === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSipMonthlyAmount(preset)}
                  disabled={preset > maxSipMonthly}
                  className="text-xs"
                >
                  ₹{(preset / 1000)}K
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Duration (Months)</Label>
              <p className="text-xl font-bold">{sipDuration} months</p>
            </div>
            
            <Slider
              value={[sipDuration]}
              onValueChange={([value]) => setSipDuration(value)}
              min={3}
              max={24}
              step={1}
              className="py-4"
            />

            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 12, 24].map((months) => (
                <Button
                  key={months}
                  variant={sipDuration === months ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSipDuration(months)}
                  className="text-xs"
                >
                  {months}M
                </Button>
              ))}
            </div>
          </div>

          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              SIP Summary
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Total Investment</p>
                <p className="text-lg font-bold">₹{sipTotalInvestment.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Expected Profit</p>
                <p className="text-lg font-bold text-green-600">
                  +₹{sipReturns.expectedReturn.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="text-lg font-bold">{sipDuration} months</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Return</p>
                <p className="text-lg font-bold text-blue-600">
                  ₹{sipReturns.totalReturn.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Next debit date</span>
                <span className="font-semibold">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </Card>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900 mb-1">Auto-debit enabled</p>
                <p className="text-yellow-700">
                  ₹{sipMonthlyAmount.toLocaleString('en-IN')} will be automatically debited from your wallet on the same date every month. 
                  Ensure sufficient balance.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={() => setStep(2)} className="w-full" size="lg">
        Continue to Payment
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 mb-1">Razorpay Test Mode</p>
            <p className="text-sm text-blue-700">
              This is sandbox mode. Use test cards: 4111 1111 1111 1111 (Any CVV, Future date)
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-4 block">Select Payment Method</Label>
        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
          <div className="space-y-3">
            <Card 
              className={`p-4 cursor-pointer transition-all ${
                paymentMethod === 'UPI' ? 'border-green-600 bg-green-50' : 'hover:border-green-300'
              }`}
              onClick={() => setPaymentMethod('UPI')}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="UPI" id="upi" />
                <Smartphone className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <Label htmlFor="upi" className="font-semibold cursor-pointer">UPI</Label>
                  <p className="text-sm text-gray-600">Pay using Google Pay, PhonePe, Paytm</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">Recommended</Badge>
              </div>
            </Card>

            <Card 
              className={`p-4 cursor-pointer transition-all ${
                paymentMethod === 'CARD' ? 'border-green-600 bg-green-50' : 'hover:border-green-300'
              }`}
              onClick={() => setPaymentMethod('CARD')}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="CARD" id="card" />
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <Label htmlFor="card" className="font-semibold cursor-pointer">Debit/Credit Card</Label>
                  <p className="text-sm text-gray-600">Visa, Mastercard, RuPay, Amex</p>
                </div>
              </div>
            </Card>

            <Card 
              className={`p-4 cursor-pointer transition-all ${
                paymentMethod === 'NETBANKING' ? 'border-green-600 bg-green-50' : 'hover:border-green-300'
              }`}
              onClick={() => setPaymentMethod('NETBANKING')}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="NETBANKING" id="netbanking" />
                <Building2 className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <Label htmlFor="netbanking" className="font-semibold cursor-pointer">Net Banking</Label>
                  <p className="text-sm text-gray-600">All major banks supported</p>
                </div>
              </div>
            </Card>

            <Card 
              className={`p-4 cursor-pointer transition-all ${
                paymentMethod === 'WALLET' ? 'border-green-600 bg-green-50' : 'hover:border-green-300'
              }`}
              onClick={() => setPaymentMethod('WALLET')}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="WALLET" id="wallet" />
                <Wallet className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <Label htmlFor="wallet" className="font-semibold cursor-pointer">Wallet</Label>
                  <p className="text-sm text-gray-600">Paytm, PhonePe, FreeCharge</p>
                </div>
              </div>
            </Card>
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          Back
        </Button>
        <Button onClick={() => setStep(3)} className="flex-1">
          Review Investment
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const finalAmount = investmentType === 'ONETIME' ? amount : sipMonthlyAmount;
    const totalInvestment = investmentType === 'ONETIME' ? amount : sipTotalInvestment;
    const expectedProfit = investmentType === 'ONETIME' ? oneTimeReturns.expectedReturn : sipReturns.expectedReturn;

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 mb-1">Ready to invest</p>
              <p className="text-sm text-green-700">
                Please review your investment details before confirming payment
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-lg">Investment Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Project</span>
              <span className="font-semibold text-right max-w-[60%]">{project.title}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between">
              <span className="text-gray-600">Investment Type</span>
              <Badge className={investmentType === 'SIP' ? 'bg-purple-600' : 'bg-green-600'}>
                {investmentType === 'ONETIME' ? 'One-Time' : 'SIP (Monthly)'}
              </Badge>
            </div>
            <Separator />
            
            <div className="flex justify-between">
              <span className="text-gray-600">
                {investmentType === 'ONETIME' ? 'Investment Amount' : 'Monthly Amount'}
              </span>
              <span className="font-bold text-lg">₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>

            {investmentType === 'SIP' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{sipDuration} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Investment</span>
                  <span className="font-semibold">₹{totalInvestment.toLocaleString('en-IN')}</span>
                </div>
              </>
            )}
            <Separator />
            
            <div className="flex justify-between">
              <span className="text-gray-600">Expected ROI</span>
              <span className="font-semibold text-green-600">{project.expectedROI}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Profit</span>
              <span className="font-bold text-green-600 text-lg">
                +₹{expectedProfit.toLocaleString('en-IN')}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold">{paymentMethod}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold">Amount to Pay Now</span>
              <span className="font-bold text-2xl text-green-600">
                ₹{finalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gray-50">
          <h4 className="font-semibold mb-3">Project Timeline</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Project Duration</span>
              <span className="font-semibold">{project.timeline}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Expected Completion</span>
              <span className="font-semibold">
                {new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={processPayment} 
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isProcessing ? 'Processing...' : 'Pay Now'}
            {!isProcessing && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const finalAmount = investmentType === 'ONETIME' ? amount : sipMonthlyAmount;

    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h3>
          <p className="text-gray-600">Your payment has completed and the receipt is shown below.</p>
        </div>

        <Card className="p-6 text-left">
          <h4 className="font-bold mb-4 text-center">Payment Receipt</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-mono font-semibold">{receipt?.transactionId || 'N/A'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID</span>
              <span className="font-mono font-semibold">{receipt?.orderId || 'N/A'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID</span>
              <span className="font-mono font-semibold">{receipt?.paymentId || 'N/A'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-gray-600">Project</span>
              <span className="font-semibold text-right max-w-[60%]">{project.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-bold text-green-600">₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold">{receipt?.method || paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-semibold">{receipt?.date || new Date().toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <Badge className="bg-green-600">Verified</Badge>
            </div>
            {investmentType === 'SIP' && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">SIP Duration</span>
                  <span className="font-semibold">{sipDuration} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Payment</span>
                  <span className="font-semibold">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={() => navigate('/investor/portfolio')}>
            View Portfolio
          </Button>
          <Button onClick={() => navigate('/projects')}>
            Explore More Projects
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 1 && 'Choose Investment Type'}
            {step === 2 && 'Select Payment Method'}
            {step === 3 && 'Review & Confirm'}
            {step === 4 && 'Investment Confirmed'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {step !== 4 && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold ${
                        step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          step > s ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
