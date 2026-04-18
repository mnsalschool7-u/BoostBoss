const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const availabilityPill = document.getElementById("availability-pill");
const orderForm = document.getElementById("order-form");
const orderScreen = document.getElementById("order-screen");
const confirmationScreen = document.getElementById("confirmation-screen");
const confirmationLocation = document.getElementById("confirmation-location");
const confirmationType = document.getElementById("confirmation-type");
const confirmationPayment = document.getElementById("confirmation-payment");
const confirmationSendTo = document.getElementById("confirmation-send-to");
const newOrderButton = document.getElementById("new-order-button");
const checkoutMessage = document.getElementById("checkout-message");
const locationTypeInputs = document.querySelectorAll('input[name="locationType"]');
const dormFields = document.getElementById("dorm-fields");
const dormRoomGroup = document.getElementById("dorm-room-group");
const dormBuildingSelect = document.getElementById("dorm-building");
const roomNumberInput = document.getElementById("room-number");
const dormPaymentNote = document.getElementById("dorm-payment-note");
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
const squareNote = document.getElementById("square-note");
const digitalPaymentNote = document.getElementById("digital-payment-note");
const orderScreenshotInput = document.getElementById("order-screenshot");
const submitButton = orderForm.querySelector('button[type="submit"]');
const feedbackForm = document.getElementById("feedback-form");
const feedbackSubmitButton = document.getElementById("feedback-submit-button");
const feedbackMessageStatus = document.getElementById("feedback-message-status");
const buttonDefaultLabels = new Map([[submitButton, submitButton.textContent]]);

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

function renderAvailabilityState(isOpen) {
  statusDot.style.background = isOpen ? "var(--green-500)" : "var(--red)";
  statusDot.style.boxShadow = isOpen
    ? "0 0 0 6px rgba(31, 143, 95, 0.16)"
    : "0 0 0 6px rgba(201, 75, 75, 0.16)";
  statusText.textContent = isOpen ? "Runners available" : "No runners available";
  availabilityPill.textContent = isOpen ? "Live" : "Offline";
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
  const isVanWinkle = isDorm && dormBuildingSelect.value === "Van Winkle Hall";

  dormFields.classList.toggle("hidden", !isDorm);
  dormRoomGroup.classList.toggle("hidden", !isDorm);
  buildingFields.classList.toggle("hidden", isDorm);
  classroomGroup.classList.toggle("hidden", isDorm);
  vanWinkleGroup.classList.toggle("hidden", !isVanWinkle);

  dormBuildingSelect.required = isDorm;
  roomNumberInput.required = isDorm;
  buildingSelect.required = !isDorm;
  classroomDetailsInput.required = !isDorm;
  vanWinkleCommunityInput.required = isVanWinkle;

  if (isDorm) {
    buildingSelect.value = "";
    classroomDetailsInput.value = "";
  } else {
    dormBuildingSelect.value = "";
    roomNumberInput.value = "";
    vanWinkleCommunityInput.value = "";
  }

  if (!isVanWinkle) {
    vanWinkleCommunityInput.value = "";
  }
}

function syncDeliveryFields() {
  const selectedType = orderForm.querySelector('input[name="deliveryType"]:checked').value;
  const detailConfig = {
    "Straight to dorm (if before 9pm)": {},
    "Drop off at building door": {
      label: "Which building door should we drop at?",
      placeholder: "Try to include the door number",
      note: "Drop off at building door only applies if you send payment through Apple Pay or Venmo upon filling out the form.",
    },
    "Meet outside": {
      label: "Where should we meet?",
      placeholder: "Door number, general pointers, or meetup spot",
    },
    "In class": {
      label: "Class number",
      placeholder: "Enter your class number",
    },
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
  squareNote.classList.toggle("hidden", selectedPayment !== "Square");
  digitalPaymentNote.classList.toggle(
    "hidden",
    selectedPayment !== "Venmo" && selectedPayment !== "Apple Pay"
  );
}

function getLocationSummary(data) {
  const locationType = data.locationType;

  if (locationType === "Dorm") {
    const community = data.vanWinkleCommunity ? `, ${data.vanWinkleCommunity}` : "";
    return `${data.dormBuilding} Room ${data.roomNumber}${community}`;
  }

  return `${data.building} - ${data.classroomDetails}`;
}

function showConfirmation(data) {
  confirmationLocation.textContent = data.locationSummary || getLocationSummary(data);
  const deliveryDetails = data.deliveryDetails;
  const deliveryType = data.deliveryType;
  confirmationType.textContent = deliveryDetails ? `${deliveryType} - ${deliveryDetails}` : deliveryType;
  confirmationPayment.textContent = data.paymentMethod;
  confirmationSendTo.textContent = "571-619-4416";

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
    roomNumber: formData.get("roomNumber") || "",
    vanWinkleCommunity: formData.get("vanWinkleCommunity") || "",
    building: formData.get("building") || "",
    classroomDetails: formData.get("classroomDetails") || "",
    orderedFrom: formData.get("orderedFrom"),
    phone: formData.get("phone"),
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
deliveryTypeInputs.forEach((input) => input.addEventListener("change", syncDeliveryFields));
paymentMethodInputs.forEach((input) => input.addEventListener("change", syncPaymentFields));

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
        name: formData.get("name") || "Anonymous",
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
  syncPaymentFields();
  setButtonsDisabled(false);
  setMessage("");
  orderScreenshotInput.value = "";
});

loadAvailabilityState();
syncLocationFields();
syncDeliveryFields();
syncPaymentFields();
