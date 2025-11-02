import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { SpecKitState, SpecKitWorkspace } from '../../types/spec-kit';

interface SpecKitContextValue {
  state: SpecKitState;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<SpecKitState | null>;
  resumePipeline: (workspaceId: string) => Promise<SpecKitState | null>;
  saveContext: (workspaceId: string) => Promise<SpecKitState | null>;
}

const defaultState: SpecKitState = {
  workspaces: [],
  activeWorkspaceId: null,
  lastBroadcast: Date.now(),
};

const SpecKitContext = createContext<SpecKitContextValue | undefined>(undefined);

export const SpecKitProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<SpecKitState>(defaultState);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateState = useCallback((next: SpecKitState | null) => {
    if (next) {
      setState(next);
    }
  }, []);

  const loadInitialState = useCallback(async () => {
    if (!window.electronAPI?.getSpecKitState) {
      setIsLoading(false);
      return;
    }

    try {
      const initialState = await window.electronAPI.getSpecKitState();
      updateState(initialState);
    } catch (error) {
      console.error('Failed to load Spec Kit state', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  useEffect(() => {
    if (!window.electronAPI?.onSpecKitStateChanged) {
      return;
    }

    const handler = (nextState: SpecKitState) => {
      updateState(nextState);
    };

    window.electronAPI.onSpecKitStateChanged(handler);

    return () => {
      window.electronAPI?.removeSpecKitStateListener?.(handler);
    };
  }, [updateState]);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!window.electronAPI?.switchSpecKitWorkspace) {
        return null;
      }

      try {
        const nextState = await window.electronAPI.switchSpecKitWorkspace({ workspaceId });
        updateState(nextState);
        return nextState;
      } catch (error) {
        console.error('Failed to switch Spec Kit workspace', error);
        throw error;
      }
    },
    [updateState]
  );

  const resumePipeline = useCallback(
    async (workspaceId: string) => {
      if (!window.electronAPI?.resumeSpecKitPipeline) {
        return null;
      }

      try {
        const nextState = await window.electronAPI.resumeSpecKitPipeline({ workspaceId });
        updateState(nextState);
        return nextState;
      } catch (error) {
        console.error('Failed to resume Spec Kit pipeline', error);
        throw error;
      }
    },
    [updateState]
  );

  const saveContext = useCallback(
    async (workspaceId: string) => {
      if (!window.electronAPI?.saveSpecKitContext) {
        return null;
      }

      try {
        const nextState = await window.electronAPI.saveSpecKitContext({ workspaceId });
        updateState(nextState);
        return nextState;
      } catch (error) {
        console.error('Failed to save Spec Kit context', error);
        throw error;
      }
    },
    [updateState]
  );

  const value = useMemo<SpecKitContextValue>(
    () => ({ state, isLoading, switchWorkspace, resumePipeline, saveContext }),
    [state, isLoading, switchWorkspace, resumePipeline, saveContext]
  );

  return <SpecKitContext.Provider value={value}>{children}</SpecKitContext.Provider>;
};

export const useSpecKit = (): SpecKitContextValue => {
  const context = useContext(SpecKitContext);
  if (!context) {
    throw new Error('useSpecKit must be used within a SpecKitProvider');
  }
  return context;
};

export const useActiveSpecKitWorkspace = (): SpecKitWorkspace | undefined => {
  const { state } = useSpecKit();
  return state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
};
