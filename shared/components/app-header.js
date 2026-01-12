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
						<div class="flex items-center gap-3">
							<div class="w-4 h-4 bg-black rotate-45"></div>
							<span class="font-semibold">Charlotte</span>
						</div>
					</div>
				</div>
			</header>
		`;
	}
}

customElements.define('app-header', AppHeader);
