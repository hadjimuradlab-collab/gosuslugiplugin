const keys = {
  form1: ["lastName", "firstName", "middleName", "certificateNumber", "certificateDate"],
  form2: ["lastName", "firstName", "middleName", "snils"],
  form3: ["lastName", "firstName", "snils"],
  form4: ["name", "serial", "verificationNumber", "verificationDate"]
};

document.querySelectorAll("button[data-form]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const form = btn.dataset.form;
    const data = {};
    for (const field of keys[form]) {
      const input = document.getElementById(`${form.replace('form', 'f')}_${field}`);
      data[field] = input?.value?.trim() || "";
    }

    const store = await chrome.storage.local.get([form]);
    const current = Array.isArray(store[form]) ? store[form] : [];
    current.push({ ...data, id: crypto.randomUUID(), createdAt: Date.now() });
    await chrome.storage.local.set({ [form]: current });

    btn.textContent = "Сохранено";
    setTimeout(() => (btn.textContent = "Сохранить в справочник"), 900);
  });
});
