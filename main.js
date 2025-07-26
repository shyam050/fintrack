document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("bill-date").valueAsDate = new Date();

  initApp();

  document.getElementById("bill-form").addEventListener("submit", addBill);
  document
    .getElementById("month-filter")
    .addEventListener("change", filterBills);
});

let bills = [];

function initApp() {
  loadBills();

  updateUI();

  populateMonthFilter();
}

function loadBills() {
  const savedBills = localStorage.getItem("bills");
  if (savedBills) {
    bills = JSON.parse(savedBills);

    bills.forEach((bill) => {
      bill.date = new Date(bill.date);
    });
  }
}

function saveBills() {
  localStorage.setItem("bills", JSON.stringify(bills));
}

function addBill(event) {
  event.preventDefault();

  const name = document.getElementById("bill-name").value;
  const amount = Number.parseFloat(
    document.getElementById("bill-amount").value
  );
  const dateStr = document.getElementById("bill-date").value;
  const category = document.getElementById("bill-category").value;

  const date = new Date(dateStr);

  const newBill = {
    id: Date.now(),
    name,
    amount,
    date,
    category,
  };

  bills.push(newBill);

  saveBills();

  document.getElementById("bill-form").reset();
  document.getElementById("bill-date").valueAsDate = new Date();

  showNotification("Bill added successfully!");

  updateUI();

  populateMonthFilter();
}

function deleteBill(id) {
  bills = bills.filter((bill) => bill.id !== id);

  saveBills();

  showNotification("Bill deleted successfully!");

  updateUI();
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;

  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.backgroundColor = "var(--primary-color)";
  notification.style.color = "white";
  notification.style.padding = "12px 20px";
  notification.style.borderRadius = "8px";
  notification.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
  notification.style.zIndex = "1000";
  notification.style.opacity = "0";
  notification.style.transform = "translateY(20px)";
  notification.style.transition = "opacity 0.3s, transform 0.3s";

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  }, 10);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(20px)";

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function updateUI() {
  updateTotalAmount();

  updateMonthlyAmount();

  updateBillsList();

  updateMonthlyBreakdown();

  updateCategoryBreakdown();

  updateCounts();
}

function updateCounts() {
  document.getElementById("bill-count").textContent = bills.length;

  const uniqueCategories = new Set(bills.map((bill) => bill.category));
  document.getElementById("category-count").textContent = uniqueCategories.size;
}

function updateTotalAmount() {
  const totalAmount = bills.reduce((total, bill) => total + bill.amount, 0);
  document.getElementById("total-amount").textContent =
    totalAmount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
}

function updateMonthlyAmount() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyTotal = bills.reduce((total, bill) => {
    if (
      bill.date.getMonth() === currentMonth &&
      bill.date.getFullYear() === currentYear
    ) {
      return total + bill.amount;
    }
    return total;
  }, 0);

  document.getElementById("month-amount").textContent =
    monthlyTotal.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
}

function updateBillsList() {
  const billsList = document.getElementById("bills-list");
  const noBillsMessage = document.getElementById("no-bills-message");

  billsList.innerHTML = "";

  const monthFilter = document.getElementById("month-filter").value;

  let filteredBills = bills;
  if (monthFilter !== "all") {
    const [year, month] = monthFilter.split("-");
    filteredBills = bills.filter((bill) => {
      return (
        bill.date.getFullYear() === Number.parseInt(year) &&
        bill.date.getMonth() === Number.parseInt(month) - 1
      );
    });
  }

  filteredBills.sort((a, b) => b.date - a.date);

  if (filteredBills.length === 0) {
    noBillsMessage.style.display = "block";
  } else {
    noBillsMessage.style.display = "none";

    filteredBills.forEach((bill) => {
      const row = document.createElement("tr");

      const formattedDate = formatDate(bill.date);

      const categoryIcon = getCategoryIcon(bill.category);

      row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${bill.name}</td>
                <td><i class="${categoryIcon}"></i> ${bill.category}</td>
                <td>${bill.amount.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}</td>
                <td>
                    <button class="btn-delete" onclick="deleteBill(${bill.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;

      billsList.appendChild(row);
    });
  }
}

function getCategoryIcon(category) {
  const icons = {
    Food: "fas fa-utensils",
    Housing: "fas fa-home",
    Transportation: "fas fa-car",
    Utilities: "fas fa-bolt",
    Entertainment: "fas fa-film",
    Healthcare: "fas fa-medkit",
    Other: "fas fa-shopping-bag",
  };

  return icons[category] || "fas fa-tag";
}

function updateMonthlyBreakdown() {
  const monthlyChart = document.getElementById("monthly-chart");
  monthlyChart.innerHTML = "";

  const monthlyTotals = {};

  bills.forEach((bill) => {
    const year = bill.date.getFullYear();
    const month = bill.date.getMonth();
    const key = `${year}-${month}`;

    if (!monthlyTotals[key]) {
      monthlyTotals[key] = {
        year,
        month,
        total: 0,
      };
    }

    monthlyTotals[key].total += bill.amount;
  });

  const sortedMonths = Object.values(monthlyTotals).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });

  const recentMonths = sortedMonths.slice(0, 6).reverse();

  const maxAmount = Math.max(...recentMonths.map((m) => m.total), 1);

  if (recentMonths.length > 0) {
    recentMonths.forEach((monthData) => {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const barWidth = (monthData.total / maxAmount) * 100;
      const monthName = monthNames[monthData.month];
      const monthLabel = `${monthName.substring(0, 3)} ${monthData.year}`;

      const monthBarContainer = document.createElement("div");
      monthBarContainer.className = "month-bar-container";

      monthBarContainer.innerHTML = `
                <div class="month-label">${monthLabel}</div>
                <div class="month-bar-wrapper">
                    <div class="month-bar" style="width: ${barWidth}%"></div>
                </div>
                <div class="month-amount">${monthData.total.toLocaleString(
                  "en-IN",
                  {
                    style: "currency",
                    currency: "INR",
                  }
                )}</div>
            `;

      monthlyChart.appendChild(monthBarContainer);
    });
  } else {
    const message = document.createElement("p");
    message.textContent = "No monthly data available yet.";
    message.style.textAlign = "center";
    message.style.color = "var(--text-light)";
    message.style.padding = "2rem";
    message.style.marginTop = "2rem";

    monthlyChart.appendChild(message);
  }
}

function updateCategoryBreakdown() {
  const categoryChart = document.getElementById("category-chart");
  categoryChart.innerHTML = "";

  const categoryTotals = {};

  bills.forEach((bill) => {
    if (!categoryTotals[bill.category]) {
      categoryTotals[bill.category] = 0;
    }

    categoryTotals[bill.category] += bill.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const categoryColors = {
    Food: "#f97316",
    Housing: "#8b5cf6",
    Transportation: "#14b8a6",
    Utilities: "#f59e0b",
    Entertainment: "#ec4899",
    Healthcare: "#06b6d4",
    Other: "#6366f1",
  };

  if (sortedCategories.length > 0) {
    sortedCategories.forEach((item) => {
      const categoryItem = document.createElement("div");
      categoryItem.className = "category-item";

      const color = categoryColors[item.category] || "#6366f1";

      categoryItem.innerHTML = `
                <div class="category-color" style="background-color: ${color}"></div>
                <div class="category-name">
                    <i class="${getCategoryIcon(item.category)}"></i>
                    ${item.category}
                </div>
                <div class="category-amount">${item.total.toLocaleString(
                  "en-IN",
                  {
                    style: "currency",
                    currency: "INR",
                  }
                )}</div>
            `;

      categoryChart.appendChild(categoryItem);
    });
  } else {
    // If no data, show a message
    const message = document.createElement("p");
    message.textContent = "No category data available yet.";
    message.style.textAlign = "center";
    message.style.color = "var(--text-light)";
    message.style.padding = "2rem";
    message.style.marginTop = "2rem";

    categoryChart.appendChild(message);
  }
}

function populateMonthFilter() {
  const monthFilter = document.getElementById("month-filter");

  const currentSelection = monthFilter.value;

  while (monthFilter.options.length > 1) {
    monthFilter.remove(1);
  }

  const months = {};

  bills.forEach((bill) => {
    const year = bill.date.getFullYear();
    const month = bill.date.getMonth() + 1;
    const key = `${year}-${month.toString().padStart(2, "0")}`;

    if (!months[key]) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      months[key] = {
        value: key,
        text: `${monthNames[month - 1]} ${year}`,
      };
    }
  });

  const sortedMonths = Object.values(months).sort((a, b) => {
    return b.value.localeCompare(a.value);
  });

  sortedMonths.forEach((month) => {
    const option = document.createElement("option");
    option.value = month.value;
    option.textContent = month.text;
    monthFilter.appendChild(option);
  });

  if (
    Array.from(monthFilter.options).some(
      (option) => option.value === currentSelection
    )
  ) {
    monthFilter.value = currentSelection;
  }
}

function filterBills() {
  updateBillsList();
}

function formatCurrency(amount) {
  return "₹" + amount.toFixed(2);
}

function formatDate(date) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
}
