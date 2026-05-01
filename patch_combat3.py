#!/usr/bin/env python3
import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

# 1. Update showQCM
old_showQCM = """  showQCM: function() {
    this.log("Piratage QCM en cours...");"""

new_showQCM = """  showQCM: function() {
    this.log("Piratage QCM en cours...");
    this.combatMenuState = 'QCM';
    this.updateUI();"""

text = text.replace(old_showQCM, new_showQCM)

# 2. Add currentQCM assignment
old_q_assign = """    const q = questions[Math.floor(Math.random() * questions.length)];

    let html = `<h3>PIRATAGE SYSTÈME (QCM)</h3>"""

new_q_assign = """    const q = questions[Math.floor(Math.random() * questions.length)];
    this.currentQCM = { optionsCount: q.options.length, ans: q.ans };

    let html = `<h3>PIRATAGE SYSTÈME (QCM)</h3>"""

text = text.replace(old_q_assign, new_q_assign)

# 3. Add keyboard shortcut hint to QCM options
old_btn = """        html += `<button onclick="COMBAT.answerQCM(${idx}, ${q.ans})" style="display:block; width:100%; margin:8px 0; padding:10px; background:#111; color:#00ffcc; border:1px solid #00ffcc; cursor:pointer; font-size:14px; transition:0.2s;" onmouseover="this.style.background='#00ffcc';this.style.color='black';" onmouseout="this.style.background='#111';this.style.color='#00ffcc';">${opt}</button>`;"""

new_btn = """        html += `<button onclick="COMBAT.answerQCM(${idx}, ${q.ans})" style="display:block; width:100%; margin:8px 0; padding:10px; background:#111; color:#00ffcc; border:1px solid #00ffcc; cursor:pointer; font-size:14px; transition:0.2s;" onmouseover="this.style.background='#00ffcc';this.style.color='black';" onmouseout="this.style.background='#111';this.style.color='#00ffcc';">[${idx+1}] ${opt}</button>`;"""

text = text.replace(old_btn, new_btn)

# 4. Update handleInput to process QCM keys and ignore Escape if in QCM
old_input_start = """  handleInput: function(evt) {
    if (this.turn !== 'PLAYER') return;
    const key = (evt.key || "").trim();
    
    // Raccourcis pour faire RETOUR
    if (key === "0" || evt.key === "Escape" || evt.key === "Backspace") {
        if (this.combatMenuState !== 'MAIN') {"""

new_input_start = """  handleInput: function(evt) {
    if (this.turn !== 'PLAYER') return;
    const key = (evt.key || "").trim();
    
    // Raccourcis pour faire RETOUR
    if (key === "0" || evt.key === "Escape" || evt.key === "Backspace") {
        if (this.combatMenuState === 'QCM') return; // Impossible d'annuler un QCM
        if (this.combatMenuState !== 'MAIN') {"""

text = text.replace(old_input_start, new_input_start)

# 5. Add QCM logic to handleInput
old_input_end = """    else if (this.combatMenuState === 'CHARGED_STRIKE') {
        const maxPa = this.playerEntity.pa || 0;
        if (num >= 1 && num <= maxPa) {
            this.executeChargedStrike(num);
        }
    }
  },"""

new_input_end = """    else if (this.combatMenuState === 'CHARGED_STRIKE') {
        const maxPa = this.playerEntity.pa || 0;
        if (num >= 1 && num <= maxPa) {
            this.executeChargedStrike(num);
        }
    }
    else if (this.combatMenuState === 'QCM') {
        if (num >= 1 && num <= (this.currentQCM ? this.currentQCM.optionsCount : 4)) {
            this.answerQCM(num - 1, this.currentQCM.ans);
        }
    }
  },"""

text = text.replace(old_input_end, new_input_end)

# 6. Clear menu if in QCM state
old_render_main = """    // === MENU PRINCIPAL ===
    const cards = this.getAvailableAbilityCards();"""

new_render_main = """    // === MENU PRINCIPAL ===
    if (this.combatMenuState === 'QCM') {
        menu.innerHTML = "";
        return;
    }

    const cards = this.getAvailableAbilityCards();"""

text = text.replace(old_render_main, new_render_main)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch v3 applied successfully!")
