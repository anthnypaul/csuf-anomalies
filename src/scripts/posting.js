import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  getDocs,
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { app, auth } from "./firebaseConfig.js";

/* Start 
        OF  
            POSTING FUNCIOTNALITY*/
export function initializePosting() {
  const db = getFirestore(app);
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".add");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = form.querySelector(".title").value;
      const description = form.querySelector(".description").value;

      // Get the uploaded image
      const imageInput = form.querySelector("#imageInput");
      const imageFile = imageInput.files[0];

      // Upload the image to Firebase Storage
      const storageRef = getStorage(app);
      const imageRef = ref(storageRef, `images/${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(imageRef);

      const user = auth.currentUser;

      if (user) {
        const userId = user.uid;
        const displayName = user.email ? user.email.split("@")[0] : ""; // Using email as displayName
        // Add data to Firestore
        await addDoc(collection(db, "posts"), {
          title,
          description,
          imageUrl,
          postedAt: serverTimestamp(),
          userId,
          displayName,
        });

        // Redirect to another HTML after successful submission
        window.location.href = "sightings.html";
      }
    });
  });

  const postsContainer = document.getElementById("postsContainer");

  onSnapshot(
    query(collection(db, "posts"), orderBy("postedAt", "desc")),
    async (snapshot) => {
      console.log("Snapshot received:", snapshot);

      postsContainer.innerHTML = "";
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const postDocId = docSnap.id;
        console.log("Data from Firestore:", data);

        const postElement = document.createElement("div");
        postElement.classList.add("post");

        // Fetch user information based on the user ID stored in the post document
        const displayName = data.displayName;

        // Format date to display only date and time
        const cleanTime = {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        };
        const postedDate = data.postedAt
          .toDate()
          .toLocaleString(undefined, cleanTime);

        postElement.innerHTML = `
        <h2 class="post-title">${data.title}</h2>
        <p class="post-description">${data.description}</p>
        <img class="post-image" src="${data.imageUrl}" alt="Post Image">
        <p class="post-author">Posted by: ${displayName} · ${postedDate}</p>
        <div class="post-btns">
          <button class="button--true"><img src="img/icons/T_Icon.png"></button>
          <button class="button--false"><img src="img/icons/F_icon.png"></button>
          <a href="post.html"><img src="img/icons/comment_icon.png"></a>
        </div>
      `;
        console.log("Appending postElement");
        postsContainer.appendChild(postElement);

        postElement.addEventListener("click", () => {
          // Redirect to post.html with the relevant post data
          const postData = {
            title: data.title,
            imageUrl: data.imageUrl,
            description: data.description,
            postedDate: postedDate,
            displayName: displayName,
            postDocId: postDocId,
          };

          // Store postData in localStorage for retrieval on post.html
          localStorage.setItem("postData", JSON.stringify(postData));

          // Redirect to post.html
          window.location.href = "post.html";
        });
        postsContainer.appendChild(postElement);
      }
    }
  );

  document.addEventListener("DOMContentLoaded", () => {
    const postData = JSON.parse(localStorage.getItem("postData"));
    const postDocId = postData.postDocId;

    document.getElementById("postTitle").textContent = postData.title;
    document.getElementById("postImage").src = postData.imageUrl;
    document.getElementById("postDescription").textContent =
      postData.description;
    document.getElementById("postDate").textContent = postData.postedDate;
    document.getElementById("postAuthor").textContent =
      "Posted by: " + postData.displayName;

    // Call updateCommentsContainer to display comments
    updateCommentsContainer(postDocId);

    // Add event listeners to buttons
    document.querySelector(".button--true").addEventListener("click", () => {
      vote(true, postDocId);
    });

    document.querySelector(".button--false").addEventListener("click", () => {
      vote(false, postDocId);
    });
  });

  //Commenting to Post Upload
  document.addEventListener("DOMContentLoaded", () => {
    const commentsForm = document.getElementById("addComment");
    const commentsContainer = document.getElementById("commentsContainer");

    commentsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Comments submitted");

      const postDocId = JSON.parse(localStorage.getItem("postData")).postDocId;
      const comment = commentsForm.querySelector(".comment").value;

      if (postDocId) {
        const commentsRef = collection(db, "posts", postDocId, "comments");
        const user = auth.currentUser;

        if (user) {
          const userId = user.uid;
          const displayName = user.email ? user.email.split("@")[0] : "";

          await addDoc(commentsRef, {
            authorId: userId,
            displayName,
            text: comment,
            timestamp: serverTimestamp(),
          });

          const success = await updateCommentsContainer(postDocId);

          if (success) {
            console.log("Comment added successfully");
          } else {
            console.error("Error adding comment");
          }
        } else {
          console.error("User not logged in.");
        }
      }
    });
  });

  async function updateCommentsContainer(postDocId) {
    const commentsContainer = document.getElementById("commentsContainer");
    commentsContainer.innerHTML = ""; // Clear previous comments

    const commentsRef = collection(db, "posts", postDocId, "comments");
    const querySnapshot = await getDocs(commentsRef);

    querySnapshot.forEach((doc) => {
      const commentData = doc.data();
      const commentElement = document.createElement("div");
      commentElement.classList.add("comment");

      // Format date if needed
      // const commentDate = commentData.timestamp.toDate();

      commentElement.innerHTML = `
        <span><br><span>
        <p class="comment-author">${commentData.displayName}:</p>
        <p class="comment-text">${commentData.text}</p>
      `;

      commentsContainer.appendChild(commentElement);
    });
    const { trueVotes, falseVotes } = await getVoteCount(postDocId);

    // Update the HTML elements with the vote counts
    const trueVoteCountElement = document.getElementById("trueVoteCountElementId"); 
    trueVoteCountElement.textContent = `${trueVotes}`;
  
    const falseVoteCountElement = document.getElementById("falseVoteCountElementId");
    falseVoteCountElement.textContent = `${falseVotes}`;
  }
  async function vote(isReal, postId) {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const displayName = user.email ? user.email.split("@")[0] : ""; // Using email as displayName

      const voteRef = doc(db, "posts", postId, "votes", userId);

      // Check if the user has already voted
      const voteDoc = await getDoc(voteRef);
      if (voteDoc.exists()) {
        console.log("User has already voted on this post");
        return;
      }

      // Add the vote to the database
      try {
        await setDoc(voteRef, {
          isReal: isReal,
          userId: userId,
          displayName: displayName,
        });
        console.log("Vote recorded successfully");
      } catch (error) {
        console.error("Error recording vote: ", error);
      }
    } else {
      console.error("User not logged in");
    }
  }
  async function getVoteCount(postId) {
    const votesRef = collection(db, "posts", postId, "votes");
    const querySnapshot = await getDocs(votesRef);
  
    let trueVotes = 0;
    let falseVotes = 0;
  
    querySnapshot.forEach((doc) => {
      const voteData = doc.data();
      if (voteData.isReal) {
        trueVotes++;
      } else {
        falseVotes++;
      }
    });
  
    return { trueVotes, falseVotes };
  }  
}

/* END 
          OF  
              POSTING FUNCIOTNALITY*/