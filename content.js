const FORMS = [
  {
    id: "form1",
    title: "Укажите сведения о проектировщике",
    mapping: {
      "Фамилия": "lastName",
      "Имя": "firstName",
      "Отчество": "middleName",
      "Номер квалификационного аттестата": "certificateNumber",
      "Дата квалификационного аттестата": "certificateDate"
    }
  },
  {
    id: "form2",
    title: "Укажите сведения об ответственном работнике",
    mapping: { "Фамилия": "lastName", "Имя": "firstName", "Отчество": "middleName", "СНИЛС": "snils" }
  },
  {
    id: "form3",
    title: "Укажите сведения о работниках",
    mapping: { "Фамилия": "lastName", "Имя": "firstName", "СНИЛС": "snils" }
  },
  {
    id: "form4",
    title: "Укажите сведения об оборудовании",
    mapping: {
      "Наименование": "name",
      "Заводской (серийный) номер": "serial",
      "Номер свидетельства о поверке": "verificationNumber",
      "Дата свидетельства о поверке": "verificationDate"
    }
  }
];

function triggerInput(el, value) {
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function findInputByLabelText(root, labelText) {
  const labels = Array.from(root.querySelectorAll("label, span, div, p"));
  const labelNode = labels.find((n) => n.textContent?.trim() === labelText);
  if (!labelNode) return null;

  if (labelNode.htmlFor) {
    const byFor = root.querySelector(`#${CSS.escape(labelNode.htmlFor)}`);
    if (byFor) return byFor;
  }

  const wrapper = labelNode.closest("label, div, section, article") || labelNode.parentElement;
  return wrapper?.querySelector("input, textarea") || null;
}

async function injectButtons() {
  for (const form of FORMS) {
    const titleNode = Array.from(document.querySelectorAll("h1,h2,h3,div,p,span")).find((n) =>
      n.textContent?.includes(form.title)
    );
    if (!titleNode) continue;
    if (titleNode.parentElement?.querySelector(`.gs-auto-btn[data-form='${form.id}']`)) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.form = form.id;
    btn.className = "gs-auto-btn";
    btn.textContent = "Автозаполнить из справочника";
    btn.style.cssText = "margin:8px 0;padding:6px 10px;background:#005bff;color:#fff;border:none;border-radius:6px;cursor:pointer";

    btn.addEventListener("click", async () => {
      const data = await chrome.storage.local.get([form.id]);
      const list = data[form.id] || [];
      if (!list.length) return alert("Справочник пуст. Добавьте запись в расширении.");
      const item = list[list.length - 1];

      const scope = titleNode.closest("section, form, div") || document;
      for (const [label, key] of Object.entries(form.mapping)) {
        const input = findInputByLabelText(scope, label) || findInputByLabelText(document, label);
        if (input) triggerInput(input, item[key] || "");
      }
    });

    titleNode.insertAdjacentElement("afterend", btn);
  }
}

const observer = new MutationObserver(() => injectButtons());
observer.observe(document.documentElement, { childList: true, subtree: true });
injectButtons();
