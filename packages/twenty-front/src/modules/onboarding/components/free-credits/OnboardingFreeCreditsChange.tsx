import { StyledOnboardingFreeCreditsChange } from '@/onboarding/components/free-credits/StyledOnboardingFreeCreditsChange';
import { useOnboardingFreeCreditsChangeAnimation } from '@/onboarding/hooks/useOnboardingFreeCreditsChangeAnimation';

type OnboardingFreeCreditsChangeProps = {
  label: string;
  isLost: boolean;
  delay: number;
  onDisplayed: () => void;
};

export const OnboardingFreeCreditsChange = ({
  label,
  isLost,
  delay,
  onDisplayed,
}: OnboardingFreeCreditsChangeProps) => {
  const scope = useOnboardingFreeCreditsChangeAnimation({
    isLost,
    delay,
    onDisplayed,
  });

  return (
    <StyledOnboardingFreeCreditsChange ref={scope} data-lost={isLost}>
      {label}
    </StyledOnboardingFreeCreditsChange>
  );
};
