document.addEventListener("DOMContentLoaded", () => {
  const loggedIn = localStorage.getItem("isLoggedIn");
  if (loggedIn !== "true") {
    window.location.href = "./login.html";
    return;
  }

  const accountBtn = document.querySelector(".account-btn");
  const logoutMenu = document.getElementById("logoutMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!accountBtn || !logoutMenu || !logoutBtn) return;

  accountBtn.addEventListener("click", () => {
    logoutMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".account-dropdown")) {
      logoutMenu.classList.add("hidden");
    }
  });

  logoutBtn.addEventListener("click", () => {
    const confirmLogout = confirm("Bạn có chắc muốn đăng xuất không?");
    if (confirmLogout) {
      localStorage.removeItem("isLoggedIn");
      // tuỳ bạn có muốn clear hết đăng nhập
      // localStorage.removeItem('authUser');
      window.location.href = "./login.html";
    }
  });
});
