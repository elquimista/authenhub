require 'webauthn'

WebAuthn.configure do |config|
  # This value needs to match `window.location.origin` evaluated by
  # the User Agent during registration and authentication ceremonies.
  config.origin = ENV['WEBAUTHN_ORIGIN']

  # Relying Party name for display purposes
  config.rp_name = ENV['WEBAUTHN_RP_NAME']

  # Optionally configure a client timeout hint, in milliseconds.
  # This hint specifies how long the browser should wait for any
  # interaction with the user.
  # This hint may be overridden by the browser.
  # https://www.w3.org/TR/webauthn/#dom-publickeycredentialcreationoptions-timeout
  config.credential_options_timeout = 60_000
end
