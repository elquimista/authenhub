;(function () {
  async function main() {
    const { base64urlToBuffer, bufferToBase64url } = window
    const dataElement = document.querySelector('div[data-public-key-options]')
    const publicKeyOptions = JSON.parse(atob(dataElement.dataset.publicKeyOptions))

    publicKeyOptions.challenge = base64urlToBuffer(publicKeyOptions.challenge)
    publicKeyOptions.allowCredentials[0].id = base64urlToBuffer(publicKeyOptions.allowCredentials[0].id)

    try {
      const fedCredObj = await navigator.credentials.get({ publicKey: publicKeyOptions })
      const publicKeyCredential = {
        authenticatorAttachment: fedCredObj.authenticatorAttachment,
        id: fedCredObj.id,
        rawId: bufferToBase64url(fedCredObj.rawId),
        response: {
          authenticatorData: bufferToBase64url(fedCredObj.response.authenticatorData),
          clientDataJSON: bufferToBase64url(fedCredObj.response.clientDataJSON),
          signature: bufferToBase64url(fedCredObj.response.signature),
          userHandle: fedCredObj.response.userHandle,
        },
        type: fedCredObj.type,
      }

      const response = await fetch(window.location.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKeyCredential }),
      })
      const result = await response.json()
      window.location.href = result.redirect_uri
    } catch (err) {
      document.querySelector('#error_message').textContent = 'Error occured. Please try again.'
      console.log(err)
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('body.login') !== null) {
      main()
    }
  })
})();
