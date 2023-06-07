;(function () {
  async function main() {
    const { base64urlToBuffer, bufferToBase64url } = window
    const dataElement = document.querySelector('div[data-public-key-options]')
    const publicKeyOptions = JSON.parse(atob(dataElement.dataset.publicKeyOptions))

    publicKeyOptions.challenge = base64urlToBuffer(publicKeyOptions.challenge)
    publicKeyOptions.user.id = base64urlToBuffer(publicKeyOptions.user.id)

    try {
      const pkCredObj = await navigator.credentials.create({ publicKey: publicKeyOptions })
      const publicKeyCredential = {
        authenticatorAttachment: pkCredObj.authenticatorAttachment,
        id: pkCredObj.id,
        rawId: bufferToBase64url(pkCredObj.rawId),
        response: {
          attestationObject: bufferToBase64url(pkCredObj.response.attestationObject),
          clientDataJSON: bufferToBase64url(pkCredObj.response.clientDataJSON),
        },
        type: pkCredObj.type,
      }

      const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKeyCredential }),
      })
      const result = await response.json()
      document.querySelector('#webauthn_id').textContent = result.webauthn_id
      document.querySelector('#public_key').textContent = result.public_key
    } catch (err) {
      document.querySelector('#webauthn_id').textContent = 'Error occured. Please try again.'
      document.querySelector('#public_key').textContent = ''
      console.log(err)
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('body.signup') !== null) {
      main()
    }
  })
})();
