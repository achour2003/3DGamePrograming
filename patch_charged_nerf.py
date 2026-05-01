import sys, re

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

# 1. Add getPaMultiplier to COMBAT
if "getPaMultiplier:" not in text:
    old_calc = """  calcDamage: function(attacker, defender, skill) {"""
    new_calc = """  getPaMultiplier: function(pa) {
      if (pa <= 0) return 1.0;
      const mults = [1.0, 1.3, 1.65, 2.0, 2.35, 2.6, 2.8, 2.95, 3.1, 3.2];
      if (pa < mults.length) return mults[pa];
      return 3.2 + (pa - 9) * 0.1;
  },

  calcDamage: function(attacker, defender, skill) {"""
    text = text.replace(old_calc, new_calc)

# 2. Update renderAbilityMenu
text = text.replace('Dégâts x ${(Math.pow(1.3, i)).toFixed(2)}', 'Dégâts x ${COMBAT.getPaMultiplier(i).toFixed(2)}')
text = text.replace('Dégâts x ${(Math.pow(1.3, maxPa)).toFixed(2)}', 'Dégâts x ${COMBAT.getPaMultiplier(maxPa).toFixed(2)}')

# 3. Update executeChargedStrike
text = text.replace('const dmg = Math.floor(baseDmg * Math.pow(1.3, paInvested));', 'const dmg = Math.floor(baseDmg * this.getPaMultiplier(paInvested));')

# 4. Update enemyAI
text = text.replace('const dmg = Math.floor(baseDmg * Math.pow(1.3, paInvested));', 'const dmg = Math.floor(baseDmg * this.getPaMultiplier(paInvested));')


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Nerf patch applied successfully!")
