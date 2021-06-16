// Constants:
import {
  TOGGLE_THEME,
  TOGGLE_EXTENSION_VISIBILITY,
  UPDATE_EXTENSION_FOOTER,
  UPDATE_EXTENSION,
  UPDATE_AUTH,
  UPDATE_DATABASE,
} from '../action-types';

// Exports:
export const toggleTheme = (payload) => {
  return { type: TOGGLE_THEME, payload };
};

export const toggleExtensionVisibility = (payload) => {
  return { type: TOGGLE_EXTENSION_VISIBILITY, payload };
};

export const updateExtensionFooter = (payload) => {
  return { type: UPDATE_EXTENSION_FOOTER, payload };
};

export const updateExtension = (payload) => {
  return { type: UPDATE_EXTENSION, payload };
};

export const updateAuth = (payload) => {
  return { type: UPDATE_AUTH, payload };
};

export const updateDatabase = (payload) => {
  return { type: UPDATE_DATABASE, payload };
};