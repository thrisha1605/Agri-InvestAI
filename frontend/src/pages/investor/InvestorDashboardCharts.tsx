import { useEffect, useState } from "react";
import { authService } from "@/lib/auth";
import { getInvestorInvestments } from "@/lib/appData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"];

export default function InvestorDashboardCharts() {
  const user = authService.getCurrentUser();

  const [growthData, setGrowthData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setGrowthData([]);
      setPieData([]);
      return;
    }

    const investments = getInvestorInvestments(user.id);

    const growthByMonth = investments.reduce<Record<string, number>>((acc, investment) => {
      const date = new Date(investment.createdAt);
      const label = Number.isNaN(date.getTime())
        ? "Unknown"
        : date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      acc[label] = (acc[label] || 0) + Number(investment.amount || 0);
      return acc;
    }, {});

    const distributionByProject = investments.reduce<Record<string, number>>((acc, investment) => {
      const label = investment.projectTitle || investment.projectId || "Unknown";
      acc[label] = (acc[label] || 0) + Number(investment.amount || 0);
      return acc;
    }, {});

    setGrowthData(
      Object.entries(growthByMonth).map(([date, amount]) => ({
        date,
        amount,
      })),
    );
    setPieData(
      Object.entries(distributionByProject).map(([name, value]) => ({
        name,
        value,
      })),
    );
  }, [user]);

  const hasGrowthData = growthData.length > 0;
  const hasPieData = pieData.length > 0;

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Growth</h3>
        {!hasGrowthData ? (
          <div className="flex h-72 items-center justify-center text-sm text-gray-500">
            No investment growth data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="amount" stroke="#16a34a" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Distribution</h3>
        {!hasPieData ? (
          <div className="flex h-72 items-center justify-center text-sm text-gray-500">
            No investment distribution data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
