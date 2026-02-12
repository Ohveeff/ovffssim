// ================= COINS (CENTS SYSTEM) =================
let coins = parseInt(localStorage.getItem("coins")) || 100000; // = 1000.00
updateCoins();

function formatCoins(c) {
  return (c / 100).toFixed(2);
}

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${formatCoins(coins)}`;
  localStorage.setItem("coins", coins);
}

// ================= INVENTORY =================
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];

function saveData() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function addToInventory(item) {
  inventory.push(item);
  saveData();
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";
  inventory.forEach((i, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${i.rarity.toLowerCase()}`;
    div.innerHTML = `
      <img src="${i.image}">
      <p>${i.name}</p>
      <small>${formatCoins(i.price)} coins</small><br>
      <button class="sell-btn">Sell</button>
    `;
    div.querySelector(".sell-btn").onclick = () => {
      coins += i.price;
      inventory.splice(index, 1);
      updateCoins();
      saveData();
      renderInventory();
    };
    inv.appendChild(div);
  });
}
renderInventory();

// ================= UI BUTTONS =================
document.getElementById("toggle-inv-btn").onclick =
  () => document.getElementById("inventory").classList.toggle("hidden");

document.getElementById("add-coins-btn").onclick = () => {
  coins += 5000;
  updateCoins();
};

document.getElementById("remove-coins-btn").onclick = () => {
  coins = Math.max(0, coins - 5000);
  updateCoins();
};

// ================= CASE DATA =================
let caseDataList = [];
let caseData;

fetch("data/cases.json")
  .then(r => r.json())
  .then(d => {
    caseDataList = d.cases;
    populateCaseSelect();
    selectCase(caseDataList[0].id);
  });

function populateCaseSelect() {
  const select = document.getElementById("case-select");
  select.innerHTML = "";
  caseDataList.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.name;
    select.appendChild(o);
  });
  select.onchange = () => selectCase(select.value);
  document.getElementById("show-select-btn").onclick =
    () => select.classList.toggle("hidden");
}

function selectCase(id) {
  caseData = caseDataList.find(c => c.id === id);
  document.getElementById("case-name").textContent = caseData.name;
  document.getElementById("case-image").src = caseData.image;
  document.getElementById("open-btn").textContent =
    `Open for ${formatCoins(caseData.price)} coins`;
}

// ================= RNG =================
function weightedRandom(items) {
  let total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (let i of items) {
    if (r < i.weight) return i;
    r -= i.weight;
  }
}

// ================= SPINNER =================
let lastWonDiv = null;

function buildSpinner(win) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  // VISUAL POOL (better feel)
  const visualPool = [];
  caseData.items.forEach(i => {
    const count = Math.max(1, Math.floor(i.weight / 100));
    for (let x = 0; x < count; x++) visualPool.push(i);
  });

  const arr = [];
  for (let i = 0; i < 12; i++) visualPool.forEach(v => arr.push(v));

  const winIndex = arr.length - 15;
  arr[winIndex] = win;

  arr.forEach(i => {
    const div = document.createElement("div");
    div.className = `spinner-item ${i.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${i.image}">`;
    strip.appendChild(div);
  });

  const itemWidth = strip.querySelector(".spinner-item").offsetWidth + 20;
  const dist = itemWidth * winIndex;

  if (lastWonDiv) lastWonDiv.classList.remove("highlight-won");

  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  requestAnimationFrame(() => {
    strip.style.transition = "transform 11s cubic-bezier(.25,.1,.25,1)";
    strip.style.transform = `translateX(-${dist}px)`;
  });

  setTimeout(() => {
    const d = strip.children[winIndex];
    if (d) {
      d.classList.add("highlight-won");
      lastWonDiv = d;
    }
  }, 11000);
}

// ================= OPEN BUTTON =================
document.getElementById("open-btn").onclick = () => {
  if (!caseData) return;
  if (coins < caseData.price) return;

  coins -= caseData.price;
  updateCoins();

  const won = weightedRandom(caseData.items);
  buildSpinner(won);

  setTimeout(() => {
    document.getElementById("winner-name").textContent =
      `You won: ${won.name}`;
    addToInventory(won);
    addRecentDrop(won);
  }, 11000);
};

// ================= TOP DROPS =================
function addRecentDrop(i) {
  recentDrops.push(i);
  if (recentDrops.length > 20) recentDrops.shift();
  saveData();
  renderTopDrops();
}

function renderTopDrops() {
  const c = document.getElementById("top-drops");
  c.innerHTML = "";
  [...recentDrops]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .forEach(i => {
      const d = document.createElement("div");
      d.className = `top-drop ${i.rarity.toLowerCase()}`;
      d.innerHTML = `
        <img src="${i.image}">
        <p>${i.name}</p>
        <strong>${formatCoins(i.price)} coins</strong>
      `;
      c.appendChild(d);
    });
}
renderTopDrops();
