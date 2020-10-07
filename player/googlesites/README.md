## What is this example

This is an example of using the Twitch interactive and dumb player and adding a number of Controls to it, on Google Sites

It uses [both kinds of embed](https://dev.twitch.tv/docs/embed/)

Since it uses the JS Embed Library, you do not need to specify the `parent` as the JS Library will work it out for you

This example is based on this ["Web" Example](https://github.com/BarryCarlyon/twitch_misc/tree/master/player/html)

## The Magic

Google sites has a tendenacy to change the URL of one of the iFrames in the stack when you save/publish your page.
So in order to update the parent stack you have to do something clever.

here is the magic

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

## TRY THIS EXAMPLE NOW!

This example is also available via Google Pages!

Give it a [whirl here](https://github.com/BarryCarlyon/twitch_misc/tree/master/player/html)

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
