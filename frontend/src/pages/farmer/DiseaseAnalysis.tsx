import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageSquare,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Info,
  Leaf,
} from "lucide-react";
import { detectDisease, type DiseaseDetectionResponse } from "@/lib/agriAi";

interface DiseaseDetectionProps {
  onBack?: () => void;
  onOpenChat?: () => void;
}

function getSeverityTone(severity: string) {
  switch ((severity || "").toUpperCase()) {
    case "HIGH":
    case "SEVERE":
      return "bg-red-100 text-red-700";
    case "LOW":
    case "MILD":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export function DiseaseAnalysis({ onBack, onOpenChat }: DiseaseDetectionProps) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResponse | null>(null);
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError("");

    try {
      const response = await detectDisease(selectedFile);
      setResult(response);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to analyze the crop image right now.";
      setError(message);
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
  };

  const displayError =
    error.includes("Flask disease detection service") || error.includes("backend API")
      ? "Disease AI service is offline right now. Start the Spring Boot backend and the Flask API on port 5001, then retry the image analysis."
      : error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-emerald-600" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Disease Detection</h1>
                <p className="text-sm text-slate-500">PlantVillage-based CNN inference with treatment guidance</p>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleOpenChat} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Assistant
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Upload a close-up leaf image from tomato, potato, or corn for the best results. The Flask API will
            return disease class, confidence, severity, treatment, and prevention suggestions.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Upload Crop Image</CardTitle>
                <CardDescription>
                  Use a clear image with visible symptoms on the leaf surface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!previewUrl ? (
                  <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-10 text-center">
                    <Upload className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
                    <label className="cursor-pointer text-sm font-medium text-emerald-700">
                      Choose an image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-2 text-sm text-slate-500">PNG or JPG up to your browser upload limit</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border">
                      <img src={previewUrl} alt="Leaf preview" className="h-80 w-full object-cover" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleAnalyze} disabled={analyzing} className="bg-emerald-600 hover:bg-emerald-700">
                        {analyzing ? "Analyzing..." : "Analyze Image"}
                      </Button>
                      <Button variant="outline" onClick={resetAnalysis}>
                        Upload New
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Model Coverage</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="font-medium text-emerald-900">Supported crops</p>
                  <p className="mt-1 text-sm text-emerald-800">Tomato, Potato, Corn</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="font-medium text-amber-900">Supported classes</p>
                  <p className="mt-1 text-sm text-amber-800">Disease and healthy leaf classes from PlantVillage</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{displayError}</AlertDescription>
              </Alert>
            )}

            {!result ? (
              <Card className="border-dashed shadow-sm">
                <CardContent className="flex min-h-[520px] flex-col items-center justify-center p-10 text-center">
                  <Leaf className="mb-4 h-12 w-12 text-emerald-500" />
                  <h2 className="text-2xl font-semibold text-slate-900">Awaiting AI diagnosis</h2>
                  <p className="mt-3 max-w-xl text-sm text-slate-600">
                    Once an image is uploaded, the system will call the disease detection API and show the predicted
                    disease label, confidence, severity, and recommended control steps.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-emerald-200 shadow-sm">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-2xl">{result.disease}</CardTitle>
                        <CardDescription>
                          Crop: {result.crop} • Raw label: {result.rawLabel}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          Confidence: {Number(result.confidence || 0).toFixed(2)}%
                        </Badge>
                        <Badge className={getSeverityTone(result.severity)}>{result.severity}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, Number(result.confidence || 0))}%` }}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-emerald-50 p-4">
                        <p className="text-sm text-emerald-700">Primary prediction</p>
                        <p className="mt-2 text-xl font-semibold text-emerald-900">{result.disease}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-600">Severity assessment</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">{result.severity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle>Treatment Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.treatment.map((item) => (
                        <div key={item} className="flex gap-3 rounded-2xl border p-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                          <p className="text-sm text-slate-700">{item}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle>Prevention Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.prevention.map((item) => (
                        <div key={item} className="flex gap-3 rounded-2xl border p-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-600" />
                          <p className="text-sm text-slate-700">{item}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Prediction Ranking</CardTitle>
                    <CardDescription>Top model outputs from the disease classifier</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.topPredictions.map((prediction) => (
                      <div key={prediction.rawLabel} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{prediction.label}</span>
                          <span className="font-medium text-slate-900">
                            {Number(prediction.confidence || 0).toFixed(2)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, Number(prediction.confidence || 0))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
