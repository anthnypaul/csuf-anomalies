import {
  getDocs,
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { app, auth } from "./firebaseConfig.js";

const db = getFirestore(app);
const discussionRef = collection(db, "discussions");

export function initializeDiscussion() {
  document.addEventListener("DOMContentLoaded", () => {
    const discussionForm = document.getElementById("addDiscussion");
    discussionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Form submitted");

      const title = discussionForm.querySelector(".title").value;
      const description = discussionForm.querySelector(".description").value;
      const user = auth.currentUser;

      if (user) {
        const userId = user.uid;
        const displayName = user.email ? user.email.split("@")[0] : "";

        try {
          await addDoc(discussionRef, {
            title,
            description,
            postedAt: serverTimestamp(),
            userId,
            displayName,
          });

          window.location.href = "discussion.html";
        } catch (error) {
          console.error("Error adding discussion: ", error);
        }
      }
    });
  });

  const discussionContainer = document.getElementById("discussionContainer");

  onSnapshot(
    query(discussionRef, orderBy("postedAt", "desc")),
    async (snapshot) => {
      discussionContainer.innerHTML = "";
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const discDocId = docSnap.id;

        const discussionElement = document.createElement("div");
        discussionElement.classList.add("discussion");

        const displayName = data.displayName;

        const cleanTime = {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        };

        const postedDate = data.postedAt
          .toDate()
          .toLocaleString(undefined, cleanTime);

        discussionElement.innerHTML = `
          <div class="discussion-content">
            <h2 class="discussion-title">${data.title}</h2>
            <p class="discussion-description">${data.description}</p>
            <div class="flex justify-between">
              <p class="discussion-author" id="discAuthor">Posted by: ${displayName} at ${postedDate}</p>
              <a href="discussionPost.html"><img src="img/icons/comment_icon.png"></a>
            </div>
          </div>
        `;

        discussionContainer.appendChild(discussionElement);

        discussionElement.addEventListener("click", () => {
          const discData = {
            title: data.title,
            description: data.description,
            postedDate: postedDate,
            displayName: displayName,
            discDocId: discDocId,
          };

          localStorage.setItem("discData", JSON.stringify(discData));
          window.location.href = "discussionPost.html";
        });
      }
    }
  );

  const discData = JSON.parse(localStorage.getItem("discData"));
  const discDocId = discData.discDocId;

  document.getElementById("discTitle").textContent = discData.title;
  document.getElementById("discDescription").textContent = discData.description;
  document.getElementById("discDate").textContent = discData.postedDate;
  document.getElementById("discAuthor").textContent =
    "Posted by: " + discData.displayName;

  updateCommentsContainer(discDocId);

  async function addDiscussionComment(discDocId, comment) {
    const commentsRef = collection(db, `discussions/${discDocId}/comments`);
    const user = auth.currentUser;

    if (user) {
      const userId = user.uid;
      const displayName = user.email ? user.email.split("@")[0] : "";

      try {
        await addDoc(commentsRef, {
          authorId: userId,
          displayName,
          text: comment,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error adding comment: ", error);
      }
    } else {
      console.error("User not logged in.");
    }
  }

  const commentsForm = document.getElementById("addDiscussionComment");
  const commentsContainer = document.getElementById("commentsContainer");

  commentsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Comments submitted");

    const comment = commentsForm.querySelector(".comment").value;

    if (discDocId) {
      await addDiscussionComment(discDocId, comment);

      const success = await updateCommentsContainer(discDocId);

      if (success) {
        console.log("Comment added successfully");
      } else {
        console.error("Error adding comment");
      }
    }
  });

  async function updateCommentsContainer(discDocId) {
    commentsContainer.innerHTML = "";

    const commentsRef = collection(db, `discussions/${discDocId}/comments`);
    const querySnapshot = await getDocs(commentsRef);

    querySnapshot.forEach((doc) => {
      const commentData = doc.data();
      const commentElement = document.createElement("div");
      commentElement.classList.add("comment");

      commentElement.innerHTML = `
        <span><br><span>
        <p class="comment-author">${commentData.displayName}:</p>
        <p class="comment-text">${commentData.text}</p>
      `;

      commentsContainer.appendChild(commentElement);
    });
  }
}

