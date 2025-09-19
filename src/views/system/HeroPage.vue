<template>
  <section class="hero-page">
    <div class="hero-content">
      <h1>Welcome to SPMO</h1>
      <p class="subtitle">SPMO is your comprehensive Property Inventory Management System.</p>
      <ul class="features">
        <li>Efficient property tracking</li>
        <li>Automated inventory updates</li>
        <li>Secure data management</li>
        <li>Easy reporting and analytics</li>
      </ul>
      <router-link to="/inventory" class="cta-button"> Get Started </router-link>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HeroPage',
}
</script>

<style scoped>
.hero-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%);
  color: #fff;
}

.hero-content {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
  background: rgba(30, 30, 60, 0.7);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

h1 {
  font-size: 2.8rem;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.3rem;
  margin-bottom: 2rem;
}

.features {
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
}

.features li {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.cta-button {
  display: inline-block;
  padding: 0.8rem 2rem;
  background: #fff;
  color: #4e54c8;
  font-weight: bold;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s;
}

.cta-button:hover {
  background: #e0e0ff;
}
</style>
