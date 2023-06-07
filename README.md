# authenhub
Simple authentication gateway with webauthn

## Usage

### docker-compose.yml
```yaml
version: '3'
services:
  app:
    container_name: authenhub
    image: elquimista/authenhub:latest
    restart: unless-stopped
    ports:
      - 127.0.0.1:9696:9696
    env_file: .env
```

### .env
Copy `example.env` file to `.env` and fill and/or change values appropriately. And then run:
```sh
docker-compose up -d
```

### Yubikey Registration
When you are running the app for the first time, you probably want to register your Yubikey:
1. Set `SIGNUP_ENABLED="true"` in `.env` file.
1. Run
   ```sh
   docker-compose down; docker-compose up -d
   ```
1. Go to `"https://<authenhub_app_domain>/signup"` in the browser. If you are running this app locally, it's best to run it behind Nginx proxy along with `Let's Encrypt` free SSL.
1. Once you are done interacting with your Yubikey, copy `webauthn_id` and `public_key` values, and fill `ADMIN_WEBAUTHN_ID` and `ADMIN_WEBAUTHN_PUBLIC_KEY` with those values in `.env` file.
1. Disable signup by reverting `SIGNUP_ENABLED` to `"false"` in `.env` file.
1. Start a fresh container again:
   ```sh
   docker-compose down; docker-compose up -d
   ```

### Nginx Configuration
It is assumed these files are called in from the main nginx conf file.

`/usr/local/etc/nginx/sites-enabled/authenhub.conf` (nginx conf path in homebrew with Intel mac looks like this):
```nginx
server {
  server_name iam.example.com;

  proxy_buffering off;

  listen 443 ssl; # managed by Certbot
  ssl_certificate /Users/<username>/.lets-encrypt/live/example.com/fullchain.pem; # managed by Certbot
  ssl_certificate_key /Users/<username>/.lets-encrypt/live/example.com/privkey.pem; # managed by Certbot
  include /Users/<username>/.lets-encrypt/options-ssl-nginx.conf; # managed by Certbot
  ssl_dhparam /Users/<username>/.lets-encrypt/ssl-dhparams.pem; # managed by Certbot

  location / {
    proxy_pass http://127.0.0.1:9696;
    proxy_set_header Host $host;
  }
}

server {
  listen 80;
  server_name iam.example.com;

  return 301 https://$host$request_uri;
}
```

`/usr/local/etc/nginx/sites-enabled/app1.conf`:
```nginx
server {
  server_name app1.example.com;
  proxy_buffering off;

  listen 443 ssl; # managed by Certbot
  ssl_certificate /Users/<username>/.lets-encrypt/live/example.com/fullchain.pem; # managed by Certbot
  ssl_certificate_key /Users/<username>/.lets-encrypt/live/example.com/privkey.pem; # managed by Certbot
  include /Users/<username>/.lets-encrypt/options-ssl-nginx.conf; # managed by Certbot
  ssl_dhparam /Users/<username>/.lets-encrypt/ssl-dhparams.pem; # managed by Certbot

  location / {
    auth_request /auth;
    error_page 401 = @error401;
    proxy_set_header Host $host;
    ...
  }

  location = /auth {
    internal;
    proxy_pass http://127.0.0.1:9696;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header X-Authenhub-Host iam.example.com;
  }

  location @error401 {
    return 302 $scheme://iam.example.com/login?redirect_uri=$scheme://$http_host$request_uri;
  }

}

server {
  listen 80;
  server_name app1.example.com;

  return 301 https://$host$request_uri;
}
```

## Development

Clone this repository and run:
```sh
docker-compose build
docker-compose up -d
docker-compose exec -it app bash
(docker) $ rackup -o0.0.0.0 -p9696
```

### Precompiling Assets
```sh
(docker) $ rake assets:precompile
```
