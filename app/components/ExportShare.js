"use client";

import { useState } from 'react';
import {
  generateShareableLink,
  generateTwitterShareUrl,
  generateLinkedInShareUrl,
  generateGitHubBadge,
  generateMarkdownSummary,
  copyToClipboard,
  exportAsJSON,
  exportAsCSV,
  exportAsHTML,
} from '../utils/exportUtils';

export default function ExportShare({ username, data, analysisMeta, repos = [] }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(null);

  if (!data) return null;

  const stats = data.stats || {};
  const profile = data.profile || {};

  const handleCopyShareLink = async () => {
    const link = generateShareableLink(username);
    await copyToClipboard(link);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyMarkdown = async () => {
    const markdown = generateMarkdownSummary(data);
    await copyToClipboard(markdown);
    setCopied('markdown');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyBadge = async () => {
    const badge = generateGitHubBadge(username, 'stars', stats.stars || 0);
    await copyToClipboard(badge);
    setCopied('badge');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExportJSON = () => {
    exportAsJSON({
      profile: data.profile,
      stats: data.stats,
      languages: data.languages,
      activityChart: data.activityChart,
      repositories: repos,
      generatedAt: new Date().toISOString(),
    }, `devscope-${username}-${Date.now()}.json`);
  };

  const handleExportCSV = () => {
    exportAsCSV(repos, `devscope-${username}-repos-${Date.now()}.csv`);
  };

  const handleExportHTML = () => {
    exportAsHTML(data, analysisMeta, `devscope-${username}-report-${Date.now()}.html`);
  };

  const handleTwitterShare = () => {
    window.open(generateTwitterShareUrl(username, stats), '_blank');
  };

  const handleLinkedInShare = () => {
    window.open(generateLinkedInShareUrl(username), '_blank');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        title="Export and share options"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export & Share
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-4">
            {/* Share Section */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Share</h3>
              
              <button
                onClick={handleCopyShareLink}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {copied === 'link' ? '✓ Copied' : 'Copy Share Link'}
              </button>

              <button
                onClick={handleTwitterShare}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7" />
                </svg>
                Share on Twitter/X
              </button>

              <button
                onClick={handleLinkedInShare}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                Share on LinkedIn
              </button>
            </div>

            {/* Copy Section */}
            <div className="mb-4 border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Copy to Clipboard</h3>
              
              <button
                onClick={handleCopyMarkdown}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {copied === 'markdown' ? '✓ Copied' : 'Copy as Markdown'}
              </button>

              <button
                onClick={handleCopyBadge}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14" />
                </svg>
                {copied === 'badge' ? '✓ Copied' : 'Copy GitHub Badge'}
              </button>
            </div>

            {/* Export Section */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Download</h3>
              
              <button
                onClick={handleExportHTML}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export as HTML Report
              </button>

              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export as JSON
              </button>

              {repos.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Repos as CSV
                </button>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowMenu(false)}
              className="w-full mt-4 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
