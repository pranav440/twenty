import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

export const StyledOnboardingFreeCreditsChange = styled.span`
  color: ${themeCssVariables.color.green9};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  opacity: 0;

  &[data-lost='true'] {
    color: ${themeCssVariables.font.color.tertiary};
  }
`;
