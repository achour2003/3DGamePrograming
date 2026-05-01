import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

# 1. Update renderAbilityMenu
old_render = """    // === SOUS-MENU FRAPPE CHARGÉE ===
    if (this.combatMenuState === 'CHARGED_STRIKE') {
        let html = `<div style="color:white; font-family:monospace; margin-bottom:10px; font-weight:bold;">SÉLECTIONNEZ LES PA À INVESTIR</div>`;
        const maxPa = this.playerEntity.pa || 0;
        if (maxPa < 1) {
            html += `<p style="color:#ff4444; font-family:monospace;">Pas assez de PA !</p>`;
        } else {
            for (let i = 1; i <= maxPa; i++) {
                if (i > 9) break; 
                html += `
                  <div class="action-box" onclick="COMBAT.executeChargedStrike(${i})">
                    <span class="hotkey">${i}</span>
                    <div class="content">
                      <div class="act-name">Puissance Niv. ${i}</div>
                      <div class="act-desc">Dégâts x ${(Math.pow(1.3, i)).toFixed(2)} (-${i} PA)</div>
                    </div>
                  </div>
                `;
            }
        }
        html += `
          <div class="action-box" onclick="COMBAT.combatMenuState='MAIN'; COMBAT.updateUI();">
            <span class="hotkey">0</span>
            <div class="content">
              <div class="act-name">Retour / Annuler</div>
              <div class="act-desc">Touche 0 ou Échap</div>
            </div>
          </div>
        `;
        menu.innerHTML = html;
        return;
    }"""

new_render = """    // === SOUS-MENU FRAPPE CHARGÉE ===
    if (this.combatMenuState === 'CHARGED_STRIKE') {
        let html = `<div style="color:white; font-family:monospace; margin-bottom:10px; font-weight:bold;">SÉLECTIONNEZ LES PA À INVESTIR</div>`;
        const maxPa = this.playerEntity.pa || 0;
        if (maxPa < 1) {
            html += `<p style="color:#ff4444; font-family:monospace;">Pas assez de PA !</p>`;
        } else {
            for (let i = 1; i <= 8; i++) {
                if (i > maxPa) break;
                html += `
                  <div class="action-box" onclick="COMBAT.executeChargedStrike(${i})">
                    <span class="hotkey">${i}</span>
                    <div class="content">
                      <div class="act-name">Puissance Niv. ${i}</div>
                      <div class="act-desc">Dégâts x ${(Math.pow(1.3, i)).toFixed(2)} (-${i} PA)</div>
                    </div>
                  </div>
                `;
            }
            html += `
              <div class="action-box" onclick="COMBAT.executeChargedStrike(${maxPa})" style="border-color:#ff4444; box-shadow:0 0 8px #ff4444;">
                <span class="hotkey" style="color:#ff4444;">9</span>
                <div class="content">
                  <div class="act-name" style="color:#ff4444; font-weight:bold;">FRAPPE DÉVASTATRICE</div>
                  <div class="act-desc">Consomme TOUT (${maxPa} PA) -> Dégâts x ${(Math.pow(1.3, maxPa)).toFixed(2)}</div>
                </div>
              </div>
            `;
        }
        html += `
          <div class="action-box" onclick="COMBAT.combatMenuState='MAIN'; COMBAT.updateUI();">
            <span class="hotkey">0</span>
            <div class="content">
              <div class="act-name">Retour / Annuler</div>
              <div class="act-desc">Touche 0 ou Échap</div>
            </div>
          </div>
        `;
        menu.innerHTML = html;
        return;
    }"""

text = text.replace(old_render, new_render)

# 2. Update handleInput logic
old_input = """    else if (this.combatMenuState === 'CHARGED_STRIKE') {
        const maxPa = this.playerEntity.pa || 0;
        if (num >= 1 && num <= maxPa) {
            this.executeChargedStrike(num);
        }
    }"""

new_input = """    else if (this.combatMenuState === 'CHARGED_STRIKE') {
        const maxPa = this.playerEntity.pa || 0;
        if (num >= 1 && num <= 8) {
            if (num <= maxPa) {
                this.executeChargedStrike(num);
            }
        } else if (num === 9) {
            if (maxPa >= 1) {
                this.executeChargedStrike(maxPa);
            }
        }
    }"""

text = text.replace(old_input, new_input)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Charged strike patch applied!")
