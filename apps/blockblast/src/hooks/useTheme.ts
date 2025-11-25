import { useMemo } from 'react';
import { PALETTE } from '../styles/theme';

export const useTheme = () => {
  return useMemo(() => ({ palette: PALETTE }), []);
};
