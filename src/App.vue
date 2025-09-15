<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/home">Home</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/unauthorized">unathorized</RouterLink>
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
nav {
  display: flex;
  justify-content: center;
}

nav a {
  padding: 1em;
}

.content {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 500px;
  border: solid 1px black;
  margin-left: auto;
  margin-right: auto;
  border-radius: 1em;
  padding: 2em 0 2em 0;
}
</style>
