<nav>
	<ul>
		<li><a href="/">Home</a></li>
		<li><a href="/items">Items</a></li>
	</ul>
</nav>

<slot />

<style>
	nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
	}

	nav ul {
		display: flex;
		gap: 1rem;
		padding: 0;
	}

	nav li {
		list-style: none;
	}
</style>
