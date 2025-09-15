<template>
  <div class="unauthorized-view">
    <h1>401 - Unauthorized</h1>
    <p>You do not have permission to access this page.</p>
    <router-link to="/login">Go to Login</router-link>
  </div>
</template>

<script>
export default {
  name: 'UnauthorizedView',
}
</script>

<style scoped>
.unauthorized-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
h1 {
  color: #d32f2f;
  margin-bottom: 16px;
}
p {
  margin-bottom: 24px;
}
</style>
