function generatePopupText(item, popupColor) {
  const navigationURL = `https://www.google.com/maps/dir/?api=1&destination=${item.coordinate[0]},${item.coordinate[1]}`;
  let popupHtml = `
    <div class="map-popup" data-popup-id="${item.id}">
        <div class="map-popup-title">
            <div class="map-popup-name">
            ${item.tags.name || "Parkplatz"}
            </div>
            <div class="map-popup-distance">
            ${item.distanceFromUser.toFixed(0)} m
            </div>
        </div>
        <div class="map-popup-list">
            <div class="map-popup-list-row">
                <label>Zugang</label>
                <span>${item.tags.access || "keine Angabe"}</span>
            </div>
            <div class="map-popup-list-row">
                <label>Gebühr</label>
                <span>${item.tags.fee || "keine Angabe"}</span>
            </div>
            <div class="map-popup-list-row">
                <label>Kapazität</label>
                <span>${item.tags.capacity || "keine Angabe"}</span>
            </div>
            <div class="map-popup-list-row">
                <label>Typ</label>
                <span>${item.tags.parking || "keine Angabe"}</span>
            </div>
            <div class="map-popup-list-row">
                <label>Operator</label>
                <span>${item.tags.operator || "keine Angabe"}</span>
            </div>
    `;
  // Add hidden information
  for (const [key, value] of Object.entries(item.tags || {})) {
    if (
      key === "name" ||
      key === "access" ||
      key === "capacity" ||
      key === "fee" ||
      key === "parking" ||
      key === "operator"
    ) {
      // Information already shown
      continue;
    }
    popupHtml += `
            <div class="map-popup-list-row map-popup-list-row-extendable hidden-force">
                <label>${key}</label>
                <span>${value}</span>
            </div>
        `;
  }
  popupHtml += `
        </div>
        <button class="map-popup-more" onclick="extendPopupLabelList(${item.id})">mehr
        </button>
        <a class="map-popup-nav-button" href=${navigationURL} target="_blank" style="background-color:${popupColor};">
            Navigieren
        </a>
    </div>
    `;
  return popupHtml;
}

function extendPopupLabelList(itemId) {
  const popupDiv = document.querySelector(`[data-popup-id="${itemId}"]`);
  const buttonDiv = popupDiv.querySelector(".map-popup-more");
  const isExtended = buttonDiv.innerHTML === "weniger";
  if (isExtended) {
    buttonDiv.innerHTML = "mehr";
  } else {
    buttonDiv.innerHTML = "weniger";
  }

  const popupListRowDivs = popupDiv.querySelectorAll(
    ".map-popup-list-row-extendable"
  );

  if (isExtended) {
    popupListRowDivs.forEach((row) => {
      row.classList.add("hidden-force");
    });
  } else {
    popupListRowDivs.forEach((row) => {
      row.classList.remove("hidden-force");
    });
  }
}
