/**
 * Shared constants for waypoint actions
 */

export const WaypointActions = {
  NO_ACTION: 'noAction',
  TAKE_PHOTO: 'takePhoto',
  START_RECORD: 'startRecord',
  STOP_RECORD: 'stopRecord',
} as const;

export type WaypointAction = typeof WaypointActions[keyof typeof WaypointActions];

/**
 * Action options mapping for dropdowns
 */
export const ACTION_OPTIONS = [
  { value: WaypointActions.NO_ACTION, label: 'No Action' },
  { value: WaypointActions.TAKE_PHOTO, label: 'Take Picture' },
  { value: WaypointActions.START_RECORD, label: 'Start Recording' },
  { value: WaypointActions.STOP_RECORD, label: 'Stop Recording' },
] as const;

/**
 * Action display icons
 */
export const ACTION_ICONS: Record<WaypointAction, string> = {
  [WaypointActions.NO_ACTION]: '',
  [WaypointActions.TAKE_PHOTO]: '📷',
  [WaypointActions.START_RECORD]: '🎬',
  [WaypointActions.STOP_RECORD]: '⏹️',
};

/**
 * Action badge color mappings
 */
export const ACTION_BADGE_COLORS: Record<WaypointAction, 'blue' | 'red' | 'yellow' | 'green'> = {
  [WaypointActions.NO_ACTION]: 'blue',
  [WaypointActions.TAKE_PHOTO]: 'blue',
  [WaypointActions.START_RECORD]: 'red',
  [WaypointActions.STOP_RECORD]: 'yellow',
};
