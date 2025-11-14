/*
	Hyperspace by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function () {

	// Atajos a elementos principales.
	var body = document.body;
	var sidebar = document.querySelector('#sidebar');

	// Breakpoints.
	if (typeof breakpoints !== 'undefined') {
		breakpoints({
			xlarge: ['1281px', '1680px'],
			large: ['981px', '1280px'],
			medium: ['737px', '980px'],
			small: ['481px', '736px'],
			xsmall: [null, '480px']
		});
	}

	// Hack: Enable IE flexbox workarounds.
	if (typeof browser !== 'undefined' && browser.name === 'ie') {
		body.classList.add('is-ie');
	}

	// Play initial animations on page load.
	window.addEventListener('load', function () {
		window.setTimeout(function () {
			body.classList.remove('is-preload');
		}, 100);
	});

	// Forms: activar .submit no-input.
	document.addEventListener('click', function (event) {
		var submit = event.target.closest('.submit');
		if (!submit) return;

		var form = submit.closest('form');
		if (!form) return;

		event.preventDefault();
		event.stopPropagation();
		form.submit();
	});

	// Función para calcular offset de scroll (como hacía scrolly).
	function getScrollOffset() {
		if (typeof breakpoints !== 'undefined'
			&& breakpoints.active('<=large')
			&& !breakpoints.active('<=small')
			&& sidebar) {
			return sidebar.offsetHeight;
		}
		return 0;
	}

	// Scroll suave hacia un elemento.
	function smoothScrollToElement(target) {
		if (!target) return;

		var offset = getScrollOffset();
		var rect = target.getBoundingClientRect();
		var targetY = rect.top + window.pageYOffset - offset;

		window.scrollTo({
			top: targetY,
			behavior: 'smooth'
		});
	}

	// Sidebar.
	if (sidebar) {

		var sidebarLinks = Array.prototype.slice.call(sidebar.querySelectorAll('a'));
		var sectionToLink = new Map();
		var lockedLink = null;

		// Preparar links del sidebar.
		sidebarLinks.forEach(function (link) {

			// Marcar como scrolly (por si hay estilos).
			link.classList.add('scrolly');

			link.addEventListener('click', function (e) {
				var href = link.getAttribute('href') || '';
				if (!href || href.charAt(0) !== '#') return;

				// Navegación interna: manejamos nosotros.
				e.preventDefault();

				// Desactivar todos.
				sidebarLinks.forEach(function (l) {
					l.classList.remove('active');
				});

				// Activar y lockear este.
				link.classList.add('active');
				link.classList.add('active-locked');
				lockedLink = link;

				// Scroll suave a la sección.
				var section = document.querySelector(href);
				smoothScrollToElement(section);
			});

			// Vincular cada sección con su link.
			var href = link.getAttribute('href') || '';
			if (!href || href.charAt(0) !== '#') return;

			var section = document.querySelector(href);
			if (!section) return;

			// Inicialmente inactiva (como initialize de Scrollex).
			section.classList.add('inactive');
			sectionToLink.set(section, link);
		});

		// Observer para activar secciones y links del sidebar (reemplazo de Scrollex).
		if (sectionToLink.size > 0 && 'IntersectionObserver' in window) {
			var sidebarObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					var section = entry.target;
					if (!entry.isIntersecting) return;

					// Activar sección.
					section.classList.remove('inactive');

					var link = sectionToLink.get(section);
					if (!link) return;

					// Sin link bloqueado: activar según scroll.
					if (!lockedLink) {
						sidebarLinks.forEach(function (l) {
							l.classList.remove('active');
						});
						link.classList.add('active');
					}
					// Si este link era el bloqueado, "desbloquear".
					else if (lockedLink === link) {
						link.classList.remove('active-locked');
						lockedLink = null;
					}
				});
			}, {
				root: null,
				rootMargin: '-20% 0px -20% 0px',
				threshold: 0.25
			});

			sectionToLink.forEach(function (_link, section) {
				sidebarObserver.observe(section);
			});
		}
	}

	// Scrolly (para otros elementos con .scrolly que no estén en el sidebar).
	function setupScrolly() {
		var elements = document.querySelectorAll('.scrolly');

		Array.prototype.forEach.call(elements, function (el) {

			// Los del sidebar ya tienen su propio handler.
			if (sidebar && el.closest('#sidebar')) return;

			el.addEventListener('click', function (e) {
				var href = el.getAttribute('href') || '';
				if (!href || href.charAt(0) !== '#') return;

				var target = document.querySelector(href);
				if (!target) return;

				e.preventDefault();
				smoothScrollToElement(target);
			});
		});
	}

	setupScrolly();

	// Spotlights.
	(function () {
		var sections = document.querySelectorAll('.spotlights > section');
		if (sections.length === 0) return;

		// Observer para activar spotlights (equivalente a Scrollex en modo middle).
		var spotlightsObserver = null;
		if ('IntersectionObserver' in window) {
			spotlightsObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					entry.target.classList.remove('inactive');
				});
			}, {
				root: null,
				rootMargin: '-10% 0px -10% 0px',
				threshold: 0.25
			});
		}

		sections.forEach(function (section) {

			// Inicialmente inactiva.
			section.classList.add('inactive');

			// Asignar imagen de fondo y ocultar <img>.
			var imageWrapper = section.querySelector('.image');
			if (imageWrapper) {
				var img = imageWrapper.querySelector('img');
				if (img) {
					imageWrapper.style.backgroundImage = 'url(' + img.src + ')';

					var pos = img.getAttribute('data-position') || img.dataset.position;
					if (pos) {
						imageWrapper.style.backgroundPosition = pos;
					}

					img.style.display = 'none';
				}
			}

			if (spotlightsObserver) {
				spotlightsObserver.observe(section);
			} else {
				// Fallback: sin IntersectionObserver, activarlas directamente.
				section.classList.remove('inactive');
			}
		});
	})();

	// Features.
	(function () {
		var featureBlocks = document.querySelectorAll('.features');
		if (featureBlocks.length === 0) return;

		var featuresObserver = null;
		if ('IntersectionObserver' in window) {
			featuresObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					entry.target.classList.remove('inactive');
				});
			}, {
				root: null,
				rootMargin: '-20% 0px -20% 0px',
				threshold: 0.25
			});
		}

		featureBlocks.forEach(function (block) {
			block.classList.add('inactive');

			if (featuresObserver) {
				featuresObserver.observe(block);
			} else {
				// Fallback sin IntersectionObserver.
				block.classList.remove('inactive');
			}
		});
	})();

})();
