const fs = require('fs');
// Very naive search in a binary file for string "idle"
const buffer = fs.readFileSync('mannequins/SKM_Manny_Simple.glb');
const str = buffer.toString('utf8');
const idles = str.match(/.{0,10}idle.{0,10}/gi);
console.log(idles);