(function () {
	try {
		var key = 'atelier-room-theme';
		var ids = [
			'washi',
			'graphite',
			'bibliotheek',
			'north-light',
			'charcoal',
			'prussian',
			'plaster',
			'nocturne',
			'salon'
		];
		var stored = localStorage.getItem(key);
		if (stored && ids.indexOf(stored) !== -1) {
			document.documentElement.setAttribute('data-atelier-theme', stored);
		}
	} catch (e) {}
})();
