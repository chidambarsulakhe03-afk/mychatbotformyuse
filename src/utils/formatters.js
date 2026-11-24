/**
 * Group conversations into human-friendly time periods
 */
export function groupConversationsByDate(conversations) {
  const groups = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOf7Days = startOfToday - 7 * 86400000;
  const startOf30Days = startOfToday - 30 * 86400000;

  conversations.forEach((conv) => {
    const time = new Date(conv.updated_at || conv.created_at).getTime();

    if (time >= startOfToday) {
      groups.Today.push(conv);
    } else if (time >= startOfYesterday) {
      groups.Yesterday.push(conv);
    } else if (time >= startOf7Days) {
      groups['Previous 7 Days'].push(conv);
    } else if (time >= startOf30Days) {
      groups['Previous 30 Days'].push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  return Object.entries(groups).filter(([_, items]) => items.length > 0);
}

/**
 * Format relative timestamp
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Truncate long strings
 */
export function truncate(str, maxLength = 30) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}
