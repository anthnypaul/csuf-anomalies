import { initializeArticles } from "./articles.js";
import { initializeAuth } from "./auth.js";
import { initializeDiscussion } from "./discussions.js";
import { initializePosting } from "./posting.js";

initializeAuth();
initializePosting();
initializeArticles();
initializeDiscussion();

