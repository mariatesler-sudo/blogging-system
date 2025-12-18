import {
  initApp,
  performSearch,
  hideAuthModal,
  hideEditProfileModal,
  hideCommentsModal,
} from "./app.js";


document.addEventListener("DOMContentLoaded", initApp);


document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideAuthModal();
    hideEditProfileModal();
    hideCommentsModal();
  }

  if (e.key === "Enter" && document.activeElement?.id === "search-input") {
    performSearch();
  }
});


window.onclick = function (event) {
  const authModal = document.getElementById("auth-modal");
  const editModal = document.getElementById("edit-profile-modal");
  const commentsModal = document.getElementById("comments-modal");

  if (event.target === authModal) hideAuthModal();
  if (event.target === editModal) hideEditProfileModal();
  if (event.target === commentsModal) hideCommentsModal();
};
