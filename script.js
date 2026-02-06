// -------------------- Coins --------------------
let coins = parseInt(localStorage.getItem("coins")) || 1000;
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}

updateCoins();

// -------------------- Inventory --------------------
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

function addToInventory(item) {
  inventory.push(item);
  localStorage.setItem("inventory", JSON.stringify(inventory));
  renderInventory();
}

function renderInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";

  inventory.forEach(item => {
    const div = document.createElement("div");
    div.className = `inv-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.name}</p>
    `;
    inv.appendChild(div);
  });
}

renderInventory();

// -------------------- Case Data --------------------
let caseData;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];
    document.getElementById("case-container").innerHTML =
      `<img src="${caseData.image}"><p>Price: ${caseData.price} coins</p>`;
  });

// -------------------- Case Opening --------------------
function openCase(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * total;

  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
}

// -------------------- Spinner --------------------
function populateSpinner(items) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const repeatedItems = [...items, ...items, ...items];
  repeatedItems.forEach(item => {
    const img = document.createElement("img");
    img.src = item.image;
    img.className = item.rarity;
    strip.appendChild(img);
  });
}

function spinToItem(item) {
  const strip = document.getElementById("spinner-strip");
  const imgs = strip.querySelectorAll("img");
  const itemIndices = [];

  imgs.forEach((img, i) => {
    if (img.src.includes(item.image)) itemIndices.push(i);
  });

  const targetIndex = itemIndices[Math.floor(Math.random() * itemIndices.length)];
  const imgWidth = 160;
  const containerWidth = document.getElementById("spinner-container").offsetWidth;
  const left = -(targetIndex * imgWidth - containerWidth / 2 + imgWidth / 2);

  strip.style.transition = "left 4s cubic-bezier(.1,.6,0,1)";
  strip.style.left = `${left}px`;
}

// -------------------- Open Button --------------------
document.getElementById("open-btn").addEventListener("click", () => {
  if (!caseData) return alert("Case not loaded yet!");
  if (coins < caseData.price) return alert("Not enough coins!");

  coins -= caseData.price;
  localStorage.setItem("coins", coins);
  updateCoins();

  const item = openCase(caseData.items);
  addToInventory(item);

  populateSpinner(caseData.items);
  spinToItem(item);

  setTimeout(() => {
    showResult(item);
  }, 4000);
});

// Show the opening result
function showResult(item) {
  document.getElementById("result").innerHTML = `
    <h2 class="${item.rarity}">${item.name}</h2>
    <img src="${item.image}">
    <p>Value: ${item.price} coins</p>
  `;
}

