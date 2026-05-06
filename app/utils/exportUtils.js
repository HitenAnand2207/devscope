/**
 * Export and sharing utilities for DevScope
 */

// Generate shareable link
export function generateShareableLink(username, baseUrl = typeof window !== 'undefined' ? window.location.origin : '') {
  return `${baseUrl}?user=${encodeURIComponent(username)}`;
}

// Generate comparison link
export function generateComparisonLink(user1, user2, baseUrl = typeof window !== 'undefined' ? window.location.origin : '') {
  return `${baseUrl}?compare=${encodeURIComponent(user1)}&vs=${encodeURIComponent(user2)}`;
}

// Generate Twitter share URL
export function generateTwitterShareUrl(username, stats) {
  const text = `I just analyzed @${username} on DevScope! 📊\n\nStats:\n• ${stats.repos} repositories\n• ${stats.stars} total stars\n• ${stats.followers} followers\n• Productivity Score: ${stats.score}/100\n\nCheck it out:`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(generateShareableLink(username))}`;
}

// Generate LinkedIn share URL
export function generateLinkedInShareUrl(username) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generateShareableLink(username))}`;
}

// Generate GitHub badge markdown
export function generateGitHubBadge(username, metric = 'stars', value = 0) {
  const badges = {
    stars: `![DevScope Stars](https://img.shields.io/badge/DevScope-${value}%20Stars-blue)`,
    productivity: `![DevScope Score](https://img.shields.io/badge/DevScope-${value}%2F100-brightgreen)`,
    repos: `![DevScope Repos](https://img.shields.io/badge/DevScope-${value}%20Repos-orange)`,
  };
  return badges[metric] || badges.stars;
}

// Export as JSON
export function exportAsJSON(data, filename = 'devscope-analysis.json') {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  downloadFile(dataBlob, filename);
}

// Export as CSV (repositories)
export function exportAsCSV(repos, filename = 'devscope-repos.csv') {
  if (!repos || repos.length === 0) return;

  const headers = ['Name', 'Stars', 'Forks', 'Language', 'Description', 'URL', 'Updated'];
  const csvRows = [headers.map(h => `"${h}"`).join(',')];

  repos.forEach(repo => {
    const row = [
      repo.name,
      repo.stars || 0,
      repo.forks || 0,
      repo.language || 'N/A',
      (repo.description || '').replace(/"/g, '""'),
      repo.url || '',
      repo.pushed_at || 'N/A',
    ];
    csvRows.push(row.map(cell => `"${cell}"`).join(','));
  });

  const csvContent = csvRows.join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(dataBlob, filename);
}

// Generate HTML report
export function generateHTMLReport(data, analysisMeta) {
  if (!data) return '';

  const profile = data.profile || {};
  const stats = data.stats || {};
  const languages = data.languages || {};
  const activityChart = data.activityChart || {};

  const languageRows = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lang, count]) => `<tr><td>${lang}</td><td>${count.toLocaleString()}</td></tr>`)
    .join('');

  const generatedTime = analysisMeta?.generatedAt ? new Date(analysisMeta.generatedAt).toLocaleString() : 'Unknown';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevScope Analysis - ${profile.login}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 30px; }
    .profile-header { display: flex; align-items: center; justify-content: center; gap: 20px; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #3b82f6; }
    h1 { color: #3b82f6; font-size: 2.5em; margin-bottom: 10px; }
    .bio { color: #cbd5e1; font-size: 1.1em; margin-bottom: 20px; }
    .generated-time { color: #64748b; font-size: 0.9em; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .stat-card { background: #1e293b; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .stat-label { color: #94a3b8; font-size: 0.9em; text-transform: uppercase; margin-bottom: 5px; }
    .stat-value { font-size: 2em; font-weight: bold; color: #3b82f6; }
    
    .section { margin-bottom: 40px; }
    .section-title { font-size: 1.8em; color: #3b82f6; margin-bottom: 20px; border-bottom: 2px solid #475569; padding-bottom: 10px; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #475569; }
    th { background: #1e293b; color: #3b82f6; font-weight: bold; }
    tr:hover { background: #1e293b; }
    
    .productivity-meter { background: #1e293b; padding: 20px; border-radius: 8px; }
    .meter-bar { height: 20px; background: #475569; border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .meter-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #06b6d4); }
    
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #475569; color: #64748b; }
    .footer a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="profile-header">
        ${profile.avatar ? `<img src="${profile.avatar}" alt="${profile.login}" class="avatar">` : ''}
        <div>
          <h1>@${profile.login}</h1>
          ${profile.name ? `<p style="font-size: 1.2em; color: #cbd5e1; margin-bottom: 10px;">${profile.name}</p>` : ''}
          ${profile.bio ? `<p class="bio">${profile.bio}</p>` : ''}
        </div>
      </div>
      <p class="generated-time">Generated on ${generatedTime}</p>
    </header>

    <section class="section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Repositories</div>
          <div class="stat-value">${(stats.repos || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Stars</div>
          <div class="stat-value">${(stats.stars || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Forks</div>
          <div class="stat-value">${(stats.forks || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Followers</div>
          <div class="stat-value">${(profile.followers || 0).toLocaleString()}</div>
        </div>
      </div>
    </section>

    ${stats.score !== undefined ? `
    <section class="section">
      <h2 class="section-title">Productivity Score</h2>
      <div class="productivity-meter">
        <p>Score: <strong>${Math.round(stats.score)}/100</strong></p>
        <div class="meter-bar">
          <div class="meter-fill" style="width: ${stats.score}%"></div>
        </div>
      </div>
    </section>
    ` : ''}

    ${Object.keys(languages).length > 0 ? `
    <section class="section">
      <h2 class="section-title">Top Languages</h2>
      <table>
        <thead>
          <tr>
            <th>Language</th>
            <th>Repositories</th>
          </tr>
        </thead>
        <tbody>
          ${languageRows}
        </tbody>
      </table>
    </section>
    ` : ''}

    <footer class="footer">
      <p>Generated by <a href="https://devscope.vercel.app" target="_blank">DevScope</a> - GitHub Developer Activity Analyzer</p>
    </footer>
  </div>
</body>
</html>
  `;
}

// Download file helper
export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export HTML as file
export function exportAsHTML(data, analysisMeta, filename = 'devscope-report.html') {
  const html = generateHTMLReport(data, analysisMeta);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  downloadFile(blob, filename);
}

// Generate markdown summary
export function generateMarkdownSummary(data) {
  if (!data) return '';

  const profile = data.profile || {};
  const stats = data.stats || {};
  const languages = data.languages || {};

  const languageList = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, count]) => `- ${lang}: ${count}`)
    .join('\n');

  return `# DevScope Analysis for @${profile.login}

${profile.name ? `**${profile.name}**\n` : ''}${profile.bio ? `${profile.bio}\n` : ''}
## Overview
- **Repositories:** ${(stats.repos || 0).toLocaleString()}
- **Total Stars:** ${(stats.stars || 0).toLocaleString()}
- **Forks:** ${(stats.forks || 0).toLocaleString()}
- **Followers:** ${(profile.followers || 0).toLocaleString()}
- **Productivity Score:** ${Math.round(stats.score || 0)}/100

## Top Languages
${languageList}

---
*Generated by [DevScope](https://devscope.vercel.app)*
`;
}

// Copy to clipboard
export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  }
}
