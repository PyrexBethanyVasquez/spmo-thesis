<template>
  <div class="forgot-password-modal">
    <div class="modal-overlay" @click="close"></div>
    <div class="modal-content">
      <h2>Forgot Password</h2>
      <p>Please contact the developers to reset your password.</p>
      <button @click="close">Close</button>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'
const emit = defineEmits(['close'])

function close() {
  emit('close')
}
</script>

<style scoped>
.forgot-password-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
}
.modal-content {
  position: relative;
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  z-index: 1;
  min-width: 300px;
  text-align: center;
}
button {
  margin-top: 1rem;
}
</style>
