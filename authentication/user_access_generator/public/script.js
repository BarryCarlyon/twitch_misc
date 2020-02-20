document.body.addEventListener('click', (e) => {
    if (e.target.getAttribute('type') == 'checkbox') {
        generate();
    }
});

function generate() {
    var force_verify = 'false';
    var scopes = [];
    var checks = document.getElementsByTagName('input');
    for (var x=0;x<checks.length;x++) {
        if (checks[x].getAttribute('type') == 'checkbox') {
            console.log(x, checks[x].checked, checks[x].getAttribute('name'));
            if (checks[x].checked) {
                if (checks[x].getAttribute('name') == 'force_verify') {
                    force_verify = 'true';
                } else {
                    scopes.push(checks[x].getAttribute('name'));
                }
            }
        }
    }

    var url = 'https://id.twitch.tv/oauth2/authorize'
        + '?client_id=' + client_id
        + '&redirect_uri=' + redirect_uri
        + '&response_type=code'
        + '&force_verify=' + force_verify
        + '&state=' + state
        + '&scope=';

    url += scopes.join('+');

    document.getElementById('auth_url_preview').textContent = url;
    document.getElementById('auth_url').setAttribute('href', url);
}
generate();
