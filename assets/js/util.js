/* breakpoints.js v1.1 (refactor legible)
 * Original v1.0 | @ajlkn | MIT licensed
 */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		// CommonJS
		module.exports = factory();
	} else {
		// Global (browser)
		root.breakpoints = factory();
	}
})(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	/**
	 * Función principal que el usuario llama:
	 * breakpoints({ small: ['481px', '736px'], ... })
	 */
	function Breakpoints(definitions) {
		internal.init(definitions);
	}

	/**
	 * Estado interno y métodos de trabajo.
	 */
	const internal = {
		// Mapa de nombres de breakpoint -> definición
		//   ej: { medium: ['737px', '980px'], large: ['981px', '1280px'] }
		list: null,

		// Cache de expresiones de media query ya calculadas
		//   ej: { '<=medium': 'screen and (max-width: 980px)' }
		media: {},

		// Handlers registrados vía breakpoints.on()
		events: [],

		/**
		 * Inicializa la lista de breakpoints y registra listeners de ventana.
		 */
		init(definitions) {
			this.list = definitions;

			const poll = this.poll.bind(this);

			window.addEventListener('resize', poll);
			window.addEventListener('orientationchange', poll);
			window.addEventListener('load', poll);
			window.addEventListener('fullscreenchange', poll);
		},

		/**
		 * Devuelve true/false indicando si un breakpoint está activo.
		 * Ej: breakpoints.active('<=medium')
		 */
		active(query) {
			let name;
			let op;          // 'gte', 'lte', 'gt', 'lt', 'not', 'eq'
			let mediaString; // resultado final, ej: 'screen and (max-width: 980px)'
			let def;         // definición encontrada en this.list[name]
			let min;         // número mínimo
			let max;         // número máximo
			let unit;        // unidad, ej: 'px'

			// Cache: si ya lo calculamos antes, usamos el valor directamente.
			if (!(query in this.media)) {

				// ----- 1) Parsear el operador y el nombre del breakpoint -----
				if (query.substr(0, 2) === '>=') {
					op = 'gte';
					name = query.substr(2);
				} else if (query.substr(0, 2) === '<=') {
					op = 'lte';
					name = query.substr(2);
				} else if (query.charAt(0) === '>') {
					op = 'gt';
					name = query.substr(1);
				} else if (query.charAt(0) === '<') {
					op = 'lt';
					name = query.substr(1);
				} else if (query.charAt(0) === '!') {
					op = 'not';
					name = query.substr(1);
				} else {
					op = 'eq';
					name = query;
				}

				// ----- 2) Resolver la definición a partir de la lista -----
				if (name && this.list && (name in this.list)) {

					def = this.list[name];

					// Definición tipo array: [min, max]
					if (Array.isArray(def)) {
						min = parseInt(def[0], 10);
						max = parseInt(def[1], 10);

						// Determinar la unidad (px, em, etc.)
						if (isNaN(min)) {
							// No hay mínimo, solo máximo.
							if (isNaN(max)) {
								// Ambos NaN -> definición inválida.
								this.media[query] = false;
								return false;
							}
							unit = def[1].substr(String(max).length);
						} else {
							unit = def[0].substr(String(min).length);
						}

						// ----- 3) Construir la media query según el operador -----

						if (isNaN(min)) {
							// Solo hay máximo definido.
							switch (op) {
								case 'gte':
									mediaString = 'screen';
									break;
								case 'lte':
									mediaString = 'screen and (max-width: ' + max + unit + ')';
									break;
								case 'gt':
									mediaString = 'screen and (min-width: ' + (max + 1) + unit + ')';
									break;
								case 'lt':
									mediaString = 'screen and (max-width: -1px)';
									break;
								case 'not':
									mediaString = 'screen and (min-width: ' + (max + 1) + unit + ')';
									break;
								default: // 'eq'
									mediaString = 'screen and (max-width: ' + max + unit + ')';
									break;
							}
						} else if (isNaN(max)) {
							// Solo hay mínimo definido.
							switch (op) {
								case 'gte':
									mediaString = 'screen and (min-width: ' + min + unit + ')';
									break;
								case 'lte':
									mediaString = 'screen';
									break;
								case 'gt':
									mediaString = 'screen and (max-width: -1px)';
									break;
								case 'lt':
									mediaString = 'screen and (max-width: ' + (min - 1) + unit + ')';
									break;
								case 'not':
									mediaString = 'screen and (max-width: ' + (min - 1) + unit + ')';
									break;
								default: // 'eq'
									mediaString = 'screen and (min-width: ' + min + unit + ')';
									break;
							}
						} else {
							// Hay mínimo y máximo definidos.
							switch (op) {
								case 'gte':
									mediaString = 'screen and (min-width: ' + min + unit + ')';
									break;
								case 'lte':
									mediaString = 'screen and (max-width: ' + max + unit + ')';
									break;
								case 'gt':
									mediaString = 'screen and (min-width: ' + (max + 1) + unit + ')';
									break;
								case 'lt':
									mediaString = 'screen and (max-width: ' + (min - 1) + unit + ')';
									break;
								case 'not':
									mediaString =
										'screen and (max-width: ' + (min - 1) + unit + '), ' +
										'screen and (min-width: ' + (max + 1) + unit + ')';
									break;
								default: // 'eq'
									mediaString =
										'screen and (min-width: ' + min + unit + ') and ' +
										'(max-width: ' + max + unit + ')';
									break;
							}
						}
					} else {
						// Definición directa tipo string:
						// "(max-width: 980px)" o "screen and (max-width: 980px)"
						if (def.charAt(0) === '(') {
							mediaString = 'screen and ' + def;
						} else {
							mediaString = def;
						}
					}
				} else {
					// Si no coincide con ningún breakpoint conocido,
					// asumimos que el propio `query` es una media query CSS.
					if (query.charAt(0) === '(') {
						mediaString = 'screen and ' + query;
					} else {
						mediaString = query;
					}
				}

				// Guardar en cache; si no hay mediaString, se guarda false.
				this.media[query] = mediaString ? mediaString : false;
			}

			// Si no hay media válida, retornamos false.
			if (this.media[query] === false) return false;

			// Evaluar el match de la media query.
			return window.matchMedia(this.media[query]).matches;
		},

		/**
		 * Registra un handler que se ejecuta cuando un breakpoint pasa a estar activo.
		 * Ej:
		 * breakpoints.on('<=medium', function () { ... });
		 */
		on(query, handler) {
			this.events.push({
				query: query,
				handler: handler,
				state: false
			});

			// Ejecutar inmediatamente si ya está activo.
			if (this.active(query)) handler();
		},

		/**
		 * Revisa todos los handlers registrados y ejecuta los que
		 * acaban de pasar de inactivos a activos.
		 */
		poll() {
			for (let i = 0; i < this.events.length; i++) {
				const ev = this.events[i];

				if (this.active(ev.query)) {
					if (!ev.state) {
						ev.state = true;
						ev.handler();
					}
				} else if (ev.state) {
					// Solo marcamos que dejó de estar activo;
					// no hay callback de "salida" en la implementación original.
					ev.state = false;
				}
			}
		}
	};

	// Exponer API pública sobre la función Breakpoints.
	Breakpoints._ = internal;

	Breakpoints.on = function (query, handler) {
		internal.on(query, handler);
	};

	Breakpoints.active = function (query) {
		return internal.active(query);
	};

	return Breakpoints;
});
