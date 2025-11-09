import { Debug } from "../Debug";
import { Peavy } from "../Peavy";

const registry = new Map();

function handleButton(e: Event) {
  const button = e.currentTarget as Element;
  let text = "";
  if (button.getAttribute("role") === "gridcell") {
    text = button.closest("[role='row']")?.textContent || "";
  }

  if (!text) {
    text = button.getAttribute("aria-label") || button.textContent || "";
  }
  if (!text) {
    text = button.parentElement?.getAttribute("aria-label") || "";
  }
  if (!text) {
    const svg = button.querySelector("svg");
    text = svg?.getAttribute("aria-label") || svg?.getAttribute("data-testid") || "";
  }
  if (!text) {
    const id = button.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        text = label.textContent || "";
      }
    }
  }
  if (!text) {
    text = button.getAttribute("placeholder") || "";
  }
  if (!text) {
    text = button.getAttribute("title") || button.id;
  }
  if (button.getAttribute("aria-haspopup")) {
    const labeledby = button.getAttribute("aria-labelledby");
    if (labeledby) {
      const labelElem = document.getElementById(labeledby);
      if (labelElem) {
        text += " " + (labelElem.textContent || "");
      }
    }
  }
  Peavy.i(`Click: ${text}`);
}

function handleLi(e: Event) {
  let li = e.target as Element;
  if (li.tagName !== "LI") {
    li = li.closest("li") as Element;
  }
  let text = li.getAttribute("aria-label") || li.textContent || "";
  if (!text) {
    const svg = li.querySelector("svg");
    text = svg?.getAttribute("aria-label") || svg?.getAttribute("data-testid") || "";
  }
  if (!text) {
    text = li.parentElement?.getAttribute("aria-label") || "";
  }
  if (!text) {
    text = li.id || "";
  }
  Peavy.i(`Item click: ${text}`);
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement;
  let text = input.name;
  if (!text) {
    // Find associated label
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        text = label.textContent || "";
      }
    }
  }
  if (!text) {
    const parentLabel = input.closest("label");
    if (parentLabel) {
      text = parentLabel.textContent || "";
    }
  }
  if (!text) {
    text = input.parentElement?.getAttribute("aria-label") || "";
  }
  let value = input.value;
  if (input.type === "checkbox" || input.type === "radio") {
    // Checkboxes in react don't reflect value immediately
    setTimeout(() => {
      value = input.checked ? "on" : "off";
      Peavy.i(`Input ${text} changed to: ${value}`);
    }, 50);
  } else {
    Peavy.i(`Input ${text} changed to: ${value}`);
  }
}

function attachButton(button: Element) {
  if (registry.has(button)) return;
  let event = "mouseup";
  if (button.tagName !== "BUTTON" && (button.getAttribute("role") !== "gridcell")) {
    event = "mousedown";
  }
  button.addEventListener(event, handleButton, { capture: true, passive: true });
  registry.set(button, true);
}

function attachLi(li: Element) {
  if (registry.has(li)) return;
  li.addEventListener("click", handleLi, { capture: true, passive: true });
  registry.set(li, true);
}

function attachInput(input: Element) {
  if (registry.has(input)) return;
  input.addEventListener("change", handleInput, { capture: true, passive: true });
  registry.set(input, true);
}

export function attachListeners() {
  let oldPath = document.location.pathname;
  const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {
    for (const mutation of mutationList) {
      if (oldPath != document.location.pathname) {
        oldPath = document.location.pathname;
        Peavy.i(`Url changed to ${oldPath}`);
      }
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === "BUTTON") {
              attachButton(element);
            } else {
              element.querySelectorAll("button, [role='button'], [role='gridcell'], [aria-haspopup], [aria-expanded]").forEach((button) => {
                attachButton(button);
              });
            }
            if (element.tagName === "LI") {
              attachLi(element);
            } else {
              element.querySelectorAll("li").forEach((li) => {
                attachLi(li);
              });
            }
            if (element.tagName === "INPUT" && element.getAttribute("type") !== "text") {
              attachInput(element);
            } else {
              element.querySelectorAll("input").forEach((input) => {
                if (input.type !== "text") {
                  attachInput(input);
                }
              });
            }
          }
        });
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(document.body, { childList: true, subtree: true });

  document.body.querySelectorAll("button, [role='button'], [role='gridcell'], [aria-haspopup], [aria-expanded]").forEach((button) => {
    attachButton(button);
  });
  document.body.querySelectorAll("li").forEach((li) => {
    attachLi(li);
  });
  document.body.querySelectorAll("input").forEach((input) => {
    if (input.type !== "text") {
      attachInput(input);
    }
  });
  Debug.log("Interaction listeners attached");
}
