import type {StateCreator} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

interface PersistOptions<T> {
  name: string;
  version?: number;
  partialize?: (state: T) => Partial<T>;
}

export const withPersistence = <T extends object>(
  name: string,
  initializer: StateCreator<T>,
  options: Omit<PersistOptions<T>, 'name'> = {}
): StateCreator<T> => {
  return persist(initializer, {
    name,
    version: options.version ?? 1,
    storage: createJSONStorage(() => localStorage),
    partialize: options.partialize,
    // migrate hook could be added later
  });
};
