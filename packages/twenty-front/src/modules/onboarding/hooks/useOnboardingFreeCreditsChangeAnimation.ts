import { ONBOARDING_NEWLY_EARNED_CREDITS_DISPLAY_DURATION_S } from '@/onboarding/constants/OnboardingNewlyEarnedCreditsDisplayDurationS';
import { useAnimate, usePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useEffectEvent, useLayoutEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

const FADE_IN_DURATION_S = 0.24;

type UseOnboardingFreeCreditsChangeAnimationArgs = {
  delay: number;
  onDisplayed: () => void;
};

export const useOnboardingFreeCreditsChangeAnimation = ({
  delay,
  onDisplayed,
}: UseOnboardingFreeCreditsChangeAnimationArgs) => {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const shouldReduceMotion = useReducedMotion();
  const [isPresent, safeToRemove] = usePresence();

  const animateOpacity = (
    element: HTMLElement,
    opacity: number,
    options: { duration: number; delay?: number },
  ) =>
    animate(Number(getComputedStyle(element).opacity), opacity, {
      ...options,
      onUpdate: (value) => {
        element.style.opacity = String(value);
      },
    });

  const fadeOut = async () => {
    const element = scope.current;

    if (!isDefined(element) || !element.isConnected) {
      return;
    }

    await Promise.all([
      animateOpacity(element, 0, { duration: 0.2 }),
      animate(element, { y: shouldReduceMotion ? 0 : -8 }, { duration: 0.2 }),
    ]);
  };

  const play = useEffectEvent(async (isCancelled: () => boolean) => {
    const element = scope.current;

    if (!isDefined(element)) {
      return;
    }

    await Promise.all([
      animateOpacity(element, 1, { duration: FADE_IN_DURATION_S, delay }),
      animate(
        element,
        {
          scale: [shouldReduceMotion ? 1 : 0.6, 1],
          x: [shouldReduceMotion ? 0 : 8, 0],
        },
        {
          delay,
          scale: { type: 'spring', stiffness: 500, damping: 14, delay },
          x: { duration: FADE_IN_DURATION_S, delay },
        },
      ),
    ]);

    await new Promise((resolve) =>
      setTimeout(
        resolve,
        (ONBOARDING_NEWLY_EARNED_CREDITS_DISPLAY_DURATION_S -
          FADE_IN_DURATION_S) *
          1000,
      ),
    );

    if (isCancelled() || !isPresent) {
      return;
    }

    await fadeOut();

    if (!isCancelled() && isPresent) {
      onDisplayed();
    }
  });

  const exitWhenRemoved = useEffectEvent(async () => {
    await fadeOut();
    safeToRemove?.();
  });

  useEffect(() => {
    if (!isPresent) {
      void exitWhenRemoved();
    }
  }, [isPresent]);

  useLayoutEffect(() => {
    let isCancelled = false;

    void play(() => isCancelled);

    return () => {
      isCancelled = true;
    };
  }, []);

  return scope;
};
