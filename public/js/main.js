$(document).ready(function() {
  initRSAkeyUI();
  initFileEncryptionService();
});


/* -------- RSA Key Gen Service --------- */

function initRSAkeyUI() {
  const $rsaForm = $('#rsa-form')
  $rsaForm.on('submit', evt => { 
    // TODO: escape user input
    const passphrase = $('#passphrase').val();
    $('#passphrase').val('')

    genRSA(passphrase)

    // return false to prevent page refresh
    return false;
  });

  $('#gen-new-key').on('submit', () => {
    $('#gen-new-key').hide();
    $('#rsa-form').show();
    return false;
  });
}

function genRSA(passphrase) {
  // gen RSA key and public key with passphrase
  const RSAkey = cryptico.generateRSAKey(passphrase, 1024);
  const pubKey = cryptico.publicKeyString(RSAkey);

  // init download of private key
  downloadKey(RSAkey);

  // send public key to DB to be saved
  saveKeyToDB(pubKey);

  disableDownload();
}

function disableDownload() {
  $('#rsa-form').hide();
  $('#gen-new-key').show();
}

function saveKeyToDB(key) {
  const email = $('#user-email').val();
  const body = {
    key: key,
    email: email
  }

  fetch('/rsa', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}


// TODO: cryptico library creates an RSA object. Need to ID how to convert that object into a private key string 
function downloadKey(key) {
  var blob = new Blob([JSON.stringify(key)], {type : 'octet/stream'});
  blob = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', blob);
  a.setAttribute('download', 'RSAkey.txt');
  a.click()
  window.URL.revokeObjectURL(blob)
}



/* -------- File Encryption Service --------- */

function initFileEncryptionService() {
  $('#file-upload').on('submit', () => {
    const files = $('#files').files;
    const publicKey = getEncryptKey(); 
    readFile(files, publicKey)

    return false;
  })
}

function getEncryptKey() {
  // TODO!
  const key = null; // temporary

  // get public key from db
  // or prompt user to provide private key, and regen public key using cryptico

  return key;
}


function readFile(files, publicKey) {
  for (let file in files) {
    let reader = new FileReader()
    reader.onload = () => {
      const fileContent = JSON.parse(reader.result);
      // encrypt file content
      const encryptedContent = cryptico.encrypt(fileContent, publicKey);
      
      // TODO: overwrite original with encryptedContent


      // make file available for download
      fileDownloadAvailable();
    }
    if (typeof files[file] !== 'object') { continue; }
    reader.readAsText(files[file])
  }
}

function fileDownloadAvailable() {
  // TODO: UI!
}

function downloadFile() {
  // TODO ---
}


