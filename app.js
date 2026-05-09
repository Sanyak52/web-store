const tg = window.Telegram.WebApp;
tg.expand();

// Токен бота и URL для отправки сообщений через Telegram Bot API
const BOT_TOKEN = "8438057137:AAGmmKOr2QAVDEE0OQ9MX-PjzGvv8vCQlIg";
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
const CHAT_ID = "8387891092"; // chat_id, куда приходят заказы

// Запасное фото, если images/product.jpg не найден
const FALLBACK_IMAGE = "https://picsum.photos/400/400?random=1";

// Цвета для перекрашивания товара на изображении
const COLOR_MAP = {
  white: '#f5f5f5',
  blue: '#1E3A8A',
  red: '#DC143C',
  green: '#228B22',
  gray: '#666666',
  gold: '#D4AF37'
};

let selectedColor = 'white';
let customText = '';
let isCustomTextEnabled = false;

const mainImage = document.getElementById('mainImage');
const productCanvas = document.getElementById('productCanvas');

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

// Красим пластиковые части (тёмный пластик) и слева, и справа. Металлические детали (более светлые) не трогаем.
function tintProduct(ctx, w, h, colorKey) {
  const baseHex = COLOR_MAP[colorKey] || COLOR_MAP.white;
  const { r: tr, g: tg, b: tb } = hexToRgb(baseHex);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 10) continue;

    const light = 0.299 * r + 0.587 * g + 0.114 * b;
    // очень светлые (фон, болты, явный металл) — пропускаем
    if (light > 210) continue;

    const mix = 0.75;
    data[i]     = tr * mix + r * (1 - mix);
    data[i + 1] = tg * mix + g * (1 - mix);
    data[i + 2] = tb * mix + b * (1 - mix);
  }

  ctx.putImageData(imageData, 0, 0);
}

  // Рисует фото товара на canvas и перекрашивает его
function drawProductCanvas() {
  if (!mainImage.complete || mainImage.naturalWidth === 0) return;

  const sourceW = mainImage.naturalWidth;
  const sourceH = mainImage.naturalHeight;

  // Используем всю картинку целиком, ничего не обрезаем,
  // чтобы полностью был виден левый и правый вид сляйда
  const w = sourceW;
  const h = sourceH;
  productCanvas.width = w;
  productCanvas.height = h;

  const ctx = productCanvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(mainImage, 0, 0, w, h);

  // Цвет берётся из отдельного файла изображения для каждого цвета
}

mainImage.addEventListener('load', drawProductCanvas);
mainImage.addEventListener('error', () => {
  mainImage.src = FALLBACK_IMAGE;
});

// Обработка выбора цвета
document.querySelectorAll('.color-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    selectedColor = option.dataset.color;
    const imagePath = option.dataset.image;
    if (imagePath && mainImage.getAttribute('src') !== imagePath) {
      mainImage.src = imagePath;
    }
    updatePrice();
    drawProductCanvas();
  });
});

// Функция обновления цены
function updatePrice() {
  const priceAddon = document.getElementById('priceAddon');
  const isPremiumColor = ['gold', 'gray'].includes(selectedColor);
  
  let additionalCost = 0;
  if (isPremiumColor) additionalCost += 578;
  if (isCustomTextEnabled && customText.length > 0) additionalCost += 583;
  
  if (additionalCost > 0) {
    priceAddon.textContent = '+' + additionalCost;
  } else {
    priceAddon.textContent = '';
  }
}

// Выбираем первый цвет по умолчанию
document.querySelector('.color-option').classList.add('selected');

// Обработка чекбокса именной надписи
const customTextCheck = document.getElementById('customTextCheck');
const customTextInput = document.getElementById('customTextInput');

customTextCheck.addEventListener('change', () => {
  isCustomTextEnabled = customTextCheck.checked;
  customTextInput.disabled = !isCustomTextEnabled;
  
  if (!isCustomTextEnabled) {
    customTextInput.value = '';
    customText = '';
  }
  
  updatePrice();
  drawProductCanvas();
});

customTextInput.addEventListener('input', () => {
  customText = customTextInput.value;
  const charLimit = document.getElementById('charLimit');
  
  if (customText.length === 0) {
    charLimit.textContent = 'Строка должна содержать не более 30 символов';
    charLimit.className = 'char-limit';
  } else if (customText.length > 30) {
    charLimit.textContent = 'Превышен лимит символов';
    charLimit.className = 'char-limit error';
  } else {
    charLimit.textContent = 'Строка должна содержать не более 30 символов';
    charLimit.className = 'char-limit active';
  }
  
  updatePrice();
  drawProductCanvas();
});

// Отправка заказа
document.getElementById('orderBtn').addEventListener('click', () => {
  const contactModal = document.getElementById('contactModal');
  contactModal.style.display = 'flex';
});

// Обработка модального окна
const phoneInput = document.getElementById('phoneInput');
const telegramInput = document.getElementById('telegramInput');
const continueBtn = document.getElementById('continueBtn');

function updateContinueButton() {
  if (telegramInput.value.trim().length > 0) {
    continueBtn.classList.add('active');
    continueBtn.classList.remove('disabled');
  } else {
    continueBtn.classList.remove('active');
    continueBtn.classList.add('disabled');
  }
}

telegramInput.addEventListener('input', updateContinueButton);
phoneInput.addEventListener('input', updateContinueButton);

continueBtn.addEventListener('click', () => {
  console.log('Continue button clicked');
  if (continueBtn.classList.contains('active')) {
    console.log('Button is active, sending order');
    
    const message = `🛒 *Новый заказ*\n\n` +
      `📦 Товар: Сляйд для байдарки\n` +
      `🎨 Цвет: ${selectedColor}\n` +
      `📝 Надпись: ${isCustomTextEnabled && customText ? customText : 'Нет'}\n` +
      `📞 Телефон: ${phoneInput.value}\n` +
      `💬 Telegram: ${telegramInput.value}`;

    const orderData = {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    };

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Response:', data);
      if (data.ok) {
        showSuccessPage();
        document.getElementById('contactModal').style.display = 'none';
      } else {
        console.error('Bot error:', data);
        alert('❌ Ошибка отправки');
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      alert('❌ Ошибка отправки');
    });
  } else {
    console.log('Button is not active');
  }
});

// Функция показа страницы успешного заказа
function showSuccessPage() {
  const orderDetails = document.getElementById('orderDetails');
  const totalCost = 8999 + ((['gold', 'gray'].includes(selectedColor)) ? 578 : 0) + ((isCustomTextEnabled && customText.length > 0) ? 583 : 0);
  
  orderDetails.innerHTML = `
    📦 Товар: Сляйд для байдарки<br>
    🎨 Цвет: ${selectedColor}<br>
    📝 Надпись: ${isCustomTextEnabled && customText ? customText : 'Нет'}<br>
    💰 Итого: ₽${totalCost}
  `;
  
  document.getElementById('successPage').style.display = 'flex';
}

// Обработка кнопки нового заказа
document.getElementById('newOrderBtn').addEventListener('click', () => {
  document.getElementById('successPage').style.display = 'none';
  document.getElementById('phoneInput').value = '';
  document.getElementById('telegramInput').value = '';
  document.getElementById('customTextInput').value = '';
  document.getElementById('customTextCheck').checked = false;
  customText = '';
  isCustomTextEnabled = false;
  customTextInput.disabled = true;
  updatePrice();
  drawProductCanvas();
});

// Закрытие модального окна при клике вне его
document.getElementById('contactModal').addEventListener('click', (e) => {
  if (e.target.id === 'contactModal') {
    document.getElementById('contactModal').style.display = 'none';
  }
});
