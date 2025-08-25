import {apiClient} from '../../../shared/api/apiClient';

export interface Subject {
  id: number;
  name: string;
}

export const getSubjects = async (): Promise<Subject[]> => {
  const { data } = await apiClient.get<Subject[]>('/api/v1/subjects');
  return data;
};
