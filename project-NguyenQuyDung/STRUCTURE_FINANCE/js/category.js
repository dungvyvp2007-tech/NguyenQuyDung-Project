// 1. Dữ liệu mặc định (Nếu bạn muốn khởi tạo lần đầu, còn không thì xóa đi để dùng LocalStorage)
const defaultCategories = [
    { id: 1, name: "Tiền đi học", budget: 300000 },
    { id: 2, name: "Tiền đi chơi", budget: 500000 },
];

document.addEventListener("DOMContentLoaded", () => {
    // --- KHAI BÁO BIẾN ---
    const monthPicker = document.getElementById("monthPicker");
    const categoryNameInput = document.getElementById("categoryNameInput");
    const categoryBudgetInput = document.getElementById("categoryBudgetInput");
    const addCategoryBtn = document.getElementById("addCategoryBtn");
    const categoryWarning = document.getElementById("categoryWarning");
    const categoryContainer = document.getElementById("categoryContainer");
    const moneyDisplay = document.getElementById("money");
    let editingCategoryId = null;

    // --- LOGIC TÀI KHOẢN (DROPDOWN & LOGOUT) ---
    const accountBtn = document.querySelector(".account-btn");
    const logoutMenu = document.getElementById("logoutMenu");
    const logoutBtn = document.getElementById("logoutBtn");

    if (accountBtn && logoutMenu) {
        accountBtn.onclick = () => logoutMenu.classList.toggle("hidden");
        document.onclick = (e) => {
            if (!e.target.closest(".account-dropdown")) logoutMenu.classList.add("hidden");
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm("Bạn có chắc muốn đăng xuất không?")) {
                localStorage.removeItem("isLoggedIn");
                window.location.href = "./login.html";
            }
        };
    }

    // --- QUẢN LÝ DANH MỤC & TIỀN BẠC ---

    // Thiết lập tháng hiện tại mặc định
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    if (!monthPicker.value) monthPicker.value = currentMonth;

    // Hàm cập nhật số dư (Dùng chung Key 'monthlyBudgets' với trang Home)
    const updateRemainingMoney = (month) => {
        const budgets = JSON.parse(localStorage.getItem("monthlyBudgets")) || {};
        const categoriesData = JSON.parse(localStorage.getItem("monthlyCategories")) || {};
        
        const monthBudget = parseFloat(budgets[month] || 0);
        const monthCategories = categoriesData[month] || [];
        
        const totalSpent = monthCategories.reduce((sum, cat) => sum + Number(cat.budget || 0), 0);
        const remaining = monthBudget - totalSpent;

        if (moneyDisplay) {
            moneyDisplay.textContent = `${remaining.toLocaleString("vi-VN")} VND`;
            moneyDisplay.style.color = remaining < 0 ? "red" : "#22C55E";
        }
    };

    // Hàm hiển thị danh mục
    const renderCategories = (month) => {
        if (!month) return;
        const allData = JSON.parse(localStorage.getItem("monthlyCategories")) || {};
        const categories = allData[month] || [];

        categoryContainer.innerHTML = "";

        if (categories.length === 0) {
            categoryContainer.innerHTML = '<p style="text-align: center; color: #999; margin-top: 20px;">Chưa có danh mục nào!</p>';
            return;
        }

        categories.forEach((category) => {
            const card = document.createElement("div");
            card.className = "category-card";
            card.innerHTML = `
                <div class="card-icon"><img src="../assets/images/Frame 5.png" alt="icon"></div>
                <div class="card-text">
                    <h4>${category.name}</h4>
                    <p>${Number(category.budget).toLocaleString("vi-VN")} VND</p>
                </div>
                <div class="card-action">
                    <span class="edit-btn" title="Sửa"><img src="../assets/images/Vector (10).png" alt="edit"></span>
                    <span class="delete-btn" title="Xóa"><img src="../assets/images/Vector (11).png" alt="delete"></span>
                </div>
            `;

            // Nút sửa
            card.querySelector(".edit-btn").onclick = () => {
                categoryNameInput.value = category.name;
                categoryBudgetInput.value = category.budget;
                editingCategoryId = category.id;
                addCategoryBtn.textContent = "Lưu thay đổi";
                categoryNameInput.focus();
            };

            // Nút xóa
            card.querySelector(".delete-btn").onclick = () => {
                if (confirm(`Xóa danh mục "${category.name}"?`)) {
                    const allData = JSON.parse(localStorage.getItem("monthlyCategories")) || {};
                    allData[month] = allData[month].filter(c => c.id !== category.id);
                    localStorage.setItem("monthlyCategories", JSON.stringify(allData));
                    renderCategories(month);
                    updateRemainingMoney(month);
                }
            };

            categoryContainer.appendChild(card);
        });
    };

    // Nút Thêm danh mục
    addCategoryBtn.onclick = () => {
        const name = categoryNameInput.value.trim();
        const budget = categoryBudgetInput.value.trim();
        const month = monthPicker.value;

        if (!name || !budget || budget <= 0) {
            categoryWarning.style.display = "block";
            setTimeout(() => categoryWarning.style.display = "none", 3000);
            return;
        }

        const allData = JSON.parse(localStorage.getItem("monthlyCategories")) || {};
        if (!allData[month]) allData[month] = [];

        if (editingCategoryId !== null) {
            // Sửa
            allData[month] = allData[month].map(c => 
                c.id === editingCategoryId ? { ...c, name, budget } : c
            );
            editingCategoryId = null;
            addCategoryBtn.textContent = "Thêm danh mục";
        } else {
            // Thêm mới
            const newId = Date.now(); // Dùng timestamp làm ID để không bị trùng
            allData[month].push({ id: newId, name, budget });
        }

        localStorage.setItem("monthlyCategories", JSON.stringify(allData));
        categoryNameInput.value = "";
        categoryBudgetInput.value = "";
        renderCategories(month);
        updateRemainingMoney(month);
    };

    // Khi đổi tháng
    monthPicker.onchange = () => {
        renderCategories(monthPicker.value);
        updateRemainingMoney(monthPicker.value);
    };

    // Khởi tạo hiển thị lần đầu
    renderCategories(monthPicker.value);
    updateRemainingMoney(monthPicker.value);
});