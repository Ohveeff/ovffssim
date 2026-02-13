// -------------------------
// Variables
// -------------------------
let casesData = window.casesData.cases; // ensure cases.json sets window.casesData
let selectedCase = casesData[0];
let caseOpen = false;
let inventory = [];

// Buttons
const btnOpenCase = document.getElementById("open-case");
const btnCaseItems = document.getElementById("case-items");
const btnInventory = document.getElementById("inventory-btn");
const caseSelector = document.getElementById("case-selector");

// Containers
const spinnerContainer = document.getElementById("spinner-container");
const inventoryContainer = document.getElementById("inventory-container");
const caseItemsContainer = document.getElementById("case-items-container");
const selectedCaseImage = document.getElementById("selected-case-image");

// -------------------------
// Functions
// -------------------------
function getRandomItem(items) {
    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let item of items) {
        if (rand < item.weight) return item;
        rand -= item.weight;
    }
}

function formatPercent(weight, totalWeight) {
    return ((weight / totalWeight) * 100).toFixed(1) + "%";
}

function renderCaseItems() {
    caseItemsContainer.innerHTML = "";
    const totalWeight = selectedCase.items.reduce((sum, i) => sum + i.weight, 0);
    selectedCase.items.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("case-item-row");
        div.innerHTML = `
            <img src="${item.image}" class="case-item-img">
            <span class="case-item-name">${item.name} [${item.rarity}]</span>
            <span class="case-item-percent">${formatPercent(item.weight, totalWeight)}</span>
        `;
        caseItemsContainer.appendChild(div);
    });
}

function renderInventory() {
    inventoryContainer.innerHTML = "";
    inventory.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("inventory-item");
        div.innerHTML = `<img src="${item.image}" class="inventory-img"><span>${item.name} [${item.rarity}]</span>`;
        inventoryContainer.appendChild(div);
    });
}

function renderSelectedCase() {
    selectedCaseImage.src = selectedCase.image;
}

// -------------------------
// Events
// -------------------------
btnInventory.addEventListener("click", () => {
    inventoryContainer.style.display =
        inventoryContainer.style.display === "block" ? "none" : "block";
});

btnCaseItems.addEventListener("click", () => {
    caseItemsContainer.style.display =
        caseItemsContainer.style.display === "block" ? "none" : "block";
    if (caseItemsContainer.style.display === "block") renderCaseItems();
});

btnOpenCase.addEventListener("click", () => {
    if (caseOpen) return;
    caseOpen = true;

    spinnerContainer.innerHTML = "";
    let spinIndex = 0;

    const spinInterval = setInterval(() => {
        spinnerContainer.innerHTML = "";
        const item = selectedCase.items[spinIndex % selectedCase.items.length];
        const div = document.createElement("div");
        div.classList.add("spinner-item");
        div.innerHTML = `<img src="${item.image}" class="spinner-img"><span>${item.name}</span>`;
        spinnerContainer.appendChild(div);
        spinIndex++;
    }, 100);

    setTimeout(() => {
        clearInterval(spinInterval);
        const wonItem = getRandomItem(selectedCase.items);
        spinnerContainer.innerHTML = `<div class="spinner-item"><img src="${wonItem.image}" class="spinner-img"><span>🎉 ${wonItem.name} [${wonItem.rarity}]</span></div>`;
        inventory.push(wonItem);
        renderInventory();
        caseOpen = false;
    }, 2000);
});

// Case Selector
casesData.forEach(c => {
    const btn = document.createElement("button");
    btn.classList.add("case-select-btn");
    btn.textContent = c.name;
    btn.addEventListener("click", () => {
        selectedCase = c;
        renderSelectedCase();
        renderCaseItems();
    });
    caseSelector.appendChild(btn);
});

// Initial render
renderSelectedCase();
renderCaseItems();
renderInventory();
