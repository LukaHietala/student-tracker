function toast(msg) {
		const p = document.createElement("p");
		p.textContent = msg;
		p.classList.add("toast");
		document.body.appendChild(p);
		setTimeout(() => {
				p.remove();
		}, 2400);
}

// Source - https://stackoverflow.com/a/1026087
// Posted by Steve Harrison, modified by community. See post 'Timeline' for change history
// Retrieved 2026-10-01, License - CC BY-SA 4.0

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
