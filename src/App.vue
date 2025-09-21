<template>
  <div class="page">
    <!-- Header -->
    <header>
      <div class="nav-wrapper">
        <nav>
          <!-- Left: logo -->
          <div class="nav-left">
            <!-- Hamburger (mobile only) -->
            <button class="hamburger" @click="toggleMenu">
              <span :class="{ open: isMenuOpen }"></span>
              <span :class="{ open: isMenuOpen }"></span>
              <span :class="{ open: isMenuOpen }"></span>
            </button>

            <RouterLink to="/" class="logo">SPMO</RouterLink>
          </div>

          <!-- Right: links (desktop only) -->
          <div class="nav-right">
            <div class="nav-links">
              <RouterLink to="/home">Dashboard</RouterLink>
              <RouterLink to="/items">Item Inventory</RouterLink>
              <RouterLink to="/settings" class="disabled-link"> Transactions </RouterLink>
              <RouterLink to="/profile" class="disabled-link"> Inventory </RouterLink>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Drawer (mobile) -->
    <div class="drawer" :class="{ open: isMenuOpen }">
      <RouterLink to="/home" @click="closeMenu">Dashboard</RouterLink>
      <RouterLink to="/items" @click="closeMenu">Item Inventory</RouterLink>
      <RouterLink to="/settings" class="disabled-link" @click="closeMenu">
        Transactions
      </RouterLink>
      <RouterLink to="/profile" class="disabled-link" @click="closeMenu"> Inventory </RouterLink>
    </div>

    <!-- Overlay -->
    <div class="overlay" v-if="isMenuOpen" @click="closeMenu"></div>

    <!-- Content -->
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'

const isMenuOpen = ref(false)
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<style scoped>
/* Layout wrapper */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
/* Navigation bar */

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  font-weight: bold;
  font-size: 1.2rem;
  color: white;
  text-decoration: none;
}

/* Hamburger */
.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 22px;
  height: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding-top: 4px;
}

.hamburger span {
  display: block;
  height: 3px;
  width: 100%;
  background: white;
  border-radius: 2px;
  transition: 0.3s;
}

/* Drawer */
.drawer {
  position: fixed;
  top: 0;
  left: -250px;
  width: 250px;
  height: 100%;
  background: #34495e;
  display: flex;
  flex-direction: column;
  padding: 2rem 1rem;
  gap: 1rem;
  transition: left 0.3s ease;
  z-index: 1000;
}

.drawer.open {
  left: 0;
}

.drawer a {
  color: white;
  text-decoration: none;
}

.drawer a.disabled-link {
  opacity: 0.6;
  pointer-events: none;
}

/* Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 500;
}

/* Main content */
.content {
  padding: 1rem;
}

nav {
  max-width: 1350px;
  margin: 0 auto;
  padding: 0.75em 1.5em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Right section (links + hamburger) */
.nav-right {
  display: flex;
  align-items: center;
  gap: 1.25em;
}

/* Nav links */
.nav-links {
  display: flex;
  gap: 1.25em;
  transition: all 0.3s ease;
}

/* Hamburger button */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 999;
  padding-top: 4px;
  padding-bottom: 2px;
}

.hamburger span {
  display: block;
  height: 3px;
  width: 100%;
  background: #fff;
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* Hamburger animation */
.hamburger span.open:nth-child(1) {
  transform: rotate(45deg) translateY(7px);
}
.hamburger span.open:nth-child(2) {
  opacity: 0;
}
.hamburger span.open:nth-child(3) {
  transform: rotate(-45deg) translateY(-7px);
}

.nav-links {
  display: flex;
  gap: 1.25em;
}

@media (max-width: 768px) {
  .nav-links {
    display: none; /* hide desktop links */
  }

  .hamburger {
    display: flex; /* show hamburger */
  }
}

/* Responsive */
@media (max-width: 768px) {
  .nav-links {
    position: absolute;
    top: 60px;
    right: 0;
    background: #152e1a;
    flex-direction: column;
    width: 200px;
    padding: 1em;
    gap: 1em;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
  }

  .nav-links.open {
    max-height: 500px;
    opacity: 1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .hamburger {
    display: flex;
  }
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
  background: linear-gradient(135deg, #675c14, #035b01);
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
