/**
 * Shared Tailwind CSS class patterns for consistent styling across components
 */

export const buttonStyles = {
  toolbar: 'w-full justify-start',
  toolbarSecondary: 'w-full justify-start',
  toolbarPrimary: 'w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
  toolbarDestructive: 'w-full justify-start',
} as const;

export const panelStyles = {
  container: 'absolute top-24 right-5 z-[1000] w-[220px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-300 overflow-hidden',
  sectionDrawing: 'space-y-2 p-5 bg-gradient-to-br from-blue-50 to-blue-100/30 border-b border-gray-300',
  sectionActions: 'space-y-2 p-5 bg-gradient-to-br from-green-50 to-green-100/30',
  heading: 'text-sm font-bold text-gray-900 mb-3 flex items-center gap-2',
  buttonGrid: 'flex flex-col gap-2',
} as const;

export const badgeStyles = {
  base: 'inline-block px-2 py-1 text-xs font-medium rounded',
  blue: 'text-blue-800 bg-blue-100',
  red: 'text-red-800 bg-red-100',
  yellow: 'text-yellow-800 bg-yellow-100',
  green: 'text-green-800 bg-green-100',
} as const;

export const tableStyles = {
  container: 'overflow-x-auto border border-gray-200 rounded-lg',
  table: 'min-w-full divide-y divide-gray-200',
  thead: 'bg-gray-50',
  th: 'px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider',
  tbody: 'bg-white divide-y divide-gray-200',
  rowHighlight: 'bg-yellow-50',
  rowHover: 'hover:bg-gray-50',
  cellText: 'px-3 py-2 whitespace-nowrap text-sm text-gray-900',
  cellSubtext: 'px-3 py-2 whitespace-nowrap text-sm text-gray-600',
} as const;

export const iconStyles = {
  small: 'h-3 w-3',
  medium: 'h-4 w-4',
  large: 'h-5 w-5',
  blue: 'text-blue-600',
  green: 'text-green-600',
  gray: 'text-gray-600',
  red: 'text-red-600',
} as const;
