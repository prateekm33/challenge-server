$(document).ready(function() {
  initRSAkeyUI();
  initFileEncryptionService();
  initFileDecryptionService();
});


/* -------- RSA Key Gen Service --------- */

function initRSAkeyUI() {
  const $rsaForm = $('#rsa-form')
  $rsaForm.on('submit', evt => { 
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
  const formattedKey = formatRSAkey(RSAkey)
  download('RSAkey.txt', formattedKey);

  // send public key to DB to be saved
  saveKeyToDB(pubKey);

  disableDownload();
}

function formatRSAkey(RSAkey) {
  // any formatting prior to download needs to be done here
  const formattedKey = cryptico.privateKeyString(RSAkey);

  return formattedKey;
}

function disableDownload(form) {
  switch (form) {
    case 'rsa':
      $('#rsa-form').hide();
      $('#gen-new-key').show();
      return;
    case 'encryption':
      $('#download-file').hide()
      $('#file-upload').show();
      return;
    case 'decrypt':
      $('#download-decrypt-file').hide();
      $('#decrypt-file-upload').show();
      return;
    default:
      $('#rsa-form').hide();
      $('#gen-new-key').show();
      return;
  }
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


function download(filename = 'sample.txt', data) {
  if (!data) {
    // TODO: Better null handling
    return null;
  }


  var blob = new Blob([JSON.stringify(data)], {type : 'octet/stream'});
  blob = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', blob);
  a.setAttribute('download', filename);
  a.click()
  window.URL.revokeObjectURL(blob)


}



/* -------- File Encryption Service --------- */

function initFileEncryptionService() {

  $('#file-upload').on('submit', e => {
    e.preventDefault()

    const file = $('#files')[0].files[0];
    getEncryptKey()
      .then(key => { 
        encryptFile(file, key);
      });

  });

  $('#download-file').on('click', () => {
    $('#download-file').hide();
    $('#file-upload').show();
    download('sample_encrypted.txt', encryptedFile.cipher);
    disableDownload('encryption');
  })
}

function getEncryptKey() {
  const email = $('#user-email-input').val()
  return fetch('/rsa?email=' + email)
    .then(res => res.json())
    .then(res => res.key)
    .catch(e => { 
      console.log('[ERROR]: ', e);
      return false;
    });
}

let encryptedFile = {};


function encryptFile(file, publicKey) {

  readFile(file, encryptHelper);

  function encryptHelper() {
    // encrypt file content
    encryptedFile = cryptico.encrypt(this.result, publicKey);
    // make file available for download
    if (encryptedFile.status === 'success') {
      fileDownloadAvailable();
    }
    $('#files').val('')
  }
}

function fileDownloadAvailable() {
  $('#file-upload').hide();
  $('#download-file').show();
}




/*---------- Decrypting Service -----------*/

function initFileDecryptionService() {
  $('#decrypt-file-upload').on('submit', e => {
    e.preventDefault();

    const keyFile = $('#privateKey')[0].files[0];
    readFile(keyFile, function() {
      const _RSAkey = cryptico.privateKeyFromString(this.result);
      const file = $('#decrypt-file')[0].files[0];
      decryptFile(file, _RSAkey);
      
      $('#privateKey').val('')
      $('#decrypt-file').val('')
    })

  })

  $('#download-decrypt-file').click(() => {
    download('decrypted_message.txt', decryptedMessage);
    disableDownload('decrypt');
  });

}

let decryptedMessage = '';

function decryptFile(file, RSAkey) {
  readFile(file, decryptHelper)

  function decryptHelper() {
    const decryptedTextObj = cryptico.decrypt(this.result, RSAkey);
    decryptedMessage = decryptedTextObj.plaintext;
    // TODO: HANDLE UI FOR DECRYPT FILE AVAILABLE FOR DOWNLOAD

    if (decryptedTextObj.status === 'success') {
      decryptedAvailableForDL();
    }
  }
}

function decryptedAvailableForDL() {
  $('#decrypt-file-upload').hide();
  $('#download-decrypt-file').show();
}



/* ------------ Helper Functions -------------*/

function readFile(file, callback) {
  let reader = new FileReader();
  reader.onload = callback;
  reader.readAsText(file);
}


cryptico.privateKeyString = (rsakey) => {
  const obj = {};
  const options = ['n', 'e', 'd', 'p', 'q', 'dmp1', 'dmq1', 'coeff'];

  options.forEach(opt => {
    obj[opt] = cryptico.b16to64(rsakey[opt].toString(16))
  })

  return obj;
}

cryptico.privateKeyFromString = (string) => {
  const obj = JSON.parse(string)

  const rsa = new RSAKey();

  for (let key in obj) {
    rsa[key] = parseBigInt(cryptico.b64to16(obj[key].split('|')[0]), 16);
  }

  rsa.e = parseInt("03", 16);

  return rsa;
}