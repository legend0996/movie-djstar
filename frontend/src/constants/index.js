export const ROLES = {
  USER: 'user',
  MOVIE_OWNER: 'movie_owner',
  DEVELOPER: 'developer',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  UNVERIFIED: 'unverified',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
};

export const MOVIE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
};

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const TICKET_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_customer', label: 'Waiting on You' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'title_asc', label: 'Title: A-Z' },
  { value: 'title_desc', label: 'Title: Z-A' },
];
