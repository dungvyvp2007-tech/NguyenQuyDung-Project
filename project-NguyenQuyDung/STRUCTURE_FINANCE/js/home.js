// 1. Các hàm hỗ trợ lấy dữ liệu dùng chung
const getAuthUser = () => JSON.parse(localStorage.getItem("authUser"));
const getAllUsers = () => JSON.parse(localStorage.getItem("users")) || [];

// 2. Hàm tính toán và hiển thị tiền
function updateFinancialStatus() {
  const monthPicker = document.getElementById("monthPicker");
  const moneyDisplay = document.getElementById("money");
  const budgetInput = document.getElementById("budgetInput");

  if (!monthPicker || !moneyDisplay) return;

  const selectedMonth = monthPicker.value;
  if (!selectedMonth) return;

  const allBudgets = JSON.parse(localStorage.getItem("monthlyBudgets")) || {};
  const totalBudget = parseFloat(allBudgets[selectedMonth] || 0);

  if (budgetInput) budgetInput.value = totalBudget > 0 ? totalBudget : "";

  const allMonthlyCategories =
    JSON.parse(localStorage.getItem("monthlyCategories")) || {};
  const categoriesInMonth = allMonthlyCategories[selectedMonth] || [];

  const totalSpent = categoriesInMonth.reduce(
    (sum, item) => sum + parseFloat(item.budget || 0),
    0,
  );

  const remaining = totalBudget - totalSpent;

  moneyDisplay.textContent = remaining.toLocaleString("vi-VN") + " VND";
  moneyDisplay.style.color = remaining < 0 ? "#ef4444" : "#22C55E";
}

document.addEventListener("DOMContentLoaded", () => {
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

  // --- XỬ LÝ SỰ KIỆN MENU TÀI KHOẢN (Logout Dropdown) ---
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
        JSON.parse(localStorage.getItem("monthlyBudgets")) || {};
      allBudgets[monthPicker.value] = amount;
      localStorage.setItem("monthlyBudgets", JSON.stringify(allBudgets));

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

  // --- 3. CHANGE INFORMATION ---
  const editInfoForm = document.getElementById("editInfoForm");
  const infoModal = document.getElementById("infoModal");

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

      alert("Cập nhật thông tin thành công!");
      infoModal.style.display = "none";
      location.reload();
    };
  }

  // --- 4. CHANGE PASSWORD ---
  const editPassForm = document.getElementById("editPassForm");
  if (editPassForm) {
    editPassForm.onsubmit = (e) => {
      e.preventDefault();

      const auth = getAuthUser(); // Người đang đăng nhập (chỉ có 4 thông tin)
      const users = getAllUsers(); // Danh sách toàn bộ user (có chứa mật khẩu)

      // Tìm tài khoản đầy đủ trong danh sách users dựa trên Email hoặc ID
      const currentUserFull = users.find((u) => u.email === auth.email);

      const currentPassInput = document.getElementById("currentPass").value;
      const newPass = document.getElementById("newPass").value;
      const confirmPass = document.getElementById("confirmPass").value;

      // 1. Kiểm tra mật khẩu cũ (Lấy từ currentUserFull)
      if (!currentUserFull || currentPassInput !== currentUserFull.password) {
        alert("Mật khẩu cũ không chính xác!");
        return;
      }

      // 2. Kiểm tra khớp mật khẩu mới
      if (newPass !== confirmPass) {
        alert("Xác nhận mật khẩu mới không khớp!");
        return;
      }

      if (newPass.length < 6) {
        alert("Mật khẩu mới phải từ 6 ký tự trở lên!");
        return;
      }

      // 3. Cập nhật mật khẩu mới vào danh sách users tổng
      const userIndex = users.findIndex((u) => u.email === auth.email);
      if (userIndex !== -1) {
        users[userIndex].password = newPass;
        localStorage.setItem("users", JSON.stringify(users));

        // Cập nhật cả vào authUser nếu bạn muốn lưu mật khẩu ở đó (tùy chọn)
        // auth.password = newPass;
        // localStorage.setItem("authUser", JSON.stringify(auth));
      }

      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");

      // Đăng xuất
      localStorage.removeItem("isLoggedIn");
      window.location.href = "./login.html";
    };
  }

  // --- ĐÓNG MỞ MODAL (SỬA LỖI TẠI ĐÂY) ---
  const openInfoBtn = document.getElementById("openInfoModal");
  const openPassBtn = document.getElementById("openPassModal");
  const passModal = document.getElementById("passModal");

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
      editPassForm.reset(); // Xóa trắng form mật khẩu cũ
      passModal.style.display = "block";
    };
  }

  // Đóng Modal khi nhấn nút X hoặc nút Cancel
  document.querySelectorAll(".close-btn, .btn-cancel").forEach((btn) => {
    btn.onclick = () => {
      infoModal.style.display = "none";
      passModal.style.display = "none";
    };
  });

  // Đóng khi click ra ngoài vùng xám
  window.onclick = (e) => {
    if (e.target === infoModal) infoModal.style.display = "none";
    if (e.target === passModal) passModal.style.display = "none";
  };

  // Lắng nghe storage
  window.addEventListener("storage", (e) => {
    if (e.key === "monthlyCategories" || e.key === "monthlyBudgets") {
      updateFinancialStatus();
    }
  });
});
