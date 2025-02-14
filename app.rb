require 'roda'
require 'bcrypt'
require 'rotp'
require_relative './webauthn'

class App < Roda
  class AuthenticationError < StandardError; end

  plugin :json
  plugin :render

  plugin :assets,
    js: ['utils.js', 'login.js', 'signup.js'],
    precompiled: File.expand_path('../compiled_assets.json', __FILE__),
    gzip: true

  plugin :sessions, secret: ENV['SESSION_SECRET']
  plugin :content_for
  plugin :json_parser
  plugin :cookies

  def hostname
    request.env["HTTP_X_AUTHENHUB_HOST"] || request.host
  end

  def auth_cookie_name
    "auth-#{hostname.gsub('.', '-')}"
  end

  def set_cookie(value)
    response.set_cookie(auth_cookie_name,
      value: value,
      domain: ENV['COOKIE_DOMAIN'],
      path: '/',
      expires: Time.now + ENV.fetch('COOKIE_EXPIRES_IN', 3600).to_i,
      secure: true,
      httponly: true
    )
  end

  def admin_webauthn_creds
    JSON.parse(ENV['ADMIN_WEBAUTHN_CREDS'])
  end

  def admin_webauthn_ids
    admin_webauthn_creds.keys
  end

  def admin_password_pair_creds
    JSON.parse(ENV['ADMIN_PASSWORD_PAIR_CREDS'])
  end

  def admin_password_pair_usernames
    admin_password_pair_creds.keys
  end

  def logged_in?
    admin_webauthn_ids.include?(request.cookies[auth_cookie_name]) ||
    admin_password_pair_usernames.include?(request.cookies[auth_cookie_name])
  end

  route do |r|
    r.assets

    r.get 'auth' do
      if logged_in?
        'Authorized'
      else
        response.status = 401
        'Unauthorized'
      end
    end

    r.get 'login' do
      if logged_in?
        r.redirect r.params['redirect_uri'] if r.params['redirect_uri']
      else
        @options = WebAuthn::Credential.options_for_get(
          allow: admin_webauthn_ids
        )
        session['authentication_challenge'] = @options.challenge
        view 'login'
      end
    end

    r.post 'login' do
      if r.params['publicKeyCredential']
        webauthn_cred = WebAuthn::Credential.from_get(r.params['publicKeyCredential'])
        webauthn_cred.verify(
          session['authentication_challenge'],
          public_key: admin_webauthn_creds[webauthn_cred.id],
          sign_count: 0
        )
        set_cookie(webauthn_cred.id)
      else
        raise AuthenError unless admin_password_pair_usernames.include?(r.params['username'])
        raise AuthenError unless BCrypt::Password.new(admin_password_pair_creds[r.params['username']]['password_hash']) == r.params['password']
        raise AuthenError unless ROTP::TOTP.new(admin_password_pair_creds[r.params['username']]['otp_secret']).verify(r.params['otp'])
        set_cookie(r.params['username'])
      end
      { redirect_uri: r.params['redirect_uri'] }
    rescue WebAuthn::Error, AuthenticationError
      response.status = 401
      'Unauthorized'
    end

    r.get 'logout' do
      response.delete_cookie(auth_cookie_name, domain: ENV['COOKIE_DOMAIN'])
      'Logged out'
    end

    r.is 'signup' do
      if ENV['SIGNUP_ENABLED'] == 'true'
        r.get do
          webauthn_id = WebAuthn.generate_user_id
          @options = WebAuthn::Credential.options_for_create(
            user: { id: webauthn_id, name: 'FA' },
            exclude: [],
            authenticator_selection: { residentKey: 'preferred' },
            extensions: { credProps: true, minPinLength: true }
          )
          session['creation_challenge'] = @options.challenge
          view 'signup'
        end

        r.post do
          if r.params['publicKeyCredential']
            webauthn_cred = WebAuthn::Credential.from_create(r.params['publicKeyCredential'])
            webauthn_cred.verify(session['creation_challenge'])
            {
              webauthn_id: webauthn_cred.id,
              public_key: webauthn_cred.public_key
            }
          else
            {
              username: r.params['username'],
              password_hash: BCrypt::Password.create(r.params['password']),
              otp_secret: ROTP::Base32.random
            }
          end
        rescue WebAuthn::Error
        end
      end
    end
  end
end
