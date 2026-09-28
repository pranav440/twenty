import { onboardingCreditsLossState } from '@/onboarding/states/onboardingCreditsLossState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useCallback } from 'react';

export const useOnboardingCreditsLoss = () => {
  const setOnboardingCreditsLoss = useSetAtomState(onboardingCreditsLossState);

  const recordCreditsLoss = useCallback(
    (credits: number) => {
      if (credits <= 0) {
        return;
      }

      setOnboardingCreditsLoss((creditsLoss) => ({
        credits,
        lossCount: creditsLoss.lossCount + 1,
      }));
    },
    [setOnboardingCreditsLoss],
  );

  const clearCreditsLoss = useCallback(
    () =>
      setOnboardingCreditsLoss((creditsLoss) => ({
        ...creditsLoss,
        credits: 0,
      })),
    [setOnboardingCreditsLoss],
  );

  return { recordCreditsLoss, clearCreditsLoss };
};
