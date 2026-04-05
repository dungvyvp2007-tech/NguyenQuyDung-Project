document.addEventListener("DOMContentLoaded", () => {
  // --- HÀM HỖ TRỢ (UTILITIES) ---
  const getStorageKey = (key) => {
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    const userId = authUser ? authUser.id : "guest";
    return `user_${userId}_${key}`;
  };

  const showToast = (message, duration = 3000) => {
    const toast = document.getElementById("toast");
    if (!toast) return;

    // Thêm icon tùy theo nội dung message
    let icon = "⚠️"; // Mặc định là cảnh báo
    if (message.includes("thành công")) icon = "✅";
    if (message.includes("Vượt hạn mức")) icon = "🚫";

    toast.innerHTML = `<span>${icon}</span> ${message}`; // Dùng innerHTML để hiện icon

    toast.classList.remove("hidden");
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 300);
    }, duration);
  };

  const formatMoney = (value) => Number(value).toLocaleString("vi-VN") + " VND";

  const getCategoryById = (id) => {
    const categories =
      JSON.parse(localStorage.getItem(getStorageKey("categories"))) || [];
    return (
      categories.find((c) => c.id == id) || { name: "Không xác định", id: 0 }
    );
  };

  // --- DOM ELEMENTS ---
  const monthPicker = document.getElementById("monthPicker");
  const moneyDisplay = document.getElementById("money");
  const categorySelect = document.getElementById("categorySelect");
  const amountInput = document.getElementById("amountInput");
  const noteInput = document.getElementById("noteInput");
  const addTransactionBtn = document.getElementById("addTransactionBtn");
  const historyTableBody = document.getElementById("historyTableBody");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const sortSelect = document.getElementById("sortSelect");
  const logoutBtn = document.getElementById("logoutBtn");
  const accountBtn = document.querySelector(".account-btn");
  const logoutMenu = document.getElementById("logoutMenu");
  const statsTableBody = document.getElementById("statsTableBody");
  const paginationContainer = document.getElementById("pagination");
  const monthStatusFilter = document.getElementById("monthStatusFilter");

  // --- TRẠNG THÁI (STATE) ---
  let state = {
    currentPage: 1,
    rowsPerPage: 5,
    searchTerm: "",
    sortDirection: "none",
  };

  if (!monthPicker.value) {
    monthPicker.value = new Date().toISOString().slice(0, 7);
  }

  // --- LOGIC GIAO DỊCH ---
  const getTransactionsByMonth = (month) => {
    const monthKey = `${month}-30`;
    const monthlyData =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyTransactions"))) ||
      [];
    const monthEntry = monthlyData.find((item) => item.month === monthKey);
    return monthEntry ? monthEntry.transactions || [] : [];
  };

  const saveTransactions = (month, transactions) => {
    const monthKey = `${month}-30`;
    const storageKey = getStorageKey("monthlyTransactions");
    let monthlyData = JSON.parse(localStorage.getItem(storageKey)) || [];

    const index = monthlyData.findIndex((item) => item.month === monthKey);
    if (index !== -1) {
      monthlyData[index].transactions = transactions;
    } else {
      monthlyData.push({ month: monthKey, transactions });
    }
    localStorage.setItem(storageKey, JSON.stringify(monthlyData));
  };

  const updateFinancialStatus = () => {
    const month = monthPicker.value;
    const budgets =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || {};
    const totalBudget = parseFloat(budgets[month] || 0);
    const transactions = getTransactionsByMonth(month);
    const totalSpent = transactions.reduce(
      (sum, t) => sum + Number(t.total || 0),
      0,
    );
    const remaining = totalBudget - totalSpent;

    if (moneyDisplay) {
      moneyDisplay.textContent = formatMoney(remaining);
      moneyDisplay.style.color = remaining < 0 ? "#EF4444" : "#22C55E";
    }
  };

  // --- RENDER ---
  const renderHistoryTable = () => {
    const month = monthPicker.value;
    let transactions = getTransactionsByMonth(month);

    let filtered = transactions.filter((t) => {
      const categoryName = getCategoryById(t.categoryId).name.toLowerCase();
      const note = (t.description || "").toLowerCase();
      const search = state.searchTerm.toLowerCase();
      return categoryName.includes(search) || note.includes(search);
    });

    if (state.sortDirection === "asc") {
      filtered.sort((a, b) => a.total - b.total);
    } else if (state.sortDirection === "desc") {
      filtered.sort((a, b) => b.total - a.total);
    }

    const totalRows = filtered.length;
    const maxPage = Math.ceil(totalRows / state.rowsPerPage) || 1;
    if (state.currentPage > maxPage) state.currentPage = maxPage;

    const startIndex = (state.currentPage - 1) * state.rowsPerPage;
    const visibleRows = filtered.slice(
      startIndex,
      startIndex + state.rowsPerPage,
    );

    historyTableBody.innerHTML = "";
    if (visibleRows.length === 0) {
      historyTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Không có giao dịch phù hợp.</td></tr>`;
    } else {
      visibleRows.forEach((t, index) => {
        const category = getCategoryById(t.categoryId);
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="text-center">${startIndex + index + 1}</td>
          <td>${category.name}</td>
          <td>${formatMoney(t.total)}</td>
          <td>${t.description || ""}</td>
          <td class="text-center">
            <button class="btn-icon btn-delete" data-id="${t.id}"><img src="../assets/icons/Vector (13).png" alt=""></button>
          </td>
        `;
        historyTableBody.appendChild(row);
      });
    }
    renderPagination(totalRows);
    renderStatsTable();
    updateFinancialStatus();
  };

  const renderCategoryOptions = () => {
    const categories =
      JSON.parse(localStorage.getItem(getStorageKey("categories"))) || [];
    categorySelect.innerHTML = "<option value=''>Danh mục chi tiêu</option>";
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  };
  // --- HÀM RENDER PHÂN TRANG ---
  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / state.rowsPerPage) || 1;
    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";

    // Nút Quay lại (Back)
    const prevBtn = document.createElement("button");
    prevBtn.className = "page-item";
    prevBtn.innerHTML = `<img src="../assets/images/arrow left.png" alt="">`;
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.onclick = () => {
      state.currentPage--;
      renderHistoryTable();
    };
    paginationContainer.appendChild(prevBtn);

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.className = `page-item ${state.currentPage === i ? "active" : ""}`;
      pageBtn.textContent = i;
      pageBtn.onclick = () => {
        state.currentPage = i;
        renderHistoryTable();
      };
      paginationContainer.appendChild(pageBtn);
    }

    // Nút Tiếp theo (Next)
    const nextBtn = document.createElement("button");
    nextBtn.className = "page-item";
    nextBtn.innerHTML = `<img src="../assets/images/arrow right.png" alt="">`;
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.onclick = () => {
      state.currentPage++;
      renderHistoryTable();
    };
    paginationContainer.appendChild(nextBtn);
  };

  // --- HÀM RENDER BẢNG THỐNG KÊ CHI TIÊU ---
  const renderStatsTable = () => {
    const budgets =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyBudgets"))) || {};
    const monthlyData =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyTransactions"))) ||
      [];
    const filterValue = monthStatusFilter ? monthStatusFilter.value : "all";

    // Lấy danh sách các tháng từ cả Budget và Transactions
    const allMonths = [
      ...new Set([
        ...Object.keys(budgets),
        ...monthlyData.map((d) => d.month.replace("-30", "")),
      ]),
    ];

    statsTableBody.innerHTML = "";

    // Sắp xếp tháng mới nhất lên đầu
    allMonths
      .sort()
      .reverse()
      .forEach((m) => {
        const budget = parseFloat(budgets[m] || 0);
        const transactions = getTransactionsByMonth(m);
        const totalSpent = transactions.reduce(
          (sum, t) => sum + Number(t.total),
          0,
        );

        const isAchieved = totalSpent <= budget && budget > 0;
        const statusText = isAchieved ? "Đạt" : "Không đạt";
        const statusClass = isAchieved
          ? "badge-achieved"
          : "badge-not-achieved";

        // Lọc theo trạng thái
        if (filterValue === "achieved" && !isAchieved) return;
        if (filterValue === "notAchieved" && isAchieved) return;

        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${m}</td>
        <td>${formatMoney(budget)}</td>
        <td>${formatMoney(totalSpent)}</td>
        <td class="text-center">
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
      `;
        statsTableBody.appendChild(row);
      });
  };

  // --- XỬ LÝ SỰ KIỆN (EVENTS) ---

  // 1. Thêm giao dịch (CÓ KIỂM TRA HẠN MỨC DANH MỤC)
  addTransactionBtn.onclick = () => {
    const amount = parseFloat(amountInput.value);
    const categoryId = categorySelect.value;
    const note = noteInput.value.trim();
    const month = monthPicker.value;
    const monthKey = `${month}-30`;

    if (!amount || amount <= 0 || !categoryId) {
      showToast("Vui lòng nhập đủ số tiền và danh mục!");
      return;
    }

    // --- KIỂM TRA GIỚI HẠN TỪ CATEGORY.JS ---
    const monthlyCategories =
      JSON.parse(localStorage.getItem(getStorageKey("monthlyCategories"))) ||
      [];
    const currentMonthCat = monthlyCategories.find(
      (item) => item.month === monthKey,
    );

    if (!currentMonthCat) {
      showToast("Vui lòng thiết lập danh mục chi tiêu cho tháng này trước!");
      return;
    }

    const catConfig = currentMonthCat.categories.find(
      (c) => c.categoryId == categoryId,
    );
    if (!catConfig) {
      showToast("Danh mục này chưa được cấp ngân sách trong tháng!");
      return;
    }

    const limit = parseFloat(catConfig.budget);
    let transactions = getTransactionsByMonth(month);

    // Tính tổng đã tiêu của danh mục này
    const alreadySpent = transactions
      .filter((t) => t.categoryId == categoryId)
      .reduce((sum, t) => sum + Number(t.total), 0);

    if (alreadySpent + amount > limit) {
      const remaining = limit - alreadySpent;
      showToast(
        `Vượt hạn mức! Bạn chỉ còn được chi thêm ${formatMoney(remaining)} cho mục này.`,
      );
      amountInput.focus();
      return; // Chặn thêm giao dịch
    }

    // --- LƯU GIAO DỊCH NẾU HỢP LỆ ---
    const newTransaction = {
      id: Date.now(),
      categoryId: categoryId,
      total: amount,
      description: note,
    };

    transactions.push(newTransaction);
    saveTransactions(month, transactions);

    amountInput.value = "";
    noteInput.value = "";
    showToast("Đã thêm giao dịch thành công!");
    renderHistoryTable();
  };

  // 2. Xóa giao dịch
  historyTableBody.onclick = (e) => {
    if (e.target.closest(".btn-delete")) {
      if (!confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
      const id = e.target.closest(".btn-delete").dataset.id;
      const month = monthPicker.value;
      let transactions = getTransactionsByMonth(month);
      transactions = transactions.filter((t) => t.id != id);
      saveTransactions(month, transactions);
      renderHistoryTable();
    }
  };

  // 3. Các sự kiện Filter/Search
  searchBtn.onclick = () => {
    state.searchTerm = searchInput.value.trim();
    state.currentPage = 1;
    renderHistoryTable();
  };

  sortSelect.onchange = (e) => {
    state.sortDirection = e.target.value;
    renderHistoryTable();
  };

  monthPicker.onchange = () => {
    state.currentPage = 1;
    renderHistoryTable();
  };

  // 4. Logout logic
  if (accountBtn) {
    accountBtn.onclick = (e) => {
      e.stopPropagation();
      logoutMenu.classList.toggle("hidden");
    };
  }
  document.addEventListener("click", () => logoutMenu?.classList.add("hidden"));

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      if (confirm("Bạn có chắc muốn đăng xuất?")) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authUser");
        window.location.href = "./login.html";
      }
    };
  }

  renderCategoryOptions();
  renderHistoryTable();
  // --- SỰ KIỆN LỌC TRẠNG THÁI THỐNG KÊ ---
  if (monthStatusFilter) {
    monthStatusFilter.onchange = renderStatsTable;
  }
});
