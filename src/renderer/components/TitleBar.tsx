import React from 'react';

export const TitleBar: React.FC = () => {
  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    window.electronAPI?.windowControl(action);
  };

  return (
    <div
      className="flex items-center justify-between px-3 select-none drag-region"
      style={{
        height: 'var(--height-title-bar)',
        backgroundColor: 'var(--color-vscode-bg-tertiary)',
        borderBottom: '1px solid var(--color-vscode-border)',
      }}
    >
      <div className="text-sm font-normal" style={{ color: 'var(--color-vscode-fg-secondary)' }}>
        App Shell
      </div>

      <div className="flex gap-2 no-drag-region">
        <button
          className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
          onClick={() => handleWindowControl('minimize')}
          title="Minimize"
        />
        <button
          className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
          onClick={() => handleWindowControl('maximize')}
          title="Maximize"
        />
        <button
          className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
          onClick={() => handleWindowControl('close')}
          title="Close"
        />
      </div>
    </div>
  );
};
