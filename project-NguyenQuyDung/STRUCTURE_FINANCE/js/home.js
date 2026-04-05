// --- 1. CÁC HÀM HỖ TRỢ DÙNG CHUNG ---
const getStorageKey = (key) => {
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = authUser ? authUser.id : "guest";
  return `user_${userId}_${key}`;
};

const getAuthUser = () => JSON.parse(localStorage.getItem("authUser"));
const getAllUsers = () => JSON.parse(localStorage.getItem("users")) || [];

// --- TOAST HỖ TRỢ THÔNG BÁO ---
const showToast = (message, type = "success", duration = 1800) => {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.remove("hidden");
  toast.classList.remove("success", "error");
  toast.classList.add("show", type);
  toast.textContent = message;

  setTimeout(() => {
    toast.classList.remove("show", type);
    toast.classList.add("hidden");
  }, duration);
};

// --- 2. HÀM TÍNH TOÁN VÀ HIỂN THỊ TIỀN ---
function updateFinancialStatus() {
  const monthPicker = document.getElementById("monthPicker");
  const moneyDisplay = document.getElementById("money");
  const budgetInput = document.getElementById("budgetInput");

  if (!monthPicker || !moneyDisplay) return;

  const selectedMonth = monthPicker.value;
  if (!selectedMonth) return;

  const allBudgets =
    JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || {};
  const totalBudget = parseFloat(allBudgets[selectedMonth] || 0);

  if (budgetInput) budgetInput.value = totalBudget > 0 ? totalBudget : "";

  const allMonthlyCategories =
    JSON.parse(localStorage.getItem(getStorageKey("monthlyCategories"))) || [];
  const monthKey = `${selectedMonth}-30`;
  const monthEntry = allMonthlyCategories.find(
    (item) => item.month === monthKey,
  );

  let totalSpent = 0;
  if (monthEntry && monthEntry.categories) {
    totalSpent = monthEntry.categories.reduce(
      (sum, item) => sum + parseFloat(item.budget || 0),
      0,
    );
  }

  const remaining = totalBudget - totalSpent;
  moneyDisplay.textContent = remaining.toLocaleString("vi-VN") + " VND";
  moneyDisplay.style.color = remaining < 0 ? "#ef4444" : "#22C55E";
}

document.addEventListener("DOMContentLoaded", () => {
  // --- KHAI BÁO BIẾN MODAL (Đưa lên đầu để tránh lỗi) ---
  const infoModal = document.getElementById("infoModal");
  const passModal = document.getElementById("passModal");
  const editInfoForm = document.getElementById("editInfoForm");
  const editPassForm = document.getElementById("editPassForm");

  // --- KHỞI TẠO THÔNG TIN NGƯỜI DÙNG ---
  const authUser = getAuthUser();
  if (authUser) {
    document.getElementById("mainName").value = authUser.fullName || "";
    document.getElementById("mainEmail").value = authUser.email || "";
    document.getElementById("mainPhone").value = authUser.phone || "";
    document.getElementById("mainGender").value = authUser.gender
      ? "Male"
      : "Female";
  }

  // --- KHỞI TẠO THÁNG VÀ TIỀN ---
  const monthPicker = document.getElementById("monthPicker");
  if (monthPicker && !monthPicker.value) {
    monthPicker.value = new Date().toISOString().slice(0, 7);
  }
  updateFinancialStatus();

  // --- XỬ LÝ MENU TÀI KHOẢN & LOGOUT ---
  const accountBtn = document.querySelector(".account-btn");
  const logoutMenu = document.getElementById("logoutMenu");
  if (accountBtn && logoutMenu) {
    accountBtn.onclick = (e) => {
      e.stopPropagation();
      logoutMenu.classList.toggle("hidden");
    };
    document.addEventListener("click", () =>
      logoutMenu.classList.add("hidden"),
    );
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authUser");
        window.location.href = "./login.html";
      }
    };
  }

  // --- XỬ LÝ NGÂN SÁCH ---
  const saveBudgetBtn = document.getElementById("saveBudgetBtn");
  if (saveBudgetBtn) {
    saveBudgetBtn.onclick = () => {
      const amount = document.getElementById("budgetInput").value;
      if (!amount || amount <= 0) {
        document.getElementById("budgetWarning").style.display = "block";
        return;
      }
      document.getElementById("budgetWarning").style.display = "none";
      const allBudgets =
        JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || {};
      allBudgets[monthPicker.value] = amount;
      localStorage.setItem(
        getStorageKey("monthlyBudgets"),
        JSON.stringify(allBudgets),
      );

      document.getElementById("budgetSuccess").style.display = "block";
      setTimeout(() => {
        document.getElementById("budgetSuccess").style.display = "none";
      }, 2000);
      updateFinancialStatus();
    };
  }

  if (monthPicker) {
    monthPicker.onchange = () => updateFinancialStatus();
  }

  // --- 3. CHANGE INFORMATION (GIỮ NGUYÊN LOGIC CỦA BẠN) ---
  if (editInfoForm) {
    editInfoForm.onsubmit = (e) => {
      e.preventDefault();
      const auth = getAuthUser();
      const users = getAllUsers();

      const updatedData = {
        fullName: document.getElementById("editName").value.trim(),
        email: document.getElementById("editEmail").value.trim(),
        phone: document.getElementById("editPhone").value.trim(),
        gender: document.getElementById("editGender").value === "Male",
      };

      localStorage.setItem(
        "authUser",
        JSON.stringify({ ...auth, ...updatedData }),
      );
      const userIndex = users.findIndex((u) => u.id === auth.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedData };
        localStorage.setItem("users", JSON.stringify(users));
      }

      showToast("Cập nhật thông tin thành công!", "success");
      infoModal.style.display = "none";
      setTimeout(() => location.reload(), 1200);
    };
  }

  // --- 4. CHANGE PASSWORD (ĐÃ TỐI ƯU SỬA LỖI) ---
  // --- 4. CHANGE PASSWORD (Cập nhật có thông báo) ---
  if (editPassForm) {
    editPassForm.onsubmit = (e) => {
      e.preventDefault();

      const auth = getAuthUser();
      const users = getAllUsers();

      // 1. Tìm user trong mảng users tổng
      const userIndex = users.findIndex(
        (u) => u.id === auth.id || u.email === auth.email,
      );

      if (userIndex === -1) {
        alert("Lỗi: Không tìm thấy tài khoản người dùng trên hệ thống!");
        return;
      }

      const currentUser = users[userIndex];
      const currentPassInput = document.getElementById("currentPass").value;
      const newPass = document.getElementById("newPass").value;
      const confirmPass = document.getElementById("confirmPass").value;

      // 2. Kiểm tra các điều kiện mật khẩu
      if (currentPassInput !== currentUser.password) {
        alert("Mật khẩu cũ không chính xác. Vui lòng kiểm tra lại!");
        return;
      }

      if (newPass !== confirmPass) {
        alert("Xác nhận mật khẩu mới không khớp!");
        return;
      }

      if (newPass.length < 6) {
        alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
        return;
      }

      // 3. Thực hiện lưu dữ liệu mới
      try {
        // Cập nhật mảng tổng
        users[userIndex].password = newPass;
        localStorage.setItem("users", JSON.stringify(users));

        // Cập nhật phiên đăng nhập hiện tại
        auth.password = newPass;
        localStorage.setItem("authUser", JSON.stringify(auth));

        // --- THÔNG BÁO THÀNH CÔNG ---
        showToast("Chúc mừng! Bạn đã đổi mật khẩu thành công.", "success");

        // 4. Đăng xuất và điều hướng
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authUser");

        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1200);
      } catch (error) {
        console.error("Lỗi khi lưu mật khẩu:", error);
        alert("Đã xảy ra lỗi hệ thống khi lưu mật khẩu mới!");
      }
    };
  }

  // --- ĐÓNG MỞ MODAL ---
  const openInfoBtn = document.getElementById("openInfoModal");
  const openPassBtn = document.getElementById("openPassModal");

  if (openInfoBtn) {
    openInfoBtn.onclick = () => {
      const auth = getAuthUser();
      if (auth) {
        document.getElementById("editName").value = auth.fullName || "";
        document.getElementById("editEmail").value = auth.email || "";
        document.getElementById("editPhone").value = auth.phone || "";
        document.getElementById("editGender").value = auth.gender
          ? "Male"
          : "Female";
      }
      infoModal.style.display = "block";
    };
  }

  if (openPassBtn) {
    openPassBtn.onclick = () => {
      editPassForm.reset();
      passModal.style.display = "block";
    };
  }

  // Đóng Modal khi nhấn nút X hoặc nút Cancel
  document.querySelectorAll(".close-btn, .btn-cancel").forEach((btn) => {
    btn.onclick = () => {
      if (infoModal) infoModal.style.display = "none";
      if (passModal) passModal.style.display = "none";
    };
  });

  window.onclick = (e) => {
    if (e.target === infoModal) infoModal.style.display = "none";
    if (e.target === passModal) passModal.style.display = "none";
  };

  // Lắng nghe storage để cập nhật tiền realtime
  window.addEventListener("storage", (e) => {
    if (
      e.key.includes("monthlyCategories") ||
      e.key.includes("monthlyBudgets")
    ) {
      updateFinancialStatus();
    }
  });
});
