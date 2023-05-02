## What is this example

This is an example of using the Twitch interactive and dumb player and adding a number of Controls to it, on Google Sites

It uses [both kinds of embed](https://dev.twitch.tv/docs/embed/)

Since it uses the JS Embed Library, you do not need to specify the `parent` as the JS Library will work it out for you

This example is based on this ["Web" Example](https://github.com/BarryCarlyon/twitch_misc/tree/master/player/html)

## The Magic

Google sites has a tendenacy to change the URL of one of the iFrames in the stack when you save/publish your page.
So in order to update the parent stack you have to do something clever.

Here is the magic sauce

```javascript
  var parent = ['sites.google.com', 'www.gstatic.com', window.location.host];
  console.log(parent);
  document.getElementById('target_frame').setAttribute('src', document.getElementById('target_frame').getAttribute('src') + '&parent=' + parent.join('&parent='));

  var options = {
    width: 800,
    height: 500,
    channel: "monstercat",
    allowfullscreen: false,
    layout: "video-with-chat",
    muted: true,
    parent
  };
  var player = new Twitch.Embed("test", options);
```

This builds a list of parents and appends the innermost parent/iFrame URL (the one that changes to the stack of parents)

If you are using a custom domain, same `https://www.mycoolwebsite.com/` then you would do this instead:

```javascript
  var parent = ['www.mycoolwebsite.com', 'sites.google.com', 'www.gstatic.com', window.location.host];
```

## Just give me something to copy paste

- Add an "Embed from the web"
- Change `www.mycoolwebsite.com` to your domain name
- Change `monstercat` to your login/the Twitch channel you want to embed

```html
<html>
  <head>
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline'">
    <script type="text/javascript" src="https://embed.twitch.tv/embed/v1.js"></script>
  </head>
  <body>
    <div id="mytwitch"></div>
    <script type="text/javascript">
      new Twitch.Embed("mytwitch", {
        width: 800,
        height: 500,
        channel: "monstercat",
        allowfullscreen: false,
        layout: "video-with-chat",
        muted: true,
        parent: ['www.mycoolwebsite.com', 'sites.google.com', 'www.gstatic.com', window.location.host]
      });
    </script>
  </body>
</html>
```

### What about dumb iframes?

Put in the dumb iframe url, and then add a bit of javacript to append a parent.
Something like:

```html
<iframe src="https://www.twitch.tv/embed/monstercat/chat" id="chat_frame" style="width: 800px; height: 400px;"></iframe>

<script type="text/javascript">
  var parent = ['www.mycoolwebsite.com', 'sites.google.com', 'www.gstatic.com', window.location.host];
  console.log(parent);
  document.getElementById('chat_frame').setAttribute('src', document.getElementById('chat_frame').getAttribute('src') + '?parent=' + parent.join('&parent='));
</script>
```

### But What about For Clips

```html
<iframe src="https://clips.twitch.tv/embed?clip=CLIPSLUG" id="chat_frame" style="width: 800px; height: 400px;"></iframe>

<script type="text/javascript">
  var parent = ['www.mycoolwebsite.com', 'sites.google.com', 'www.gstatic.com', window.location.host];
  document.getElementById('clip_frame').setAttribute('src', document.getElementById('clip_frame').getAttribute('src') + '&parent=' + parent.join('&parent='));
</script>
```


## TRY THIS EXAMPLE NOW!

This example is also available via Google Pages/Sites!

Give it a [whirl on Google Pages/Sites here](https://sites.google.com/view/barry-twitch-embed-test/home)

## Reference Documentation

- [Embed Everything](https://dev.twitch.tv/docs/embed/everything)
- ["Dumb" iFrames](https://dev.twitch.tv/docs/embed/video-and-clips)

## Running the example

- Copy the contents of index.html
- in the page editor for google sites
- Edit a page
- Insert -> Embed -> Embed code
- Paste in the code
- Next
- Save
