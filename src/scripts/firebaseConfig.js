import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/* FireBase Configuration Object*/
const firebaseConfig = {
  apiKey: "apiKey",
  authDomain: "authDomain",
  projectId: "projectId",
  storageBucket: "storageBucket",
  messagingSenderId: "messagingSenderId",
  appId: "appId",
  measurementId: "measurementId",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
