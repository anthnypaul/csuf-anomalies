import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { redirectToHomepage, redirectToLandingpage } from "./redirect.js";
import { auth } from "./firebaseConfig.js";

export function initializeAuth() {
  /* Start 
          of 
              Authentication */
  // Registering Users
  //Event listener that waits for the DOM content to fully load
  document.addEventListener("DOMContentLoaded", () => {
    //Selects the element with the class "register" and stores it in the variable "registerForm"
    const registerForm = document.querySelector(".register");
    //Lisents for a form submission with the element "registerForm"
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault(); // prevents default behavior

      // Extracts the email and password values from the form input fields
      const email = registerForm.email.value;
      const password = registerForm.password.value;

      // creates a new user using the email and password
      createUserWithEmailAndPassword(auth, email, password)
        .then((cred) => {
          //if successful the console will display the confirmation and redirect to the home page
          console.log("user registration successful", cred.user);
          redirectToHomepage();
        })
        //if unsuccessful the console will display an error message
        .catch((err) => {
          console.log(err.message);
        });
    });
  });
  document.addEventListener("DOMContentLoaded", () => {
    //Logging In Users
    //Selects the element with the class "login" and stores it in the variable "loginForm"
    const loginForm = document.querySelector(".login");
    //Lisents for a form submission with the element "loginForm"
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Extracts the email and password values from the form input fields
      const email = loginForm.email.value;
      const password = loginForm.password.value;

      //Signs in the user with the email and password
      signInWithEmailAndPassword(auth, email, password)
        .then((cred) => {
          console.log("user logged in successfully", cred.user);
          redirectToHomepage();
        })
        .catch((err) => {
          console.log(err.message);
        });
    });
  });
  document.addEventListener("DOMContentLoaded", () => {
    //Sign Out Users
    //Selects the element with class "logout" and adds stores to "logoutButton"
    const logoutButton = document.querySelector(".logout");

    //Signs users out
    logoutButton.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          console.log("user logged out");
          redirectToLandingpage();
        })
        .catch((err) => {
          console.log(err.message);
        });
    });
  });
  document.addEventListener("DOMContentLoaded", () => {
    //Authentication State Changes
    onAuthStateChanged(auth, (user) => {
      console.log("user state changed", user);
      if (user) {
        const userEmailElement = document.getElementById("userEmail");
        const displayName = user.email ? user.email.split("@")[0] : "";
        userEmailElement.innerHTML = displayName;
      } else {
        console.error("User not signed in.");
      }
    });
  });
  //User Authentication Management (Quality of Life Management) Priority Low
  //TODO: Implement UA Management
  /* END 
            OF  
                AUTHENTICATION */
}
