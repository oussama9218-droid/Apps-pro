import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Import onboarding screens
import OnboardingWelcomeScreen from '../screens/onboarding/OnboardingWelcomeScreen';
import OnboardingActivityScreen from '../screens/onboarding/OnboardingActivityScreen';
import OnboardingURSSAFScreen from '../screens/onboarding/OnboardingURSSAFScreen';
import OnboardingVATScreen from '../screens/onboarding/OnboardingVATScreen';
import OnboardingThresholdsScreen from '../screens/onboarding/OnboardingThresholdsScreen';

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  
  const handleNext = (stepData: any) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => prev + 1);
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  switch (currentStep) {
    case 0:
      return <OnboardingWelcomeScreen onNext={() => handleNext({})} />;
    case 1:
      return (
        <OnboardingActivityScreen 
          onNext={(data) => handleNext(data)}
          onBack={handleBack}
        />
      );
    case 2:
      return (
        <OnboardingURSSAFScreen 
          onNext={(data) => handleNext(data)}
          onBack={handleBack}
          activityType={onboardingData.activityType}
        />
      );
    case 3:
      return (
        <OnboardingVATScreen 
          onNext={(data) => handleNext(data)}
          onBack={handleBack}
          activityType={onboardingData.activityType}
          urssafPeriodicity={onboardingData.urssafPeriodicity}
        />
      );
    case 4:
      return (
        <OnboardingThresholdsScreen 
          onBack={handleBack}
          activityType={onboardingData.activityType}
          urssafPeriodicity={onboardingData.urssafPeriodicity}
          vatRegime={onboardingData.vatRegime}
        />
      );
    default:
      return <OnboardingWelcomeScreen onNext={() => handleNext({})} />;
  }
}