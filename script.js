// ================= GLOBAL STATE =================
let coins = 1000;
let inventory = [];
let selectedCoinflipIndex = null;
let coinflipRewardBundle = [];

// ================= LOAD CASES =================
const cases = window.cases?.cases || [];
if (!cases.length) alert("No cases loaded from cases.json!");

// ================= GAME MODE SWITCH =================
const casesModeBtn = document.getElementById("cases-mode-btn");
const coinflipModeBtn = document.getElementById("coinflip-mode-btn");
const casesMode = document.getElementById("cases-mode");
const coinflipMode = document.getElementById("coinflip-mode");

function setActiveMode(activeBtn) {
  casesModeBtn.classList.remove("active-mode");
  coinflipModeBtn.classList.remove("active-mode");
  activeBtn.classList.add("active-mode");
}

casesModeBtn.onclick = () => {
  casesMode.classList.remove("hidden");
  coinflipMode.classList.add("hidden");
  setActiveMode(casesModeBtn);
};

coinflipModeBtn.onclick = () => {
  casesMode.classList.add("hidden");
  coinflipMode.classList.remove("hidden");
  setActiveMode(coinflipModeBtn);
};

// ================= UI UPDATE =================
function updateCoins() {
  document.getElementById("coins-display").textContent = "Coins: " + coins.toFixed(2);
}

function renderInventory() {
  const invDiv = document.getElementById("inventory");
  invDiv.innerHTML = "";
  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "inv-item";
    div.innerHTML = `<img src="${item.image}"><p>${item.name}</p><strong>${item.price}</strong>`;
    div.onclick = () => selectCoinflipItem(index);
    invDiv.appendChild(div);
  });
}

function addToInventory(item) {
  inventory.push(item);
  renderInventory();
}

// ================= CASE OPENING =================
const caseSelect = document.getElementById("case-select");
cases.forEach(c => {
  const option = document.createElement("option");
  option.value = c.id;
  option.textContent = `${c.name} - $${c.price}`;
  caseSelect.appendChild(option);
});

document.getElementById("open-case-btn").onclick = () => {
  const selectedCase = cases.find(c => c.id === caseSelect.value);
  if (!selectedCase || coins < selectedCase.price) return;

  coins -= selectedCase.price;
  updateCoins();

  const spinner = document.getElementById("spinner");
  spinner.innerHTML = "";

  const spinItems = [];
  for (let i = 0; i < 20; i++) {
    const item = weightedRandomItem(selectedCase.items);
    spinItems.push(item);

    const div = document.createElement("div");
    div.className = "spinner-item";
    div.innerHTML = `<img src="${item.image}">`;
    spinner.appendChild(div);
  }

  const winningItem = spinItems[15];
  addToInventory(winningItem);

  spinner.style.transform = `translateX(-${15 * 120}px)`;
  document.getElementById("winner-display").textContent = "You won: " + winningItem.name;
};

// Weighted random based on item weight
function weightedRandomItem(items) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let rnd = Math.random() * totalWeight;
  for (let i of items) {
    if (rnd < i.weight) return i;
    rnd -= i.weight;
  }
  return items[0];
}

// ================= COINFLIP =================
function getAllItems() {
  return cases.flatMap(c => c.items);
}

// Generate random reward bundle <= wager price
function generateRewardBundle(wagerItem) {
  if (Math.random() < 0.5) return [wagerItem];

  const allItems = getAllItems().filter(i => i.price <= wagerItem.price * 0.6);
  const bundle = [];
  let total = 0;

  while (total < wagerItem.price && allItems.length > 0) {
    const item = allItems[Math.floor(Math.random() * allItems.length)];
    if (total + item.price <= wagerItem.price) {
      bundle.push(item);
      total += item.price;
    } else break;
  }

  return bundle.length ? bundle : [wagerItem];
}

function selectCoinflipItem(index) {
  selectedCoinflipIndex = index;
  const item = inventory[index];

  document.getElementById("coinflip-selected").innerHTML =
    `<div class="inv-item"><img src="${item.image}"><p>${item.name}</p></div>`;

  coinflipRewardBundle = generateRewardBundle(item);

  const previewDiv = document.getElementById("coinflip-preview");
  previewDiv.innerHTML = "";

  coinflipRewardBundle.forEach(reward => {
    const div = document.createElement("div");
    div.className = "inv-item";
    div.innerHTML = `<img src="${reward.image}"><small>${reward.name}</small>`;
    previewDiv.appendChild(div);
  });

  document.getElementById("coinflip-btn").disabled = false;
}

document.getElementById("coinflip-btn").onclick = () => {
  if (selectedCoinflipIndex === null) return;

  const coinInner = document.querySelector(".coin-inner");
  const resultDiv = document.getElementById("coinflip-result");

  const win = Math.random() < 0.5;
  const spins = 6;
  const finalRotation = win ? 180 : 360;

  coinInner.style.transition = "transform 1.5s ease-in-out";
  coinInner.style.transform = `rotateY(${spins * 360 + finalRotation}deg)`;

  setTimeout(() => {
    if (win) {
      coinflipRewardBundle.forEach(addToInventory);
      resultDiv.textContent = "YOU WON!";
      resultDiv.style.color = "lime";
    } else {
      inventory.splice(selectedCoinflipIndex, 1);
      renderInventory();
      resultDiv.textContent = "YOU LOST!";
      resultDiv.style.color = "red";
    }

    selectedCoinflipIndex = null;
    document.getElementById("coinflip-btn").disabled = true;
    document.getElementById("coinflip-selected").innerHTML = "";
    document.getElementById("coinflip-preview").innerHTML = "";

  }, 1500);
};

updateCoins();
renderInventory();
