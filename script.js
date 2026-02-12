let lastWonItemDiv = null;

function buildSpinner(winItem) {
  const strip = document.getElementById("spinner-strip");
  strip.innerHTML = "";

  const items = caseData.items;
  const totalVisible = 15; // how many items to repeat for smooth scroll
  const repeatCount = 5;   // repeat the items enough to scroll far

  // Build repeated array
  const spinnerItems = [];
  for (let i = 0; i < repeatCount; i++) {
    items.forEach(it => spinnerItems.push(it));
  }

  // Insert the winItem at the center of last repeat
  const winIndex = spinnerItems.length - Math.floor(items.length / 2) - 1;
  spinnerItems[winIndex] = winItem;

  // Preload images
  const preloadPromises = spinnerItems.map(item => new Promise(resolve => {
    const img = new Image();
    img.src = item.image;
    img.onload = resolve;
    img.onerror = resolve;
  }));

  Promise.all(preloadPromises).then(() => {
    // Create DOM elements
    spinnerItems.forEach(item => {
      const div = document.createElement("div");
      div.className = `spinner-item ${item.rarity.toLowerCase()}`;
      div.innerHTML = `<img src="${item.image}">`;
      strip.appendChild(div);
    });

    const itemWidth = strip.querySelector(".spinner-item").offsetWidth + 20;
    const totalDistance = itemWidth * (spinnerItems.length - totalVisible);

    // Remove old highlight
    if (lastWonItemDiv) lastWonItemDiv.classList.remove("highlight-won");

    // Reset transform
    strip.style.transition = "none";
    strip.style.transform = `translateX(0px)`;
    strip.offsetHeight; // force reflow

    // Animate transform
    strip.style.transition = "transform 11s cubic-bezier(.25,.1,.25,1)";
    strip.style.transform = `translateX(-${totalDistance}px)`;

    // Highlight won item after animation
    setTimeout(() => {
      const wonItemDiv = strip.children[winIndex];
      if (wonItemDiv) {
        wonItemDiv.classList.add("highlight-won");
        wonItemDiv.classList.add(winItem.rarity.toLowerCase());
        lastWonItemDiv = wonItemDiv;
      }
    }, 11000);
  });
}
