// ==================== COINS ====================
let coins = parseInt(localStorage.getItem("coins")) || 1000;
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}
updateCoins();

// ==================== INVENTORY ====================
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
  updateCoins();
  saveInventory();
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
      <small>${item.price} coins</small>
      <button class="sell-btn">Sell</button>
    `;
    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    inv.appendChild(div);
  });
}
renderInventory();

// ==================== CASE DATA ====================
let caseData = null;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];

    document.getElementById("case-container").innerHTML = `
      <img src="${caseData.image}">
      <p>Price: ${caseData.price} coins</p>
    `;

    populateSpinner(caseData.items);
  })
  .catch(err => {
    console.error("Failed to load case data", err);
    alert("Failed to load cases.json");
  });

// ==================== RNG ====================
function rollItem(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * total;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
}

// ==================== SPINNER ====================
function populateSpinner(items) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  // Build BIG randomized wheel
  let wheel = [];
  for (let i = 0; i < 10; i++) {
    wheel.push(...items);
  }

  wheel = wheel.sort(() => Math.random() - 0.5);

  wheel.forEach(item => {
    const img = document.createElement("img");
    img.src = item.image;
    img.className = item.rarity;
    strip.appendChild(img);
  });
}

function spinToItem(item) {
  const strip = document.getElementById("spinner-strip");
  const imgs = strip.querySelectorAll("img");

  const matches = [];
  imgs.forEach((img, i) => {
    if (img.src.includes(item.image)) matches.push(i);
  });

  const target = matches[Math.floor(Math.random() * matches.length)];
  const imgWidth = imgs[0].offsetWidth + 10;
  const containerWidth =
    document.getElementById("spinner-container").offsetWidth;

  const offset =
    -(target * imgWidth - containerWidth / 2 + imgWidth / 2);

  strip.style.transition = "none";
  strip.style.left = "0px";
  strip.offsetHeight;

  // LONGER SPIN
  strip.style.transition = "left 6s cubic-bezier(.1,.7,0,1)";
  strip.style.left = `${offset}px`;
}

// ==================== OPEN BUTTON ====================
document.getElementById("open-btn").onclick = () => {
  if (!caseData) return alert("Case not loaded yet!");
  if (coins < caseData.price) return alert("Not enough coins!");

  coins -= caseData.price;
  localStorage.setItem("coins", coins);
  updateCoins();

  populateSpinner(caseData.items);

  const item = rollItem(caseData.items);
  spinToItem(item);

  setTimeout(() => {
    addToInventory(item);
    showResult(item);
  }, 6000);
};

// ==================== RESULT ====================
function showResult(item) {
  document.getElementById("result").innerHTML = `
    <h2 class="${item.rarity}">${item.name}</h2>
    <img src="${item.image}">
    <p>Value: ${item.price} coins</p>
  `;
}

