## What is this example

This is an example that demonstrates the duality of Two Access Tokens.

This example essentially creates a "moderator only" Dashboard.

After setup it'll prompt for the broadcaster to Authenticate with the `moderation:read` scope.
Then store and refresh that key as needed. Redis is used to store the access/refresh tokens.

After the Application has been seeded with this key, the Application will only allow the broadcaster and moderators to login.

You could use such a system to protect a bot control panel, or other system where you would need to only permit the broadcaster or channel moderator to login.

Conceivably, you can use this example to create a subscribers only "portal", you would substitiute `moderation:read` scope for `moderation:read+channel:read:subscriptions` (this would allow moderators _and_ subscribers to login to this "portal"). And update the `moderatorCheck` function to include a call to [Get Broadcaster Subscriptions](https://dev.twitch.tv/docs/api/reference#get-broadcaster-subscriptions) (usually call Subscriber check and if not a sub call moderators would be the preferred order).

This flow is demonstrated in `server_subscriber.js`

So:

- `server.js` - a Moderator only Portal
- `server_subscriber.js` - a Subscriber or Moderator only Portal

## Reference Documentation

- [Get User oAuth Token](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow)
- [Get Moderators](https://dev.twitch.tv/docs/api/reference#get-moderators)
- [Get Broadcaster Subscriptions](https://dev.twitch.tv/docs/api/reference#get-broadcaster-subscriptions)

## Setting up the config

You can set the redirect URI as needed but `http://127.0.0.1:8000` will suffice if you don't know what to use.

- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy `config_sample.json` to `config.json`
- Copy the Client ID from the Dev Console to `client_id`
- Hit "Generate Secret" on the Dev Console and copy the displayed secret into `client_secret`
- Pick a port to run the example on, 8000 should suffice, and update `listen` as needed
- Update the `redirect_uri` to `http://127.0.0.1:8000` in the config.json and apply this to the redirect URI in the dev console
- Set the `broadcaster_id` to the needed broadcaster ID, this stops another broadcaster authentciate and breaking in.

*Note*: in theory you could update the code to 'lock' to the first broadcaster that logs in, but if the keys _completely_ die, a moderator could accidentally auth and then the "owner" is set to the wrong user, so it's wise to hardcode/lock the user ID. But this is an example of a product, there are alternative ways to make sure the 'owner'/broadcaster doesn't change.

## Running the example

- `npm install`
- `npm start`

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
