<div class="layout">
	<main>
		<slot />
	</main>

	<nav>
		<ul>
			<li><a href="/">Home</a></li>
			<li><a href="/items">Items</a></li>
		</ul>
	</nav>
</div>

<style>
	:global(body) {
		margin: 0;
	}

	.layout {
		display: flex;
		flex-direction: column;
		height: 100svh;

		@media (min-width: 768px) {
			flex-direction: column-reverse;
		}
	}

	main {
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1rem;
		flex-grow: 1;
	}

	nav {
		border-top: 0.1rem solid #ccc;
		@media (min-width: 768px) {
			border-top: 0;
			border-bottom: 0.1rem solid #ccc;
		}
	}

	nav ul {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: 1rem;
		padding: 0;
		margin: 0;

		@media (min-width: 768px) {
			display: flex;
		}
	}

	nav li {
		list-style: none;
		text-align: center;
	}

	nav li + li {
		border-left: 0.1rem solid #ccc;
	}

	nav li:last-child {
		@media (min-width: 768px) {
			border-right: 0.1rem solid #ccc;
		}
	}

	nav li a {
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
