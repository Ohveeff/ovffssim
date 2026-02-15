// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;

let selectedBet = null;
let betType = null; // "coins" or "item"
let betItem = null;

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sell-all-btn").onclick = sellAllItems;
  document.getElementById("toggle-inv-btn").onclick = () =>
    document.getElementById("inventory").classList.toggle("hidden");

  document.getElementById("toggle-section-btn").onclick = toggleSection;

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
    div.className = `inv-item rarity-${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price} coins</small>
    `;
    if(item.amount>1) div.innerHTML += `<p>x${item.amount}</p>`;
    const btn = document.createElement("button");
    btn.className="sell-btn";
    btn.textContent="Sell";
    btn.onclick=()=>sellItem(index);
    div.appendChild(btn);
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

// ===================== TOGGLE CASE / COINFLIP =====================
function toggleSection() {
  const caseSec = document.getElementById("case-section");
  const coinSec = document.getElementById("coinflip-section");
  caseSec.classList.toggle("hidden");
  coinSec.classList.toggle("hidden");
}

// ===================== COINFLIP =====================
function renderBetOptions() {
  const container = document.getElementById("betOptions");
  container.innerHTML = "";

  // Coins card
  const coinCard = document.createElement("div");
  coinCard.className = "inventory-card";
  coinCard.innerHTML = `
    <div class="item-name">Coins</div>
    <div class="item-price">${coins.toFixed(2)}</div>
  `;
  if(betType==="coins") coinCard.classList.add("selected");
  coinCard.onclick = () => { betType="coins"; selectedBet="coins"; betItem=null; renderBetOptions(); updatePoolDisplay(); };
  container.appendChild(coinCard);

  // Inventory items
  inventory.forEach((item, idx)=>{
    const card = document.createElement("div");
    card.className = `inventory-card rarity-${item.rarity}`;
    if(betType==="item" && selectedBet===idx) card.classList.add("selected");
    card.innerHTML = `<img src="${item.image}"/><div>${item.name}</div><div>${item.price}</div>`;
    card.onclick = ()=>{
      if(selectedBet===idx){ clearSelection(); return; }
      betType="item"; selectedBet=idx; betItem=item;
      renderBetOptions();
      updatePoolDisplay();
    };
    container.appendChild(card);
  });
}

function clearSelection(){
  selectedBet = null; betType=null; betItem=null;
  renderBetOptions(); updatePoolDisplay();
}

function startCoinflip(){
  if(selectedBet===null){ alert("Select a bet first!"); return; }

  if(betType==="item"){
    // remove item from inventory
    inventory.splice(selectedBet,1);
    saveInventory(); renderInventory();
  }

  if(betType==="coins" && coins<=0){ alert("No coins!"); return; }

  const win = Math.random()<0.5;
  animateCoin(win);
}

function animateCoin(win){
  const coin = document.getElementById("coin");
  coin.classList.remove("flip");
  void coin.offsetWidth;
  coin.classList.add("flip");

  setTimeout(()=>{
    if(win){ coin.innerText="🟡 WIN"; handleWin(); }
    else { coin.innerText="⚫ LOSE"; handleLoss(); }

    setTimeout(()=>{
      coin.innerText="🪙"; coin.classList.remove("flip");
    },1500);
  },2000);
}

function handleWin(){
  if(betType==="coins"){ coins *=2; updateCoins(); }
  if(betType==="item"){ addToInventory({...betItem}); addToInventory({...betItem}); }
  saveInventory(); renderInventory(); clearSelection();
}

function handleLoss(){
  if(betType==="coins"){ coins=0; updateCoins(); }
  saveInventory(); renderInventory(); clearSelection();
}

function updatePoolDisplay(){
  const pool = document.getElementById("coinflipPool");
  pool.innerHTML="";
  if(betType==="coins"){
    pool.innerHTML=`<div class="pool-item">Bet: ${coins.toFixed(2)}</div>
                    <div class="pool-item">Possible Win: ${(coins*2).toFixed(2)}</div>`;
  }
  if(betType==="item" && betItem){
    pool.innerHTML=`<div class="pool-item">${betItem.name}</div>
                    <div class="pool-item">${betItem.name}</div>`;
  }
}

