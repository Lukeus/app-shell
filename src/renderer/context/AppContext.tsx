import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Extension {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
}

export interface AppState {
  // Sidebar state
  sidebarCollapsed: boolean;
  activeView: string;

  // Panel state
  panelCollapsed: boolean;
  panelHeight: number;
  activePanel: string;

  // Extensions
  extensions: Extension[];

  // Theme
  currentTheme: string;

  // Status bar
  statusBarItems: {
    branch: string;
    sync: string;
    problems: number;
    languageMode: string;
    encoding: string;
    lineEnding: string;
    cursorPosition: string;
    selection: string;
  };
}

export type AppAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_ACTIVE_VIEW'; payload: string }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'SET_PANEL_COLLAPSED'; payload: boolean }
  | { type: 'SET_PANEL_HEIGHT'; payload: number }
  | { type: 'SET_ACTIVE_PANEL'; payload: string }
  | { type: 'SET_EXTENSIONS'; payload: Extension[] }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'UPDATE_STATUS_BAR'; payload: Partial<AppState['statusBarItems']> }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  sidebarCollapsed: false,
  activeView: 'extensions',
  panelCollapsed: true,
  panelHeight: 300,
  activePanel: 'terminal',
  extensions: [],
  currentTheme: 'builtin.dark',
  statusBarItems: {
    branch: 'main',
    sync: '0↓ 0↑',
    problems: 0,
    languageMode: 'Terminal',
    encoding: 'UTF-8',
    lineEnding: 'LF',
    cursorPosition: 'Ln 1, Col 1',
    selection: '',
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };

    case 'SET_ACTIVE_VIEW':
      return {
        ...state,
        activeView: action.payload,
        // VS Code behavior: expand sidebar when switching views
        sidebarCollapsed: false,
      };

    case 'TOGGLE_PANEL':
      return { ...state, panelCollapsed: !state.panelCollapsed };

    case 'SET_PANEL_COLLAPSED':
      return { ...state, panelCollapsed: action.payload };

    case 'SET_PANEL_HEIGHT':
      return { ...state, panelHeight: action.payload };

    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload };

    case 'SET_EXTENSIONS':
      return { ...state, extensions: action.payload };

    case 'SET_THEME':
      return { ...state, currentTheme: action.payload };

    case 'UPDATE_STATUS_BAR':
      return {
        ...state,
        statusBarItems: { ...state.statusBarItems, ...action.payload },
      };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved state from localStorage on mount
  React.useEffect(() => {
    try {
      const savedSidebarState = localStorage.getItem('sidebar-state');
      const savedPanelState = localStorage.getItem('panel-state');

      if (savedSidebarState || savedPanelState) {
        const loadedState: Partial<AppState> = {};

        if (savedSidebarState) {
          const sidebarData = JSON.parse(savedSidebarState);
          loadedState.sidebarCollapsed = sidebarData.isCollapsed ?? false;
          loadedState.activeView = sidebarData.activeView ?? 'extensions';
        }

        if (savedPanelState) {
          const panelData = JSON.parse(savedPanelState);
          loadedState.panelCollapsed = panelData.isCollapsed ?? true;
          loadedState.panelHeight = panelData.height ?? 300;
        }

        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
    }
  }, []);

  // Save state to localStorage when it changes
  React.useEffect(() => {
    try {
      const sidebarState = {
        isCollapsed: state.sidebarCollapsed,
        activeView: state.activeView,
      };
      localStorage.setItem('sidebar-state', JSON.stringify(sidebarState));
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  }, [state.sidebarCollapsed, state.activeView]);

  React.useEffect(() => {
    try {
      const panelState = {
        isCollapsed: state.panelCollapsed,
        height: state.panelHeight,
      };
      localStorage.setItem('panel-state', JSON.stringify(panelState));
    } catch (error) {
      console.error('Failed to save panel state:', error);
    }
  }, [state.panelCollapsed, state.panelHeight]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
