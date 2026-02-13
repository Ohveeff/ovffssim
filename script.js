// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();

  // Buttons
  document.getElementById("toggle-inv-btn").onclick = () =>
    document.getElementById("inventory").classList.toggle("hidden");
  document.getElementById("add-coins-btn").onclick = () => {
    coins += 1.01;
    updateCoins();
  };
  document.getElementById("remove-coins-btn").onclick = () => {
    coins = Math.max(0, coins - 0.04);
    updateCoins();
  };

  // Case Items Button
  const caseItemsBtn = document.getElementById("show-case-items-btn");
  const caseItemsList = document.getElementById("case-items-list");
  caseItemsBtn.addEventListener("click", () => {
    if (!currentCase) return;
    if (caseItemsList.style.display === "block") {
      caseItemsList.style.display = "none";
      caseItemsBtn.textContent = "Show Case Items";
    } else {
      renderCaseItems();
      caseItemsList.style.display = "block";
      caseItemsBtn.textContent = "Hide Case Items";
    }
  });
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins.toFixed(2)}`;
  localStorage.setItem("coins", coins);
}

// ===================== INVENTORY =====================
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("recentDrops", JSON.stringify(recentDrops));
}

function addToInventory(item) {
  inventory.push(item);
  recentDrops.push(item);
  if (recentDrops.length > 20) recentDrops.shift();
  saveInventory();
  renderInventory();
  renderTopDrops();
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  saveInventory();
  updateCoins();
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";
  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price} coins</small>
      <button class="sell-btn theme-btn">Sell</button>
    `;
    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    inv.appendChild(div);
  });
}

// ===================== TOP DROPS =====================
function renderTopDrops() {
  const c = document.getElementById("top-drops");
  c.innerHTML = "";
  [...recentDrops].sort((a,b)=>b.price-a.price).slice(0,8).forEach(i=>{
    const d = document.createElement("div");
    d.className = `top-drop ${i.rarity.toLowerCase()}`;
    d.innerHTML = `<img src="${i.image}"><p>${i.name}</p><strong>${i.price} coins</strong>`;
    c.appendChild(d);
  });
}

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json").then(r=>r.json()).then(data=>{
    cases = data.cases;
    const select = document.getElementById("case-select");
    select.innerHTML = "";
    cases.forEach(c=>{
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = `${c.name} (${c.price} coins)`;
      select.appendChild(option);
    });
    select.onchange = ()=> selectCase(select.value);
    selectCase(cases[0].id);
  });
}

function selectCase(id){
  currentCase = cases.find(c=>c.id===id);
  if(!currentCase) return;
  document.getElementById("case-image").src=currentCase.image;
  document.getElementById("case-name").textContent=currentCase.name;
  document.getElementById("open-btn").textContent=`Open for ${currentCase.price} Coins`;
  currentCase.items.forEach(i=>new Image().src=i.image);
}

// ===================== CASE ITEMS =====================
function renderCaseItems(){
  if(!currentCase) return;
  const list = document.getElementById("case-items-list");
  list.innerHTML="";
  const totalWeight = currentCase.items.reduce((s,i)=>s+i.weight,0);
  currentCase.items.sort((a,b)=>b.price-a.price).forEach(item=>{
    const div=document.createElement("div");
    div.className=`inv-item ${item.rarity.toLowerCase()}`;
    const chance=((item.weight/totalWeight)*100).toFixed(2);
    div.innerHTML=`<img src="${item.image}" style="width:50px;height:50px;object-fit:contain;">
      <div style="text-align:left;">
      <strong>${item.name}</strong><br>
      ${item.price} coins<br>
      ${chance}%
      </div>`;
    list.appendChild(div);
  });
}

// ===================== RNG =====================
function getRandomItem(items){
  const totalWeight = items.reduce((sum,i)=>sum+i.weight,0);
  let roll=Math.random()*totalWeight;
  for(let item of items){if(roll<item.weight)return item;roll-=item.weight;}
  return items[0];
}

// ===================== SPINNER =====================
function spinToItem(winningItem){
  const strip=document.getElementById("spinner-strip");
  strip.innerHTML="";
  const totalSlots=50, winnerIndex=38, items=currentCase.items;
  for(let i=0;i<totalSlots;i++){
    let item=items[Math.floor(Math.random()*items.length)];
    if(i===winnerIndex)item=winningItem;
    const div=document.createElement("div");
    div.className=`spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML=`<img src="${item.image}">`;
    strip.appendChild(div);
  }
  const spinnerItems=strip.querySelectorAll(".spinner-item");
  const itemWidth=spinnerItems[0].offsetWidth+30;
  const containerWidth=document.getElementById("spinner-container").offsetWidth;
  const offset=-(winnerIndex*itemWidth-containerWidth/2+itemWidth/2);
  strip.style.transition="none";
  strip.style.transform="translateX(0px)";
  strip.offsetHeight;
  strip.style.transition="transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform=`translateX(${offset}px)`;
  setTimeout(()=>{
    spinnerItems[winnerIndex].classList.add("highlight-won");
    showWinner(winningItem);
  },3200);
}

// ===================== SHOW WINNER =====================
function showWinner(item){
  const nameBox=document.getElementById("winner-name");
  if(nameBox){nameBox.textContent=`You won: ${item.name}`;nameBox.className=item.rarity.toLowerCase();}
  addToInventory(item);
}

// ===================== OPEN BUTTON =====================
document.getElementById("open-btn").addEventListener("click",()=>{
  if(!currentCase) return;
  if(coins<currentCase.price){alert("Not enough coins!");return;}
  coins-=currentCase.price;
  updateCoins();
  const winningItem=getRandomItem(currentCase.items);
  spinToItem(winningItem);
});

// ===================== COINFLIP SYSTEM =====================
let selectedCoinflipIndex = null;

function getAllItems() {
  let all = [];
  cases.forEach(c => {
    all = all.concat(c.items);
  });
  return all;
}

function selectCoinflipItem(index) {
  selectedCoinflipIndex = index;
  const item = inventory[index];

  document.getElementById("coinflip-selected").innerHTML = `
    <div class="inv-item ${item.rarity.toLowerCase()}">
      <img src="${item.image}">
      <p>${item.name}</p>
      <strong>${item.price} coins</strong>
    </div>
  `;

  document.getElementById("coinflip-btn").disabled = false;
}

document.getElementById("coinflip-btn").addEventListener("click", () => {
  if (selectedCoinflipIndex === null) return;

  const item = inventory[selectedCoinflipIndex];
  const resultDiv = document.getElementById("coinflip-result");
  const coinInner = document.querySelector(".coin-inner");

  resultDiv.textContent = "Flipping...";
  resultDiv.style.color = "white";

  const win = Math.random() < 0.5;
  const spins = 6;
  const finalRotation = win ? 180 : 360;

  coinInner.style.transition = "none";
  coinInner.style.transform = "rotateY(0deg)";
  coinInner.offsetHeight;

  coinInner.style.transition = "transform 1.5s ease-in-out";
  coinInner.style.transform = `rotateY(${spins * 360 + finalRotation}deg)`;

  setTimeout(() => {

    if (win) {

      const wagerValue = item.price;
      const duplicateSame = Math.random() < 0.5;

      if (duplicateSame) {

        addToInventory(item);
        resultDiv.textContent = `YOU WON! Duplicate ${item.name}!`;

      } else {

        const allItems = getAllItems()
          .filter(i => i.price <= wagerValue * 0.6);

        let totalGiven = 0;
        let safety = 0;

        while (totalGiven < wagerValue && safety < 50 && allItems.length > 0) {

          const randomItem = allItems[Math.floor(Math.random() * allItems.length)];

          if (totalGiven + randomItem.price <= wagerValue) {
            addToInventory(randomItem);
            totalGiven += randomItem.price;
          }

          safety++;
        }

        resultDiv.textContent = `YOU WON! Bulk items worth ${totalGiven.toFixed(2)} coins!`;
      }

      resultDiv.style.color = "lime";

    } else {

      inventory.splice(selectedCoinflipIndex, 1);
      saveInventory();
      renderInventory();

      resultDiv.textContent = "YOU LOST! Item Removed!";
      resultDiv.style.color = "red";
    }

    selectedCoinflipIndex = null;
    document.getElementById("coinflip-btn").disabled = true;
    document.getElementById("coinflip-selected").innerHTML = "";

  }, 1500);
});

// ===================== COINFLIP SYSTEM =====================
let selectedCoinflipIndex = null;
let coinflipRewardBundle = [];

function getAllItems() {
  let all = [];
  cases.forEach(c => {
    all = all.concat(c.items);
  });
  return all;
}

// Generate reward bundle BEFORE flip
function generateRewardBundle(wagerItem) {

  const duplicateSame = Math.random() < 0.5;
  const bundle = [];

  if (duplicateSame) {
    bundle.push(wagerItem);
  } else {

    const allItems = getAllItems()
      .filter(i => i.price <= wagerItem.price * 0.6);

    let totalGiven = 0;
    let safety = 0;

    while (totalGiven < wagerItem.price && safety < 50 && allItems.length > 0) {

      const randomItem = allItems[Math.floor(Math.random() * allItems.length)];

      if (totalGiven + randomItem.price <= wagerItem.price) {
        bundle.push(randomItem);
        totalGiven += randomItem.price;
      }

      safety++;
    }
  }

  return bundle;
}

function selectCoinflipItem(index) {
  selectedCoinflipIndex = index;
  const item = inventory[index];

  // Show selected item
  document.getElementById("coinflip-selected").innerHTML = `
    <div class="inv-item ${item.rarity.toLowerCase()}">
      <img src="${item.image}">
      <p>${item.name}</p>
      <strong>${item.price} coins</strong>
    </div>
  `;

  // Generate preview bundle
  coinflipRewardBundle = generateRewardBundle(item);

  const previewDiv = document.getElementById("coinflip-preview");
  previewDiv.innerHTML = "";

  coinflipRewardBundle.forEach(reward => {
    const div = document.createElement("div");
    div.className = `inv-item ${reward.rarity.toLowerCase()}`;
    div.style.width = "110px";
    div.innerHTML = `
      <img src="${reward.image}">
      <small>${reward.name}</small>
    `;
    previewDiv.appendChild(div);
  });

  document.getElementById("coinflip-btn").disabled = false;
}

document.getElementById("coinflip-btn").addEventListener("click", () => {
  if (selectedCoinflipIndex === null) return;

  const resultDiv = document.getElementById("coinflip-result");
  const coinInner = document.querySelector(".coin-inner");

  resultDiv.textContent = "Flipping...";
  resultDiv.style.color = "white";

  const win = Math.random() < 0.5;
  const spins = 6;
  const finalRotation = win ? 180 : 360;

  coinInner.style.transition = "none";
  coinInner.style.transform = "rotateY(0deg)";
  coinInner.offsetHeight;

  coinInner.style.transition = "transform 1.5s ease-in-out";
  coinInner.style.transform = `rotateY(${spins * 360 + finalRotation}deg)`;

  setTimeout(() => {

    if (win) {

      // Give pre-generated bundle
      coinflipRewardBundle.forEach(item => {
        addToInventory(item);
      });

      resultDiv.textContent = "YOU WON!";
      resultDiv.style.color = "lime";

    } else {

      // Remove wagered item
      inventory.splice(selectedCoinflipIndex, 1);
      saveInventory();
      renderInventory();

      resultDiv.textContent = "YOU LOST! Item Removed!";
      resultDiv.style.color = "red";
    }

    selectedCoinflipIndex = null;
    coinflipRewardBundle = [];

    document.getElementById("coinflip-btn").disabled = true;
    document.getElementById("coinflip-selected").innerHTML = "";
    document.getElementById("coinflip-preview").innerHTML = "";

  }, 1500);
});
