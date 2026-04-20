import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LandDetailsForm, 
  CropInfoForm, 
  IrrigationTimelineForm, 
  FundingForm,
  ESGFactorsForm 
} from '@/lib/validations';
import { 
  INDIAN_STATES, 
  SOIL_TYPES, 
  CROP_TYPES, 
  WATER_SOURCES, 
  IRRIGATION_METHODS,
  ESG_OPTIONS 
} from '@/constants/cropData';
import { calculateLocalEsgSummary, getWaterInvestmentPlan } from '@/lib/agriAi';
import { Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';

// Step 1: Land Details
export function LandDetailsStep({ form }: { form: UseFormReturn<LandDetailsForm> }) {
  const { register, formState: { errors }, setValue, watch } = form;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="location">Village/Town Name *</Label>
          <Input 
            id="location" 
            placeholder="e.g., Mandya" 
            {...register('location')}
          />
          {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select onValueChange={(value) => setValue('state', value)} defaultValue={watch('state')}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <p className="text-sm text-red-600">{errors.state.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">District *</Label>
          <Input 
            id="district" 
            placeholder="e.g., Mandya" 
            {...register('district')}
          />
          {errors.district && <p className="text-sm text-red-600">{errors.district.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="acreage">Land Size (Acres) *</Label>
          <Input 
            id="acreage" 
            type="number" 
            step="0.1"
            placeholder="e.g., 5.5" 
            {...register('acreage', { valueAsNumber: true })}
          />
          {errors.acreage && <p className="text-sm text-red-600">{errors.acreage.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Soil Type *</Label>
        <RadioGroup onValueChange={(value) => setValue('soilType', value)} defaultValue={watch('soilType')}>
          <div className="grid md:grid-cols-2 gap-3">
            {SOIL_TYPES.map((soil) => (
              <Card key={soil.value} className="p-4 hover:border-green-600 cursor-pointer">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={soil.value} id={soil.value} />
                  <Label htmlFor={soil.value} className="cursor-pointer flex-1">
                    <p className="font-semibold">{soil.label}</p>
                    <p className="text-xs text-gray-600">{soil.description}</p>
                  </Label>
                </div>
              </Card>
            ))}
          </div>
        </RadioGroup>
        {errors.soilType && <p className="text-sm text-red-600">{errors.soilType.message}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="soilPH">Soil pH Level *</Label>
          <Input 
            id="soilPH" 
            type="number" 
            step="0.1"
            min="3"
            max="11"
            placeholder="e.g., 6.5" 
            {...register('soilPH', { valueAsNumber: true })}
          />
          <p className="text-xs text-gray-600">Normal range: 5.5 - 7.5</p>
          {errors.soilPH && <p className="text-sm text-red-600">{errors.soilPH.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Land Ownership *</Label>
          <RadioGroup onValueChange={(value) => setValue('landOwnership', value as any)} defaultValue={watch('landOwnership')}>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OWNED" id="owned" />
                <Label htmlFor="owned">Owned</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="LEASED" id="leased" />
                <Label htmlFor="leased">Leased</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SHARED" id="shared" />
                <Label htmlFor="shared">Shared</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="rounded-xl border bg-emerald-50 p-4">
        <h3 className="font-semibold text-emerald-900">Weather Snapshot for AI Crop Analysis</h3>
        <p className="mt-1 text-xs text-emerald-700">
          These values are used in the crop suitability, risk, and revenue model.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="temperature">Average Temperature (C) *</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            placeholder="e.g., 27"
            {...register('temperature', { valueAsNumber: true })}
          />
          {errors.temperature && <p className="text-sm text-red-600">{errors.temperature.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="humidity">Humidity (%) *</Label>
          <Input
            id="humidity"
            type="number"
            step="0.1"
            placeholder="e.g., 68"
            {...register('humidity', { valueAsNumber: true })}
          />
          {errors.humidity && <p className="text-sm text-red-600">{errors.humidity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rainfall">Rainfall (mm/season) *</Label>
          <Input
            id="rainfall"
            type="number"
            step="1"
            placeholder="e.g., 780"
            {...register('rainfall', { valueAsNumber: true })}
          />
          {errors.rainfall && <p className="text-sm text-red-600">{errors.rainfall.message}</p>}
        </div>
      </div>
    </div>
  );
}

// Step 2: Crop Information
export function CropInfoStep({ form }: { form: UseFormReturn<CropInfoForm> }) {
  const { register, formState: { errors }, setValue, watch } = form;
  const selectedCrop = CROP_TYPES.find(c => c.value === watch('cropType'));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cropType">Crop Type *</Label>
        <Select onValueChange={(value) => setValue('cropType', value)} defaultValue={watch('cropType')}>
          <SelectTrigger>
            <SelectValue placeholder="Select crop type" />
          </SelectTrigger>
          <SelectContent>
            {['Cereals', 'Pulses', 'Cash Crops', 'Oilseeds', 'Vegetables', 'Fruits'].map((category) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">{category}</div>
                {CROP_TYPES.filter(c => c.category === category).map((crop) => (
                  <SelectItem key={crop.value} value={crop.value}>
                    {crop.label} <span className="text-xs text-gray-500">({crop.season})</span>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {selectedCrop && (
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{selectedCrop.category}</Badge>
            <Badge variant="outline">{selectedCrop.season}</Badge>
          </div>
        )}
        {errors.cropType && <p className="text-sm text-red-600">{errors.cropType.message}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="cropVariety">Crop Variety *</Label>
          <Input 
            id="cropVariety" 
            placeholder="e.g., Basmati 370, BT Cotton" 
            {...register('cropVariety')}
          />
          {errors.cropVariety && <p className="text-sm text-red-600">{errors.cropVariety.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousCrop">Previous Crop (Optional)</Label>
          <Input 
            id="previousCrop" 
            placeholder="e.g., Wheat" 
            {...register('previousCrop')}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="expectedYield">Expected Yield *</Label>
          <Input 
            id="expectedYield" 
            type="number" 
            placeholder="e.g., 50" 
            {...register('expectedYield', { valueAsNumber: true })}
          />
          {errors.expectedYield && <p className="text-sm text-red-600">{errors.expectedYield.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="yieldUnit">Yield Unit *</Label>
          <Select onValueChange={(value) => setValue('yieldUnit', value as any)} defaultValue={watch('yieldUnit')}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="QUINTAL">Quintal (100kg)</SelectItem>
              <SelectItem value="TON">Ton (1000kg)</SelectItem>
              <SelectItem value="KG">Kilogram</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
        <div>
          <Label htmlFor="organicCertified" className="text-base font-semibold">
            Organic Certified Farm
          </Label>
          <p className="text-sm text-gray-600">Is this farm certified organic?</p>
        </div>
        <Switch
          id="organicCertified"
          checked={watch('organicCertified')}
          onCheckedChange={(checked) => setValue('organicCertified', checked)}
        />
      </div>

      <div className="rounded-xl border bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-900">Optional Soil Nutrient Inputs</h3>
        <p className="mt-1 text-xs text-slate-600">
          Add lab-tested NPK values to improve crop recommendation accuracy.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nitrogen">Nitrogen (N)</Label>
          <Input
            id="nitrogen"
            type="number"
            placeholder="e.g., 90"
            {...register('nitrogen', { valueAsNumber: true })}
          />
          {errors.nitrogen && <p className="text-sm text-red-600">{errors.nitrogen.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phosphorus">Phosphorus (P)</Label>
          <Input
            id="phosphorus"
            type="number"
            placeholder="e.g., 42"
            {...register('phosphorus', { valueAsNumber: true })}
          />
          {errors.phosphorus && <p className="text-sm text-red-600">{errors.phosphorus.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="potassium">Potassium (K)</Label>
          <Input
            id="potassium"
            type="number"
            placeholder="e.g., 55"
            {...register('potassium', { valueAsNumber: true })}
          />
          {errors.potassium && <p className="text-sm text-red-600">{errors.potassium.message}</p>}
        </div>
      </div>
    </div>
  );
}

// Step 3: Irrigation & Timeline
export function IrrigationTimelineStep({ form }: { form: UseFormReturn<IrrigationTimelineForm> }) {
  const { register, formState: { errors }, setValue, watch } = form;
  const selectedMethod = IRRIGATION_METHODS.find(m => m.value === watch('irrigationMethod'));
  const selectedWaterSource = watch('waterSource');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Irrigation Method *</Label>
        <RadioGroup onValueChange={(value) => setValue('irrigationMethod', value as any)} defaultValue={watch('irrigationMethod')}>
          <div className="grid gap-3">
            {IRRIGATION_METHODS.map((method) => (
              <Card key={method.value} className="p-4 hover:border-green-600 cursor-pointer">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={method.value} id={method.value} />
                  <Label htmlFor={method.value} className="cursor-pointer flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{method.label}</p>
                        <p className="text-xs text-gray-600">{method.description}</p>
                      </div>
                      <Badge className="bg-blue-600">{method.efficiency}% Efficient</Badge>
                    </div>
                  </Label>
                </div>
              </Card>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="waterSource">Water Source *</Label>
        <Select onValueChange={(value) => setValue('waterSource', value)} defaultValue={watch('waterSource')}>
          <SelectTrigger>
            <SelectValue placeholder="Select water source" />
          </SelectTrigger>
          <SelectContent>
            {WATER_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.waterSource && <p className="text-sm text-red-600">{errors.waterSource.message}</p>}
      </div>

      {selectedMethod && (
        <div className="rounded-xl border bg-sky-50 p-4">
          <p className="font-semibold text-sky-900">{selectedMethod.label}</p>
          <p className="mt-1 text-sm text-sky-700">{selectedMethod.description}</p>
        </div>
      )}

      {selectedWaterSource === 'NONE' && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Water gap detected</p>
          <p className="mt-1 text-sm text-amber-800">
            The system will recommend borewell infrastructure and add an estimated Rs. 120000 water investment to the project plan.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="plantingDate">Planting Date *</Label>
          <Input 
            id="plantingDate" 
            type="date" 
            {...register('plantingDate')}
          />
          {errors.plantingDate && <p className="text-sm text-red-600">{errors.plantingDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="harvestDate">Expected Harvest Date *</Label>
          <Input 
            id="harvestDate" 
            type="date" 
            {...register('harvestDate')}
          />
          {errors.harvestDate && <p className="text-sm text-red-600">{errors.harvestDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (Months) *</Label>
          <Input 
            id="duration" 
            type="number" 
            placeholder="e.g., 4" 
            {...register('duration', { valueAsNumber: true })}
          />
          {errors.duration && <p className="text-sm text-red-600">{errors.duration.message}</p>}
        </div>
      </div>
    </div>
  );
}

// Step 4: Funding Requirements
export function FundingStep({ form }: { form: UseFormReturn<FundingForm> }) {
  const { register, formState: { errors }, watch } = form;

  const calculateTotal = () => {
    const costs = [
      watch('seedsCost') || 0,
      watch('fertilizersCost') || 0,
      watch('pesticidesCost') || 0,
      watch('laborCost') || 0,
      watch('irrigationCost') || 0,
      watch('machineryRental') || 0,
      watch('otherCosts') || 0,
    ];
    return costs.reduce((sum, cost) => sum + cost, 0);
  };

  const calculateROI = () => {
    const total = calculateTotal();
    const revenue = watch('expectedRevenue') || 0;
    if (total === 0) return 0;
    return (((revenue - total) / total) * 100).toFixed(1);
  };

  const total = calculateTotal();
  const roi = calculateROI();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">📊 Budget Breakdown</p>
        <p className="text-xs text-blue-700">
          Enter all estimated costs for your project. The funding goal will be auto-calculated.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="seedsCost">Seeds Cost (₹) *</Label>
          <Input 
            id="seedsCost" 
            type="number" 
            placeholder="e.g., 25000" 
            {...register('seedsCost', { valueAsNumber: true })}
          />
          {errors.seedsCost && <p className="text-sm text-red-600">{errors.seedsCost.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fertilizersCost">Fertilizers Cost (₹) *</Label>
          <Input 
            id="fertilizersCost" 
            type="number" 
            placeholder="e.g., 30000" 
            {...register('fertilizersCost', { valueAsNumber: true })}
          />
          {errors.fertilizersCost && <p className="text-sm text-red-600">{errors.fertilizersCost.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pesticidesCost">Pesticides/Protection (₹) *</Label>
          <Input 
            id="pesticidesCost" 
            type="number" 
            placeholder="e.g., 15000" 
            {...register('pesticidesCost', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="laborCost">Labor Cost (₹) *</Label>
          <Input 
            id="laborCost" 
            type="number" 
            placeholder="e.g., 50000" 
            {...register('laborCost', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="irrigationCost">Irrigation Setup/Maintenance (₹) *</Label>
          <Input 
            id="irrigationCost" 
            type="number" 
            placeholder="e.g., 40000" 
            {...register('irrigationCost', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="machineryRental">Machinery Rental (₹) *</Label>
          <Input 
            id="machineryRental" 
            type="number" 
            placeholder="e.g., 20000" 
            {...register('machineryRental', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otherCosts">Other Costs (₹) *</Label>
          <Input 
            id="otherCosts" 
            type="number" 
            placeholder="e.g., 10000" 
            {...register('otherCosts', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedRevenue">Expected Revenue (₹) *</Label>
          <Input 
            id="expectedRevenue" 
            type="number" 
            placeholder="e.g., 300000" 
            {...register('expectedRevenue', { valueAsNumber: true })}
          />
          {errors.expectedRevenue && <p className="text-sm text-red-600">{errors.expectedRevenue.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minimumInvestment">Minimum Investment per Investor (₹) *</Label>
        <Input 
          id="minimumInvestment" 
          type="number" 
          placeholder="e.g., 10000" 
          {...register('minimumInvestment', { valueAsNumber: true })}
        />
        <p className="text-xs text-gray-600">Recommended: ₹5,000 - ₹50,000</p>
        {errors.minimumInvestment && <p className="text-sm text-red-600">{errors.minimumInvestment.message}</p>}
      </div>

      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <h3 className="font-bold text-lg mb-4">Financial Summary</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Funding Required</p>
            <p className="text-3xl font-bold text-green-700">₹{total.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Expected Revenue</p>
            <p className="text-3xl font-bold text-blue-700">₹{(watch('expectedRevenue') || 0).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Estimated ROI</p>
            <p className={`text-3xl font-bold ${parseFloat(roi) > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {roi}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 5: ESG Factors
export function ESGFactorsStep({ form }: { form: UseFormReturn<ESGFactorsForm> }) {
  const { setValue, watch } = form;
  const summary = calculateLocalEsgSummary({
    waterUsage: watch('waterUsage') || 0,
    fertilizerType: watch('fertilizerType') || 'CHEMICAL',
    pesticideLevel: watch('pesticideLevel') || 'MEDIUM',
    renewableEnergy: watch('renewableEnergy') || 0,
    workersEmployed: watch('workersEmployed') || 0,
    fairWages: watch('fairWages') || false,
    communityBenefit: watch('communityBenefit') || 0,
    documentsUploaded: watch('documentsUploaded') || 0,
    transparencyScore: watch('transparencyScore') || 0,
    trustScore: watch('trustScore') || 0,
  });

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-green-900 font-medium">Advanced ESG Score</p>
          <Badge className={`${summary.finalESGScore >= 70 ? 'bg-green-600' : summary.finalESGScore >= 40 ? 'bg-yellow-600' : 'bg-red-600'} text-lg px-3`}>
            {summary.finalESGScore}/100
          </Badge>
        </div>
        <p className="text-xs text-green-700">
          Environmental is weighted at 40%, social at 30%, and governance at 30%.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-gray-600">Environmental</p>
          <p className="text-3xl font-bold text-green-700">{summary.environmentalScore}</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-600">Social</p>
          <p className="text-3xl font-bold text-blue-700">{summary.socialScore}</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-sm text-gray-600">Governance</p>
          <p className="text-3xl font-bold text-purple-700">{summary.governanceScore}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-green-700">Environmental Inputs</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="waterUsage">Water Usage (litres per acre / season)</Label>
            <Input
              id="waterUsage"
              type="number"
              value={watch('waterUsage') ?? 0}
              onChange={(event) => setValue('waterUsage', Number(event.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fertilizerType">Fertilizer Type</Label>
            <Select onValueChange={(value) => setValue('fertilizerType', value as any)} defaultValue={watch('fertilizerType')}>
              <SelectTrigger>
                <SelectValue placeholder="Select fertilizer plan" />
              </SelectTrigger>
              <SelectContent>
                {ESG_OPTIONS.fertilizerTypes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pesticideLevel">Pesticide Level</Label>
            <Select onValueChange={(value) => setValue('pesticideLevel', value as any)} defaultValue={watch('pesticideLevel')}>
              <SelectTrigger>
                <SelectValue placeholder="Select pesticide intensity" />
              </SelectTrigger>
              <SelectContent>
                {ESG_OPTIONS.pesticideLevels.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="renewableEnergy">Renewable Energy Share (%)</Label>
            <Input
              id="renewableEnergy"
              type="number"
              value={watch('renewableEnergy') ?? 0}
              onChange={(event) => setValue('renewableEnergy', Number(event.target.value || 0))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-blue-700">Social Inputs</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="workersEmployed">Workers Employed</Label>
            <Input
              id="workersEmployed"
              type="number"
              value={watch('workersEmployed') ?? 0}
              onChange={(event) => setValue('workersEmployed', Number(event.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="communityBenefit">Community Benefit Score (0-100)</Label>
            <Input
              id="communityBenefit"
              type="number"
              value={watch('communityBenefit') ?? 0}
              onChange={(event) => setValue('communityBenefit', Number(event.target.value || 0))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="fairWages" className="text-base font-semibold">
              Fair wages verified
            </Label>
            <p className="text-sm text-gray-600">Confirm minimum wage compliance and timely payment.</p>
          </div>
          <Switch
            id="fairWages"
            checked={watch('fairWages')}
            onCheckedChange={(checked) => setValue('fairWages', checked)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-purple-700">Governance Inputs</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="documentsUploaded">Documents Uploaded</Label>
            <Input
              id="documentsUploaded"
              type="number"
              value={watch('documentsUploaded') ?? 0}
              onChange={(event) => setValue('documentsUploaded', Number(event.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transparencyScore">Transparency Score (0-100)</Label>
            <Input
              id="transparencyScore"
              type="number"
              value={watch('transparencyScore') ?? 0}
              onChange={(event) => setValue('transparencyScore', Number(event.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trustScore">Trust Score (0-100)</Label>
            <Input
              id="trustScore"
              type="number"
              value={watch('trustScore') ?? 0}
              onChange={(event) => setValue('trustScore', Number(event.target.value || 0))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 6: Image Upload
export function ImageUploadStep({ 
  uploadedImages, 
  setUploadedImages 
}: { 
  uploadedImages: File[];
  setUploadedImages: (files: File[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setUploadedImages([...uploadedImages, ...imageFiles].slice(0, 10)); // Max 10 images
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">📸 Photo Guidelines</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Upload at least 3 clear images of your land and crops</li>
          <li>• Include aerial/wide shots showing land area</li>
          <li>• Add close-up images of soil quality and irrigation setup</li>
          <li>• Maximum 10 images, each up to 5MB</li>
        </ul>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-green-600 bg-green-50' : 'border-gray-300 hover:border-green-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-semibold mb-2">Drag & drop images here</p>
        <p className="text-sm text-gray-600 mb-4">or click to browse files</p>
        <Button type="button" variant="outline">
          <ImageIcon className="mr-2 h-4 w-4" />
          Choose Images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {uploadedImages.length > 0 && (
        <div>
          <p className="font-semibold mb-4">
            Uploaded Images ({uploadedImages.length}/10)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedImages.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 7: Review & Submit
export function ReviewStep({
  projectData,
  generatedDescription,
  setGeneratedDescription,
}: {
  projectData: any;
  generatedDescription: string;
  setGeneratedDescription: (desc: string) => void;
}) {
  const { landDetails, cropInfo, irrigation, funding, esg, projectInsights } = projectData;
  const localEsgSummary = calculateLocalEsgSummary({
    waterUsage: esg?.waterUsage || 0,
    fertilizerType: esg?.fertilizerType || 'CHEMICAL',
    pesticideLevel: esg?.pesticideLevel || 'MEDIUM',
    renewableEnergy: esg?.renewableEnergy || 0,
    workersEmployed: esg?.workersEmployed || 0,
    fairWages: esg?.fairWages || false,
    communityBenefit: esg?.communityBenefit || 0,
    documentsUploaded: esg?.documentsUploaded || 0,
    transparencyScore: esg?.transparencyScore || 0,
    trustScore: esg?.trustScore || 0,
  });
  const esgSummary = projectInsights?.esgBreakdown || localEsgSummary;
  const waterPlan = projectInsights?.waterAnalysis || getWaterInvestmentPlan(irrigation?.waterSource);

  const totalCost = funding?.seedsCost + funding?.fertilizersCost + funding?.pesticidesCost + 
    funding?.laborCost + funding?.irrigationCost + funding?.machineryRental + funding?.otherCosts;

  const finalInvestment = Number(projectInsights?.totalInvestment || totalCost || 0);
  const finalRevenue = Number(projectInsights?.expectedRevenue || funding?.expectedRevenue || 0);
  const roi = projectInsights?.expectedROI !== undefined
    ? Number(projectInsights.expectedROI).toFixed(1)
    : funding?.expectedRevenue && totalCost
      ? (((funding.expectedRevenue - totalCost) / totalCost) * 100).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900 font-medium mb-2">✅ Review Your Project</p>
        <p className="text-xs text-green-700">
          Please review all details before submission. Once submitted, the project will be sent for admin approval.
        </p>
      </div>

      {/* Project Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Location</p>
          <p className="font-bold">{landDetails?.location}, {landDetails?.state}</p>
          <p className="text-sm text-gray-600 mt-2">{landDetails?.acreage} acres • {landDetails?.soilType}</p>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-gray-600 mb-1">Crop Details</p>
          <p className="font-bold">{cropInfo?.cropType}</p>
          <p className="text-sm text-gray-600 mt-2">Expected: {cropInfo?.expectedYield} {cropInfo?.yieldUnit}</p>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-sm text-gray-600 mb-1">ESG Score</p>
          <p className="text-3xl font-bold text-purple-700">{esgSummary.finalESGScore}/100</p>
        </Card>
      </div>

      {waterPlan?.needsWaterInvestment && (
        <Card className="p-5 border-amber-300 bg-amber-50">
          <h3 className="font-bold text-amber-900">Water Infrastructure Suggestion</h3>
          <p className="mt-2 text-sm text-amber-800">
            {waterPlan.recommendation}
          </p>
          <p className="mt-3 text-sm text-amber-900">
            Estimated water investment: Rs. {Number(waterPlan.waterCost || 0).toLocaleString('en-IN')}
          </p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">ESG Breakdown</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Environmental</p>
            <p className="text-2xl font-bold text-green-700">{esgSummary.environmentalScore}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Social</p>
            <p className="text-2xl font-bold text-blue-700">{esgSummary.socialScore}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Governance</p>
            <p className="text-2xl font-bold text-purple-700">{esgSummary.governanceScore}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Label</p>
            <p className="text-2xl font-bold">{esgSummary.label}</p>
          </div>
        </div>
      </Card>

      {/* Financial Overview */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Financial Overview</h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">Funding Goal</p>
            <p className="text-2xl font-bold text-green-600">Rs. {finalInvestment.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Expected Revenue</p>
            <p className="text-2xl font-bold text-blue-600">Rs. {finalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estimated ROI</p>
            <p className="text-2xl font-bold text-purple-600">{roi}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Min Investment</p>
            <p className="text-2xl font-bold text-orange-600">Rs. {funding?.minimumInvestment?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </Card>

      {/* AI Generated Description */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI-Generated Project Description
          </h3>
          <Badge className="bg-purple-600">Auto-Generated</Badge>
        </div>
        <Textarea
          value={generatedDescription}
          onChange={(e) => setGeneratedDescription(e.target.value)}
          rows={12}
          className="font-mono text-sm"
          placeholder="Project description will be auto-generated..."
        />
        <p className="text-xs text-gray-600 mt-2">
          You can edit this AI-generated description before submitting
        </p>
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Project Timeline</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Planting Date</p>
            <p className="font-semibold">{new Date(irrigation?.plantingDate).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Harvest Date</p>
            <p className="font-semibold">{new Date(irrigation?.harvestDate).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-semibold">{irrigation?.duration} months</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
