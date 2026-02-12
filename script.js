// ================= COINS =================
let coins = parseFloat(localStorage.getItem("coins"));
if (isNaN(coins)) coins = 100;
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins.toFixed(2)}`;
}
updateCoins();

// ================= INVENTORY =================
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function addToInventory(item) {
  inventory.push(item);
  saveInventory();
  renderInventory();
}

function sellItem(index) {
  coins += inventory[index].price;
  inventory.splice(index, 1);
  localStorage.setItem("coins", coins);
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
      <small>${item.price.toFixed(2)} coins</small>
      <button class="sell-btn">Sell</button>
    `;

    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    inv.appendChild(div);
  });
}
renderInventory();

// ================= CASE DATA =================
let allCases = [];
let currentCase = null;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    allCases = data.cases;
    loadCase(allCases[0]);
  });

function loadCase(caseObj) {
  currentCase = caseObj;

  document.getElementById("case-container").innerHTML = `
    <img src="${caseObj.image}" width="200">
    <h2>${caseObj.name}</h2>
  `;

  document.getElementById("open-btn").textContent =
    `Open Case (${caseObj.price.toFixed(2)} Coins)`;

  populateSpinner(caseObj.items);
}

// ================= RNG =================
function getRandomItemByWeight(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (let item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return items[0];
}

// ================= SPINNER =================
function populateSpinner(items) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const repeatCount = 40; // long wheel like CSGO
  const randomized = [];

  for (let i = 0; i < repeatCount; i++) {
    const randomItem = items[Math.floor(Math.random() * items.length)];
    randomized.push(randomItem);
  }

  randomized.forEach(item => {
    const div = document.createElement("div");
    div.className = `spinner-item ${item.rarity.toLowerCase()}`;
    div.dataset.image = item.image;

    div.innerHTML = `<img src="${item.image}">`;
    strip.appendChild(div);
  });
}

function spinToItem(item) {
  const strip = document.getElementById("spinner-strip");
  const items = strip.querySelectorAll(".spinner-item");
  if (!items.length) return;

  items.forEach(i => i.classList.remove("highlight-won"));

  const matches = [...items]
    .map((el, i) => el.dataset.image === item.image ? i : -1)
    .filter(i => i !== -1);

  const targetIndex = matches.length
    ? matches[Math.floor(Math.random() * matches.length)]
    : Math.floor(items.length * 0.7);

  const itemWidth = items[0].offsetWidth + 20;
  const containerWidth =
    document.getElementById("spinner-container").offsetWidth;

  const offset =
    -(targetIndex * itemWidth - containerWidth / 2 + itemWidth / 2);

  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";
  strip.offsetHeight;

  // 🎯 CSGO style smooth spin
  strip.style.transition =
    "transform 3.5s cubic-bezier(.25,.85,.35,1)";
  strip.style.transform = `translateX(${offset}px)`;

  setTimeout(() => {
    items[targetIndex].classList.add("highlight-won");
    showResult(item);
  }, 3500);
}

// ================= RESULT =================
function showResult(item) {
  const result = document.getElementById("winner-name");
  result.className = item.rarity.toLowerCase();
  result.textContent = `You won: ${item.name}`;
}

// ================= OPEN BUTTON =================
document.getElementById("open-btn").addEventListener("click", () => {
  if (!currentCase) return;
  if (coins < currentCase.price) return alert("Not enough coins!");

  coins -= currentCase.price;
  localStorage.setItem("coins", coins);
  updateCoins();

  const wonItem = getRandomItemByWeight(currentCase.items);

  spinToItem(wonItem);

  setTimeout(() => {
    addToInventory(wonItem);
  }, 3500);
});
