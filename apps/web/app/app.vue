<script setup lang="ts">
const route = useRoute();
const fullWidth = computed(() => route.path.startsWith('/verbs'));

useHead({
  htmlAttrs: { lang: 'en' },
  title: 'Bunpro Nakama',
  link: [
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
    { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon.png' },
    { rel: 'shortcut icon', href: '/favicon.ico' },
  ],
});
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <ULink
          to="/"
          aria-label="Bunpro Nakama"
          class="flex shrink-0 items-center gap-1.5 text-xl font-bold text-highlighted"
        >
          <img
            src="/brand-mark.png"
            alt=""
            width="32"
            height="32"
            class="size-8 shrink-0"
          >
          <span>Bunpro Nakama</span>
        </ULink>
      </template>
      <template #right>
        <nav class="flex items-center gap-1">
          <UButton to="/" color="neutral" variant="ghost">Home</UButton>
          <UButton to="/verbs" color="neutral" variant="ghost">Verb study</UButton>
          <UButton to="/sessions" color="neutral" variant="ghost">Sessions</UButton>
          <UButton to="/plans" color="neutral" variant="ghost">Lesson plans</UButton>
          <UButton to="/settings" color="neutral" variant="ghost">Settings</UButton>
        </nav>
      </template>
    </UHeader>
    <UMain class="w-full px-4 py-2" :class="fullWidth ? 'max-w-none' : 'mx-auto max-w-4xl'">
      <NuxtPage />
    </UMain>
  </UApp>
</template>
