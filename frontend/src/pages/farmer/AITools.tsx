import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import {
  Sprout,
  Camera,
  ShieldCheck,
  Droplets,
  ArrowRight,
  Leaf,
} from "lucide-react";

const TOOLS = [
  {
    title: "Crop Analysis",
    description:
      "Run suitability, yield, profit, and agronomic risk analysis using crop profiles, weather, soil pH, and optional NPK values.",
    icon: Sprout,
    action: "/farmer/crop-analysis",
    accent: "from-emerald-500 to-lime-500",
  },
  {
    title: "Disease Detection",
    description:
      "Upload a leaf image to the CNN disease model and get confidence, severity, treatment, and prevention guidance.",
    icon: Camera,
    action: "/farmer/disease-analysis",
    accent: "from-orange-500 to-amber-500",
  },
  {
    title: "Smart Project Creation",
    description:
      "Create projects with ESG scoring, water-gap detection, borewell investment planning, and investor-ready AI insights.",
    icon: ShieldCheck,
    action: "/farmer/create-project",
    accent: "from-blue-500 to-cyan-500",
  },
];

export function AITools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <BackButton />

        <div className="mb-8 rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                Agri-Invest AI
              </p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">Farmer AI Tools</h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                Use the production AI modules for crop planning, image-based disease detection,
                ESG scoring, and water investment assessment. The old demo logic has been replaced
                by API-backed tools and backend crop profiles.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <Sprout className="h-6 w-6 text-emerald-600" />
                <p className="mt-2 text-sm font-medium text-slate-900">Crop suitability</p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4">
                <Camera className="h-6 w-6 text-orange-600" />
                <p className="mt-2 text-sm font-medium text-slate-900">Disease inference</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <Leaf className="h-6 w-6 text-blue-600" />
                <p className="mt-2 text-sm font-medium text-slate-900">ESG + water planning</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.title} className="overflow-hidden border-0 shadow-lg shadow-slate-200/60">
                <div className={`h-2 bg-gradient-to-r ${tool.accent}`} />
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Icon className="h-7 w-7 text-slate-800" />
                  </div>
                  <CardTitle>{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-between" onClick={() => navigate(tool.action)}>
                    Open Tool
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="border-emerald-100 bg-emerald-50/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-emerald-700" />
                Water Infrastructure Logic
              </CardTitle>
              <CardDescription>
                Projects with no reliable water source are automatically flagged for borewell investment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Drilling estimate: Rs. 80,000 to 1,50,000</p>
              <p>Pump estimate: Rs. 20,000</p>
              <p>Pipes estimate: Rs. 10,000</p>
              <p>Total planning value used by the system: Rs. 1,20,000</p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50/70">
            <CardHeader>
              <CardTitle>What gets stored on each project</CardTitle>
              <CardDescription>
                Investor-ready metrics are attached to the saved project for dashboards and detail pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Crop suitability score, expected yield, cost, revenue, and profit estimate</p>
              <p>Environmental, social, governance, and final ESG score</p>
              <p>Water gap detection, borewell cost, and total investment requirement</p>
              <p>Investor alerts like water infrastructure requirement and high agronomic risk</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
