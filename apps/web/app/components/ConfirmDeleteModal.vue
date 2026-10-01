<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false });

const props = withDefaults(
  defineProps<{
    sessionId?: string;
    pending?: boolean;
    heading?: string;
    message?: string;
  }>(),
  {
    sessionId: '',
    heading: 'Delete session',
  },
);

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <UModal
    v-model:open="open"
    :title="props.heading"
    :ui="{
      footer: 'justify-end',
    }"
  >
    <template #body>
      <p v-if="message" class="text-sm text-highlighted">{{ message }}</p>
      <p v-else class="text-sm text-highlighted">
        Delete <span class="font-medium break-all">{{ sessionId }}</span> and every answer stored
        with it? This cannot be undone.
      </p>
    </template>
    <template #footer>
      <UButton color="neutral" variant="ghost" :disabled="pending" @click="open = false">
        Cancel
      </UButton>
      <UButton color="error" :loading="pending" @click="emit('confirm')">
        Delete
      </UButton>
    </template>
  </UModal>
</template>
