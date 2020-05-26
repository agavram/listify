import firebase from 'firebase/app';
import 'firebase/firestore';

var firebaseConfig = {
    apiKey: "AIzaSyBSYiZZJ_2oDOPNaEljFnakwC8d9ys_fR4",
    authDomain: "listify-d415f.firebaseapp.com",
    databaseURL: "https://listify-d415f.firebaseio.com",
    projectId: "listify-d415f",
    storageBucket: "listify-d415f.appspot.com",
    messagingSenderId: "380784602866",
    appId: "1:380784602866:web:198f0bd5fd451056516a6b",
    measurementId: "G-QY7R42QZEH"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
    
export const db = firebase.firestore();