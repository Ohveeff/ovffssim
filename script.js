// ================= GLOBAL STATE =================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let currentCase = null;
let selectedCoinItem = null;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  populateCases();
  setupModeSwitch();
  setupCoinflip();
});

// ================= COINS =================
function updateCoins() {
  document.getElementById("coins-display").textContent = `Coins: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ================= INVENTORY =================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}
function addToInventory(item) {
  inventory.push(item);
  saveInventory();
  renderInventory();
}
function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";
  inventory.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}"><p>${item.name}</p><small>${item.price} coins</small>`;
    div.onclick = () => selectCoinItem(idx);
    inv.appendChild(div);
  });
}

// ================= CASES =================
function populateCases() {
  const select = document.getElementById("case-select");
  select.innerHTML = "";
  window.cases.cases.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.price} coins)`;
    select.appendChild(opt);
  });
  select.onchange = () => selectCase(select.value);
  if(window.cases.cases[0]) selectCase(window.cases.cases[0].id);
}

function selectCase(id) {
  currentCase = window.cases.cases.find(c => c.id === id);
}

document.getElementById("open-case-btn").onclick = () => {
  if(!currentCase) return;
  if(coins < currentCase.price){ alert("Not enough coins!"); return; }
  coins -= currentCase.price;
  updateCoins();
  const item = getRandomItem(currentCase.items);
  spinItem(item);
  addToInventory(item);
}

function getRandomItem(items) {
  const total = items.reduce((s,i)=>s+i.weight,0);
  let roll = Math.random() * total;
  for(let i of items){ if(roll<i.weight) return i; roll-=i.weight; }
  return items[0];
}

function spinItem(item) {
  const spinner = document.getElementById("spinner");
  spinner.innerHTML = "";
  const totalSlots = 30;
  for(let i=0;i<totalSlots;i++){
    const div = document.createElement("div");
    const pick = (i===totalSlots-2)?item:currentCase.items[Math.floor(Math.random()*currentCase.items.length)];
    div.className = `spinner-item ${pick.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${pick.image}">`;
    spinner.appendChild(div);
  }
  const offset = -((totalSlots-2)*120/2);
  spinner.style.transition = "transform 4s cubic-bezier(.08,.6,0,1)";
  spinner.style.transform = `translateX(${offset}px)`;
  setTimeout(()=> {
    document.getElementById("winner-display").textContent = `You won: ${item.name}`;
  },4000);
}

// ================= COINFLIP =================
function setupCoinflip() {
  document.getElementById("coinflip-btn").onclick = flipCoin;
}

function selectCoinItem(idx) {
  selectedCoinItem = inventory[idx];
  document.getElementById("coinflip-btn").disabled = false;
  const preview = document.getElementById("coinflip-preview");
  preview.innerHTML = "";
  // Show potential rewards
  const winItem = selectedCoinItem;
  const loseItems = getLoseItems(selectedCoinItem.price);
  [winItem,...loseItems].forEach(i=>{
    const div = document.createElement("div");
    div.className = `inv-item ${i.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${i.image}"><p>${i.name}</p><small>${i.price} coins</small>`;
    preview.appendChild(div);
  });
}

function getLoseItems(value) {
  const cheaper = inventory.filter(i=>i.price<=value && i!==selectedCoinItem);
  const result = [];
  let total=0;
  while(total<value && cheaper.length>0){
    const pick = cheaper[Math.floor(Math.random()*cheaper.length)];
    result.push(pick);
    total += pick.price;
  }
  return result;
}

function flipCoin() {
  if(!selectedCoinItem) return;
  const coin = document.querySelector(".coin-inner");
  coin.style.transform = "rotateY(720deg)";
  setTimeout(()=>{
    const won = Math.random()<0.5;
    const resultDiv = document.getElementById("coinflip-result");
    if(won){
      addToInventory(selectedCoinItem);
      resultDiv.textContent = `You won: ${selectedCoinItem.name}`;
    } else {
      const loseItems = getLoseItems(selectedCoinItem.price);
      loseItems.forEach(i=>addToInventory(i));
      resultDiv.textContent = `You lost your item! You got smaller items instead.`;
    }
  },1500);
}

// ================= MODE SWITCH =================
function setupModeSwitch() {
  const casesBtn = document.getElementById("cases-mode-btn");
  const coinBtn = document.getElementById("coinflip-mode-btn");
  const casesDiv = document.getElementById("cases-mode");
  const coinDiv = document.getElementById("coinflip-mode");

  casesBtn.onclick = () => { casesDiv.classList.remove("hidden"); coinDiv.classList.add("hidden"); casesBtn.classList.add("active-mode"); coinBtn.classList.remove("active-mode"); }
  coinBtn.onclick = () => { coinDiv.classList.remove("hidden"); casesDiv.classList.add("hidden"); coinBtn.classList.add("active-mode"); casesBtn.classList.remove("active-mode"); }
}
