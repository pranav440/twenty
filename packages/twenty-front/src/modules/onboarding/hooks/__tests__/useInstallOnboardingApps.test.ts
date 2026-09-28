import { act, renderHook } from '@testing-library/react';

import { useInstallOnboardingApps } from '@/onboarding/hooks/useInstallOnboardingApps';

const mockTriggerInstallAppsOnboardingStep = jest.fn();

jest.mock('@/onboarding/hooks/useTriggerInstallAppsOnboardingStep', () => ({
  useTriggerInstallAppsOnboardingStep: () =>
    mockTriggerInstallAppsOnboardingStep,
}));

const AVAILABLE_APPS = ['app-1', 'app-2'];

describe('useInstallOnboardingApps', () => {
  beforeEach(() => {
    mockTriggerInstallAppsOnboardingStep.mockReset();
  });

  it('should install every available app by default', async () => {
    mockTriggerInstallAppsOnboardingStep.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useInstallOnboardingApps(AVAILABLE_APPS),
    );

    await act(async () => {
      await result.current.installSelectedAppsAndContinue();
    });

    expect(mockTriggerInstallAppsOnboardingStep).toHaveBeenCalledWith({
      universalIdentifiers: ['app-1', 'app-2'],
      isAutoSkipped: false,
    });
  });

  it('should leave out the apps turned off', async () => {
    mockTriggerInstallAppsOnboardingStep.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useInstallOnboardingApps(AVAILABLE_APPS),
    );

    act(() => {
      result.current.toggleApp('app-1');
    });

    await act(async () => {
      await result.current.installSelectedAppsAndContinue();
    });

    expect(mockTriggerInstallAppsOnboardingStep).toHaveBeenCalledWith({
      universalIdentifiers: ['app-2'],
      isAutoSkipped: false,
    });
  });

  it('should reset the completing state when the step fails', async () => {
    mockTriggerInstallAppsOnboardingStep.mockRejectedValue(
      new Error('network error'),
    );

    const { result } = renderHook(() =>
      useInstallOnboardingApps(AVAILABLE_APPS),
    );

    await act(async () => {
      await result.current.installSelectedAppsAndContinue();
    });

    expect(result.current.isCompleting).toBe(false);
  });

  it('should allow retrying after a failed attempt', async () => {
    mockTriggerInstallAppsOnboardingStep
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useInstallOnboardingApps(AVAILABLE_APPS),
    );

    await act(async () => {
      await result.current.installSelectedAppsAndContinue();
    });

    await act(async () => {
      await result.current.installSelectedAppsAndContinue();
    });

    expect(mockTriggerInstallAppsOnboardingStep).toHaveBeenCalledTimes(2);
  });

  it('should ignore a second submission while one is already in flight', async () => {
    let resolveTrigger: () => void = () => {};

    mockTriggerInstallAppsOnboardingStep.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveTrigger = resolve;
      }),
    );

    const { result } = renderHook(() =>
      useInstallOnboardingApps(AVAILABLE_APPS),
    );

    act(() => {
      void result.current.installSelectedAppsAndContinue();
    });

    expect(result.current.isCompleting).toBe(true);

    act(() => {
      void result.current.skip();
    });

    expect(mockTriggerInstallAppsOnboardingStep).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveTrigger();
    });
  });
});
