import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const onboardingCreditsLossState = createAtomState<{
  credits: number;
  lossCount: number;
}>({
  key: 'onboardingCreditsLossState',
  defaultValue: { credits: 0, lossCount: 0 },
});
