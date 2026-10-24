import { LISTABLE_COMPONENTS as PAPSDL_LISTABLE_COMPONENTS } from './papsdl/lazy-listable-components';

/**
 * This list bundles all the listable components from all the enabled themes.
 * Listable components are components that use the @listableObjectComponent decorator
 *
 * Themes that aren't in use should not be imported here, so they don't take up unnecessary space in the main bundle.
 */
export const THEME_LISTABLE_COMPONENTS = [
  ...PAPSDL_LISTABLE_COMPONENTS,
];
