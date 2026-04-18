import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/contexts/NotificationContext';
import { authService } from '@/lib/auth';
import { Bell, Mail, Smartphone, CheckCircle } from 'lucide-react';

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const user = authService.getCurrentUser();

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = () => {
    updatePreferences(localPrefs);
  };

  const togglePreference = (channel: 'email' | 'push' | 'inApp', key: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: !prev[channel][key as keyof typeof prev.email],
      }
    }));
  };

  const farmerNotifications = [
    { key: 'projectApprovals', label: 'Project Approvals', description: 'Get notified when your project is approved or rejected' },
    { key: 'newInvestments', label: 'New Investments', description: 'Receive alerts when someone invests in your project' },
    { key: 'harvestReminders', label: 'Harvest Reminders', description: 'Reminders about upcoming harvest dates' },
    { key: 'settlementUpdates', label: 'Settlement Updates', description: 'Updates on profit settlements and fund transfers' },
  ];

  const investorNotifications = [
    { key: 'projectUpdates', label: 'Project Updates', description: 'Progress updates from projects you invested in' },
    { key: 'paymentConfirmations', label: 'Payment Confirmations', description: 'Confirmation of successful investments' },
    { key: 'profitDistributions', label: 'Profit Distributions', description: 'Notifications when profits are credited' },
    { key: 'sipAlerts', label: 'SIP Auto-debit Alerts', description: 'Reminders before SIP amount is debited' },
  ];

  const partnerNotifications = [
    { key: 'projectUpdates', label: 'Assigned Work Updates', description: 'Updates related to assigned farm work and milestone reviews' },
    { key: 'paymentConfirmations', label: 'Payout Alerts', description: 'Notifications when salary or project payouts are released' },
    { key: 'settlementUpdates', label: 'Settlement Updates', description: 'Status changes for verified work and payment reviews' },
    { key: 'sipAlerts', label: 'System Alerts', description: 'Important reminders and platform notices for partners' },
  ];

  const adminNotifications = [
    { key: 'projectApprovals', label: 'Project Review Queue', description: 'New project submissions and approval decisions' },
    { key: 'projectUpdates', label: 'Project Activity', description: 'Milestone updates, field reports, and live progress events' },
    { key: 'paymentConfirmations', label: 'Payout Requests', description: 'Withdrawal requests and disbursal-related actions' },
    { key: 'settlementUpdates', label: 'Settlement Events', description: 'Completion, disbursal, and operational alerts' },
  ];

  const notificationList =
    user?.role === 'FARMER'
      ? farmerNotifications
      : user?.role === 'AGRI_PARTNER'
        ? partnerNotifications
        : user?.role === 'ADMIN'
          ? adminNotifications
          : investorNotifications;

  const renderNotificationToggles = (channel: 'email' | 'push' | 'inApp') => (
    <div className="space-y-6">
      {notificationList.map((notif) => (
        <div key={notif.key} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0">
          <div className="flex-1">
            <Label htmlFor={`${channel}-${notif.key}`} className="text-base font-semibold cursor-pointer">
              {notif.label}
            </Label>
            <p className="text-sm text-gray-600 mt-1">{notif.description}</p>
          </div>
          <Switch
            id={`${channel}-${notif.key}`}
            checked={localPrefs[channel][notif.key as keyof typeof localPrefs.email]}
            onCheckedChange={() => togglePreference(channel, notif.key)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Notification Preferences</h1>
          <p className="text-gray-600">
            Manage how you want to receive notifications
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Choose which channels you want to receive notifications through
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="inApp" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inApp" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  In-App
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="push" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Push
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inApp" className="mt-6">
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">In-App Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Receive notifications directly in the platform with toast alerts
                  </p>
                </div>
                {renderNotificationToggles('inApp')}
              </TabsContent>

              <TabsContent value="email" className="mt-6">
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Email Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Receive notifications at {user?.email}
                  </p>
                </div>
                {renderNotificationToggles('email')}
              </TabsContent>

              <TabsContent value="push" className="mt-6">
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Push Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Receive push notifications on your mobile device
                  </p>
                </div>
                {renderNotificationToggles('push')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Presets */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Presets</CardTitle>
            <CardDescription>Apply predefined notification settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => {
                  const allEnabled = { ...preferences };
                  Object.keys(allEnabled).forEach(channel => {
                    Object.keys(allEnabled[channel as keyof typeof allEnabled]).forEach(key => {
                      (allEnabled[channel as keyof typeof allEnabled] as any)[key] = true;
                    });
                  });
                  setLocalPrefs(allEnabled);
                }}
              >
                <CheckCircle className="h-5 w-5 mb-2 text-green-600" />
                <span className="font-semibold">All Notifications</span>
                <span className="text-xs text-gray-600">Enable everything</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => {
                  const importantOnly = { ...preferences };
                  Object.keys(importantOnly).forEach(channel => {
                    Object.keys(importantOnly[channel as keyof typeof importantOnly]).forEach(key => {
                      (importantOnly[channel as keyof typeof importantOnly] as any)[key] = 
                        ['projectApprovals', 'paymentConfirmations', 'profitDistributions', 'settlementUpdates'].includes(key);
                    });
                  });
                  setLocalPrefs(importantOnly);
                }}
              >
                <Bell className="h-5 w-5 mb-2 text-blue-600" />
                <span className="font-semibold">Important Only</span>
                <span className="text-xs text-gray-600">Critical updates only</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => {
                  const allDisabled = { ...preferences };
                  Object.keys(allDisabled).forEach(channel => {
                    Object.keys(allDisabled[channel as keyof typeof allDisabled]).forEach(key => {
                      (allDisabled[channel as keyof typeof allDisabled] as any)[key] = false;
                    });
                  });
                  setLocalPrefs(allDisabled);
                }}
              >
                <Bell className="h-5 w-5 mb-2 text-gray-400" />
                <span className="font-semibold">Disable All</span>
                <span className="text-xs text-gray-600">Turn off notifications</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setLocalPrefs(preferences)}>
            Reset Changes
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
