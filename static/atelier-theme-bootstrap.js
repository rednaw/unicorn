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
		var id = stored && ids.indexOf(stored) !== -1 ? stored : 'washi';
		document.documentElement.setAttribute('data-atelier-theme', id);
	} catch (e) {}
})();
