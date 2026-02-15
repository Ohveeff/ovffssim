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

// ===================== COINFLIP =====================
let selectedBet=null;
let betType=null;

function renderBetOptions(){
  const betSelection=document.getElementById("bet-selection");
  if(!betSelection)return;
  betSelection.innerHTML="";

  // coin bet
  [10,50].forEach(amount=>{
    const div=document.createElement("div");
    div.className="bet-item";
    div.textContent=`${amount} Coins`;
    div.onclick=()=>{
      selectedBet=amount;
      betType="coins";
    };
    betSelection.appendChild(div);
  });

  // item bet
  inventory.forEach((item,index)=>{
    const div=document.createElement("div");
    div.className="bet-item";
    div.innerHTML=`<img src="${item.image}">${item.name} x${item.amount||1}`;
    div.onclick=()=>{
      selectedBet=index;
      betType="item";
    };
    betSelection.appendChild(div);
  });
}

document.getElementById("flip-btn").onclick=()=>{
  if(!betType){alert("Select bet first");return;}

  const win=Math.random()<0.5;

  if(betType==="coins"){
    if(coins<selectedBet){alert("Not enough coins");return;}
    coins-=selectedBet;
    if(win) coins+=selectedBet*2;
    updateCoins();
  }

  if(betType==="item"){
    let item=inventory[selectedBet];
    if(win){
      item.amount++;
    }else{
      if(item.amount>1)item.amount--;
      else inventory.splice(selectedBet,1);
    }
    saveInventory();
    renderInventory();
  }

  renderBetOptions();
};
