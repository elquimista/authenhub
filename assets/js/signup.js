;(function () {
  async function useUsernamePasswordPair(e) {
    e.preventDefault()
    const formdata = new FormData(e.target)

    try {
      const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formdata.get('username'),
          password: formdata.get('password'),
        }),
      })
      const result = await response.json()
      document.querySelector('#password_hash').textContent = result.password_hash
      document.querySelector('#otp_secret').textContent = result.otp_secret
    } catch (err) {
      document.querySelector('#password_hash').textContent = 'Error occured. Please try again.'
      console.log(err)
    }
  }

  async function usePasskey() {
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
      document.getElementById('usernamePasswordSignupForm').addEventListener('submit', useUsernamePasswordPair)
      document.getElementById('btnUsePasskey').addEventListener('click', usePasskey)
    }
  })
})();
