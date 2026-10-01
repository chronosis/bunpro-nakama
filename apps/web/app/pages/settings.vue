<script setup lang="ts">
interface PlanWindow {
  lookbackDays: number;
  maxSessions: number;
}

const { data: settings, refresh } = await useFetch<PlanWindow>('/api/settings');
const pending = ref(false);
const message = ref('');
const errorMessage = ref('');

async function save(window: PlanWindow) {
  pending.value = true;
  message.value = '';
  errorMessage.value = '';
  try {
    await $fetch('/api/settings', { method: 'PUT', body: window });
    await refresh();
    const sessionWord = window.maxSessions === 1 ? 'session' : 'sessions';
    const dayWord = window.lookbackDays === 1 ? 'day' : 'days';
    message.value = `Saved. Lesson plans use ${window.maxSessions} ${sessionWord} from the last ${window.lookbackDays} ${dayWord}.`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not save settings';
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold">Settings</h1>
    <PlanWindowForm
      v-if="settings"
      :lookback-days="settings.lookbackDays"
      :max-sessions="settings.maxSessions"
      :pending="pending"
      @save="save"
    />
    <UAlert v-if="message" color="success" :title="message" />
    <UAlert v-if="errorMessage" color="error" :title="errorMessage" />
  </div>
</template>
