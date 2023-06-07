require 'roda'
require_relative './webauthn'

class App < Roda
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

  def logged_in?
    request.cookies['auth'] == ENV['ADMIN_WEBAUTHN_ID']
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
          allow: [ENV['ADMIN_WEBAUTHN_ID']]
        )
        session['authentication_challenge'] = @options.challenge
        view 'login'
      end
    end

    r.post 'login' do
      webauthn_cred = WebAuthn::Credential.from_get(r.params['publicKeyCredential'])
      webauthn_cred.verify(
        session['authentication_challenge'],
        public_key: ENV['ADMIN_WEBAUTHN_PUBLIC_KEY'],
        sign_count: 0
      )
      response.set_cookie('auth',
                          value: webauthn_cred.id,
                          domain: ENV['COOKIE_DOMAIN'],
                          path: '/',
                          expires: Time.now + ENV.fetch('COOKIE_EXPIRES_IN', 3600).to_i,
                          secure: true,
                          httponly: true
                         )
      { redirect_uri: r.params['redirect_uri'] }
    rescue WebAuthn::Error
      response.status = 401
      'Unauthorized'
    end

    r.get 'logout' do
      response.delete_cookie('auth', domain: ENV['COOKIE_DOMAIN'])
      'Logged out'
    end

    r.is 'signup' do
      if ENV['SIGNUP_ENABLED'] == 'true'
        r.get do
          webauthn_id = WebAuthn.generate_user_id
          @options = WebAuthn::Credential.options_for_create(
            user: { id: webauthn_id, name: 'FA' },
            exclude: []
          )
          session['creation_challenge'] = @options.challenge
          view 'signup'
        end

        r.post do
          webauthn_cred = WebAuthn::Credential.from_create(r.params['publicKeyCredential'])
          webauthn_cred.verify(session['creation_challenge'])
          {
            webauthn_id: webauthn_cred.id,
            public_key: webauthn_cred.public_key
          }
        rescue WebAuthn::Error
        end
      end
    end
  end
end
