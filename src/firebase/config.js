// Packages:
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/firestore';
import 'firebase/storage';


// Constants:
const firebaseConfig = {
  apiKey: "AIzaSyDQhDVouDQC-DLG4hojVk7tgr7JTy-8Y_g",
  authDomain: "open-reply.firebaseapp.com",
  databaseURL: "https://open-reply.firebaseio.com",
  projectId: "open-reply",
  storageBucket: "open-reply.appspot.com",
  messagingSenderId: "753239720595",
  appId: "1:753239720595:web:f17885cbfebf40bc778366",
  measurementId: "G-LWBDTCVZTR"
};

firebase.initializeApp(firebaseConfig);

const AUTH = firebase.auth();
const REALTIME = firebase.database();
const STORAGE = firebase.firestore();
const DATABASE = {
  REALTIME,
  STORAGE
};
const BUCKET = firebase.storage().ref();


// Exports:
export { AUTH, DATABASE, BUCKET };
