<script setup lang="ts">
const props = defineProps<{
  lookbackDays: number;
  maxSessions: number;
  pending: boolean;
}>();

const emit = defineEmits<{
  save: [window: { lookbackDays: number; maxSessions: number }];
}>();

const days = ref(props.lookbackDays);
const sessions = ref(props.maxSessions);

watch(
  () => props.lookbackDays,
  (value) => {
    days.value = value;
  },
);
watch(
  () => props.maxSessions,
  (value) => {
    sessions.value = value;
  },
);

function submit() {
  emit('save', {
    lookbackDays: Number(days.value),
    maxSessions: Number(sessions.value),
  });
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit">
    <p class="text-sm text-muted">
      The lesson plan uses at most this many of the newest sessions inside the lookback.
      Defaults are 14 days and 15 sessions.
    </p>
    <label class="block text-sm">
      Days to look back
      <input
        v-model="days"
        class="mt-1 block w-32 rounded border px-2 py-1"
        type="number"
        min="1"
        max="365"
        required
      >
    </label>
    <label class="block text-sm">
      Sessions
      <input
        v-model="sessions"
        class="mt-1 block w-32 rounded border px-2 py-1"
        type="number"
        min="1"
        max="200"
        required
      >
    </label>
    <UButton type="submit" :loading="pending">Save settings</UButton>
  </form>
</template>
