import { OnboardingFreeCreditsAnimatedCount } from '@/onboarding/components/free-credits/OnboardingFreeCreditsAnimatedCount';
import { OnboardingFreeCreditsProgressBar } from '@/onboarding/components/free-credits/OnboardingFreeCreditsProgressBar';
import { StyledOnboardingFreeCreditsCount } from '@/onboarding/components/free-credits/StyledOnboardingFreeCreditsCount';
import { StyledOnboardingFreeCreditsLabel } from '@/onboarding/components/free-credits/StyledOnboardingFreeCreditsLabel';
import { StyledOnboardingFreeCreditsText } from '@/onboarding/components/free-credits/StyledOnboardingFreeCreditsText';
import { styled } from '@linaria/react';
import { plural } from '@lingui/core/macro';
import { MOBILE_VIEWPORT } from 'twenty-ui/theme';

const StyledProgressLabel = styled(StyledOnboardingFreeCreditsLabel)`
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
`;

type OnboardingFreeCreditsProgressProps = {
  earnedCredits: number;
  goalCredits: number;
  previouslySeenCredits: number;
  hasNewlyEarnedCredits: boolean;
  hasTrackGrown: boolean;
  onTrackGrown: () => void;
};

export const OnboardingFreeCreditsProgress = ({
  earnedCredits,
  goalCredits,
  previouslySeenCredits,
  hasNewlyEarnedCredits,
  hasTrackGrown,
  onTrackGrown,
}: OnboardingFreeCreditsProgressProps) => {
  const displayedCredits = hasTrackGrown
    ? earnedCredits
    : Math.min(previouslySeenCredits, earnedCredits);

  return (
    <>
      <OnboardingFreeCreditsProgressBar
        credits={displayedCredits}
        goalCredits={goalCredits}
        shouldGlint={hasTrackGrown && hasNewlyEarnedCredits}
        onTrackGrown={onTrackGrown}
      />
      <StyledOnboardingFreeCreditsText>
        <StyledOnboardingFreeCreditsCount>
          <OnboardingFreeCreditsAnimatedCount credits={displayedCredits} />
          /
          <OnboardingFreeCreditsAnimatedCount credits={goalCredits} />
        </StyledOnboardingFreeCreditsCount>
        <StyledProgressLabel>
          {plural(goalCredits, {
            one: 'free credit',
            other: 'free credits',
          })}
        </StyledProgressLabel>
      </StyledOnboardingFreeCreditsText>
    </>
  );
};
