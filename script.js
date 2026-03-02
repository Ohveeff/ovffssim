// ===================== GLOBAL STATE =====================
let coins = parseFloat(localStorage.getItem("coins")) || 100;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let cases = [];
let currentCase = null;
let recentDrops = JSON.parse(localStorage.getItem("recentDrops")) || [];
let coinflipMode = false;
let coinflipWagerIndex = null;

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {

  // Buttons
  document.getElementById("sell-all-btn").onclick = sellAllItems;

  document.getElementById("toggle-inv-btn").onclick = () =>
    document.getElementById("inventory").classList.toggle("hidden");

  document.getElementById("add-coins-btn").onclick = () => {
    coins += 0.10;
    updateCoins();
  };

  document.getElementById("remove-coins-btn").onclick = () => {
    coins = Math.max(0, coins - 5.00);
    updateCoins();
  };

  // Coinflip toggle
  const coinflipToggleBtn = document.createElement("button");
  coinflipToggleBtn.className = "theme-btn";
  coinflipToggleBtn.textContent = "Toggle Coinflip Mode";
  coinflipToggleBtn.style.margin = "10px";
  document.body.insertBefore(coinflipToggleBtn, document.getElementById("coins").nextSibling);

  coinflipToggleBtn.onclick = () => {
    coinflipMode = !coinflipMode;
    document.getElementById("case-section").style.display = coinflipMode ? "none" : "flex";
    document.getElementById("coinflip-wrapper").style.display = coinflipMode ? "block" : "none";
    coinflipToggleBtn.textContent = coinflipMode ? "Back to Cases" : "Toggle Coinflip Mode";
  };

  // Case Items Button
  const caseItemsBtn = document.getElementById("show-case-items-btn");
  const caseItemsList = document.getElementById("case-items-list");

  caseItemsBtn.addEventListener("click", () => {
    if (!currentCase) return;

    if (caseItemsList.style.display === "block") {
      caseItemsList.style.display = "none";
      caseItemsBtn.textContent = "Show Potential Items";
    } else {
      renderCaseItems();
      caseItemsList.style.display = "block";
      caseItemsBtn.textContent = "Hide Case Items";
    }
  });

  // Coinflip Wrapper
  const coinflipWrapper = document.createElement("div");
  coinflipWrapper.id = "coinflip-wrapper";
  coinflipWrapper.style.display = "none";
  coinflipWrapper.style.margin = "20px auto";
  coinflipWrapper.style.textAlign = "center";
  coinflipWrapper.innerHTML = `
    <h2>Coinflip</h2>
    <p>Select an item from your inventory to wager:</p>
    <select id="coinflip-select"></select>
    <div style="margin-top:20px;">
      <div id="coinflip-chip" style="width:100px;height:100px;margin:0 auto;cursor:pointer;"></div>
    </div>
    <p id="coinflip-result" style="margin-top:10px;font-weight:bold;"></p>
  `;
  document.body.appendChild(coinflipWrapper);

  const coinflipSelect = document.getElementById("coinflip-select");
  const coinflipChip = document.getElementById("coinflip-chip");
  const coinflipResult = document.getElementById("coinflip-result");

  coinflipChip.onclick = () => {
    if (coinflipSelect.selectedIndex === -1) {
      alert("Select an item to wager!");
      return;
    }
    coinflipWagerIndex = coinflipSelect.value;
    performCoinflip();
  };

  updateCoins();
  renderInventory();
  renderTopDrops();
  loadCases();
});

// ===================== COINS =====================
function updateCoins() {
  document.getElementById("coins").textContent = `Balance: ${coins.toFixed(2)}`;
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
  renderCoinflipSelect();
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  saveInventory();
  updateCoins();
  renderInventory();
  renderCoinflipSelect();
}

function sellAllItems() {
  if (inventory.length === 0) {
    alert("Inventory is empty!");
    return;
  }

  let totalValue = inventory.reduce((sum, item) => sum + item.price, 0);

  coins += totalValue;
  inventory = [];

  saveInventory();
  updateCoins();
  renderInventory();
  renderCoinflipSelect();

  alert(`Sold all items for ${totalValue.toFixed(2)} coins!`);
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

  renderCoinflipSelect();
}

// ===================== COINFLIP SELECT =====================
function renderCoinflipSelect() {
  const select = document.getElementById("coinflip-select");
  if (!select) return;
  select.innerHTML = "";

  inventory.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.name} (${item.rarity})`;
    select.appendChild(option);
  });
}

// ===================== TOP DROPS =====================
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
        <strong>${i.price} coins</strong>
      `;
      c.appendChild(d);
    });
}

// ===================== LOAD CASES =====================
function loadCases() {
  fetch("data/cases.json")
    .then(r => r.json())
    .then(data => {
      cases = data.cases;

      const select = document.getElementById("case-select");
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

  document.getElementById("case-image").src = currentCase.image;
  document.getElementById("case-name").textContent = currentCase.name;
  document.getElementById("open-btn").textContent =
    `Open for ${currentCase.price} Coins`;

  currentCase.items.forEach(i => new Image().src = i.image);
}

// ===================== CASE ITEMS =====================
function renderCaseItems() {
  if (!currentCase) return;

  const list = document.getElementById("case-items-list");
  list.innerHTML = "";

  const totalWeight = currentCase.items.reduce((sum, i) => sum + i.weight, 0);

  currentCase.items
    .slice()
    .sort((a, b) => b.price - a.price)
    .forEach(item => {
      const div = document.createElement("div");
      div.className = `inv-item ${item.rarity.toLowerCase()}`;

      const chance = ((item.weight / totalWeight) * 100).toFixed(2);

      div.innerHTML = `
        <img src="${item.image}" style="width:50px;height:50px;object-fit:contain;">
        <div style="text-align:left;">
          <strong>${item.name}</strong><br>
          ${item.price} coins<br>
          ${chance}%
        </div>
      `;
      list.appendChild(div);
    });
}

// ===================== RNG =====================
function getRandomItem(items) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * totalWeight;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }

  return items[0];
}

// ===================== SPINNER =====================
function spinToItem(winningItem) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const totalSlots = 50;
  const winnerIndex = 38;
  const items = currentCase.items;

  for (let i = 0; i < totalSlots; i++) {
    let item = items[Math.floor(Math.random() * items.length)];
    if (i === winnerIndex) item = winningItem;

    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  }

  const spinnerItems = strip.querySelectorAll(".spinner-item");
  const itemWidth = spinnerItems[0].offsetWidth + 30;
  const containerWidth = document.getElementById("spinner-container").offsetWidth;

  const offset = -(winnerIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  strip.style.transition = "transform 3.2s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    spinnerItems[winnerIndex].classList.add("highlight-won");
    showWinner(winningItem);
  }, 3200);
}

// ===================== SHOW WINNER =====================
function showWinner(item) {
  const nameBox = document.getElementById("winner-name");
  if (nameBox) {
    nameBox.textContent = ` ${item.name}`;
    nameBox.className = item.rarity.toLowerCase();
  }

  addToInventory(item);
}

// ===================== OPEN BUTTON =====================
document.getElementById("open-btn")
  .addEventListener("click", () => {
    if (!currentCase) return;
    if (coins < currentCase.price) {
      alert("Not enough coins!");
      return;
    }

    coins -= currentCase.price;
    updateCoins();

    const winningItem = getRandomItem(currentCase.items);
    spinToItem(winningItem);
  });

// ===================== COINFLIP LOGIC =====================
function performCoinflip() {
  if (coinflipWagerIndex === null) return;

  const item = inventory[coinflipWagerIndex];
  coinflipResult.textContent = "";
  coinflipChip.innerHTML = "";

  // Create spinning chip
  coinflipChip.style.background = "radial-gradient(circle, red 50%, black 50%)";
  coinflipChip.style.borderRadius = "50%";
  coinflipChip.style.width = "100px";
  coinflipChip.style.height = "100px";
  coinflipChip.style.transition = "transform 2s ease-out";

  // Start spin
  setTimeout(() => {
    const flipResult = Math.random() < 0.5 ? "red" : "black";

    coinflipChip.style.transform = "rotateY(1800deg)";

    setTimeout(() => {
      coinflipChip.style.background = flipResult === "red" ?
        "radial-gradient(circle, red 50%, black 50%)" :
        "radial-gradient(circle, black 50%, red 50%)";

      if (flipResult === "red") {
        coinflipResult.textContent = `You WON! ${item.name} duplicated!`;
        addToInventory({...item}); // duplicate
      } else {
        coinflipResult.textContent = `You LOST! ${item.name} removed from inventory.`;
        inventory.splice(coinflipWagerIndex, 1);
        saveInventory();
        renderInventory();
      }
      coinflipWagerIndex = null;
      renderCoinflipSelect();
    }, 2000);
  }, 100);
}
