const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

function readJson(fp){
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}
function writeJson(fp, obj){
  fs.writeFileSync(fp, JSON.stringify(obj, null, 2), 'utf8');
}

(async function(){
  const users = readJson(usersFile);
  let changed = false;
  for (const u of users) {
    if (typeof u.password === 'string' && !u.password.startsWith('$2')) {
      const hash = await bcrypt.hash(u.password, 10);
      u.password = hash;
      changed = true;
      console.log(`Hasheado usuario ${u.email}`);
    }
  }
  if (changed) {
    writeJson(usersFile, users);
    console.log('Usuarios actualizados con contraseñas hasheadas.');
  } else {
    console.log('No se encontraron contraseñas planas.');
  }
})();
