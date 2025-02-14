;(function () {
  async function useUsernamePasswordPair(e) {
    e.preventDefault()
    const formdata = new FormData(e.target)

    try {
      const response = await fetch(window.location.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formdata.get('username'),
          password: formdata.get('password'),
          otp: formdata.get('otp'),
        }),
      })
      const result = await response.json()
      window.location.href = result.redirect_uri
    } catch (err) {
      e.target.reset()
      document.querySelector('#error_message').textContent = 'Error occured. Please try again.'
      console.log(err)
    }
  }

  async function usePasskey() {
    const { base64urlToBuffer, bufferToBase64url } = window
    const dataElement = document.querySelector('div[data-public-key-options]')

    try {
      const publicKeyOptions = JSON.parse(atob(dataElement.dataset.publicKeyOptions))
      publicKeyOptions.challenge = base64urlToBuffer(publicKeyOptions.challenge)
      publicKeyOptions.allowCredentials.forEach(e => {
        e.id = base64urlToBuffer(e.id)
      })

      const fedCredObj = await navigator.credentials.get({ publicKey: publicKeyOptions })
      const publicKeyCredential = {
        authenticatorAttachment: fedCredObj.authenticatorAttachment,
        id: fedCredObj.id,
        rawId: bufferToBase64url(fedCredObj.rawId),
        response: {
          authenticatorData: bufferToBase64url(fedCredObj.response.authenticatorData),
          clientDataJSON: bufferToBase64url(fedCredObj.response.clientDataJSON),
          signature: bufferToBase64url(fedCredObj.response.signature),
          // userHandle: fedCredObj.response.userHandle,
          userHandle: '', // FIXME: prefer above line when webauthn-ruby releases a patch.
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
      document.getElementById('usernamePasswordLoginForm').addEventListener('submit', useUsernamePasswordPair)
      document.getElementById('btnUsePasskey').addEventListener('click', usePasskey)
    }
  })
})();
