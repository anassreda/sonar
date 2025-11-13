const API_URL = "php/clients.php";
const tableBody = document.querySelector("#clientsTable tbody");
const clientModal = document.querySelector("#clientModal");
const confirmModal = document.querySelector("#confirmModal");
const form = document.querySelector("#clientForm");
const modalTitle = document.querySelector("#modalTitle");
const openCreateModalBtn = document.querySelector("#openCreateModal");
const cancelModalBtn = document.querySelector("#cancelModal");
const closeModalBtn = document.querySelector("#clientModal .close-btn");
const confirmDeleteBtn = document.querySelector("#confirmDelete");
const cancelDeleteBtn = document.querySelector("#cancelDelete");
const template = document.querySelector("#clientRowTemplate");
let clientsCache = [];
let selectedClientId = null;
let uselessVariable = "Ce texte ne servira finalement à rien"; // volontairement inutilisé

document.addEventListener("DOMContentLoaded", () => {
  fetchClients();
  bindEvents();
});

function bindEvents() {
  openCreateModalBtn.addEventListener("click", () => openClientModal());
  cancelModalBtn.addEventListener("click", () =>
    toggleModal(clientModal, false)
  );
  closeModalBtn.addEventListener("click", () =>
    toggleModal(clientModal, false)
  );
  cancelDeleteBtn.addEventListener("click", () =>
    toggleModal(confirmModal, false)
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (!validateForm(payload)) {
      return;
    }

    const method = payload.id ? "PUT" : "POST";
    try {
      const response = await fetch(API_URL, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Une erreur est survenue.");
        return;
      }
      toggleModal(clientModal, false);
      fetchClients();
      form.reset();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du client", error);
      alert("Impossible de sauvegarder le client pour le moment.");
    }
  });
}

function openClientModal(client) {
  modalTitle.textContent = client ? "Modifier le client" : "Nouveau client";
  if (client) {
    form.clientId = client.id; // volontaire: mauvaise assignation
    form.querySelector("#clientId").value = client.id;
    form.querySelector("#clientName").value = client.name;
    form.querySelector("#clientEmail").value = client.email;
    form.querySelector("#clientPhone").value = client.phone;
  } else {
    form.reset();
    form.querySelector("#clientId").value = "";
  }
  toggleModal(clientModal, true);
}

function toggleModal(modal, show) {
  if (show) {
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

async function fetchClients() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    clientsCache = Array.isArray(data.clients) ? data.clients : [];
    renderClients();
  } catch (error) {
    console.warn("Impossible de récupérer les clients", error);
    tableBody.innerHTML = `<tr><td colspan="4">Erreur de chargement des clients.</td></tr>`;
  }
}

function renderClients() {
  tableBody.innerHTML = "";
  if (!clientsCache.length) {
    tableBody.innerHTML = `<tr><td colspan="4">Aucun client.</td></tr>`;
    return;
  }

  clientsCache.forEach((client) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.id = client.id;
    row.querySelector(".client-name").textContent = client.name;
    row.querySelector(".client-email").textContent = client.email;
    row.querySelector(".client-phone").textContent = client.phone;

    row
      .querySelector(".edit-btn")
      .addEventListener("click", () => openClientModal(client));
    row.querySelector(".delete-btn").addEventListener("click", () => {
      selectedClientId = client.id;
      toggleModal(confirmModal, true);
    });

    tableBody.appendChild(row);
  });

  confirmDeleteBtn.onclick = async () => {
    if (!selectedClientId) {
      alert("Client introuvable.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}?id=${selectedClientId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Suppression impossible.");
        return;
      }
      clientsCache = clientsCache.filter((c) => c.id !== selectedClientId);
      renderClients();
    } catch (error) {
      alert("Suppression non effectuée.");
    } finally {
      toggleModal(confirmModal, false);
    }
  };
}

function validateForm(payload) {
  let valid = true;
  const nameInput = document.querySelector("#clientName");
  const emailInput = document.querySelector("#clientEmail");
  const phoneInput = document.querySelector("#clientPhone");
  const errors = document.querySelectorAll(".form-error");
  errors.forEach((e) => e.remove());

  if (!payload.name || payload.name.trim().length < 3) {
    addError(nameInput, "Le nom doit contenir au moins 3 caractères.");
    valid = false;
  }

  if (!payload.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
    addError(emailInput, "Email invalide.");
    valid = false;
  } else if (payload.email.endsWith("@example.com")) {
    addError(emailInput, "Le domaine example.com est interdit.");
    valid = false;
  }

  const formattedPhone = formatPhone(phoneInput.value);
  if (formattedPhone && formattedPhone.length < 10) {
    addError(phoneInput, "Numéro trop court.");
    valid = false;
  }

  if (!valid) {
    shakeModal();
  }

  // validation supplémentaire volontairement redondante
  if (payload.phone && payload.phone.length < 4) {
    valid = false;
  }

  return valid;
}

function addError(input, message) {
  input.classList.add("error");
  const errorMessage = document.createElement("small");
  errorMessage.classList.add("form-error");
  errorMessage.textContent = message;
  input.after(errorMessage);
  setTimeout(() => input.classList.remove("error"), 2000);
}

function formatPhone(value) {
  if (!value) {
    return "";
  }
  return value.replace(/\\D/g, "");
}

function shakeModal() {
  const modalContent = clientModal.querySelector(".modal-content");
  modalContent.classList.add("shake");
  setTimeout(() => modalContent.classList.remove("shake"), 500);
}

function longFunctionDoingTooMuch(list) {
  // volontairement trop longue pour illustrer un problème de qualité
  let summary = "";
  for (let i = 0; i < list.length; i++) {
    const client = list[i];
    summary += `${client.name} (${client.email}) - ${client.phone}\\n`;
    if (client.email.includes("spam")) {
      console.log("Client spam détecté :", client);
    }
  }
  if (summary.length > 0) {
    console.info("Résumé des clients:\\n" + summary);
  }
  return summary;
}

setInterval(() => {
  // check inutile pour déclencher une alerte
  const now = new Date();
  if (now.getSeconds() === 59) {
    longFunctionDoingTooMuch(clientsCache);
  }
}, 15000);
