const categories = [
  { id: 1, name: "Tiền đi chơi", limit: 100000 },
  { id: 2, name: "Tiền đi học", limit: 120000 },
  { id: 3, name: "Tiền cà phê", limit: 80000 },
  { id: 4, name: "Tiền cho con", limit: 150000 },
  { id: 5, name: "Tiền ăn", limit: 90000 },
  { id: 6, name: "Tiền xăng", limit: 110000 },
];

const monthlySummaries = [
  { month: "September 2025", budget: 500000, spent: 420000 },
  { month: "October 2025", budget: 600000, spent: 620000 },
  { month: "November 2025", budget: 550000, spent: 490000 },
  { month: "December 2025", budget: 650000, spent: 680000 },
];

let transactions = [
  { id: 1, createdDate: "2025-09-02", total: 150000, description: "Đi chơi sapa", categoryId: 1 },
  { id: 2, createdDate: "2025-09-05", total: 120000, description: "Học online", categoryId: 2 },
  { id: 3, createdDate: "2025-09-08", total: 90000, description: "Đi uống nước", categoryId: 3 },
  { id: 4, createdDate: "2025-09-12", total: 160000, description: "Mua bỉm sữa", categoryId: 4 },
  { id: 5, createdDate: "2025-09-18", total: 95000, description: "Ăn trưa", categoryId: 5 },
  { id: 6, createdDate: "2025-10-02", total: 130000, description: "Đổ xăng", categoryId: 6 },
  { id: 7, createdDate: "2025-10-08", total: 140000, description: "Đi cafe cùng bạn", categoryId: 3 },
  { id: 8, createdDate: "2025-10-14", total: 155000, description: "Mua sách", categoryId: 2 },
  { id: 9, createdDate: "2025-10-20", total: 200000, description: "Tổ chức sinh nhật", categoryId: 1 },
  { id: 10, createdDate: "2025-10-28", total: 87000, description: "Ăn tối gia đình", categoryId: 5 },
];

const state = {
  currentPage: 1,
  rowsPerPage: 5,
  searchTerm: "",
  sortDirection: "none",
  monthFilter: "all",
};

function formatMoney(value) {
  return value.toLocaleString("vi-VN") + " ₫";
}

function getCategoryById(id) {
  return categories.find((item) => item.id === id) || { name: "Khác", limit: 0 };
}

function renderCategoryOptions() {
  const categorySelect = document.getElementById("categorySelect");
  if (!categorySelect) return;
  categorySelect.innerHTML = "<option value=''>Danh mục chi tiêu</option>";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

function getFilteredTransactions() {
  const filtered = transactions.filter((transaction) => {
    const category = getCategoryById(transaction.categoryId).name;
    const searchText = state.searchTerm.trim().toLowerCase();
    if (!searchText) return true;
    return (
      category.toLowerCase().includes(searchText) ||
      transaction.description.toLowerCase().includes(searchText)
    );
  });

  if (state.sortDirection === "asc") {
    filtered.sort((a, b) => a.total - b.total);
  } else if (state.sortDirection === "desc") {
    filtered.sort((a, b) => b.total - a.total);
  }

  return filtered;
}

function renderHistoryTable() {
  const tableBody = document.getElementById("historyTableBody");
  const pagination = document.getElementById("pagination");
  if (!tableBody || !pagination) return;

  const filtered = getFilteredTransactions();
  const totalRows = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / state.rowsPerPage));
  if (state.currentPage > pageCount) state.currentPage = pageCount;

  const startIndex = (state.currentPage - 1) * state.rowsPerPage;
  const visibleRows = filtered.slice(startIndex, startIndex + state.rowsPerPage);

  tableBody.innerHTML = "";
  if (visibleRows.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td class="text-center" colspan="5">Không có giao dịch phù hợp.</td>`;
    tableBody.appendChild(emptyRow);
  } else {
    visibleRows.forEach((transaction, index) => {
      const category = getCategoryById(transaction.categoryId);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="text-center">${startIndex + index + 1}</td>
        <td>${category.name}</td>
        <td>${formatMoney(transaction.total)}</td>
        <td>${transaction.description}</td>
        <td class="text-center">
          <button class="btn-icon btn-delete" data-id="${transaction.id}" title="Xóa giao dịch">
            <img src="../assets/icons/Vector (13).png" alt="Xóa" />
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  renderPagination(pageCount);
  updateWarningCard();
}

function renderPagination(pageCount) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;
  pagination.innerHTML = "";

  const createButton = (content, page, disabled = false, active = false) => {
    const button = document.createElement("button");
    button.className = "page-item" + (active ? " active" : "");
    button.disabled = disabled;
    button.innerHTML = content;
    button.addEventListener("click", () => {
      state.currentPage = page;
      renderHistoryTable();
    });
    return button;
  };

  pagination.appendChild(createButton("<", Math.max(1, state.currentPage - 1), state.currentPage === 1));

  for (let i = 1; i <= pageCount; i += 1) {
    pagination.appendChild(createButton(i, i, false, i === state.currentPage));
  }

  pagination.appendChild(createButton(">", Math.min(pageCount, state.currentPage + 1), state.currentPage === pageCount));
}

function renderMonthlyStats() {
  const statsBody = document.getElementById("statsTableBody");
  if (!statsBody) return;

  const filteredStats = monthlySummaries.filter((monthData) => {
    if (state.monthFilter === "achieved") {
      return monthData.spent <= monthData.budget;
    }
    if (state.monthFilter === "notAchieved") {
      return monthData.spent > monthData.budget;
    }
    return true;
  });

  statsBody.innerHTML = "";

  if (filteredStats.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="4" class="text-center">Không có tháng phù hợp.</td>`;
    statsBody.appendChild(emptyRow);
    return;
  }

  filteredStats.forEach((monthData) => {
    const achieved = monthData.spent <= monthData.budget;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${monthData.month}</td>
      <td>${formatMoney(monthData.budget)}</td>
      <td>${formatMoney(monthData.spent)}</td>
      <td class="text-center"><span class="status-badge ${achieved ? "badge-achieved" : "badge-not-achieved"}">${achieved ? "Đạt" : "Không đạt"}</span></td>
    `;
    statsBody.appendChild(row);
  });
}

function updateWarningCard() {
  const warningCard = document.querySelector(".warning-card");
  const warningDesc = document.querySelector(".warning-desc");
  if (!warningCard || !warningDesc) return;

  const exceededTransaction = transactions.find((transaction) => {
    const category = getCategoryById(transaction.categoryId);
    return category.limit > 0 && transaction.total > category.limit;
  });

  if (exceededTransaction) {
    const category = getCategoryById(exceededTransaction.categoryId);
    warningDesc.textContent = `Giao dịch "${exceededTransaction.description}" vượt giới hạn ${category.name}: ${formatMoney(exceededTransaction.total)} / ${formatMoney(category.limit)}`;
    warningCard.classList.remove("hidden");
    return;
  }

  const exceededMonth = monthlySummaries.find((monthData) => monthData.spent > monthData.budget);
  if (exceededMonth) {
    warningDesc.textContent = `Tháng ${exceededMonth.month} đã vượt ngân sách: ${formatMoney(exceededMonth.spent)} / ${formatMoney(exceededMonth.budget)}`;
    warningCard.classList.remove("hidden");
    return;
  }

  warningCard.classList.add("hidden");
}

function handleSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  state.searchTerm = input.value;
  state.currentPage = 1;
  renderHistoryTable();
}

function handleSort() {
  const sortSelect = document.getElementById("sortSelect");
  if (!sortSelect) return;
  state.sortDirection = sortSelect.value;
  state.currentPage = 1;
  renderHistoryTable();
}

function handleMonthFilter() {
  const filterSelect = document.getElementById("monthStatusFilter");
  if (!filterSelect) return;
  state.monthFilter = filterSelect.value;
  renderMonthlyStats();
}

function handleDeleteTransaction(event) {
  const button = event.target.closest(".btn-delete");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (!id) return;

  const confirmDelete = confirm("Bạn có chắc muốn xóa giao dịch này?");
  if (!confirmDelete) return;

  transactions = transactions.filter((transaction) => transaction.id !== id);
  renderHistoryTable();
}

function handleAddTransaction() {
  const amountInput = document.getElementById("amountInput");
  const categorySelect = document.getElementById("categorySelect");
  const noteInput = document.getElementById("noteInput");

  if (!amountInput || !categorySelect || !noteInput) return;

  const total = Number(amountInput.value.replace(/[^0-9]/g, ""));
  const categoryId = Number(categorySelect.value);
  const description = noteInput.value.trim();

  if (!total || !categoryId || !description) {
    alert("Vui lòng nhập đầy đủ số tiền, danh mục và ghi chú.");
    return;
  }

  const newTransaction = {
    id: Date.now(),
    createdDate: new Date().toISOString().slice(0, 10),
    total,
    description,
    categoryId,
  };

  transactions.unshift(newTransaction);
  amountInput.value = "";
  categorySelect.value = "";
  noteInput.value = "";
  state.currentPage = 1;
  renderHistoryTable();
}

function initHistoryPage() {
  const accountBtn = document.querySelector(".account-btn");
  const logoutMenu = document.getElementById("logoutMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const sortSelect = document.getElementById("sortSelect");
  const monthFilter = document.getElementById("monthStatusFilter");
  const addBtn = document.getElementById("addTransactionBtn");
  const historyTable = document.querySelector(".history-table");

  if (accountBtn && logoutMenu && logoutBtn) {
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
        window.location.href = "./login.html";
      }
    });
  }

  renderCategoryOptions();
  renderHistoryTable();
  renderMonthlyStats();
  updateWarningCard();

  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }
  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", handleSort);
  }
  if (monthFilter) {
    monthFilter.addEventListener("change", handleMonthFilter);
  }
  if (addBtn) {
    addBtn.addEventListener("click", handleAddTransaction);
  }
  if (historyTable) {
    historyTable.addEventListener("click", handleDeleteTransaction);
  }
}

document.addEventListener("DOMContentLoaded", initHistoryPage);
