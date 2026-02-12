// ===================== COINS =====================
let coins = parseInt(localStorage.getItem("coins")) || 1000;
localStorage.setItem("coins", coins);

function updateCoins() {
  document.getElementById("coins").textContent = `Coins: ${coins}`;
}
updateCoins();

// ===================== INVENTORY =====================
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
      <img src="${item.image}" width="70">
      <p>${item.name}</p>
      <small>${item.price} coins</small><br>
      <button class="sell-btn">Sell</button>
    `;
    div.querySelector(".sell-btn").onclick = () => sellItem(index);
    inv.appendChild(div);
  });
}
renderInventory();

// ===================== COIN ADJUST BUTTONS =====================
const coinControls = document.createElement("div");
coinControls.style.margin = "15px";
coinControls.innerHTML = `
  <button id="add-coins">+$50</button>
  <button id="remove-coins">-$50</button>
  <button id="toggle-inv">Toggle Inventory</button>
`;
document.body.insertBefore(coinControls, document.getElementById("case-container"));

document.getElementById("add-coins").onclick = () => {
  coins += 50;
  localStorage.setItem("coins", coins);
  updateCoins();
};
document.getElementById("remove-coins").onclick = () => {
  coins -= 50;
  if(coins < 0) coins = 0;
  localStorage.setItem("coins", coins);
  updateCoins();
};
document.getElementById("toggle-inv").onclick = () => {
  const inv = document.getElementById("inventory");
  inv.style.display = inv.style.display === "none" ? "flex" : "none";
};

// ===================== CASE DATA =====================
let caseData = null;

fetch("data/cases.json")
  .then(res => res.json())
  .then(data => {
    caseData = data.cases[0];
    document.getElementById("case-container").innerHTML = `
      <img src="${caseData.image}" width="180">
      <p>Price: ${caseData.price} coins</p>
    `;
  });

// ===================== RNG =====================
function weightedRandom(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (let item of items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
}

// ===================== SPINNER & ARROWS =====================
const leftArrow = document.getElementById("winner-left");
const rightArrow = document.getElementById("winner-right");
const spinnerContainer = document.getElementById("spinner-container");

function updateArrowPositions(targetIndex) {
  const strip = document.getElementById("spinner-strip");
  const imgs = strip.querySelectorAll("img");
  if (!imgs.length) return;
  const imgWidth = imgs[0].offsetWidth + 10;
  const containerWidth = spinnerContainer.offsetWidth;
  const offset = -(targetIndex * imgWidth - containerWidth / 2 + imgWidth / 2);
  strip.style.left = `${offset}px`;

  // center arrows
  leftArrow.style.left = `${containerWidth/2 - 50}px`;
  rightArrow.style.left = `${containerWidth/2 + 50}px`;
}

// Reposition arrows on resize
window.addEventListener("resize", () => {
  const winningImg = document.querySelector("#spinner-strip img.winning");
  if (winningImg) {
    const imgs = [...document.querySelectorAll("#spinner-strip img")];
    const index = imgs.indexOf(winningImg);
    updateArrowPositions(index);
  }
});

// Build the full spinner strip with winning item
function buildSpinner(items, winItem) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";
  const stripItems = [];
  for (let i = 0; i < 60; i++) {
    if (i === 45) stripItems.push(winItem); // winning item ~75%
    else stripItems.push(items[Math.floor(Math.random() * items.length)]);
  }
  stripItems.forEach(item => {
    const img = document.createElement("img");
    img.src = item.image;
    img.className = item.rarity.toLowerCase();
    strip.appendChild(img);
  });
  return stripItems;
}

function spinToItem(winItem) {
  const strip = document.getElementById("spinner-strip");
  const stripItems = buildSpinner(caseData.items, winItem);
  const imgs = strip.querySelectorAll("img");
  imgs.forEach(img => img.classList.remove("winning"));

  const targetIndex = stripItems.indexOf(winItem);

  // arrow color by rarity
  let color="white";
  switch(winItem.rarity.toLowerCase()){
    case "common": color="gray"; break;
    case "uncommon": color="green"; break;
    case "rare": color="blue"; break;
    case "strange": color="orange"; break;
    case "unusual": color="purple"; break;
    case "legendary": color="gold"; break;
    case "mythical": color="violet"; break;
  }
  leftArrow.style.color = color;
  rightArrow.style.color = color;
  leftArrow.classList.add("glow");
  rightArrow.classList.add("glow");

  const imgWidth = imgs[0].offsetWidth + 10;
  const containerWidth = spinnerContainer.offsetWidth;
  const offset = -(targetIndex * imgWidth - containerWidth / 2 + imgWidth / 2);

  strip.style.transition = "none";
  strip.style.left = "0px";
  strip.offsetHeight;

  strip.style.transition = "left 6s cubic-bezier(.1,.7,0,1)";
  strip.style.left = `${offset}px`;

  setTimeout(() => {
    imgs[targetIndex].classList.add("winning");
    updateArrowPositions(targetIndex);
    document.getElementById("open-btn").disabled = false;
  }, 6000);
}

// ===================== OPEN BUTTON =====================
document.getElementById("open-btn").addEventListener("click", () => {
  if (!caseData) return alert("Case not loaded yet!");
  if (coins < caseData.price) return alert("Not enough coins!");
  document.getElementById("open-btn").disabled = true;
  coins -= caseData.price;
  localStorage.setItem("coins", coins);
  updateCoins();

  const winningItem = weightedRandom(caseData.items);
  spinToItem(winningItem);
});
