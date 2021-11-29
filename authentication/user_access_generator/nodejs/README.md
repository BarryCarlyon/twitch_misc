## What is this example

A Token Generator of sorts. To demonstrate how to perform Scoped User oAuth authentication in NodeJS

## Reference Documentation

- [OAuth Authorization Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)
- [Revoking Access Tokens](https://dev.twitch.tv/docs/authentication#revoking-access-tokens)
- [Available API Scopes](https://dev.twitch.tv/docs/authentication#scopes)

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

The `logout` function makes use of the [Token Revoke](https://dev.twitch.tv/docs/authentication#revoking-access-tokens) end point to kill a server stored token. Normally you probably wouldn't call this as you would store the Token and it's Refresh token in a database to maintain "offline access" to the users account, say for keeping a Subscriber list up to date, or for use in other things like [Twitch PubSub](https://dev.twitch.tv/docs/pubsub)

The `validate` endpoint returns some important information, such as when the token expires, you'll need to refresh the token as needed if the token expires using the refresh token, thats not covered in this example, but you can read about [refreshing on the docs](https://dev.twitch.tv/docs/authentication#refreshing-access-tokens)

An oAuth example such as this, will work for most services that provide oAuth, you just have to swap out the three oAuth URLs (and how to validate a token/fetch a user from the service), for the relevant URL's for that service

- https://id.twitch.tv/oauth2/authorize - where to send a User to to authorize yoru applications access to the users account
- https://id.twitch.tv/oauth2/token - where you POST/exchange the CODE to to get an Access Token
- https://id.twitch.tv/oauth2/revoke - where to POST to, to logout/kill a token

And

- https://id.twitch.tv/oauth2/validate - where to validate a token, if the service supports it

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
