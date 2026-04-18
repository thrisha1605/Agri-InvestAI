import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import {
  getProjectById,
  listProgress,
  getInvestorInvestments,
} from "@/lib/appData";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment } from '@/lib/payment';
import { ArrowLeft } from "lucide-react";

function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function InvestorProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [amount, setAmount] = useState(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sipActive, setSipActive] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  const project = id ? getProjectById(id) : null;
  const updates = id ? listProgress(id) : [];
  const investments =
    user?.role === "INVESTOR" ? getInvestorInvestments(user.id) : [];

  const fundingPercent = useMemo(() => {
    if (!project?.fundingGoal) return 0;
    return Math.round(
      (Number(project.fundedAmount || 0) /
        Number(project.fundingGoal || 1)) *
        100
    );
  }, [project]);

  const esgScore = Number(
    project?.esgScore ||
      project?.esgBreakdown?.finalESGScore ||
      project?.projectInsights?.esgBreakdown?.finalESGScore ||
      0
  );
  const riskLevel = String(
    project?.riskLevel ||
      project?.cropAnalysis?.riskLevel ||
      project?.projectInsights?.cropAnalysis?.riskLevel ||
      "MEDIUM"
  ).toUpperCase();

  // 🤖 AI LOGIC
  useEffect(() => {
    if (!project) return;

    if (project.expectedROI > 15 && esgScore > 75) {
      setAiSuggestion("🔥 High ROI & Eco-Friendly Project — Strong Buy!");
    } else if (project.expectedROI > 10) {
      setAiSuggestion("👍 Good Returns Expected — Moderate Risk");
    } else {
      setAiSuggestion("⚠️ Low ROI — Invest Carefully");
    }
  }, [project]);

  // 💳 PAYMENT
  const handlePayment = async () => {
    if (!project || !user) {
      alert('Invalid project or user session');
      return;
    }

    setIsProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay checkout.');
      }

      const orderData = await createRazorpayOrder(amount);

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'AgriInvest AI',
        description: `Investment in ${project.title}`,
        order_id: orderData.orderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        handler: async function (response: any) {
          try {
            await verifyRazorpayPayment({
              ...response,
              userId: user.id,
              projectId: project.id,
              amount,
            });

            toast.success('✅ Payment successful! Redirecting to dashboard...');
            navigate('/investor/dashboard');
          } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : 'Payment verification failed.');
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔁 SIP START
  const handleCreateSIP = async () => {
    try {
      await apiRequest({
        method: "POST",
        url: "/api/sip/create",
        data: {
          userId: user?.id,
          projectId: project.id,
          amount,
        },
      });

      setSipActive(true);
      alert("✅ SIP Started!");
    } catch (err) {
      alert("Failed to start SIP");
    }
  };

  // 🛑 SIP STOP
  const handleStopSIP = async () => {
    try {
      await apiRequest({
        method: "POST",
        url: "/api/sip/stop",
        data: {
          userId: user?.id,
          projectId: project.id,
        },
      });

      setSipActive(false);
      alert("🛑 SIP Stopped!");
    } catch (err) {
      alert("Failed to stop SIP");
    }
  };

  if (!project) {
    return <div className="p-10 text-center">Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr] mt-6">
          {/* LEFT */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{project.title}</CardTitle>
              <CardDescription>Farmer: {project.farmerName}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <p>{project.description}</p>

              <div>
                <p>Funding Progress: {fundingPercent}%</p>
                <Progress value={fundingPercent} />
              </div>
            </CardContent>
          </Card>

          {/* RIGHT */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>Goal: {formatCurrency(project.fundingGoal)}</div>
              <div>Raised: {formatCurrency(project.fundedAmount)}</div>

              {/* 🌱 ESG */}
              <div className="rounded-xl border p-4 bg-green-50">
                <p>🌱 ESG Score</p>
                <h2 className="text-2xl font-bold">{esgScore}/100</h2>
                <Progress value={esgScore} className="mt-2" />
              </div>

              {/* 🤖 AI */}
              <div className="rounded-xl border p-4 bg-purple-50">
                <p className="text-sm text-gray-600">🤖 AI Suggestion</p>
                <p className="font-semibold text-purple-700 mt-1">
                  {aiSuggestion}
                </p>
              </div>

              {/* 💰 INVEST */}
              <div className="rounded-xl border p-4 bg-slate-50 space-y-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full border p-2 rounded"
                />

                <Button onClick={handlePayment} disabled={isProcessing} className="w-full">
                  {isProcessing ? 'Processing…' : '💳 Pay & Invest'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCreateSIP}
                  className="w-full"
                >
                  🔁 Start Monthly SIP
                </Button>

                {sipActive && (
                  <Button
                    variant="destructive"
                    onClick={handleStopSIP}
                    className="w-full"
                  >
                    🛑 Stop SIP
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
