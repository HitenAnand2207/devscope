export function appendAnalysisHistory(history = [], entry, limit = 6) {
  const next = [
    { ...entry },
    ...history.filter((item) => item.username?.toLowerCase() !== entry.username?.toLowerCase()),
  ].slice(0, limit);

  return next;
}
