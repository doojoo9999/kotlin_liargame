/* eslint-disable react-refresh/only-export-components */
import type { AxiosInstance } from 'axios';
import { createContext, useContext, type ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';

type PlayApiShape = Pick<AxiosInstance, 'post' | 'patch' | 'get'>;

const PlayApiContext = createContext<PlayApiShape>(apiClient);

type ProviderProps = {
  children: ReactNode;
  client?: PlayApiShape;
};

export const PlayApiProvider = ({ children, client = apiClient }: ProviderProps) => (
  <PlayApiContext.Provider value={client}>{children}</PlayApiContext.Provider>
);

export const usePlayApi = () => useContext(PlayApiContext);
