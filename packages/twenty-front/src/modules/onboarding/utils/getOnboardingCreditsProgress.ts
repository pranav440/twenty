import { type OnboardingConfig } from '@/client-config/types/OnboardingConfig';
import { type OnboardingCreditsProgress } from '@/onboarding/types/OnboardingCreditsProgress';
import { type OnboardingCreditsStep } from '@/onboarding/types/OnboardingCreditsStep';
import { type OnboardingDraftCredits } from '@/onboarding/types/OnboardingDraftCredits';
import { isDefined } from 'twenty-shared/utils';
import {
  type OnboardingCreditRewards,
  OnboardingStatus,
} from '~/generated-metadata/graphql';

const ONBOARDING_STATUS_ORDER = [
  OnboardingStatus.WORKSPACE_ACTIVATION,
  OnboardingStatus.SYNC_EMAIL,
  OnboardingStatus.APPS_INSTALLATION,
  OnboardingStatus.PROFILE_CREATION,
  OnboardingStatus.INVITE_TEAM,
  OnboardingStatus.BOOK_CALL,
  OnboardingStatus.PLAN_REQUIRED,
  OnboardingStatus.COMPLETED,
];

const ONBOARDING_STATUS_BY_CREDITS_STEP: Record<
  OnboardingCreditsStep,
  OnboardingStatus
> = {
  importContacts: OnboardingStatus.SYNC_EMAIL,
  installApps: OnboardingStatus.APPS_INSTALLATION,
  createProfile: OnboardingStatus.PROFILE_CREATION,
  inviteTeam: OnboardingStatus.INVITE_TEAM,
  upgradeTrial: OnboardingStatus.PLAN_REQUIRED,
};

const ONBOARDING_CREDITS_STEPS: OnboardingCreditsStep[] = [
  'importContacts',
  'installApps',
  'createProfile',
  'inviteTeam',
  'upgradeTrial',
];

type GetOnboardingCreditsProgressArgs = {
  creditRewards: Omit<OnboardingCreditRewards, '__typename'>;
  onboardingConfig: OnboardingConfig;
  onboardingStatus: OnboardingStatus | null | undefined;
  isFirstWorkspaceMember: boolean;
  isPlanRequired: boolean;
  onboardingDraftCredits?: OnboardingDraftCredits;
};

export const getOnboardingCreditsProgress = ({
  creditRewards,
  onboardingConfig,
  onboardingStatus,
  isFirstWorkspaceMember,
  isPlanRequired,
  onboardingDraftCredits = {},
}: GetOnboardingCreditsProgressArgs): OnboardingCreditsProgress => {
  const {
    importContactsCredits,
    installAppsCredits,
    inviteTeamCredits,
    enrichmentQualificationCredits,
    totalCredits,
    pendingInvitationsCount,
  } = creditRewards;

  const statusIndex = isDefined(onboardingStatus)
    ? ONBOARDING_STATUS_ORDER.indexOf(onboardingStatus)
    : -1;
  const getStepIndex = (step: OnboardingCreditsStep) =>
    ONBOARDING_STATUS_ORDER.indexOf(ONBOARDING_STATUS_BY_CREDITS_STEP[step]);
  const hasReachedStep = (step: OnboardingCreditsStep) =>
    statusIndex >= getStepIndex(step);
  const hasPassedStep = (step: OnboardingCreditsStep) =>
    statusIndex > getStepIndex(step);

  const inviteTeamGoal =
    onboardingConfig.inviteTeamCreditsRewardPerUser *
    onboardingConfig.inviteTeamMaxInvites;

  const goalByStep: Record<OnboardingCreditsStep, number> = {
    importContacts: isFirstWorkspaceMember
      ? onboardingConfig.importContactsCreditsReward
      : 0,
    installApps: isFirstWorkspaceMember
      ? onboardingConfig.installAppsCreditsReward
      : 0,
    createProfile: isFirstWorkspaceMember
      ? onboardingConfig.createProfileCreditsReward
      : 0,
    inviteTeam: inviteTeamGoal,
    upgradeTrial: isPlanRequired ? onboardingConfig.upgradeCreditsReward : 0,
  };

  const pendingInviteCredits = Math.min(
    pendingInvitationsCount * onboardingConfig.inviteTeamCreditsRewardPerUser,
    Math.max(0, inviteTeamGoal - inviteTeamCredits),
  );

  const createProfileCredits = hasPassedStep('createProfile')
    ? goalByStep.createProfile
    : 0;

  const confirmedCreditsByStep: Record<OnboardingCreditsStep, number> = {
    importContacts: importContactsCredits,
    installApps: installAppsCredits,
    createProfile: createProfileCredits,
    inviteTeam: inviteTeamCredits + pendingInviteCredits,
    upgradeTrial: 0,
  };

  const onboardingStep = ONBOARDING_CREDITS_STEPS.find(
    (step) => ONBOARDING_STATUS_BY_CREDITS_STEP[step] === onboardingStatus,
  );

  const getDraftCredits = (step: OnboardingCreditsStep) => {
    const draftCredits = onboardingDraftCredits[step] ?? 0;
    const unconfirmedCredits = Math.max(
      0,
      goalByStep[step] - confirmedCreditsByStep[step],
    );

    if (step === onboardingStep) {
      return Math.min(draftCredits, unconfirmedCredits);
    }

    return hasPassedStep(step) && confirmedCreditsByStep[step] === 0
      ? Math.min(draftCredits, goalByStep[step])
      : 0;
  };

  const getStepEarnedCredits = (step: OnboardingCreditsStep) =>
    confirmedCreditsByStep[step] + getDraftCredits(step);

  const draftCredits = ONBOARDING_CREDITS_STEPS.reduce(
    (credits, step) => credits + getDraftCredits(step),
    0,
  );
  const earnedCredits =
    totalCredits + createProfileCredits + pendingInviteCredits + draftCredits;

  const currentStepCredits = isDefined(onboardingStep)
    ? Math.max(
        0,
        goalByStep[onboardingStep] - getStepEarnedCredits(onboardingStep),
      )
    : 0;
  const currentStep =
    isDefined(onboardingStep) && currentStepCredits > 0 ? onboardingStep : null;

  const isStepDone = (step: OnboardingCreditsStep) =>
    hasPassedStep(step) || (step === 'upgradeTrial' && hasReachedStep(step));

  const goalCredits = Math.max(
    ONBOARDING_CREDITS_STEPS.filter(hasReachedStep).reduce(
      (goal, step) =>
        goal +
        (isStepDone(step) && step !== 'inviteTeam'
          ? goalByStep[step]
          : getStepEarnedCredits(step)),
      enrichmentQualificationCredits,
    ),
    earnedCredits,
  );

  const earnedCreditsBySource: OnboardingCreditsProgress['earnedCreditsBySource'] =
    [
      ...ONBOARDING_CREDITS_STEPS.filter(
        (step) =>
          getStepEarnedCredits(step) > 0 ||
          (isStepDone(step) && goalByStep[step] > 0),
      ).map((step) => ({
        source: step,
        credits: getStepEarnedCredits(step),
        rewardCredits: goalByStep[step],
      })),
      ...(enrichmentQualificationCredits > 0
        ? [
            {
              source: 'companyBonus' as const,
              credits: enrichmentQualificationCredits,
              rewardCredits: enrichmentQualificationCredits,
            },
          ]
        : []),
    ];

  return {
    earnedCredits,
    earnedCreditsBySource,
    goalCredits,
    currentStep,
    currentStepCredits,
  };
};
