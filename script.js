// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins) || coins < 0) coins = 100;

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let cases = [];
let currentCase = null;
let coinflipRunning = false; // prevents double win/lose

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {

  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
  populateCoinflipDropdown();

  const sellAllBtn = document.getElementById("sell-all-btn");
  if (sellAllBtn) sellAllBtn.onclick = sellAllItems;

  const addBtn = document.getElementById("add-coins-btn");
  if (addBtn) addBtn.onclick = () => {
    coins += 0.10;
    updateCoins();
  };

  const removeBtn = document.getElementById("remove-coins-btn");
  if (removeBtn) removeBtn.onclick = () => {
    coins = Math.max(0, coins - 5);
    updateCoins();
  };

  const coinBtn = document.getElementById("coinflip-btn");
  if (coinBtn) {
    coinBtn.onclick = () => {
      if (coinflipRunning) return;

      const select = document.getElementById("coinflip-select");
      const index = parseInt(select.value);
      if (!isNaN(index)) coinflipItem(index);
    };
  }

  const openBtn = document.getElementById("open-btn");
  if (openBtn) openBtn.onclick = openCase;
});

// ===================== COINS =====================
function updateCoins() {
  const coinEl = document.getElementById("coins");
  if (coinEl) coinEl.textContent = `Balance: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function renderInventory() {
  const container = document.getElementById("inventory");
  if (!container) return;

  container.innerHTML = "";

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity?.toLowerCase() || ""}`;

    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price} coins</small>
      <button class="sell-btn theme-btn">Sell</button>
    `;

    const sellBtn = div.querySelector(".sell-btn");
    if (sellBtn) {
      sellBtn.onclick = () => sellItem(index);
    }

    container.appendChild(div);
  });
}

function sellItem(index) {
  if (!inventory[index]) return;

  coins += inventory[index].price;
  inventory.splice(index, 1);

  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();
}

function sellAllItems() {
  if (inventory.length === 0) return;

  const total = inventory.reduce((sum, i) => sum + i.price, 0);
  coins += total;
  inventory = [];

  saveInventory();
  updateCoins();
  renderInventory();
  populateCoinflipDropdown();

  alert(`Sold everything for ${total.toFixed(2)} coins.`);
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const container = document.getElementById("top-drops");
  if (!container) return;

  container.innerHTML = "";

  [...recentDrops]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .forEach(item => {
      const div = document.createElement("div");
      div.className = `top-drop ${item.rarity?.toLowerCase() || ""}`;
      div.innerHTML = `
        <img src="${item.image}">
        <p>${item.name}</p>
        <strong>${item.price} coins</strong>
      `;
      container.appendChild(div);
    });
}

// ===================== COINFLIP =====================
function populateCoinflipDropdown() {
  const select = document.getElementById("coinflip-select");
  if (!select) return;

  select.innerHTML = "";

  if (inventory.length === 0) {
    select.innerHTML = `<option>No items available</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;

  inventory.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.name} (${item.price} coins)`;
    select.appendChild(option);
  });
}

function coinflipItem(index) {
  if (!inventory[index]) return;

  coinflipRunning = true;

  const item = inventory[index];
  const coin = document.getElementById("coin");
  const win = Math.random() < 0.5;

  if (coin) {
    const rotations = 6;
    const finalDeg = 360 * rotations + (win ? 0 : 180);
    coin.style.transition = "transform 2s ease-out";
    coin.style.transform = `rotateY(${finalDeg}deg)`;
  }

  setTimeout(() => {

    if (win) {
      inventory.push({ ...item });
      alert(`You WON! ${item.name} duplicated.`);
    } else {
      inventory.splice(index, 1);
      alert(`You LOST! ${item.name} removed.`);
    }

    saveInventory();
    renderInventory();
    populateCoinflipDropdown();

    coinflipRunning = false;

  }, 2000);
}

// ===================== CASE SYSTEM =====================
function loadCases() {
  fetch("data/cases.json")
    .then(res => res.json())
    .then(data => {
      cases = data.cases || [];
      const select = document.getElementById("case-select");
      if (!select || cases.length === 0) return;

      select.innerHTML = "";

      cases.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = `${c.name} (${c.price} coins)`;
        select.appendChild(option);
      });

      select.onchange = () => selectCase(select.value);
      selectCase(cases[0].id);
    });
}

function selectCase(id) {
  currentCase = cases.find(c => c.id === id);
  if (!currentCase) return;

  const img = document.getElementById("case-image");
  const name = document.getElementById("case-name");
  const btn = document.getElementById("open-btn");

  if (img) img.src = currentCase.image;
  if (name) name.textContent = currentCase.name;
  if (btn) btn.textContent = `Open for ${currentCase.price} Coins`;
}

function openCase() {
  if (!currentCase) return;
  if (coins < currentCase.price) return alert("Not enough coins.");

  coins -= currentCase.price;
  updateCoins();

  const winningItem = getRandomItem(currentCase.items);
  spinToItem(winningItem);
}

function getRandomItem(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }

  return items[0];
}

// ===================== SPINNER =====================
function spinToItem(winningItem) {
  const strip = document.getElementById("spinner-strip");
  const container = document.getElementById("spinner-container");
  if (!strip || !container) return;

  strip.innerHTML = "";

  const slots = 50;
  const winnerIndex = 38;

  for (let i = 0; i < slots; i++) {
    let item = currentCase.items[
      Math.floor(Math.random() * currentCase.items.length)
    ];

    if (i === winnerIndex) item = winningItem;

    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity?.toLowerCase() || ""}`;
    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  }

  const itemWidth = strip.children[0].offsetWidth + 30;
  const containerWidth = container.offsetWidth;

  const offset =
    -(winnerIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

  strip.style.transition = "none";
  strip.style.transform = "translateX(0)";
  strip.offsetHeight;

  strip.style.transition = "transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => showWinner(winningItem), 3200);
}

function showWinner(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();

  saveInventory();
  renderInventory();
  renderTopDrops();
  populateCoinflipDropdown();

  const winnerBox = document.getElementById("winner-name");
  if (winnerBox) {
    winnerBox.textContent = item.name;
    winnerBox.className = item.rarity?.toLowerCase() || "";
  }
}
