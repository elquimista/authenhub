;(function () {
  // https://github.com/github/webauthn-json/blob/c54cbbf2491eccb7bbc176015242c1a39a831af6/src/webauthn-json/base64url.ts#L3-L21
  window.base64urlToBuffer = function (base64urlString) {
    // Base64url to Base64
    const padding = '=='.slice(0, (4 - (base64urlString.length % 4)) % 4)
    const base64String = base64urlString.replace(/-/g, '+').replace(/_/g, '/') + padding

    // Base64 to binary string
    const str = atob(base64String)

    // Binary string to buffer
    const buffer = new ArrayBuffer(str.length)
    const byteView = new Uint8Array(buffer)
    for (let i = 0; i < str.length; i++) {
      byteView[i] = str.charCodeAt(i)
    }

    return buffer
  }

  // https://github.com/github/webauthn-json/blob/c54cbbf2491eccb7bbc176015242c1a39a831af6/src/webauthn-json/base64url.ts#L23-L41
  window.bufferToBase64url = function (buffer) {
    // Buffer to binary string
    const byteView = new Uint8Array(buffer)
    let str = ''
    for (const charCode of byteView) {
      str += String.fromCharCode(charCode)
    }

    // Binary string to base64
    const base64String = btoa(str)

    // Base64 to base64url
    // We assume that the base64url string is well-formed.
    const base64urlString = base64String
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    return base64urlString
  }
})();
