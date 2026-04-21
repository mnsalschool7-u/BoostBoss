const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const availabilityPill = document.getElementById("availability-pill");
const statusCard = document.querySelector(".status-card");
const sleepyScene = document.getElementById("sleepy-scene");
const orderForm = document.getElementById("order-form");
const orderScreen = document.getElementById("order-screen");
const confirmationScreen = document.getElementById("confirmation-screen");
const confirmationLocation = document.getElementById("confirmation-location");
const confirmationType = document.getElementById("confirmation-type");
const confirmationPayment = document.getElementById("confirmation-payment");
const confirmationSendToLabel = document.getElementById("confirmation-send-to-label");
const confirmationSendTo = document.getElementById("confirmation-send-to");
const newOrderButton = document.getElementById("new-order-button");
const checkoutMessage = document.getElementById("checkout-message");
const locationTypeInputs = document.querySelectorAll('input[name="locationType"]');
const dormFields = document.getElementById("dorm-fields");
const dormRoomGroup = document.getElementById("dorm-room-group");
const dormBuildingSelect = document.getElementById("dorm-building");
const roomNumberInput = document.getElementById("room-number");
const afterHoursGroup = document.getElementById("after-hours-group");
const dormPaymentNote = document.getElementById("dorm-payment-note");
const woodlandHillGroup = document.getElementById("woodland-hill-group");
const woodlandHillBuildingSelect = document.getElementById("woodland-hill-building");
const vanWinkleGroup = document.getElementById("van-winkle-group");
const vanWinkleCommunityInput = document.getElementById("van-winkle-community");
const buildingFields = document.getElementById("building-fields");
const buildingSelect = document.getElementById("building");
const classroomGroup = document.getElementById("classroom-group");
const classroomDetailsInput = document.getElementById("classroom-details");
const deliveryTypeInputs = document.querySelectorAll('input[name="deliveryType"]');
const deliveryDetailsGroup = document.getElementById("delivery-details-group");
const deliveryDetailsLabel = document.getElementById("delivery-details-label");
const deliveryDetailsInput = document.getElementById("delivery-details");
const deliveryDetailsNote = document.getElementById("delivery-details-note");
const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
const promoCodeInput = document.getElementById("promo-code");
const promoStatus = document.getElementById("promo-status");
const squareNote = document.getElementById("square-note");
const squareOnlineNote = document.getElementById("square-online-note");
const promoPaymentNote = document.getElementById("promo-payment-note");
const digitalPaymentNote = document.getElementById("digital-payment-note");
const venmoLink = document.getElementById("venmo-link");
const applePayInstructions = document.getElementById("apple-pay-instructions");
const messagesLink = document.getElementById("messages-link");
const applePaySquareLink = document.getElementById("apple-pay-square-link");
const squareLink = document.getElementById("square-link");
const deliveryFeePrice = document.getElementById("delivery-fee-price");
const deliveryFeeFill = document.getElementById("delivery-fee-fill");
const orderScreenshotInput = document.getElementById("order-screenshot");
const submitButton = orderForm.querySelector('button[type="submit"]');
const feedbackForm = document.getElementById("feedback-form");
const feedbackSubmitButton = document.getElementById("feedback-submit-button");
const feedbackMessageStatus = document.getElementById("feedback-message-status");
const buttonDefaultLabels = new Map([[submitButton, submitButton.textContent]]);
let runnersAvailable = false;
let manualRunnersAvailable = false;
const FREE_DELIVERY_CODE = "CODE";

function getEasternMinutesSinceMidnight() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0) % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);

  return hour * 60 + minute;
}

function isBoostBossSleeping() {
  const minutes = getEasternMinutesSinceMidnight();

  return minutes >= 30 && minutes < 7 * 60;
}

function isDormAccessAfterHours() {
  const minutes = getEasternMinutesSinceMidnight();

  return minutes >= 21 * 60 || minutes < 30;
}

function setMessage(message) {
  checkoutMessage.textContent = message;
  checkoutMessage.classList.toggle("hidden", !message);
}

function setButtonsDisabled(disabled, activeButton) {
  buttonDefaultLabels.forEach((label, button) => {
    button.disabled = disabled;
    button.textContent = disabled && button === activeButton ? "Submitting order..." : label;
  });
}

function setFeedbackMessage(message) {
  feedbackMessageStatus.textContent = message;
  feedbackMessageStatus.classList.toggle("hidden", !message);
}

function hasFreeDeliveryPromo(code = promoCodeInput?.value || "") {
  return code.trim().toUpperCase() === FREE_DELIVERY_CODE;
}

function syncPromoState() {
  const promoApplied = hasFreeDeliveryPromo();

  deliveryFeePrice.textContent = promoApplied ? "$0 flat rate" : "$3 flat rate";
  deliveryFeeFill.style.width = promoApplied ? "0%" : "100%";
  deliveryFeeFill.style.background = promoApplied
    ? "linear-gradient(90deg, var(--green-300), var(--green-100))"
    : "";

  promoStatus.textContent = promoApplied
    ? "Promo applied. Delivery fee is now $0."
    : promoCodeInput.value.trim()
      ? "Promo code not recognized."
      : "";
  promoStatus.classList.toggle("hidden", !promoStatus.textContent);
}

function renderAvailabilityState(isOpen) {
  manualRunnersAvailable = isOpen;

  const isSleeping = isBoostBossSleeping();
  const canOrder = isOpen && !isSleeping;
  runnersAvailable = canOrder;

  statusCard.classList.toggle("sleeping-state", isSleeping);
  sleepyScene.classList.toggle("hidden", !isSleeping);
  statusDot.style.background = canOrder ? "var(--green-500)" : "var(--red)";
  statusDot.style.boxShadow = canOrder
    ? "0 0 0 6px rgba(31, 143, 95, 0.16)"
    : "0 0 0 6px rgba(201, 75, 75, 0.16)";
  statusText.textContent = isSleeping
    ? "Boost Boss is sleeping"
    : isOpen
      ? "Runners available"
      : "No runners available";
  availabilityPill.textContent = isSleeping ? "Sleeping" : isOpen ? "Live" : "Offline";
  orderForm.classList.toggle("form-disabled", !canOrder);
  orderForm.querySelectorAll("input, select, textarea, button").forEach((field) => {
    field.disabled = !canOrder;
  });
  setMessage(
    canOrder
      ? ""
      : isSleeping
        ? "Boost Boss is sleeping from 12:30am to 7am. Orders reopen at 7am."
        : "Ordering is paused right now because no runners are available."
  );
}

async function loadAvailabilityState() {
  try {
    const response = await fetch("/api/status");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to load live availability.");
    }

    renderAvailabilityState(Boolean(payload.isOpen));
  } catch (_error) {
    renderAvailabilityState(false);
  }
}

function syncLocationFields() {
  const selectedType = orderForm.querySelector('input[name="locationType"]:checked').value;
  const isDorm = selectedType === "Dorm";
  const isBuilding = selectedType === "Babson building";
  const selectedDorm = dormBuildingSelect.value || dormBuildingSelect.selectedOptions[0]?.textContent || "";
  const isVanWinkle = isDorm && selectedDorm.toLowerCase().includes("van winkle");
  const isWoodlandHill = isDorm && selectedDorm.toLowerCase() === "woodland hill";

  dormFields.classList.toggle("hidden", !isDorm);
  woodlandHillGroup.classList.toggle("hidden", !isWoodlandHill);
  dormRoomGroup.classList.toggle("hidden", !isDorm);
  buildingFields.classList.toggle("hidden", !isBuilding);
  classroomGroup.classList.toggle("hidden", !isBuilding);
  vanWinkleGroup.classList.toggle("hidden", !isVanWinkle);

  dormBuildingSelect.required = isDorm;
  woodlandHillBuildingSelect.required = isWoodlandHill;
  roomNumberInput.required = isDorm;
  buildingSelect.required = isBuilding;
  classroomDetailsInput.required = isBuilding;
  vanWinkleCommunityInput.required = isVanWinkle;

  if (isDorm) {
    buildingSelect.value = "";
    classroomDetailsInput.value = "";
    if (!isWoodlandHill) {
      woodlandHillBuildingSelect.value = "";
    }
  } else if (isBuilding) {
    dormBuildingSelect.value = "";
    woodlandHillBuildingSelect.value = "";
    roomNumberInput.value = "";
    vanWinkleCommunityInput.value = "";
  }

  if (!isVanWinkle) {
    vanWinkleCommunityInput.value = "";
  }

  afterHoursGroup.classList.toggle("hidden", !isDormAccessAfterHours());
}

function syncDeliveryFields() {
  const selectedType = orderForm.querySelector('input[name="deliveryType"]:checked').value;
  const detailConfig = {
    "Straight to dorm (if before 9pm)": {},
    "Drop off at building door": {
      label: "Which building door should we drop at?",
      placeholder: "Try to include the door number",
      note: "Drop off at dorm/building door only applies upon sending payment at the same time of form submission.",
    },
    "Meet outside": {
      label: "Where should we meet?",
      placeholder: "Door number, general pointers, or meetup spot",
    },
    "In class/study room": {},
  };

  const config = detailConfig[selectedType];
  const needsDetails = Boolean(config && (config.label || config.placeholder));
  const showDormPaymentNote = selectedType === "Straight to dorm (if before 9pm)";

  deliveryDetailsGroup.classList.toggle("hidden", !needsDetails);
  deliveryDetailsInput.required = needsDetails;
  dormPaymentNote.classList.toggle("hidden", !showDormPaymentNote);

  if (!needsDetails) {
    deliveryDetailsInput.value = "";
    deliveryDetailsInput.placeholder = "";
  } else {
    deliveryDetailsLabel.textContent = config.label;
    deliveryDetailsInput.placeholder = config.placeholder;
  }

  deliveryDetailsNote.textContent = config.note || "";
  deliveryDetailsNote.classList.toggle("hidden", !config.note);
}

function syncPaymentFields() {
  const selectedPayment = orderForm.querySelector('input[name="paymentMethod"]:checked').value;
  const promoApplied = hasFreeDeliveryPromo();
  squareNote.classList.toggle("hidden", selectedPayment !== "Square in person");
  squareOnlineNote.classList.toggle("hidden", selectedPayment !== "Card-Pay online" || promoApplied);
  promoPaymentNote.classList.toggle("hidden", !promoApplied);
  digitalPaymentNote.classList.toggle(
    "hidden",
    promoApplied || (selectedPayment !== "Venmo" && selectedPayment !== "Apple Cash / Messages")
  );
  venmoLink.classList.toggle("hidden", promoApplied || selectedPayment !== "Venmo");
  applePayInstructions.classList.toggle(
    "hidden",
    promoApplied || selectedPayment !== "Apple Cash / Messages"
  );
  messagesLink.classList.toggle("hidden", promoApplied || selectedPayment !== "Apple Cash / Messages");
  applePaySquareLink.classList.toggle(
    "hidden",
    promoApplied || selectedPayment !== "Apple Pay through Square"
  );
  squareLink.classList.toggle("hidden", promoApplied || selectedPayment !== "Card-Pay online");
}

function getLocationSummary(data) {
  const locationType = data.locationType;

  if (locationType === "Dorm") {
    const dormBuilding = data.woodlandHillBuilding || data.dormBuilding;
    const community = data.vanWinkleCommunity ? `, ${data.vanWinkleCommunity}` : "";
    return `${dormBuilding} Room ${data.roomNumber}${community}`;
  }

  return `${data.building} - ${data.classroomDetails}`;
}

function showConfirmation(data) {
  confirmationLocation.textContent = data.locationSummary || getLocationSummary(data);
  const deliveryDetails = data.deliveryDetails;
  const deliveryType = data.deliveryType;
  confirmationType.textContent = deliveryDetails ? `${deliveryType} - ${deliveryDetails}` : deliveryType;
  confirmationPayment.textContent = data.paymentMethod;
  confirmationSendToLabel.textContent = data.amountTotal === 0 ? "Delivery fee" : "Send to";
  confirmationSendTo.textContent = data.amountTotal === 0 ? "Promo applied - $0 due" : "571-619-4416";

  orderScreen.classList.add("hidden");
  confirmationScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getOrderData(formData) {
  return {
    customerName: formData.get("order"),
    deliveryType: formData.get("deliveryType"),
    deliveryDetails: formData.get("deliveryDetails") || "",
    locationType: formData.get("locationType"),
    dormBuilding: formData.get("dormBuilding") || "",
    woodlandHillBuilding: formData.get("woodlandHillBuilding") || "",
    roomNumber: formData.get("roomNumber") || "",
    afterHoursDetails: formData.get("afterHoursDetails") || "",
    vanWinkleCommunity: formData.get("vanWinkleCommunity") || "",
    building: formData.get("building") || "",
    classroomDetails: formData.get("classroomDetails") || "",
    orderedFrom: formData.get("orderedFrom"),
    phone: formData.get("phone"),
    promoCode: formData.get("promoCode") || "",
    paymentMethod: formData.get("paymentMethod"),
    screenshotPath: "",
  };
}

async function uploadScreenshot() {
  const file = orderScreenshotInput.files[0];

  if (!file) {
    throw new Error("Please upload a screenshot of your order before submitting.");
  }

  const uploadData = new FormData();
  uploadData.append("orderScreenshot", file);

  const response = await fetch("/api/upload-screenshot", {
    method: "POST",
    body: uploadData,
  });
  const payload = await response.json();

  if (!response.ok || !payload.screenshotPath) {
    throw new Error(payload.error || "Unable to upload your screenshot.");
  }

  return payload.screenshotPath;
}

async function submitManualOrder(activeButton) {
  if (isBoostBossSleeping()) {
    renderAvailabilityState(manualRunnersAvailable);
    return;
  }

  if (!runnersAvailable) {
    setMessage("Ordering is paused right now because no runners are available.");
    return;
  }

  if (!orderForm.reportValidity()) {
    return;
  }

  const formData = new FormData(orderForm);
  const orderData = getOrderData(formData);

  setMessage("");
  setButtonsDisabled(true, activeButton);

  try {
    orderData.screenshotPath = await uploadScreenshot();

    const response = await fetch("/api/manual-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to save your order.");
    }

    showConfirmation(payload);
    setButtonsDisabled(false);
  } catch (error) {
    setMessage(error.message || "Unable to submit your order right now.");
    setButtonsDisabled(false);
  }
}

locationTypeInputs.forEach((input) => input.addEventListener("change", syncLocationFields));
dormBuildingSelect.addEventListener("change", syncLocationFields);
dormBuildingSelect.addEventListener("input", syncLocationFields);
deliveryTypeInputs.forEach((input) => input.addEventListener("change", syncDeliveryFields));
paymentMethodInputs.forEach((input) => input.addEventListener("change", syncPaymentFields));
promoCodeInput.addEventListener("input", () => {
  syncPromoState();
  syncPaymentFields();
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitManualOrder(submitButton);
});

feedbackForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(feedbackForm);
  feedbackSubmitButton.disabled = true;
  feedbackSubmitButton.textContent = "Sending...";
  setFeedbackMessage("");

  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Anonymous",
        message: formData.get("message"),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to save suggestion.");
    }

    feedbackForm.reset();
    setFeedbackMessage("Thanks for the suggestion. We appreciate it.");
  } catch (error) {
    setFeedbackMessage(error.message || "Unable to send suggestion right now.");
  } finally {
    feedbackSubmitButton.disabled = false;
    feedbackSubmitButton.textContent = "Send suggestion";
  }
});

newOrderButton.addEventListener("click", () => {
  confirmationScreen.classList.add("hidden");
  orderScreen.classList.remove("hidden");
  orderForm.reset();
  loadAvailabilityState();
  syncLocationFields();
  syncDeliveryFields();
  syncPromoState();
  syncPaymentFields();
  setButtonsDisabled(false);
  setMessage("");
  orderScreenshotInput.value = "";
});

loadAvailabilityState();
syncLocationFields();
syncDeliveryFields();
syncPromoState();
syncPaymentFields();

setInterval(() => {
  renderAvailabilityState(manualRunnersAvailable);
  syncLocationFields();
}, 60 * 1000);
