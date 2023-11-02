# CSUF ANOMALIES
CSUF Anomalies is a web application to share sightings, discuss creepy happenings on campus, and vote on news articles. It uses vanilla javascript and standard html and css.

## Dependecies to be Installed

Tailwindcss and Webpack

```
npm install -D tailwindcss
npm install --save-dev webpack webpack-cli
npm install firebase
```

## Connecting Firebase

https://firebase.google.com/docs/web/setup

in firebaseConfig.js

```
const firebaseConfig = {
  apiKey: "apiKey",
  authDomain: "authDomain",
  projectId: "projectId",
  storageBucket: "storageBucket",
  messagingSenderId: "messagingSenderId",
  appId: "appId",
  measurementId: "measurementId",
};
```

replace the values then run

```
npm run build
```

to run webpack so that it can bundle the javascript. 