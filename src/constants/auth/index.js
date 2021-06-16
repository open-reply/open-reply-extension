// Imports:
import { ACCOUNT } from "../../assets/icons";


// Exports:
export const DEFAULT_AUTH_USER = {
  username: null,
  email: null,
  emailVerified: null,
  photoURL: ACCOUNT,
  UID: null
};
export const emailRegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
export const usernameRegExp = /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/;
