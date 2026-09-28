import { type OnboardingConfig } from '@/client-config/types/OnboardingConfig';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { OnboardingFreeCreditsChange } from '@/onboarding/components/free-credits/OnboardingFreeCreditsChange';
import { OnboardingFreeCreditsPopoverContent } from '@/onboarding/components/free-credits/OnboardingFreeCreditsPopoverContent';
import { OnboardingFreeCreditsProgress } from '@/onboarding/components/free-credits/OnboardingFreeCreditsProgress';
import { StyledOnboardingFreeCreditsCount } from '@/onboarding/components/free-credits/StyledOnboardingFreeCreditsCount';
import { StyledOnboardingFreeCreditsLabel } from '@/onboarding/components/free-credits/StyledOnboardingFreeCreditsLabel';
import { StyledOnboardingFreeCreditsText } from '@/onboarding/components/free-credits/StyledOnboardingFreeCreditsText';
import { ONBOARDING_SKIP_DIALOG_IDS } from '@/onboarding/constants/OnboardingSkipDialogIds';
import { useOnboardingCreditsLoss } from '@/onboarding/hooks/useOnboardingCreditsLoss';
import { useOnboardingFreeCreditsTooltipContent } from '@/onboarding/hooks/useOnboardingFreeCreditsTooltipContent';
import { useOnboardingNewlyEarnedCredits } from '@/onboarding/hooks/useOnboardingNewlyEarnedCredits';
import { onboardingCreditsLossState } from '@/onboarding/states/onboardingCreditsLossState';
import { type OnboardingCreditsProgress } from '@/onboarding/types/OnboardingCreditsProgress';
import { type OnboardingFreeCreditsTooltipContent } from '@/onboarding/types/OnboardingFreeCreditsTooltipContent';
import { currentFocusIdSelector } from '@/ui/utilities/focus/states/currentFocusIdSelector';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRef, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconCoins, IconInfoCircle } from 'twenty-ui/icon';
import { Popover, Tooltip } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPillAnchor = styled.div`
  display: flex;
`;

const StyledTrigger = styled.button`
  align-items: center;
  background: none;
  border: none;
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.tertiary};
  corner-shape: round;
  cursor: pointer;
  display: flex;
  font-family: inherit;
  padding: 0;

  &:hover > span,
  &[data-popup-open] > span {
    background-color: ${themeCssVariables.background.transparent.medium};
  }

  &:hover > span[data-highlighted='earned'],
  &[data-popup-open] > span[data-highlighted='earned'] {
    background-color: ${themeCssVariables.color.green4};
    border-color: ${themeCssVariables.color.green5};
  }
`;

const StyledTriggerPart = styled.span`
  align-items: center;
  background-color: ${themeCssVariables.background.transparent.light};
  border: 1px solid transparent;
  box-sizing: border-box;
  corner-shape: round;
  display: flex;
  height: ${themeCssVariables.spacing[6]};
  transition:
    background-color calc(${themeCssVariables.animation.duration.normal} * 1s),
    border-color calc(${themeCssVariables.animation.duration.normal} * 1s),
    color calc(${themeCssVariables.animation.duration.normal} * 1s);

  &[data-highlighted='earned'] {
    background-color: ${themeCssVariables.color.green3};
    border-color: ${themeCssVariables.color.green4};
    color: ${themeCssVariables.color.green9};
  }
`;

const StyledCreditsPart = styled(StyledTriggerPart)`
  border-bottom-left-radius: ${themeCssVariables.border.radius.pill};
  border-right: none;
  border-top-left-radius: ${themeCssVariables.border.radius.pill};
  gap: ${themeCssVariables.spacing['1.5']};
  padding: 0 ${themeCssVariables.spacing[2]} 0
    ${themeCssVariables.spacing['1.5']};
`;

const StyledCreditsContent = styled(motion.span)`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['1.5']};
`;

const StyledInfoPart = styled(StyledTriggerPart)`
  border-bottom-right-radius: ${themeCssVariables.border.radius.rounded};
  border-top-right-radius: ${themeCssVariables.border.radius.rounded};
  justify-content: center;
  padding: 0 ${themeCssVariables.spacing['1.5']} 0
    ${themeCssVariables.spacing[1]};

  &:not([data-highlighted='earned']) {
    border-left-color: ${themeCssVariables.border.color.transparentStrong};
  }
`;

const NEWLY_EARNED_CREDITS_DELAY_S = 0.3;
const NEWLY_EARNED_CREDITS_ON_MOUNT_DELAY_S = 0.75;

const StyledTooltipPopup = styled(Tooltip.Popup)`
  && {
    transition:
      opacity 0.15s ease-out,
      transform 0.2s cubic-bezier(0.2, 0, 0, 1);
  }

  &&[data-starting-style],
  &&[data-ending-style] {
    opacity: 0;
    transform: translateY(-4px);
  }

  &&[data-ending-style] {
    transition-duration: 0.15s;
  }

  @media (prefers-reduced-motion: reduce) {
    && {
      transition: none;
    }
  }
`;

type OnboardingFreeCreditsPillProps = {
  onboardingConfig: OnboardingConfig;
  progress: OnboardingCreditsProgress;
  workspaceId: string;
};

export const OnboardingFreeCreditsPill = ({
  onboardingConfig,
  progress,
  workspaceId,
}: OnboardingFreeCreditsPillProps) => {
  const { t } = useLingui();
  const theme = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { formatNumber } = useNumberFormat();
  const [isPopoverShown, setIsPopoverShown] = useState(false);
  const currentFocusId = useAtomStateValue(currentFocusIdSelector);
  const isSkipDialogOpened = Object.values(ONBOARDING_SKIP_DIALOG_IDS).some(
    (skipDialogId) => skipDialogId === currentFocusId,
  );
  const [hasTrackGrown, setHasTrackGrown] = useState(
    shouldReduceMotion ?? false,
  );
  const [displayedTooltipContent, setDisplayedTooltipContent] =
    useState<OnboardingFreeCreditsTooltipContent | null>(null);
  const onboardingCreditsLoss = useAtomStateValue(onboardingCreditsLossState);
  const { clearCreditsLoss } = useOnboardingCreditsLoss();
  const pillAnchorRef = useRef<HTMLDivElement>(null);

  const { earnedCredits, goalCredits, currentStep, currentStepCredits } =
    progress;
  const {
    earnedCreditsWithoutTrial,
    previouslySeenCredits,
    newlyEarnedCredits,
    isFirstCreditsGain,
    markCreditsAsSeen,
  } = useOnboardingNewlyEarnedCredits({ progress, workspaceId });
  const tooltipContent = useOnboardingFreeCreditsTooltipContent({
    onboardingConfig,
    currentStep,
    newlyEarnedCredits,
    isFirstCreditsGain,
  });

  const hasNewlyEarnedCredits = newlyEarnedCredits > 0;
  const shouldShowLostCredits =
    onboardingCreditsLoss.credits > 0 && !hasNewlyEarnedCredits;

  const formatCredits = (credits: number) =>
    formatNumber(credits, { decimals: 2 });
  const formattedCurrentStepCredits = formatCredits(currentStepCredits);

  const newlyEarnedCreditsDelay = hasTrackGrown
    ? NEWLY_EARNED_CREDITS_DELAY_S
    : NEWLY_EARNED_CREDITS_ON_MOUNT_DELAY_S;

  const isEarningFirstCredits = goalCredits <= 0;
  const highlight =
    isEarningFirstCredits || hasNewlyEarnedCredits ? 'earned' : undefined;

  if (
    isDefined(tooltipContent) &&
    (tooltipContent.title !== displayedTooltipContent?.title ||
      tooltipContent.description !== displayedTooltipContent?.description)
  ) {
    setDisplayedTooltipContent(tooltipContent);
  }

  return (
    <StyledContainer>
      <AnimatePresence>
        {hasNewlyEarnedCredits && (
          <OnboardingFreeCreditsChange
            key={earnedCreditsWithoutTrial}
            label={`+${formatCredits(newlyEarnedCredits)}`}
            isLost={false}
            delay={newlyEarnedCreditsDelay}
            onDisplayed={markCreditsAsSeen}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {shouldShowLostCredits && (
          <OnboardingFreeCreditsChange
            key={`lost-${onboardingCreditsLoss.lossCount}`}
            label={`−${formatCredits(onboardingCreditsLoss.credits)}`}
            isLost
            delay={newlyEarnedCreditsDelay}
            onDisplayed={clearCreditsLoss}
          />
        )}
      </AnimatePresence>
      <StyledPillAnchor ref={pillAnchorRef}>
        <Popover.Root
          onOpenChange={(open) => {
            if (open) {
              setIsPopoverShown(true);
            }
          }}
          onOpenChangeComplete={(open) => {
            if (!open) {
              setIsPopoverShown(false);
            }
          }}
        >
          <Popover.Trigger openOnHover render={<StyledTrigger />}>
            <StyledCreditsPart data-highlighted={highlight}>
              <IconCoins size={theme.icon.size.md} color="currentColor" />
              <AnimatePresence mode="wait">
                <StyledCreditsContent
                  key={isEarningFirstCredits ? 'earn' : 'progress'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: theme.animation.duration.fast }}
                >
                  {isEarningFirstCredits ? (
                    <StyledOnboardingFreeCreditsText>
                      <StyledOnboardingFreeCreditsCount>{t`Earn ${formattedCurrentStepCredits}`}</StyledOnboardingFreeCreditsCount>
                      <StyledOnboardingFreeCreditsLabel>
                        {plural(currentStepCredits, {
                          one: 'free credit',
                          other: 'free credits',
                        })}
                      </StyledOnboardingFreeCreditsLabel>
                    </StyledOnboardingFreeCreditsText>
                  ) : (
                    <OnboardingFreeCreditsProgress
                      earnedCredits={earnedCredits}
                      goalCredits={goalCredits}
                      previouslySeenCredits={previouslySeenCredits}
                      hasNewlyEarnedCredits={hasNewlyEarnedCredits}
                      hasTrackGrown={hasTrackGrown}
                      onTrackGrown={() => setHasTrackGrown(true)}
                    />
                  )}
                </StyledCreditsContent>
              </AnimatePresence>
            </StyledCreditsPart>
            <StyledInfoPart data-highlighted={highlight}>
              <IconInfoCircle size={theme.icon.size.md} color="currentColor" />
            </StyledInfoPart>
          </Popover.Trigger>
          <Popover.Popup side="bottom" align="end" aria-label={t`Free credits`}>
            <OnboardingFreeCreditsPopoverContent progress={progress} />
          </Popover.Popup>
        </Popover.Root>
      </StyledPillAnchor>
      <Tooltip.Root
        open={
          !isPopoverShown && !isSkipDialogOpened && isDefined(tooltipContent)
        }
      >
        <StyledTooltipPopup
          anchor={pillAnchorRef}
          side="bottom"
          align="end"
          arrow
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={displayedTooltipContent?.title}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
              transition={{ duration: theme.animation.duration.normal }}
            >
              <Tooltip.Content
                description={displayedTooltipContent?.description}
              >
                {displayedTooltipContent?.title}
              </Tooltip.Content>
            </motion.div>
          </AnimatePresence>
        </StyledTooltipPopup>
      </Tooltip.Root>
    </StyledContainer>
  );
};
