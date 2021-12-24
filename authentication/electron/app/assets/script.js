console.log('loaded');
window.electron.onTwitchUser(user => {
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