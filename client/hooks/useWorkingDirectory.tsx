import { createContext, useContext } from 'react';

interface WorkingDirectoryContextType {
  workingDirectory: string | null;
}

export const WorkingDirectoryContext = createContext<WorkingDirectoryContextType>({
  workingDirectory: null,
});

export function useWorkingDirectory() {
  return useContext(WorkingDirectoryContext);
}
