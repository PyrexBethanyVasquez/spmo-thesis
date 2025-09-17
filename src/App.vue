<template>
  <div class="page">
    <!-- Header -->
    <header>
      <div class="wrapper">
        <nav>
          <RouterLink to="/home">Home</RouterLink>
          <RouterLink to="/login">Login</RouterLink>
          <RouterLink to="/unauthorized">Unauthorized</RouterLink>
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
  min-height: 100vh; /* full height of the screen */
}

/* Header navigation */
nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1em;
  padding: 1em;
  background: #f9f9f9; /* optional: makes it stand out */
  border-bottom: 1px solid #ddd;
}

nav a {
  padding: 0.5em 1em;
  text-decoration: none;
  border-radius: 0.5em;
  transition: background 0.3s;
}

nav a:hover {
  background: #f0f0f0;
}

/* Fullscreen main content */
.content {
  flex: 1; /* takes up all remaining vertical space */
  width: 100%; /* full width */
  padding: 2em;
  box-sizing: border-box;
}

/* Responsive */
@media (max-width: 600px) {
  nav {
    flex-direction: column;
    align-items: center;
  }

  .content {
    padding: 1.5em 1em;
  }
}
</style>
