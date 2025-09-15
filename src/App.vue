<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/home">Home</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/unauthorized">Unauthorized</RouterLink>
      </nav>
    </div>
  </header>

  <div class="content">
    <RouterView />
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
/* Header navigation */
nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap; /* allows wrapping on smaller screens */
  gap: 1em;
  padding: 1em;
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

/* Main content */
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%; /* responsive width */
  max-width: 500px; /* desktop cap */
  border: solid 1px black;
  margin: 2em auto;
  border-radius: 1em;
  padding: 2em 1em;
  box-sizing: border-box;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  nav {
    flex-direction: column;
    align-items: center;
  }

  .content {
    width: 95%; /* slightly smaller margin */
    padding: 1.5em 1em;
  }
}
</style>
