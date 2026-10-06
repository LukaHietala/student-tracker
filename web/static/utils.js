function modify(obj, newObj) {
		/*Object.keys(obj).forEach(function(key) {
			delete obj[key];
			});*/
		Object.keys(newObj).forEach(function (key) {
				obj[key] = newObj[key];
		});
}

function toast(msg) {
		const p = document.createElement("p");
		p.textContent = msg;
		p.classList.add("toast");
		document.body.appendChild(p);
		setTimeout(() => {
				p.remove();
		}, 2400);
}

function formatForReading(seconds) {
		return seconds < 0 ? `Ylitöitä tehty: ${secondsToHuman(seconds)}` : `Töitä jäljellä: ${secondsToHuman(seconds)}`;
}

function secondsToHuman(seconds) {
		const hours = Math.floor(Math.abs(seconds) / 3600);
		const minutes = Math.floor((Math.abs(seconds) % 3600) / 60);
		return `${hours} t ${minutes} min`;
}

// Source - https://stackoverflow.com/a/1026087
// Posted by Steve Harrison, modified by community. See post 'Timeline' for change history
// Retrieved 2026-10-01, License - CC BY-SA 4.0

function capitalizeFirstLetter(val) {
		return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}