import React from 'react';
import { useAppContext } from '../context/AppContext';

interface ActivityItem {
  id: string;
  title: string;
  icon: string;
}

const activityItems: ActivityItem[] = [
  { id: 'explorer', title: 'Explorer', icon: '📁' },
  { id: 'speckit', title: 'Spec Kit', icon: '🧭' },
  { id: 'prompts', title: 'Prompt Registry', icon: '🧠' },
  { id: 'extensions', title: 'Extensions', icon: '📦' },
  { id: 'marketplace', title: 'Marketplace', icon: '🏪' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
];

export const ActivityBar: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const handleItemClick = (viewId: string) => {
    // VS Code behavior: if clicking the same view and sidebar is open, toggle it
    if (viewId === state.activeView && !state.sidebarCollapsed) {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    } else {
      // Otherwise, show the view (and expand if collapsed)
      dispatch({ type: 'SET_ACTIVE_VIEW', payload: viewId });
    }
  };

  const handleSidebarToggle = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  return (
    <div
      className="flex flex-col items-center justify-between py-2 z-10"
      style={{
        width: 'var(--width-activity-bar)',
        backgroundColor: 'var(--color-vscode-bg-tertiary)',
        borderRight: '1px solid var(--color-vscode-border)',
      }}
    >
      <div className="flex flex-col gap-1 w-full">
        {activityItems.map(item => (
          <button
            key={item.id}
            className={`activity-item ${state.activeView === item.id ? 'active' : ''}`}
            onClick={() => handleItemClick(item.id)}
            title={item.title}
          >
            <span className="text-xl flex items-center justify-center">{item.icon}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1 w-full border-t border-vscode-border pt-2">
        <button className="activity-item" onClick={handleSidebarToggle} title="Toggle Sidebar">
          <span className="text-xl flex items-center justify-center">
            {state.sidebarCollapsed ? '▶' : '◀'}
          </span>
        </button>
      </div>
    </div>
  );
};
