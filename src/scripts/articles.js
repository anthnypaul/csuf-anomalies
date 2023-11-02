import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { app, auth } from "./firebaseConfig.js";

export function initializeArticles() {
  /* NEWS
        ARTICLE 
              FUNCTIONALITY */

  //Get reference to the Firestore collection
  const db = getFirestore(app);
  const articleRef = collection(db, "articles");
  const articleForm = document.getElementById("addArticle");

  document.addEventListener("DOMContentLoaded", () => {
    console.log(articleForm);

    articleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Form submitted");

      const title = articleForm.querySelector(".title").value;
      const articleLink = articleForm.querySelector(".articleLink").value;
      const description = articleForm.querySelector(".description").value;

      try {
        await addDoc(articleRef, {
          title,
          url: articleLink,
          description,
          timestamp: serverTimestamp(),
        });

        window.location.href = "news.html";
      } catch (error) {
        console.error("Error adding article: ", error);
      }
    });
  });

  const articlesContainer = document.getElementById("articlesContainer");

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  onSnapshot(
    query(articleRef, orderBy("timestamp", "desc")),
    async (snapshot) => {
      articlesContainer.innerHTML = "";

      snapshot.forEach(async (doc) => {
        const data = doc.data();
        console.log("Snapshot received:", snapshot);

        const articleElement = document.createElement("div");
        articleElement.classList.add("article");

        // Format date to display only date and time
        const cleanTime = {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        };

        const postedDate = data.timestamp
          .toDate()
          .toLocaleString(undefined, cleanTime);

        articleElement.innerHTML = `
      <div class="article-content">
        <h2 class="article-title">${data.title}</h2>
        <p class="article-description">${data.description}</p>
        <a class="read-article" href="${data.url}" target="_blank">Read Article</a>
        <p class="discussion-date" id="postDate">${postedDate}</p>
      </div>
      <div class="article-btns">
        <div class="btn-zoom flex">
          <button class="true-button" data-doc-id="${doc.id}"><img src="img/icons/T_Icon.png"></button>
          <p class="true-vote-count"><span class="true-count"></span></p>
        </div>
        <div class="btn-zoom flex">
          <button class="false-button" data-doc-id="${doc.id}"><img src="img/icons/F_icon.png"></button>
          <p class="false-vote-count"><span class="false-count"></span></p>
        </div>
      </div>
    `;

        const trueButton = articleElement.querySelector(".true-button");
        trueButton.addEventListener("click", () => handleVote(true, doc.id));

        const falseButton = articleElement.querySelector(".false-button");
        falseButton.addEventListener("click", () => handleVote(false, doc.id));

        const trueCountElement = articleElement.querySelector(".true-count");
        const falseCountElement = articleElement.querySelector(".false-count");

        const trueCount = await getVoteCount(doc.id, true);
        const falseCount = await getVoteCount(doc.id, false);

        trueCountElement.textContent = trueCount;
        falseCountElement.textContent = falseCount;

        articlesContainer.appendChild(articleElement);
      });
    }
  );

  function handleVote(isTrue, docId) {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const displayName = user.email ? user.email.split("@")[0] : ""; // Using email as displayName

      const voteRef = doc(db, "articles", docId, "votes", userId);

      // Check if the user has already voted
      getDoc(voteRef).then((voteDoc) => {
        if (voteDoc.exists()) {
          console.log("User has already voted on this article");
          return;
        }

        // Add the vote to the database
        setDoc(voteRef, {
          isTrue: isTrue,
          userId: userId,
          displayName: displayName,
        })
          .then(() => {
            console.log("Vote recorded successfully");
          })
          .catch((error) => {
            console.error("Error recording vote: ", error);
          });
      });
    } else {
      console.error("User not logged in");
    }
  }
  async function getVoteCount(articleId, isTrue) {
    const votesRef = collection(db, "articles", articleId, "votes");
    const querySnapshot = await getDocs(votesRef);
    let count = 0;

    querySnapshot.forEach((doc) => {
      const voteData = doc.data();
      if (voteData.isTrue === isTrue) {
        count++;
      }
    });

    return count;
  }
}
