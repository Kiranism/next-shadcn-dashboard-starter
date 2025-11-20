'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Brain, Bot, CheckCircle2, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface BotOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (config: BotConfiguration) => void;
}

export interface BotConfiguration {
  botName: string;
  botType: 'mel_ai' | 'analytics' | 'playbook' | 'scouting';
  capabilities: string[];
  triangleDefenseEnabled: boolean;
  formationPreferences: string[];
  notificationSettings: {
    email: boolean;
    inApp: boolean;
    realtime: boolean;
  };
}

const BOT_TYPES = {
  mel_ai: {
    name: 'M.E.L. AI Coach',
    icon: Brain,
    description: 'AI-powered coaching assistant with Triangle Defense expertise',
    color: '#d4db69',
    capabilities: [
      'Formation analysis',
      'Game planning',
      'Coaching insights',
      'Real-time recommendations',
    ],
  },
  analytics: {
    name: 'Analytics Bot',
    icon: Shield,
    description: 'Advanced performance metrics and statistical analysis',
    color: '#4ECDC4',
    capabilities: [
      'Performance tracking',
      'Trend analysis',
      'Statistical modeling',
      'Data visualization',
    ],
  },
  playbook: {
    name: 'Playbook Assistant',
    icon: Bot,
    description: 'Interactive playbook management and collaboration',
    color: '#FF6B6B',
    capabilities: [
      'Play creation',
      'Formation design',
      'Animation generation',
      'Collaboration tools',
    ],
  },
  scouting: {
    name: 'Scouting Bot',
    icon: Shield,
    description: 'Opponent analysis and scouting report generation',
    color: '#9B59B6',
    capabilities: [
      'Opponent tendencies',
      'Formation breakdown',
      'Weakness identification',
      'Game plan suggestions',
    ],
  },
};

export function BotOnboarding({ open, onOpenChange, onComplete }: BotOnboardingProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<BotConfiguration>({
    botName: '',
    botType: 'mel_ai',
    capabilities: [],
    triangleDefenseEnabled: true,
    formationPreferences: [],
    notificationSettings: {
      email: true,
      inApp: true,
      realtime: false,
    },
  });

  const handleNext = () => {
    if (step === 1 && !config.botName) {
      toast.error('Please enter a bot name');
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete?.(config);
    toast.success(`${config.botName} has been configured successfully!`);
    onOpenChange(false);
    // Reset state
    setStep(1);
    setConfig({
      botName: '',
      botType: 'mel_ai',
      capabilities: [],
      triangleDefenseEnabled: true,
      formationPreferences: [],
      notificationSettings: {
        email: true,
        inApp: true,
        realtime: false,
      },
    });
  };

  const toggleCapability = (capability: string) => {
    setConfig((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter((c) => c !== capability)
        : [...prev.capabilities, capability],
    }));
  };

  const toggleFormation = (formation: string) => {
    setConfig((prev) => ({
      ...prev,
      formationPreferences: prev.formationPreferences.includes(formation)
        ? prev.formationPreferences.filter((f) => f !== formation)
        : [...prev.formationPreferences, formation],
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botName">Bot Name</Label>
              <Input
                id="botName"
                placeholder="Enter a name for your bot"
                value={config.botName}
                onChange={(e) => setConfig({ ...config, botName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Bot Type</Label>
              <Select
                value={config.botType}
                onValueChange={(value: any) => setConfig({ ...config, botType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BOT_TYPES).map(([key, bot]) => {
                    const Icon = bot.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: bot.color }} />
                          {bot.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {BOT_TYPES[config.botType].description}
              </p>
            </div>
          </div>
        );

      case 2:
        const selectedBot = BOT_TYPES[config.botType];
        return (
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Select Capabilities</Label>
              <div className="grid gap-2">
                {selectedBot.capabilities.map((capability) => (
                  <div
                    key={capability}
                    className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => toggleCapability(capability)}
                  >
                    <Checkbox
                      checked={config.capabilities.includes(capability)}
                      onCheckedChange={() => toggleCapability(capability)}
                    />
                    <Label className="flex-1 cursor-pointer">{capability}</Label>
                  </div>
                ))}
              </div>
            </div>

            {config.botType === 'mel_ai' && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-amt-accent/10 border border-amt-accent/20">
                <Checkbox
                  id="triangleDefense"
                  checked={config.triangleDefenseEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, triangleDefenseEnabled: checked as boolean })
                  }
                />
                <Label htmlFor="triangleDefense" className="flex-1 cursor-pointer">
                  Enable Triangle Defense Integration
                  <p className="text-xs text-muted-foreground mt-1">
                    Provides advanced formation analysis and strategic recommendations
                  </p>
                </Label>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Formation Preferences (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select formations the bot should prioritize
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['LARRY', 'LINDA', 'RICKY', 'RITA', 'MALE_MID', 'FEMALE_MID'].map((formation) => (
                  <Button
                    key={formation}
                    variant={
                      config.formationPreferences.includes(formation) ? 'default' : 'outline'
                    }
                    onClick={() => toggleFormation(formation)}
                    className={
                      config.formationPreferences.includes(formation)
                        ? 'bg-amt-red hover:bg-amt-red/90'
                        : ''
                    }
                  >
                    {formation}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Notification Settings</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <Checkbox
                    id="email"
                    checked={config.notificationSettings.email}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notificationSettings: {
                          ...config.notificationSettings,
                          email: checked as boolean,
                        },
                      })
                    }
                  />
                  <Label htmlFor="email" className="flex-1 cursor-pointer">
                    Email Notifications
                    <p className="text-xs text-muted-foreground">
                      Receive important updates via email
                    </p>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <Checkbox
                    id="inApp"
                    checked={config.notificationSettings.inApp}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notificationSettings: {
                          ...config.notificationSettings,
                          inApp: checked as boolean,
                        },
                      })
                    }
                  />
                  <Label htmlFor="inApp" className="flex-1 cursor-pointer">
                    In-App Notifications
                    <p className="text-xs text-muted-foreground">
                      Show notifications within the portal
                    </p>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <Checkbox
                    id="realtime"
                    checked={config.notificationSettings.realtime}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notificationSettings: {
                          ...config.notificationSettings,
                          realtime: checked as boolean,
                        },
                      })
                    }
                  />
                  <Label htmlFor="realtime" className="flex-1 cursor-pointer">
                    Real-time Updates
                    <p className="text-xs text-muted-foreground">
                      Receive instant notifications during games
                    </p>
                  </Label>
                </div>
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="mt-6 p-4 rounded-lg bg-muted">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Configuration Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bot Name:</span>
                  <span className="font-medium">{config.botName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge>{BOT_TYPES[config.botType].name}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capabilities:</span>
                  <span className="font-medium">{config.capabilities.length} selected</span>
                </div>
                {config.botType === 'mel_ai' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Triangle Defense:</span>
                    <Badge variant={config.triangleDefenseEnabled ? 'default' : 'outline'}>
                      {config.triangleDefenseEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-amt-accent" />
            Bot Onboarding - Step {step} of 4
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Configure your bot with a name and type'}
            {step === 2 && 'Select capabilities and features'}
            {step === 3 && 'Set formation preferences'}
            {step === 4 && 'Configure notifications and review'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                s <= step ? 'bg-amt-red' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="min-h-[300px]">{renderStep()}</div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} className="bg-amt-red hover:bg-amt-red/90">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="bg-amt-red hover:bg-amt-red/90">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Setup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
