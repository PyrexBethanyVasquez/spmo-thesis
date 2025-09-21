<template>
  <div class="page">
    <!-- Header -->
    <header>
      <div class="nav-wrapper">
        <nav>
          <RouterLink to="/" class="logo">SPMO</RouterLink>

          <div class="nav-links">
            <RouterLink to="/home">Dashboard</RouterLink>
            <RouterLink to="/items">Item Inventory</RouterLink>
            <RouterLink to="/settings" class="disabled-link">Transactions</RouterLink>
            <RouterLink to="/profile" class="disabled-link">Inventory</RouterLink>
          </div>
        </nav>
      </div>
    </header>

    <!-- Routed content -->
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
/* Layout wrapper */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header wrapper */
.nav-wrapper {
  background: #152e1a; /* dark, professional look */
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Navigation bar */
nav {
  max-width: 1350px;
  margin: 0 auto;
  padding: 0.75em 1.5em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo / brand */
nav .logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f7fffa; /* accent blue */
  text-decoration: none;
}

/* Links container */
nav .nav-links {
  display: flex;
  gap: 1.25em;
}

/* Nav links */
nav a {
  font-size: 0.95rem;
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 500;
  position: relative;
  transition: color 0.3s ease;
}

/* Hover effect */
nav a:hover {
  color: #63b3ed;
}

/* Active link underline */
nav a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #63b3ed;
  border-radius: 2px;
}

/* Fullscreen main content */
.content {
  flex: 1;
  width: 100%;
  padding: 2em;
  box-sizing: border-box;
  background: linear-gradient(135deg, #1b1f3a, #035b01);
}

.disabled-link {
  pointer-events: none; /* prevents clicking */
  color: #a0aec0 !important; /* gray text */
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  nav {
    flex-direction: column;
    align-items: flex-start;
  }

  .nav-links {
    margin-top: 0.5em;
    flex-direction: column;
    width: 100%;
  }

  .nav-links a {
    padding: 0.5em 0;
    width: 100%;
  }
}
</style>
