// Constants:
import {
  TOGGLE_THEME,
  TOGGLE_EXTENSION_VISIBILITY,
  UPDATE_EXTENSION,
  UPDATE_AUTH,
  UPDATE_DATABASE,
  UPDATE_EXTENSION_FOOTER
} from '../action-types';
import THEMES from '../../styles/themes';
import { DEFAULT_AUTH_USER } from '../../constants/auth';
import { DEFAULT_DATABASE_USER } from '../../constants/database';
import { DEFAULT_ALERT_FOOTER } from '../../constants';


// Redux:
const initialState = {
  theme: THEMES.LIGHT,
  extension: {
    visibility: false,
    footer: DEFAULT_ALERT_FOOTER
  },
  auth: {
    loaded: false,
    isAuth: false,
    user: DEFAULT_AUTH_USER
  },
  database: {
    loaded: false,
    user: DEFAULT_DATABASE_USER
  }
};


// Functions:
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_THEME:
      return {
        ...state,
        theme: action.payload,
      };
    case TOGGLE_EXTENSION_VISIBILITY:
      return {
        ...state,
        extension: {
          ...state.extension,
          visibility: action.payload === null ? !state.extension.visibility : action.payload
        }
      };
    case UPDATE_EXTENSION_FOOTER:
      let newFooter = action.payload;
      if (newFooter === null) {
        newFooter = DEFAULT_ALERT_FOOTER
      }
      return {
        ...state,
        extension: {
          ...state.extension,
          footer: {
            ...state.extension.footer,
            ...newFooter
          }
        }
      };
    case UPDATE_EXTENSION:
      return {
        ...state,
        extension: {
          ...state.extension,
          ...action.payload
        }
      };
    case UPDATE_AUTH:
      return {
        ...state,
        auth: {
          ...state.auth,
          ...action.payload
        }
      };
    case UPDATE_DATABASE:
      return {
        ...state,
        database: {
          ...state.database,
          ...action.payload
        }
      };
    default:
      return state;
  }
};


// Exports:
export default reducer;
