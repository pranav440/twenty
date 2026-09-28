import { onboardingConfigState } from '@/client-config/states/onboardingConfigState';
import { useIsFirstWorkspaceMember } from '@/onboarding/hooks/useIsFirstWorkspaceMember';
import { useTriggerInstallAppsOnboardingStep } from '@/onboarding/hooks/useTriggerInstallAppsOnboardingStep';
import { onboardingDraftCreditsState } from '@/onboarding/states/onboardingDraftCreditsState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useState } from 'react';
import { isNonEmptyArray } from 'twenty-shared/utils';

export const useInstallOnboardingApps = (
  availableUniversalIdentifiers: string[],
) => {
  const triggerInstallAppsOnboardingStep =
    useTriggerInstallAppsOnboardingStep();

  const [deselectedUniversalIdentifiers, setDeselectedUniversalIdentifiers] =
    useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const onboardingConfig = useAtomStateValue(onboardingConfigState);
  const setOnboardingDraftCredits = useSetAtomState(
    onboardingDraftCreditsState,
  );
  const isFirstWorkspaceMember = useIsFirstWorkspaceMember();
  const rewardCredits = isFirstWorkspaceMember
    ? (onboardingConfig?.installAppsCreditsReward ?? 0)
    : 0;

  const selectedUniversalIdentifiers = availableUniversalIdentifiers.filter(
    (universalIdentifier) =>
      !deselectedUniversalIdentifiers.includes(universalIdentifier),
  );

  const setInstallAppsDraftCredits = (credits: number) =>
    setOnboardingDraftCredits((draftCredits) => ({
      ...draftCredits,
      installApps: credits,
    }));

  const toggleApp = (universalIdentifier: string) => {
    setDeselectedUniversalIdentifiers((currentDeselected) =>
      currentDeselected.includes(universalIdentifier)
        ? currentDeselected.filter(
            (identifier) => identifier !== universalIdentifier,
          )
        : [...currentDeselected, universalIdentifier],
    );
  };

  const triggerStep = async (universalIdentifiers: string[]) => {
    if (isCompleting) {
      return;
    }
    setIsCompleting(true);
    setInstallAppsDraftCredits(
      isNonEmptyArray(universalIdentifiers) ? rewardCredits : 0,
    );

    try {
      await triggerInstallAppsOnboardingStep({
        universalIdentifiers,
        isAutoSkipped: false,
      });
    } catch {
      setInstallAppsDraftCredits(0);
      setIsCompleting(false);
    }
  };

  return {
    selectedUniversalIdentifiers,
    isCompleting,
    rewardCredits,
    toggleApp,
    installSelectedAppsAndContinue: () =>
      triggerStep(selectedUniversalIdentifiers),
    skip: () => triggerStep([]),
  };
};
