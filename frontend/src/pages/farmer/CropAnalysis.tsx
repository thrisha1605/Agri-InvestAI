import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MessageSquare,
  Sprout,
  TrendingUp,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  ThermometerSun,
  CloudRain,
  Droplets,
  FlaskConical,
} from "lucide-react";
import { analyzeCrop, type CropAnalysisResponse } from "@/lib/agriAi";
import { CROP_TYPES, SOIL_TYPES } from "@/constants/cropData";

interface CropAnalysisProps {
  onBack?: () => void;
  onOpenChat?: () => void;
}

function formatCurrency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getRiskTone(risk: string) {
  switch ((risk || "").toUpperCase()) {
    case "LOW":
      return "bg-emerald-100 text-emerald-700";
    case "HIGH":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default function CropAnalysis({ onBack, onOpenChat }: CropAnalysisProps) {
  const navigate = useNavigate();

  const [cropType, setCropType] = useState("");
  const [soilType, setSoilType] = useState("");
  const [acres, setAcres] = useState("2");
  const [temperature, setTemperature] = useState("26");
  const [humidity, setHumidity] = useState("65");
  const [rainfall, setRainfall] = useState("800");
  const [ph, setPh] = useState("6.5");
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CropAnalysisResponse | null>(null);
  const [error, setError] = useState("");

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/farmer/ai-tools");
    }
  };

  const handleOpenChat = () => {
    if (onOpenChat) {
      onOpenChat();
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");

    try {
      const response = await analyzeCrop({
        cropType,
        soilType,
        acres: Number(acres),
        temperature: Number(temperature),
        humidity: Number(humidity),
        rainfall: Number(rainfall),
        ph: Number(ph),
        N: toOptionalNumber(nitrogen),
        P: toOptionalNumber(phosphorus),
        K: toOptionalNumber(potassium),
      });

      setResult(response);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to complete crop analysis right now.";
      setError(message);
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Sprout className="h-6 w-6 text-emerald-600" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">AI Crop Analysis</h1>
                <p className="text-sm text-slate-500">Yield, profit, suitability, and agronomic risk</p>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleOpenChat} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Assistant
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_1.2fr] lg:px-8">
        <div className="space-y-6">
          <Card className="border-emerald-200 shadow-sm">
            <CardHeader>
              <CardTitle>Field Inputs</CardTitle>
              <CardDescription>
                Enter soil, acreage, weather, and optional NPK values to run the crop economics model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Crop Type</label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        {crop.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Soil Type</label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOIL_TYPES.map((soil) => (
                      <SelectItem key={soil.value} value={soil.value}>
                        {soil.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Acres</label>
                  <Input type="number" min="0.1" step="0.1" value={acres} onChange={(e) => setAcres(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Soil pH</label>
                  <Input type="number" min="3" max="11" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)} />
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <ThermometerSun className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-medium text-emerald-900">Weather Conditions</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-700">Temperature (C)</label>
                    <Input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-700">Humidity (%)</label>
                    <Input type="number" step="0.1" value={humidity} onChange={(e) => setHumidity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-700">Rainfall (mm)</label>
                    <Input type="number" step="1" value={rainfall} onChange={(e) => setRainfall(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-700" />
                  <p className="text-sm font-medium text-amber-900">Optional Soil Nutrients</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-700">Nitrogen (N)</label>
                    <Input type="number" step="1" value={nitrogen} onChange={(e) => setNitrogen(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-700">Phosphorus (P)</label>
                    <Input type="number" step="1" value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-700">Potassium (K)</label>
                    <Input type="number" step="1" value={potassium} onChange={(e) => setPotassium(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleAnalyze}
                  disabled={
                    analyzing ||
                    !cropType ||
                    !soilType ||
                    !acres ||
                    !temperature ||
                    !humidity ||
                    !rainfall ||
                    !ph
                  }
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {analyzing ? "Analyzing..." : "Run Crop Analysis"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Reset Results
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <CloudRain className="mb-3 h-7 w-7 text-emerald-600" />
                <p className="font-medium text-slate-900">Suitability Engine</p>
                <p className="mt-1 text-sm text-slate-600">
                  Compares your field conditions against crop-specific climate and soil ranges.
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <TrendingUp className="mb-3 h-7 w-7 text-blue-600" />
                <p className="font-medium text-slate-900">Yield & Revenue</p>
                <p className="mt-1 text-sm text-slate-600">
                  Uses per-acre benchmark yield and reference pricing to estimate revenue and profit.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <Droplets className="mb-3 h-7 w-7 text-amber-600" />
                <p className="font-medium text-slate-900">Risk Signals</p>
                <p className="mt-1 text-sm text-slate-600">
                  Highlights weather, pH, and nutrient mismatches before you commit capital.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {!result ? (
            <Card className="h-full border-dashed">
              <CardContent className="flex h-full min-h-[560px] flex-col items-center justify-center p-10 text-center">
                <Sprout className="mb-4 h-12 w-12 text-emerald-500" />
                <h2 className="text-2xl font-semibold text-slate-900">Run a data-driven crop analysis</h2>
                <p className="mt-3 max-w-xl text-sm text-slate-600">
                  This module uses the backend crop profiles and weather inputs to estimate suitability,
                  yield, revenue, profit, and risk instead of the old placeholder logic.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-emerald-200 shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl">{result.crop}</CardTitle>
                      <CardDescription>
                        Crop code: {result.cropCode} • Water usage: {result.waterUsageLevel}
                      </CardDescription>
                    </div>
                    <Badge className={getRiskTone(result.riskLevel)}>{result.riskLevel} risk</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Suitability Score</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-900">{result.suitabilityScore}</p>
                    <p className="mt-1 text-xs text-emerald-800">Out of 100</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">Expected Yield</p>
                    <p className="mt-2 text-3xl font-bold text-blue-900">{result.expectedYield}</p>
                    <p className="mt-1 text-xs text-blue-800">{result.yieldUnit}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Revenue Estimate</p>
                    <p className="mt-2 text-3xl font-bold text-amber-900">
                      {formatCurrency(result.revenueEstimate)}
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      Price ref: {formatCurrency(result.referencePricePerQuintal)}/quintal
                    </p>
                  </div>
                  <div className="rounded-2xl bg-lime-50 p-4">
                    <p className="text-sm text-lime-700">Profit Estimate</p>
                    <p className="mt-2 text-3xl font-bold text-lime-900">
                      {formatCurrency(result.profitEstimate)}
                    </p>
                    <p className="mt-1 text-xs text-lime-800">
                      Cost estimate: {formatCurrency(result.costEstimate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {result.aiRecommendation && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>AI Crop Recommendation</CardTitle>
                    <CardDescription>
                      Random Forest recommendation from the Flask AI service using soil + weather + NPK.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">Recommended crop</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {result.aiRecommendation.recommendedCrop}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Confidence: {Number(result.aiRecommendation.confidence || 0).toFixed(2)}%
                      </p>
                    </div>

                    <div className="space-y-3">
                      {result.aiRecommendation.topPredictions.map((prediction) => (
                        <div key={prediction.crop} className="space-y-1">
                          <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>{prediction.crop}</span>
                            <span>{Number(prediction.confidence || 0).toFixed(2)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, Number(prediction.confidence || 0))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Suitability Breakdown</CardTitle>
                    <CardDescription>How each factor scored against the crop profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(result.scoringBreakdown || {}).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize text-slate-600">{key}</span>
                          <span className="font-medium text-slate-900">{Number(value).toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, Number(value || 0))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Recommended Actions</CardTitle>
                    <CardDescription>Field actions generated from the current mismatch profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.recommendedActions.map((action) => (
                      <div key={action} className="flex gap-3 rounded-2xl border p-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                        <p className="text-sm text-slate-700">{action}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Alternative Crops</CardTitle>
                  <CardDescription>Other crops that match the same field conditions well</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {result.alternativeCrops.map((crop) => (
                    <div key={crop.cropCode} className="rounded-2xl border bg-white p-4">
                      <p className="text-sm text-slate-500">{crop.cropCode}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{crop.crop}</p>
                      <p className="mt-2 text-sm text-slate-600">Compatibility score</p>
                      <p className="text-2xl font-bold text-emerald-700">{crop.score}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
