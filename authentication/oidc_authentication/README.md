## What is this example

This example is similar to the [user_access_generator](https://github.com/BarryCarlyon/twitch_misc/tree/master/authentication/user_access_generator) but covers a single scope and how to verify it. Specifically the [OIDC](https://dev.twitch.tv/docs/authentication/getting-tokens-oidc)

It works both "Authorization Code Flow" and "Implicit Code Flow", but this only covers "Authorization Code Flow"

This uses JWT's so you should read up about what a JWT is on [JWT.io](https://jwt.io/)

## Reference Documentation

- [Getting Tokens: OIDC](https://dev.twitch.tv/docs/authentication/getting-tokens-oidc)
- [JWTs](https://jwt.io/)

## Setting up the config

- Open `config_sample.json` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `""` of `client_id`
- Hit New Secret then Ok
- Copy the new Client Secret into the `""` of `client_secret`
- Add or change the `OAuth Redirect URLs` to include one for `http://localhost:8000/` as Twitch now support multiples
- Save your modified file as `config.json`

You can change the port in config if you want but remember to change it in the Redirect URL's as well, and update the configs `redirect_uri`

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node server.js`
- Open [http://localhost:8000](http://localhost:8000) in a browser

## Notes

JWTs have a really short valid time, around 15 minutes, and also cannot be refreshed!

A Twitch OpenID call, can be combined with other "regular" scopes, and will return a "regular" API access token for use. Uncomment [server.js Line 193](server.js#L193) to see what you get!

The `validate` endpoint returns some important information, such as when the token expires, you'll need to refresh the token as needed if the token expires using the refresh token, thats not covered in this example, but you can read about [refreshing on the docs](https://dev.twitch.tv/docs/authentication#refreshing-access-tokens)

Also note the `validate` endpoint uses `OAuth` instead of `Bearer` in the `Authorization` header.

## Nginx and Cookie Security

This is an example, so doesn't contain all the _best_ security practices.
Since this uses cookies to manage logins you should change the session code to something like

```
app.use(session({
    store: new RedisStore({
        client: redis_client
    }),
    secret,
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: something
    },
    rolling: true
}));
```

See also [Production Best Practices: Security](https://expressjs.com/en/advanced/best-practice-security.html#use-cookies-securely)

If you are putting this nodeJS HTTP server beind NGINX, your NGINX declartion for the location will need additional fields:

```
server {
    listen IPv4:443;
    listen [::]:443;

    server_name example.com;
    root /some/path/to/files;

    ssl on;
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        # Cookie Flags
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Cookie Flags
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;
        # Other

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;

        proxy_pass http://this_server_relay;
    }
}

upstream this_server_relay {
    server 127.0.0.1:5000;
    keepalive 8;
}

```
