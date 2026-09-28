import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { clientConfigApiStatusState } from '@/client-config/states/clientConfigApiStatusState';
import { isGoogleCalendarEnabledState } from '@/client-config/states/isGoogleCalendarEnabledState';
import { isGoogleMessagingEnabledState } from '@/client-config/states/isGoogleMessagingEnabledState';
import { isMicrosoftCalendarEnabledState } from '@/client-config/states/isMicrosoftCalendarEnabledState';
import { isMicrosoftMessagingEnabledState } from '@/client-config/states/isMicrosoftMessagingEnabledState';
import { onboardingConfigState } from '@/client-config/states/onboardingConfigState';
import { OnboardingSkipDialog } from '@/onboarding/components/OnboardingSkipDialog';
import { OnboardingSkipDialogAvatars } from '@/onboarding/components/OnboardingSkipDialogAvatars';
import { ONBOARDING_NETWORK_PREVIEW_PEOPLE } from '@/onboarding/constants/OnboardingNetworkPreviewPeople';
import { ONBOARDING_SKIP_DIALOG_IDS } from '@/onboarding/constants/OnboardingSkipDialogIds';
import { SyncEmailsAutoSkipEffect } from '@/onboarding/effect-components/SyncEmailsAutoSkipEffect';
import { useOnboardingStepEnterHotkey } from '@/onboarding/hooks/useOnboardingStepEnterHotkey';
import { useSkipSyncEmailOnboardingStep } from '@/onboarding/hooks/useSkipSyncEmailOnboardingStep';
import { useTriggerApisOAuth } from '@/settings/accounts/hooks/useTriggerApiOAuth';
import { PageFocusId } from '@/types/PageFocusId';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { AppPath, ConnectedAccountProvider } from 'twenty-shared/types';
import { IconGoogle, IconMicrosoft } from 'twenty-ui/icon';
import { ImportContacts } from '~/pages/onboarding/ImportContacts';
import {
  CalendarChannelVisibility,
  MessageChannelVisibility,
} from '~/generated/graphql';

export const SyncEmails = () => {
  const { t } = useLingui();
  const { openDialog } = useDialog();
  const onboardingConfig = useAtomStateValue(onboardingConfigState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const importContactsCreditsReward =
    currentWorkspace?.workspaceMembersCount === 1
      ? (onboardingConfig?.importContactsCreditsReward ?? 0)
      : 0;
  const { triggerApisOAuth } = useTriggerApisOAuth();
  const skipSyncEmailOnboardingStep = useSkipSyncEmailOnboardingStep();
  const [hasAutoSkipFailed, setHasAutoSkipFailed] = useState(false);

  const isGoogleMessagingEnabled = useAtomStateValue(
    isGoogleMessagingEnabledState,
  );
  const isMicrosoftMessagingEnabled = useAtomStateValue(
    isMicrosoftMessagingEnabledState,
  );
  const isGoogleCalendarEnabled = useAtomStateValue(
    isGoogleCalendarEnabledState,
  );
  const isMicrosoftCalendarEnabled = useAtomStateValue(
    isMicrosoftCalendarEnabledState,
  );

  const isGoogleProviderEnabled =
    isGoogleMessagingEnabled || isGoogleCalendarEnabled;
  const isMicrosoftProviderEnabled =
    isMicrosoftMessagingEnabled || isMicrosoftCalendarEnabled;
  const hasProviderEnabled =
    isGoogleProviderEnabled || isMicrosoftProviderEnabled;
  const isClientConfigLoaded = useAtomStateValue(
    clientConfigApiStatusState,
  ).isLoadedOnce;

  const connectWithProvider = (provider: ConnectedAccountProvider) =>
    triggerApisOAuth(provider, {
      redirectLocation: AppPath.Index,
      messageVisibility: MessageChannelVisibility.METADATA,
      calendarVisibility: CalendarChannelVisibility.METADATA,
      skipMessageChannelConfiguration: true,
    });

  const handleSkip = () => openDialog(ONBOARDING_SKIP_DIALOG_IDS.syncEmails);

  useOnboardingStepEnterHotkey({
    focusId: PageFocusId.SyncEmail,
    onEnter: handleSkip,
  });

  const handleAutoSkipError = useCallback(() => {
    setHasAutoSkipFailed(true);
  }, []);

  if (!isClientConfigLoaded) {
    return null;
  }

  if (!hasProviderEnabled && !hasAutoSkipFailed) {
    return <SyncEmailsAutoSkipEffect onError={handleAutoSkipError} />;
  }

  return (
    <>
      <ImportContacts
        onContinueWithGoogle={
          isGoogleProviderEnabled
            ? () => connectWithProvider(ConnectedAccountProvider.GOOGLE)
            : undefined
        }
        onContinueWithMicrosoft={
          isMicrosoftProviderEnabled
            ? () => connectWithProvider(ConnectedAccountProvider.MICROSOFT)
            : undefined
        }
        onSkip={handleSkip}
        rewardCredits={importContactsCreditsReward}
      />
      <OnboardingSkipDialog
        dialogId={ONBOARDING_SKIP_DIALOG_IDS.syncEmails}
        visual={
          <OnboardingSkipDialogAvatars
            avatars={ONBOARDING_NETWORK_PREVIEW_PEOPLE.map((person) => ({
              id: person.id,
              name: '',
              src: person.avatarUrl,
              shape: 'circle',
            }))}
          />
        }
        title={t`Start with your whole network`}
        description={t`Twenty adds the people you email and meet, and keeps them up to date without manual data entry.`}
        actions={[
          ...(isMicrosoftProviderEnabled
            ? [
                {
                  label: t`Continue with Microsoft`,
                  Icon: IconMicrosoft,
                  onClick: () =>
                    connectWithProvider(ConnectedAccountProvider.MICROSOFT),
                },
              ]
            : []),
          ...(isGoogleProviderEnabled
            ? [
                {
                  label: t`Continue with Google`,
                  Icon: IconGoogle,
                  onClick: () =>
                    connectWithProvider(ConnectedAccountProvider.GOOGLE),
                },
              ]
            : []),
        ]}
        rewardCredits={importContactsCreditsReward}
        onSkip={() =>
          void skipSyncEmailOnboardingStep({ isAutoSkipped: false })
        }
      />
    </>
  );
};
