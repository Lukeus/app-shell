import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

export type PipelineStepStatus = 'idle' | 'running' | 'completed' | 'error';
export type PipelineRunnerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface PipelineStepDefinition {
  id: string;
  name: string;
  description?: string;
  prompt: {
    template: string;
    requiredInputs?: string[];
    expectedOutputs?: string[];
  };
  metadata?: Record<string, unknown>;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  steps: PipelineStepDefinition[];
  metadata?: Record<string, unknown>;
}

export interface PipelineStepResult {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineExecutionContext {
  workspaceId: string;
  pipeline: PipelineDefinition;
  step: PipelineStepDefinition;
  stepState: PipelineStepRuntimeState;
  responses: Record<string, PipelineStepResult | undefined>;
  inputs: Record<string, Record<string, unknown>>;
}

export interface PipelineRunnerOptions {
  workspaceId?: string;
  autoAdvance?: boolean;
  onExecuteStep?: (
    context: PipelineExecutionContext
  ) => Promise<PipelineStepResult | void>;
  onStatusChange?: (status: PipelineRunnerStatus, workspaceId: string) => void;
}

export interface PipelineStepRuntimeState {
  id: string;
  status: PipelineStepStatus;
  inputs: Record<string, unknown>;
  response?: PipelineStepResult;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface PipelineRunnerWorkspaceState {
  workspaceId: string;
  pipelineId: string;
  currentStepIndex: number;
  status: PipelineRunnerStatus;
  steps: Record<string, PipelineStepRuntimeState>;
  history: number[];
  startedAt?: number;
  finishedAt?: number;
  error?: string;
}

export interface UsePipelineRunnerResult {
  workspaceId: string;
  pipeline: PipelineDefinition;
  state: PipelineRunnerWorkspaceState;
  currentStep?: PipelineStepDefinition;
  steps: PipelineStepDefinition[];
  startPipeline: () => void;
  pausePipeline: () => void;
  resumePipeline: () => void;
  resetPipeline: () => void;
  advanceStep: () => void;
  rewindStep: () => void;
  goToStep: (stepId: string) => void;
  setStepInputs: (stepId: string, inputs: Record<string, unknown>) => void;
  setStepResponse: (stepId: string, result: PipelineStepResult) => void;
  runCurrentStep: (
    inputOverrides?: Record<string, unknown>
  ) => Promise<PipelineStepResult | void>;
}

const DEFAULT_WORKSPACE_ID = 'default';

const createInitialStepState = (
  step: PipelineStepDefinition
): PipelineStepRuntimeState => ({
  id: step.id,
  status: 'idle',
  inputs: {},
});

const createInitialWorkspaceState = (
  pipeline: PipelineDefinition,
  workspaceId: string
): PipelineRunnerWorkspaceState => {
  const steps = pipeline.steps.reduce<Record<string, PipelineStepRuntimeState>>(
    (acc, step) => {
      acc[step.id] = createInitialStepState(step);
      return acc;
    },
    {}
  );

  return {
    workspaceId,
    pipelineId: pipeline.id,
    currentStepIndex: 0,
    status: 'idle',
    steps,
    history: [0],
  };
};

const getStepResultMap = (
  steps: Record<string, PipelineStepRuntimeState>
): Record<string, PipelineStepResult | undefined> => {
  return Object.keys(steps).reduce<Record<string, PipelineStepResult | undefined>>(
    (acc, key) => {
      acc[key] = steps[key].response;
      return acc;
    },
    {}
  );
};

const getStepInputMap = (
  steps: Record<string, PipelineStepRuntimeState>
): Record<string, Record<string, unknown>> => {
  return Object.keys(steps).reduce<Record<string, Record<string, unknown>>>(
    (acc, key) => {
      acc[key] = steps[key].inputs;
      return acc;
    },
    {}
  );
};

export const usePipelineRunner = (
  pipeline: PipelineDefinition,
  options: PipelineRunnerOptions = {}
): UsePipelineRunnerResult => {
  const { state: appState } = useAppContext();
  const resolvedWorkspaceId = options.workspaceId ?? appState.activeWorkspaceId ?? DEFAULT_WORKSPACE_ID;
  const [workspaceStates, setWorkspaceStates] = useState<Record<string, PipelineRunnerWorkspaceState>>(() => ({
    [resolvedWorkspaceId]: createInitialWorkspaceState(pipeline, resolvedWorkspaceId),
  }));
  const previousWorkspaceRef = useRef<string>(resolvedWorkspaceId);
  const pipelineRef = useRef<PipelineDefinition>(pipeline);

  useEffect(() => {
    pipelineRef.current = pipeline;
  }, [pipeline]);

  useEffect(() => {
    setWorkspaceStates(prev => {
      const next = { ...prev };
      for (const workspaceId of Object.keys(next)) {
        if (next[workspaceId].pipelineId !== pipeline.id) {
          next[workspaceId] = createInitialWorkspaceState(pipeline, workspaceId);
        }
      }
      return next;
    });
  }, [pipeline.id]);

  useEffect(() => {
    const workspaceId = resolvedWorkspaceId || DEFAULT_WORKSPACE_ID;
    setWorkspaceStates(prev => {
      const next = { ...prev };

      // Pause the previously active workspace if it was running
      const previousWorkspaceId = previousWorkspaceRef.current;
      if (previousWorkspaceId && previousWorkspaceId !== workspaceId) {
        const previousState = next[previousWorkspaceId];
        if (previousState && previousState.status === 'running') {
          next[previousWorkspaceId] = { ...previousState, status: 'paused' };
        }
      }

      if (!next[workspaceId]) {
        next[workspaceId] = createInitialWorkspaceState(pipelineRef.current, workspaceId);
      } else if (next[workspaceId].pipelineId !== pipelineRef.current.id) {
        next[workspaceId] = createInitialWorkspaceState(pipelineRef.current, workspaceId);
      }

      previousWorkspaceRef.current = workspaceId;
      return next;
    });
  }, [resolvedWorkspaceId]);

  const updateWorkspaceState = useCallback(
    (workspaceId: string, updater: (state: PipelineRunnerWorkspaceState) => PipelineRunnerWorkspaceState) => {
      setWorkspaceStates(prev => {
        const existing = prev[workspaceId] ?? createInitialWorkspaceState(pipelineRef.current, workspaceId);
        const updated = updater(existing);
        if (updated.status !== existing.status) {
          options.onStatusChange?.(updated.status, workspaceId);
        }
        return { ...prev, [workspaceId]: updated };
      });
    },
    [options]
  );

  const activeState = workspaceStates[resolvedWorkspaceId] ?? createInitialWorkspaceState(pipelineRef.current, resolvedWorkspaceId);
  const currentStep = useMemo(
    () => pipeline.steps[activeState.currentStepIndex],
    [pipeline.steps, activeState.currentStepIndex]
  );

  const startPipeline = useCallback(() => {
    updateWorkspaceState(resolvedWorkspaceId, state => {
      if (state.status === 'idle' || state.status === 'paused') {
        return {
          ...state,
          status: 'running',
          startedAt: state.startedAt ?? Date.now(),
        };
      }
      return state;
    });
  }, [resolvedWorkspaceId, updateWorkspaceState]);

  const pausePipeline = useCallback(() => {
    updateWorkspaceState(resolvedWorkspaceId, state => {
      if (state.status === 'running') {
        return { ...state, status: 'paused' };
      }
      return state;
    });
  }, [resolvedWorkspaceId, updateWorkspaceState]);

  const resumePipeline = useCallback(() => {
    updateWorkspaceState(resolvedWorkspaceId, state => {
      if (state.status === 'paused') {
        return { ...state, status: 'running' };
      }
      return state;
    });
  }, [resolvedWorkspaceId, updateWorkspaceState]);

  const resetPipeline = useCallback(() => {
    updateWorkspaceState(resolvedWorkspaceId, () =>
      createInitialWorkspaceState(pipelineRef.current, resolvedWorkspaceId)
    );
  }, [resolvedWorkspaceId, updateWorkspaceState]);

  const advanceStep = useCallback(() => {
    updateWorkspaceState(resolvedWorkspaceId, state => {
      if (state.currentStepIndex >= pipelineRef.current.steps.length - 1) {
        if (state.status !== 'completed') {
          return {
            ...state,
            status: 'completed',
            finishedAt: state.finishedAt ?? Date.now(),
          };
        }
        return state;
      }

      const nextIndex = state.currentStepIndex + 1;
      return {
        ...state,
        currentStepIndex: nextIndex,
        history: [...state.history, nextIndex],
      };
    });
  }, [resolvedWorkspaceId, updateWorkspaceState]);

  const rewindStep = useCallback(() => {
    updateWorkspaceState(resolvedWorkspaceId, state => {
      if (state.history.length <= 1) {
        return state;
      }

      const nextHistory = state.history.slice(0, -1);
      const previousIndex = nextHistory[nextHistory.length - 1];
      return {
        ...state,
        currentStepIndex: previousIndex,
        history: nextHistory,
      };
    });
  }, [resolvedWorkspaceId, updateWorkspaceState]);

  const goToStep = useCallback(
    (stepId: string) => {
      const index = pipelineRef.current.steps.findIndex(step => step.id === stepId);
      if (index === -1) {
        console.warn(`Attempted to navigate to unknown step id: ${stepId}`);
        return;
      }
      updateWorkspaceState(resolvedWorkspaceId, state => ({
        ...state,
        currentStepIndex: index,
        history: [...state.history, index],
      }));
    },
    [resolvedWorkspaceId, updateWorkspaceState]
  );

  const setStepInputs = useCallback(
    (stepId: string, inputs: Record<string, unknown>) => {
      updateWorkspaceState(resolvedWorkspaceId, state => {
        const target = state.steps[stepId];
        if (!target) {
          console.warn(`Attempted to update inputs for unknown step id: ${stepId}`);
          return state;
        }
        return {
          ...state,
          steps: {
            ...state.steps,
            [stepId]: {
              ...target,
              inputs: { ...target.inputs, ...inputs },
            },
          },
        };
      });
    },
    [resolvedWorkspaceId, updateWorkspaceState]
  );

  const setStepResponse = useCallback(
    (stepId: string, result: PipelineStepResult) => {
      updateWorkspaceState(resolvedWorkspaceId, state => {
        const target = state.steps[stepId];
        if (!target) {
          console.warn(`Attempted to store response for unknown step id: ${stepId}`);
          return state;
        }
        const updatedSteps = {
          ...state.steps,
          [stepId]: {
            ...target,
            status: 'completed',
            response: result,
            completedAt: Date.now(),
          },
        };

        const isLastStep =
          state.currentStepIndex >= pipelineRef.current.steps.length - 1;

        return {
          ...state,
          steps: updatedSteps,
          status: isLastStep ? 'completed' : state.status,
          finishedAt:
            isLastStep && state.finishedAt === undefined ? Date.now() : state.finishedAt,
        };
      });
    },
    [resolvedWorkspaceId, updateWorkspaceState]
  );

  const runCurrentStep = useCallback(
    async (inputOverrides?: Record<string, unknown>) => {
      const workspaceId = resolvedWorkspaceId;
      const state =
        workspaceStates[workspaceId] ??
        createInitialWorkspaceState(pipelineRef.current, workspaceId);
      const step = pipelineRef.current.steps[state.currentStepIndex];
      if (!step) {
        throw new Error('Cannot execute pipeline: current step is undefined.');
      }

      const provisionalStepState: PipelineStepRuntimeState = {
        ...(state.steps[step.id] ?? createInitialStepState(step)),
        status: 'running',
        startedAt: state.steps[step.id]?.startedAt ?? Date.now(),
        inputs: {
          ...state.steps[step.id]?.inputs,
          ...(inputOverrides ?? {}),
        },
      };

      const provisionalResponses = getStepResultMap(state.steps);
      const provisionalInputs = getStepInputMap(state.steps);
      provisionalInputs[step.id] = provisionalStepState.inputs;

      updateWorkspaceState(workspaceId, currentState => {
        const stepState = currentState.steps[step.id] ?? createInitialStepState(step);
        return {
          ...currentState,
          status: currentState.status === 'idle' ? 'running' : currentState.status,
          steps: {
            ...currentState.steps,
            [step.id]: {
              ...stepState,
              status: 'running',
              startedAt: stepState.startedAt ?? provisionalStepState.startedAt,
              inputs: provisionalStepState.inputs,
            },
          },
        };
      });

      const context: PipelineExecutionContext = {
        workspaceId,
        pipeline: pipelineRef.current,
        step,
        stepState: provisionalStepState,
        responses: provisionalResponses,
        inputs: provisionalInputs,
      };

      try {
        const result = await options.onExecuteStep?.(context);
        if (result) {
          setStepResponse(step.id, result);
        }
        if (options.autoAdvance !== false) {
          advanceStep();
        }
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        updateWorkspaceState(workspaceId, currentState => ({
          ...currentState,
          status: 'error',
          error: message,
          steps: {
            ...currentState.steps,
            [step.id]: {
              ...currentState.steps[step.id],
              status: 'error',
              error: message,
            },
          },
        }));
        throw error;
      }
    },
    [advanceStep, options, resolvedWorkspaceId, setStepResponse, updateWorkspaceState, workspaceStates]
  );

  return {
    workspaceId: resolvedWorkspaceId,
    pipeline,
    state: activeState,
    currentStep,
    steps: pipeline.steps,
    startPipeline,
    pausePipeline,
    resumePipeline,
    resetPipeline,
    advanceStep,
    rewindStep,
    goToStep,
    setStepInputs,
    setStepResponse,
    runCurrentStep,
  };
};
