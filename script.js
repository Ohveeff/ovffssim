// ================= COINS =================
let coins = parseFloat(localStorage.getItem("coins")) || 1000;
updateCoins();

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ================= ADMIN PASSWORD =================
const ADMIN_PASSWORD = "tf2admin"; // CHANGE THIS
let adminUnlocked = false;

function checkPassword() {
  if (adminUnlocked) return true;
  const input = prompt("Enter admin password:");
  if (input === ADMIN_PASSWORD) {
    adminUnlocked = true;
    return true;
  }
  return false;
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
      <small>${i.price.toFixed(2)} coins</small><br>
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

// Toggle inventory
document.getElementById("toggle-inv-btn").onclick = () => {
  document.getElementById("inventory").classList.toggle("hidden");
};

// ================= COIN BUTTONS (PASSWORD PROTECTED) =================
document.getElementById("add-coins-btn").onclick = () => {
  if (!checkPassword()) return alert("Wrong password!");
  coins += 50;
  updateCoins();
};

document.getElementById("remove-coins-btn").onclick = () => {
  if (!checkPassword()) return alert("Wrong password!");
  coins = Math.max(0, coins - 50);
  updateCoins();
};

// ================= CASE DATA =================
let caseDataList = [];
let caseData;

fetch("cases.json?v=" + Date.now())
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
  select.addEventListener("change", () => selectCase(select.value));
  document.getElementById("show-select-btn").onclick = () => {
    select.classList.toggle("hidden");
  };
}

function selectCase(id) {
  caseData = caseDataList.find(c => c.id === id);
  document.getElementById("case-name").textContent = caseData.name;
  document.getElementById("case-image").src = caseData.image;
  document.getElementById("open-btn").textContent =
    `Open for ${caseData.price.toFixed(2)} coins`;

  caseData.items.forEach(i => new Image().src = i.image);
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

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function buildSpinner(win) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  let pool = [];
  for (let i = 0; i < 10; i++) {
    pool.push(...caseData.items);
  }

  pool = shuffleArray(pool);
  const winIndex = pool.length - 8;
  pool[winIndex] = win;

  pool.forEach(i => {
    const div = document.createElement("div");
    div.className = `spinner-item ${i.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${i.image}">`;
    strip.appendChild(div);
  });

  const itemWidth = strip.querySelector(".spinner-item").offsetWidth + 20;
  const distance = itemWidth * (winIndex - 1);

  if (lastWonDiv) lastWonDiv.classList.remove("highlight-won");

  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  requestAnimationFrame(() => {
    strip.style.transition = "transform 6s cubic-bezier(.22,.61,.36,1)";
    strip.style.transform = `translateX(-${distance}px)`;
  });

  setTimeout(() => {
    const d = strip.children[winIndex];
    if (d) {
      d.classList.add("highlight-won");
      lastWonDiv = d;
    }
  }, 6000);
}

// ================= OPEN BUTTON =================
document.getElementById("open-btn").onclick = () => {
  if (!caseData) return;
  if (coins < caseData.price) {
    const c = document.getElementById("coins");
    c.style.color = "red";
    setTimeout(() => c.style.color = "white", 800);
    return;
  }

  coins -= caseData.price;
  updateCoins();

  const won = weightedRandom(caseData.items);
  buildSpinner(won);

  setTimeout(() => {
    document.getElementById("winner-name").textContent = `You won: ${won.name}`;
    addToInventory(won);
    addRecentDrop(won);
  }, 6000);
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
        <strong>${i.price.toFixed(2)} coins</strong>
      `;
      c.appendChild(d);
    });
}

renderTopDrops();
