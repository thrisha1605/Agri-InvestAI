import { useNavigate, Link, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth";
import { getDashboardCounts, getInvestorInvestments, listProjects } from "@/lib/appData";
import { TrendingUp, PieChart, Wallet, Search, ArrowUpRight, Leaf } from "lucide-react";
import InvestorDashboardCharts from "./InvestorDashboardCharts";

export function InvestorDashboard() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const counts = getDashboardCounts(user) as any;
  const investments = getInvestorInvestments(user.id);
  const recent = investments.slice(0, 5);

  // 💰 TOTAL + PROFIT
  const totalInvested = investments.reduce((sum, i: any) => sum + Number(i.amount || 0), 0);
  const estimatedProfit = Math.round(totalInvested * 0.2);

  const allProjects = listProjects();

  const visibleProjects = allProjects.filter((project: any) =>
    [
      "OPEN_FOR_FUNDING",
      "IN_PROGRESS",
      "HARVESTING",
      "COMPLETED",
    ].includes(project.status)
  );

  const stats = [
    {
      label: "Total Invested",
      value: `₹${totalInvested.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-100",
      path: "/investor/my-projects",
    },
    {
      label: "Estimated Profit",
      value: `₹${estimatedProfit.toLocaleString("en-IN")}`,
      icon: ArrowUpRight,
      color: "text-green-600 bg-green-100",
      path: "/investor/returns",
    },
    {
      label: "Wallet",
      value: `₹${Number(counts.walletBalance || 0).toLocaleString("en-IN")}`,
      icon: Wallet,
      color: "text-purple-600 bg-purple-100",
      path: "/investor/wallet",
    },
    {
      label: "Investments",
      value: investments.length,
      icon: PieChart,
      color: "text-orange-600 bg-orange-100",
      path: "/investor/my-projects",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Investor Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name}</p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Button asChild className="py-6"><Link to="/projects">Browse Projects</Link></Button>
          <Button asChild variant="outline" className="py-6"><Link to="/investor/my-projects">My Projects</Link></Button>
          <Button asChild variant="outline" className="py-6"><Link to="/investor/payments">Payments</Link></Button>
          <Button asChild variant="outline" className="py-6"><Link to="/investor/returns">Returns</Link></Button>
          <Button asChild variant="secondary" className="py-6"><Link to="/investor/wallet">Open Wallet</Link></Button>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} onClick={() => navigate(stat.path)} className="cursor-pointer">
              <CardContent className="p-6">
                <div className={`h-12 w-12 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 📊 CHARTS */}
        <InvestorDashboardCharts />

        {/* CONTENT */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">

          {/* RECENT INVESTMENTS */}
          <Card>
            <div className="flex justify-between p-6 pb-0">
              <h2 className="text-lg font-semibold">Recent Investments</h2>
              <Link to="/investor/my-projects">View All</Link>
            </div>

            <CardContent>
              {recent.length === 0 ? (
                <p>No investments yet</p>
              ) : (
                recent.map((i: any) => (
                  <div key={i.id} className="border p-3 rounded mb-3">
                    <p className="font-semibold">{i.projectTitle}</p>
                    <p className="text-sm">₹{i.amount}</p>
                    <p className="text-xs text-gray-500">{i.paymentStatus}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* PROJECTS */}
          <Card>
            <div className="flex justify-between p-6 pb-0">
              <h2 className="text-lg font-semibold">Available Projects</h2>
              <Link to="/projects">Explore</Link>
            </div>

            <CardContent>
              {visibleProjects.slice(0, 5).map((p: any) => (
                <div key={p.id} className="border p-3 rounded mb-3">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm">{p.cropType}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Leaf className="h-4 w-4" /> {p.farmerName}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}