// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("sell-all-btn").onclick = sellAllItems;

  document.getElementById("toggle-inv-btn").onclick = () =>
    document.getElementById("inventory").classList.toggle("hidden");

  document.getElementById("toggle-coinflip-btn").onclick = () =>
    document.getElementById("coinflip-section").classList.toggle("hidden");

  updateCoins();
  renderInventory();
  loadCases();
  renderBetOptions();
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function addToInventory(item) {
  let existing = inventory.find(i => i.name === item.name);
  if (existing) {
    existing.amount = (existing.amount || 1) + 1;
  } else {
    item.amount = 1;
    inventory.push(item);
  }
  saveInventory();
  renderInventory();
  renderBetOptions();
}

function sellItem(index) {
  let item = inventory[index];
  coins += item.price;
  if (item.amount > 1) {
    item.amount--;
  } else {
    inventory.splice(index, 1);
  }
  saveInventory();
  updateCoins();
  renderInventory();
  renderBetOptions();
}

function sellAllItems() {
  let total = inventory.reduce((sum,i)=> sum + (i.price*(i.amount||1)),0);
  coins += total;
  inventory = [];
  saveInventory();
  updateCoins();
  renderInventory();
  renderBetOptions();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach((item,index)=>{
    const div = document.createElement("div");
    div.className = "inv-item";
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price} coins</small>
      <p>x${item.amount||1}</p>
      <button class="sell-btn">Sell</button>
    `;
    div.querySelector("button").onclick=()=>sellItem(index);
    inv.appendChild(div);
  });
}

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json")
  .then(r=>r.json())
  .then(data=>{
    cases = data.cases;
    const select = document.getElementById("case-select");
    select.innerHTML="";
    cases.forEach(c=>{
      const opt=document.createElement("option");
      opt.value=c.id;
      opt.textContent=`${c.name} (${c.price} coins)`;
      select.appendChild(opt);
    });
    select.onchange=()=>selectCase(select.value);
    selectCase(cases[0].id);
  });
}

function selectCase(id){
  currentCase=cases.find(c=>c.id===id);
  if(!currentCase)return;

  document.getElementById("case-image").src=currentCase.image;
  document.getElementById("case-name").textContent=currentCase.name;
  document.getElementById("open-btn").textContent=
  `Open for ${currentCase.price} Coins`;
}

// ===================== OPEN CASE =====================
document.getElementById("open-btn").onclick=()=>{
  if(coins<currentCase.price){alert("Not enough coins");return;}
  coins-=currentCase.price;
  updateCoins();
  const item=currentCase.items[Math.floor(Math.random()*currentCase.items.length)];
  addToInventory({...item});
};

// ===================== COINFLIP STATE =====================
let selectedBet = null;
let betType = null; // "coins" or "item"

// ===================== COINFLIP INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  const flipBtn = document.getElementById("flip-btn");
  if (flipBtn) flipBtn.onclick = startCoinflip;

  renderBetOptions();
});

// ===================== RENDER BET OPTIONS =====================
function renderBetOptions() {
  const container = document.getElementById("coinflip-options");
  if (!container) return;

  container.innerHTML = "";

  // ---- COIN OPTION ----
  const coinDiv = document.createElement("div");
  coinDiv.className = "bet-item coin-option";
  coinDiv.innerHTML = `
    <div class="coin-icon">🪙</div>
    <div>Coins</div>
  `;

  coinDiv.onclick = () => {
    if (selectedBet === "coins") {
      selectedBet = null;
      betType = null;
      coinDiv.classList.remove("selected");
      updatePoolDisplay();
      return;
    }

    selectedBet = "coins";
    betType = "coins";
    document.querySelectorAll(".bet-item").forEach(e => e.classList.remove("selected"));
    coinDiv.classList.add("selected");
    updatePoolDisplay();
  };

  container.appendChild(coinDiv);

  // ---- ITEM OPTIONS ----
  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `bet-item ${item.rarity}`;

    div.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
      ${item.amount > 1 ? `<div>x${item.amount}</div>` : ""}
    `;

    div.onclick = () => {
      if (selectedBet === index) {
        selectedBet = null;
        betType = null;
        div.classList.remove("selected");
        updatePoolDisplay();
        return;
      }

      selectedBet = index;
      betType = "item";

      document.querySelectorAll(".bet-item").forEach(e => e.classList.remove("selected"));
      div.classList.add("selected");
      updatePoolDisplay();
    };

    container.appendChild(div);
  });
}

// ===================== UPDATE POOL DISPLAY =====================
function updatePoolDisplay() {
  const wager = document.getElementById("wager-display");
  const possible = document.getElementById("possible-win-display");

  if (!wager || !possible) return;

  wager.innerHTML = "";
  possible.innerHTML = "";

  if (selectedBet === null) return;

  if (betType === "coins") {
    wager.innerHTML = `<div class="coin-pool">🪙 ${coins.toFixed(2)}</div>`;

    const equalItems = inventory.filter(i => i.price <= coins);

    equalItems.forEach(i => {
      const div = document.createElement("div");
      div.className = `pool-item ${i.rarity}`;
      div.innerHTML = `
        <img src="${i.image}">
        <div>${i.name}</div>
      `;
      possible.appendChild(div);
    });
  }

  if (betType === "item") {
    const item = inventory[selectedBet];

    const wagerDiv = document.createElement("div");
    wagerDiv.className = `pool-item ${item.rarity}`;
    wagerDiv.innerHTML = `
      <img src="${item.image}">
      <div>${item.name}</div>
    `;
    wager.appendChild(wagerDiv);

    const equalItems = inventory.filter(i => i.price <= item.price);

    equalItems.forEach(i => {
      const div = document.createElement("div");
      div.className = `pool-item ${i.rarity}`;
      div.innerHTML = `
        <img src="${i.image}">
        <div>${i.name}</div>
      `;
      possible.appendChild(div);
    });
  }
}

// ===================== START COINFLIP =====================
function startCoinflip() {
  if (selectedBet === null) {
    alert("Select coins or an item first!");
    return;
  }

  const result = Math.random() < 0.5; // 50/50

  animateCoin(result);
}

// ===================== COIN ANIMATION =====================
function animateCoin(win) {
  const coin = document.getElementById("coin-animation");
  if (!coin) return;

  coin.classList.remove("win", "lose");
  coin.classList.add("flipping");

  setTimeout(() => {
    coin.classList.remove("flipping");
    coin.classList.add(win ? "win" : "lose");

    if (win) handleWin();
    else handleLoss();
  }, 2000);
}

// ===================== WIN =====================
function handleWin() {
  if (betType === "coins") {
    coins *= 2;
    updateCoins();
  }

  if (betType === "item") {
    const item = inventory[selectedBet];

    // give duplicate of same item
    addToInventory({ ...item });
  }

  saveInventory();
  renderInventory();
  renderBetOptions();
  updatePoolDisplay();
}

// ===================== LOSS =====================
function handleLoss() {
  if (betType === "coins") {
    coins = 0;
    updateCoins();
  }

  if (betType === "item") {
    inventory.splice(selectedBet, 1);
  }

  saveInventory();
  renderInventory();
  renderBetOptions();
  updatePoolDisplay();
}
