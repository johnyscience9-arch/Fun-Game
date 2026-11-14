import React, { useState } from 'react';
import { PROJECT_FILES, type ProjectFileEntry } from '../data/projectManifest';

export const ProjectFilesPanel: React.FC = () => {
  const [selected, setSelected] = useState<ProjectFileEntry>(PROJECT_FILES[0]);
  const [layerFilter, setLayerFilter] = useState<string>('ALL');

  const layers = ['ALL', 'Android Kotlin', 'Gradle & Manifest', 'Firebase & Security', 'Backend Functions'];
  const visibleFiles =
    layerFilter === 'ALL'
      ? PROJECT_FILES
      : PROJECT_FILES.filter((f) => f.layer === layerFilter);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D11] p-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {layers.map((layer) => (
            <button
              key={layer}
              type="button"
              onClick={() => setLayerFilter(layer)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                layerFilter === layer
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {visibleFiles.map((file) => (
            <button
              key={file.path}
              type="button"
              onClick={() => setSelected(file)}
              className={`w-full text-left py-3 px-2 rounded-lg transition-colors ${
                selected.path === file.path
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="text-xs font-mono truncate">{file.path}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{file.layer}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D11] p-6 space-y-4">
        <div>
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{selected.path}</div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">{selected.summary}</p>
        </div>
        <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto leading-relaxed">
          {selected.snippet}
        </pre>
      </div>
    </section>
  );
};
