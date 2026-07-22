export function formatCurrency(amount) {
  return `KES ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatFileSize(bytes) {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function getImageUrl(url) {
  if (!url) return 'https://via.placeholder.com/300x450?text=No+Poster';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL || '/api'}/files/${url}`;
}

export function getStatusBadge(status) {
  const map = {
    active: 'badge-success',
    unverified: 'badge-warning',
    suspended: 'badge-error',
    disabled: 'badge-error',
    published: 'badge-success',
    draft: 'badge-default',
    hidden: 'badge-warning',
    paid: 'badge-success',
    pending: 'badge-warning',
    failed: 'badge-error',
    completed: 'badge-success',
    cancelled: 'badge-error',
    processing: 'badge-info',
    open: 'badge-info',
    in_progress: 'badge-warning',
    waiting_on_customer: 'badge-default',
    resolved: 'badge-success',
    closed: 'badge-default',
  };
  return map[status] || 'badge-default';
}
