console.log('loaded');

login.addEventListener('click', (e) => {
    e.preventDefault();
    window.electron.login();
});
logout.addEventListener('click', (e) => {
    e.preventDefault();
    window.electron.logout();
});

document.addEventListener('click', (e) => {
    if (e.target.tagName == 'A') {
        e.preventDefault();
        if (e.target.getAttribute('href') == '#nowhere') {
            console.log('CANCELLED');
            return;
        }
        window.electron.openWeb(e.target.getAttribute('href'));
    }
});

window.electron.onTwitchLogin(data => {
    prompter.textContent = `If Prompted please enter ${data.user_code}`;
    somehwere.setAttribute('href', data.verification_uri);
    somehwere.textContent = 'Click here to login via your web browser';

    qrcode.textContent = 'or scan this QR code with your phone';
    new QRCode(qrcode, data.verification_uri);
});
window.electron.onTwitchLoginExpired(data => {
    prompter.textContent = `Request Expired`;
});

window.electron.onTwitchUser(user => {
    login.remove();
    prompter.remove();
    somehwere.remove();
    qrcode.remove();

	let table = document.getElementById('user');
	table.textContent = '';

    for (var key in user) {
        var tr = document.createElement('tr');
        table.append(tr);
        var td = document.createElement('td');
        td.textContent = key;
        tr.append(td);
        var td = document.createElement('td');
        td.textContent = user[key];
        tr.append(td);
    }
});