import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

old_str = """    let totalItems = 0;
    for (let k in this.playerEntity.inventory) totalItems += this.playerEntity.inventory[k];
    const potEl = document.getElementById("cPot");
    if (potEl) potEl.textContent = totalItems;

    this.renderAbilityMenu();
  },"""

new_str = """    let totalItems = 0;
    for (let k in this.playerEntity.inventory) totalItems += this.playerEntity.inventory[k];
    const potEl = document.getElementById("cPot");
    if (potEl) potEl.textContent = totalItems;

    const menu = document.getElementById("cMenu");
    if (menu) {
      menu.style.opacity = (this.turn === 'PLAYER') ? "1" : "0.3";
      this.renderAbilityMenu();
    }
  },"""

text = text.replace(old_str, new_str)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Opacity fixed!")
