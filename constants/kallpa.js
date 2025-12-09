export const labFlagColors = {
  normal: '#22d3ee',
  info: '#38bdf8',
  expected: '#22d3ee',
  borderline: '#fbbf24',
  abnormal: '#fb923c',
  high: '#f97316',
  low: '#38bdf8',
  critical: '#f43f5e',
};

export const formatDuration = (ms = 0) => {
  if (!ms) return '—';
  const seconds = Math.max(Math.round(ms / 1000), 1);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem ? `${minutes}m ${rem}s` : `${minutes}m`;
};

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const delta = Date.now() - timestamp;
  if (delta < 60 * 1000) return 'just now';
  if (delta < 3600 * 1000) {
    const mins = Math.floor(delta / (60 * 1000));
    return `${mins}m ago`;
  }
  const hours = Math.floor(delta / (3600 * 1000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
