import { type OnboardingDraftCredits } from '@/onboarding/types/OnboardingDraftCredits';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const onboardingDraftCreditsState =
  createAtomState<OnboardingDraftCredits>({
    key: 'onboardingDraftCreditsState',
    defaultValue: {},
  });
