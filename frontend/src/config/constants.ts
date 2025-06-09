// Item types based on the 'Item' type in frontend/src/types/index.ts
export const ITEM_TYPES: Array<'feature' | 'bug' | 'task' | 'improvement'> = [
  'task',
  'bug',
  'feature',
  'improvement',
];

// Item priorities based on the 'Item' type in frontend/src/types/index.ts
export const ITEM_PRIORITIES: Array<'low' | 'medium' | 'high' | 'urgent'> = [
  'low',
  'medium',
  'high',
  'urgent',
];

// Item statuses based on the 'Item' type in frontend/src/types/index.ts
// Might be useful for other components or future filters
export const ITEM_STATUSES: Array<'todo' | 'in_progress' | 'review' | 'done' | 'blocked'> = [
  'todo',
  'in_progress',
  'review',
  'done',
  'blocked',
];

// Default values for new items
export const DEFAULT_ITEM_TYPE: typeof ITEM_TYPES[number] = 'task';
export const DEFAULT_ITEM_PRIORITY: typeof ITEM_PRIORITIES[number] = 'medium';

// Project roles based on the 'ProjectMember' type in frontend/src/types/index.ts
export const PROJECT_ROLES: Array<'owner' | 'manager' | 'developer' | 'viewer'> = [
  'owner',
  'manager',
  'developer',
  'viewer',
];
