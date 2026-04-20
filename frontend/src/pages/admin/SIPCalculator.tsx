import React, { useState, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ArrowLeft, MessageSquare, DollarSign, TrendingUp, Calendar, PieChart } from "lucide-react";
import { Slider } from "../../components/ui/slider";

interface SIPCalculatorProps {
  onBack: () => void;
  onOpenChat: () => void;
}

export default function SIPCalculator({ onBack, onOpenChat }: SIPCalculatorProps) {
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [timePeriod, setTimePeriod] = useState(5);

  const calculations = useMemo(() => {
    const monthlyRate = expectedReturn / 12 / 100;
    const months = timePeriod * 12;
    
    // Future Value of SIP formula: FV = P × ((1 + r)^n - 1) / r × (1 + r)
    const futureValue = monthlyInvestment * 
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * 
      (1 + monthlyRate);
    
    const totalInvestment = monthlyInvestment * months;
    const estimatedReturns = futureValue - totalInvestment;
    
    return {
      futureValue: Math.round(futureValue),
      totalInvestment,
      estimatedReturns: Math.round(estimatedReturns),
    };
  }, [monthlyInvestment, expectedReturn, timePeriod]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <PieChart className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl text-gray-900">SIP Calculator</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenChat}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl text-gray-900 mb-2">
            Systematic Investment Plan Calculator
          </h2>
          <p className="text-gray-600">
            Plan your agricultural investments and calculate potential returns over time
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calculator Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Parameters</CardTitle>
                <CardDescription>
                  Adjust the sliders to calculate your SIP returns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-gray-700">Monthly Investment</label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-xl text-gray-900">
                        ${monthlyInvestment.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[monthlyInvestment]}
                    onValueChange={([value]) => setMonthlyInvestment(value)}
                    min={500}
                    max={50000}
                    step={500}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>$500</span>
                    <span>$50,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-gray-700">Expected Return (p.a.)</label>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-xl text-gray-900">{expectedReturn}%</span>
                    </div>
                  </div>
                  <Slider
                    value={[expectedReturn]}
                    onValueChange={([value]) => setExpectedReturn(value)}
                    min={1}
                    max={25}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>1%</span>
                    <span>25%</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-gray-700">Time Period</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-xl text-gray-900">{timePeriod} Years</span>
                    </div>
                  </div>
                  <Slider
                    value={[timePeriod]}
                    onValueChange={([value]) => setTimePeriod(value)}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>1 Year</span>
                    <span>30 Years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Choose SIP?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900">Disciplined Investing</p>
                    <p className="text-sm text-gray-600">
                      Regular investments build wealth systematically
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900">Rupee Cost Averaging</p>
                    <p className="text-sm text-gray-600">
                      Reduces impact of market volatility
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900">Power of Compounding</p>
                    <p className="text-sm text-gray-600">
                      Returns generate more returns over time
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900">Flexible & Convenient</p>
                    <p className="text-sm text-gray-600">
                      Start small and increase as income grows
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
                <CardDescription>
                  Your projected wealth after {timePeriod} years
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white">
                  <p className="text-sm mb-2 opacity-90">Future Value</p>
                  <p className="text-4xl mb-1">
                    ${calculations.futureValue.toLocaleString()}
                  </p>
                  <p className="text-sm opacity-75">
                    After {timePeriod} years at {expectedReturn}% returns
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Investment</p>
                    <p className="text-2xl text-gray-900">
                      ${calculations.totalInvestment.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {timePeriod * 12} months
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Estimated Returns</p>
                    <p className="text-2xl text-emerald-600">
                      ${calculations.estimatedReturns.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {((calculations.estimatedReturns / calculations.totalInvestment) * 100).toFixed(1)}% growth
                    </p>
                  </div>
                </div>

                {/* Visual Breakdown */}
                <div>
                  <h4 className="text-gray-900 mb-3">Investment Breakdown</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="text-gray-600">Your Investment</span>
                        <span className="text-gray-900">
                          {((calculations.totalInvestment / calculations.futureValue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{
                            width: `${(calculations.totalInvestment / calculations.futureValue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="text-gray-600">Returns Generated</span>
                        <span className="text-emerald-600">
                          {((calculations.estimatedReturns / calculations.futureValue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600"
                          style={{
                            width: `${(calculations.estimatedReturns / calculations.futureValue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start SIP Investment
                  </Button>
                  <Button variant="outline" className="w-full">
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Year-by-Year Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: Math.min(timePeriod, 5) }, (_, i) => {
                    const year = i + 1;
                    const monthlyRate = expectedReturn / 12 / 100;
                    const months = year * 12;
                    const yearValue = Math.round(
                      monthlyInvestment *
                        ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
                        (1 + monthlyRate)
                    );
                    
                    return (
                      <div
                        key={year}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700">Year {year}</span>
                        <span className="text-gray-900">${yearValue.toLocaleString()}</span>
                      </div>
                    );
                  })}
                  {timePeriod > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... and {timePeriod - 5} more years
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended SIP Plans */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recommended Agricultural SIP Plans</CardTitle>
            <CardDescription>
              Start investing in sustainable agriculture with these curated plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:shadow-md transition-shadow">
                <h4 className="text-lg text-gray-900 mb-2">Organic Farming SIP</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Invest in certified organic farming projects
                </p>
                <div className="space-y-1 text-sm mb-4">
                  <p className="text-gray-700">Min. Monthly: $1,000</p>
                  <p className="text-emerald-600">Expected: 11-13% p.a.</p>
                  <p className="text-gray-700">ESG Score: 9.2/10</p>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                  Start SIP
                </Button>
              </div>

              <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow">
                <h4 className="text-lg text-gray-900 mb-2">AgriTech Innovation SIP</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Technology-driven sustainable agriculture
                </p>
                <div className="space-y-1 text-sm mb-4">
                  <p className="text-gray-700">Min. Monthly: $2,000</p>
                  <p className="text-blue-600">Expected: 14-16% p.a.</p>
                  <p className="text-gray-700">ESG Score: 8.9/10</p>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                  Start SIP
                </Button>
              </div>

              <div className="p-4 border-2 border-emerald-200 bg-emerald-50 rounded-lg hover:shadow-md transition-shadow">
                <h4 className="text-lg text-gray-900 mb-2">Carbon-Neutral Farming SIP</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Climate-positive agricultural investments
                </p>
                <div className="space-y-1 text-sm mb-4">
                  <p className="text-gray-700">Min. Monthly: $1,500</p>
                  <p className="text-emerald-600">Expected: 10-12% p.a.</p>
                  <p className="text-gray-700">ESG Score: 9.6/10</p>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm">
                  Start SIP
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
