class AppHeader extends HTMLElement {
	static get observedAttributes() {
		return ['back-href', 'back-label'];
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback() {
		if (!this.isConnected) return;
		this.render();
	}

	render() {
		const backHref = (this.getAttribute('back-href') || '').trim();
		const backLabel = (this.getAttribute('back-label') || 'Volver').trim();
		const showBack = Boolean(backHref);

		const back = showBack
			? `
				<a href="${backHref}" class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900">
					<span aria-hidden="true">←</span>
					<span>${backLabel}</span>
				</a>
			`
			: '';

		this.innerHTML = `
			<header class="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
				<div class="flex items-center justify-between gap-4">
					<div class="flex items-center gap-4 shrink-0">
						${back}
						<div class="brand flex items-center gap-3 w-[280px] shrink-0">
							<img class="brand__logo w-10 h-10 md:w-16 md:h-16" src="/assets/charlotte_logo.png" alt="Charlotte Bistró" width="64" height="64" loading="eager">
							<span class="brand__text flex flex-col whitespace-nowrap">
								<span class="brand__name text-[16px] leading-[19.2px] font-bold tracking-[1.3px] uppercase" style="font-family: 'Inter', sans-serif; color: var(--brand-name-color, #0f4a22);">Charlotte Bistró | Modulo Administrativo</span>
								<span class="brand__tagline text-[11px] leading-[16.5px] tracking-[2px] font-semibold" style="color: var(--brand-tagline-base, #1F2937); opacity: 0.55;">DONDE LA ADMINISTRACIÓN TOMA LA RUTA</span>
							</span>
						</div>
					</div>
				</div>
			</header>
		`;
	}
}

customElements.define('app-header', AppHeader);
