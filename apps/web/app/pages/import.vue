<script setup lang="ts">
definePageMeta({
  middleware: [
    function () {
      return navigateTo('/sessions', { replace: true });
    },
  ],
});
</script>

<template>
  <div />
</template>
