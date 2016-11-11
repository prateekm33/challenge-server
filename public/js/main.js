$(document).ready(function() {
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
  })

});

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

  const body = {
    key: key
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
  console.log('key: ', key)
  var blob = new Blob([JSON.stringify(key)], {type : 'octet/stream'});
  blob = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', blob);
  a.setAttribute('download', 'RSAkey.txt');
  a.click()
  window.URL.revokeObjectURL(blob)
}