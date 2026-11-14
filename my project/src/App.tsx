/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Language, t } from './domain/i18n';
import { MobilePreviewPanel, type PreviewTheme } from './components/MobilePreviewPanel';
import { ArchitectureAndSetupPanel } from './components/ArchitectureAndSetupPanel';
import { ProjectFilesPanel } from './components/ProjectFilesPanel';

type WorkspaceSection = 'preview' | 'architecture' | 'files';

export default function App() {
  const [section, setSection] = useState<WorkspaceSection>('preview');
  const [language, setLanguage] = useState<Language>('en');
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>('AMOLED');

  useEffect(() => {
    const root = document.documentElement;
    if (previewTheme === 'LIGHT') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [previewTheme]);

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            FUN OFFLINE
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <button
              type="button"
              onClick={() => setSection('preview')}
              className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                section === 'preview' ? 'text-zinc-900 dark:text-white underline underline-offset-8' : ''
              }`}
            >
              {t(language, 'navPreview')}
            </button>
            <button
              type="button"
              onClick={() => setSection('architecture')}
              className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                section === 'architecture' ? 'text-zinc-900 dark:text-white underline underline-offset-8' : ''
              }`}
            >
              {t(language, 'navArchitecture')}
            </button>
            <button
              type="button"
              onClick={() => setSection('files')}
              className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                section === 'files' ? 'text-zinc-900 dark:text-white underline underline-offset-8' : ''
              }`}
            >
              {t(language, 'navExplorer')}
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setSection('architecture')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
          >
            {t(language, 'primaryExportCta')}
          </button>
        </div>

        {/* Compact mobile navigation row (< 768px) to prevent header clipping */}
        <nav className="md:hidden border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center justify-between gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => setSection('preview')}
            className={`px-2 py-1.5 rounded-md whitespace-nowrap ${
              section === 'preview' ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900' : ''
            }`}
          >
            {t(language, 'navPreview')}
          </button>
          <button
            type="button"
            onClick={() => setSection('architecture')}
            className={`px-2 py-1.5 rounded-md whitespace-nowrap ${
              section === 'architecture' ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900' : ''
            }`}
          >
            {t(language, 'navArchitecture')}
          </button>
          <button
            type="button"
            onClick={() => setSection('files')}
            className={`px-2 py-1.5 rounded-md whitespace-nowrap ${
              section === 'files' ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900' : ''
            }`}
          >
            {t(language, 'navExplorer')}
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Honest External Configuration Disclosure */}
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-amber-700 dark:text-amber-400">
              {t(language, 'configBannerTitle')}
            </h1>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-4xl">
              {t(language, 'configBannerBody')}
            </p>
          </div>
          <span className="text-xs font-mono-tabular text-zinc-500 dark:text-zinc-400 shrink-0">
            com.funoffline.app · Single APK
          </span>
        </section>

        {section === 'preview' && (
          <MobilePreviewPanel
            language={language}
            previewTheme={previewTheme}
            onChangeTheme={setPreviewTheme}
            onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'bn' : 'en'))}
          />
        )}
        {section === 'architecture' && <ArchitectureAndSetupPanel language={language} />}
        {section === 'files' && <ProjectFilesPanel />}
      </main>
    </div>
  );
}
