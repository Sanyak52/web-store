const tg = window.Telegram.WebApp;
tg.expand();

// 🔹 URL твоего backend
const API_URL = "https://YOUR_BACKEND_DOMAIN/order";

// 🔹 Список товаров (можно хранить прямо тут)
const products = [
  { id: 1, name: "Айфон 15" },
  { id: 2, name: "AirPods Pro" },
  { id: 3, name: "MacBook Air" }
];

let selectedProducts = [];

// Рендер товаров
const container = document.getElementById("products");

products.forEach(p => {
  const div = document.createElement("div");
  div.className = "product";

  const title = document.createElement("span");
  title.textContent = p.name;

  const btn = document.createElement("button");
  btn.textContent = "Выбрать";

  btn.onclick = () => {
    if (selectedProducts.includes(p.name)) {
      selectedProducts = selectedProducts.filter(x => x !== p.name);
      btn.classList.remove("selected");
      btn.textContent = "Выбрать";
    } else {
      selectedProducts.push(p.name);
      btn.classList.add("selected");
      btn.textContent = "Выбрано";
    }
  };

  div.appendChild(title);
  div.appendChild(btn);
  container.appendChild(div);
});

// Отправка заказа
document.getElementById("orderBtn").onclick = () => {
  if (selectedProducts.length === 0) {
    tg.showAlert("Выберите хотя бы один товар");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      products: selectedProducts,
      user: tg.initDataUnsafe.user,
      initData: tg.initData
    })
  })
  .then(() => {
    tg.showAlert("✅ Заказ отправлен");
    selectedProducts = [];
  })
  .catch(() => {
    tg.showAlert("❌ Ошибка отправки");
  });
};
