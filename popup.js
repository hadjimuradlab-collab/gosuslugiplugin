const keys = {
  form1: ["lastName", "firstName", "middleName", "certificateNumber", "certificateDate"],
  form2: ["lastName", "firstName", "middleName", "snils"],
  form3: ["lastName", "firstName", "snils"],
  form4: ["name", "serial", "verificationNumber", "verificationDate"]
};

const fieldLabels = {
  form1: {
    lastName: "Фамилия",
    firstName: "Имя",
    middleName: "Отчество",
    certificateNumber: "№ аттестата",
    certificateDate: "Дата аттестата"
  },
  form2: {
    lastName: "Фамилия",
    firstName: "Имя",
    middleName: "Отчество",
    snils: "СНИЛС"
  },
  form3: {
    lastName: "Фамилия",
    firstName: "Имя",
    snils: "СНИЛС"
  },
  form4: {
    name: "Наименование",
    serial: "Серийный №",
    verificationNumber: "№ поверки",
    verificationDate: "Дата поверки"
  }
};

function getInputValue(form, field) {
  const input = document.getElementById(`${form.replace("form", "f")}_${field}`);
  return input?.value?.trim() || "";
}

function setInputValues(form, data = {}) {
  for (const field of keys[form]) {
    const input = document.getElementById(`${form.replace("form", "f")}_${field}`);
    if (input) input.value = data[field] || "";
  }
}

function formatEntry(form, item) {
  return keys[form]
    .filter((field) => item[field])
    .map((field) => `${fieldLabels[form][field]}: ${item[field]}`)
    .join(" · ");
}

async function loadEntries(form) {
  const { [form]: rawList } = await chrome.storage.local.get([form]);
  return Array.isArray(rawList) ? rawList : [];
}

async function saveEntries(form, list) {
  await chrome.storage.local.set({ [form]: list });
}

async function renderList(form) {
  const container = document.getElementById(`${form}_list`);
  if (!container) return;

  const list = await loadEntries(form);
  container.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Справочник пуст";
    container.appendChild(empty);
    return;
  }

  const sorted = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  for (const item of sorted) {
    const row = document.createElement("div");
    row.className = "entry";

    const text = document.createElement("div");
    text.className = "entry-text";
    text.textContent = formatEntry(form, item);

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "small-btn";
    editBtn.textContent = "Изменить";
    editBtn.addEventListener("click", () => {
      setInputValues(form, item);
      const saveButton = document.querySelector(`button[data-form='${form}']`);
      if (saveButton) {
        saveButton.dataset.editId = item.id;
        saveButton.textContent = "Сохранить изменения";
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "small-btn danger";
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener("click", async () => {
      const current = await loadEntries(form);
      const next = current.filter((entry) => entry.id !== item.id);
      await saveEntries(form, next);
      await renderList(form);
    });

    actions.append(editBtn, deleteBtn);
    row.append(text, actions);
    container.appendChild(row);
  }
}

document.querySelectorAll("button[data-form]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const form = btn.dataset.form;
    const data = {};
    for (const field of keys[form]) data[field] = getInputValue(form, field);

    const current = await loadEntries(form);
    const editId = btn.dataset.editId;

    if (editId) {
      const next = current.map((entry) =>
        entry.id === editId ? { ...entry, ...data, updatedAt: Date.now() } : entry
      );
      await saveEntries(form, next);
      delete btn.dataset.editId;
      btn.textContent = "Сохранить в справочник";
    } else {
      current.push({ ...data, id: crypto.randomUUID(), createdAt: Date.now() });
      await saveEntries(form, current);
      btn.textContent = "Сохранено";
      setTimeout(() => {
        if (!btn.dataset.editId) btn.textContent = "Сохранить в справочник";
      }, 900);
    }

    setInputValues(form, {});
    await renderList(form);
  });
});

Object.keys(keys).forEach((form) => renderList(form));
