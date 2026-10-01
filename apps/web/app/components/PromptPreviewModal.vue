<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  prompt: string;
}>();

const copied = ref(false);
let resetCopied: ReturnType<typeof setTimeout> | undefined;

watch(open, (isOpen) => {
  if (!isOpen) copied.value = false;
});

async function copyPrompt() {
  const text = props.prompt;
  let copiedText = false;
  try {
    await navigator.clipboard.writeText(text);
    copiedText = true;
  } catch {
    copiedText = copyWithSelection(text);
  }
  if (!copiedText) return;
  copied.value = true;
  clearTimeout(resetCopied);
  resetCopied = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.focus();
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  return ok;
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Agent Prompt"
    scrollable
    :ui="{
      content: 'sm:max-w-3xl',
    }"
  >
    <template #actions>
      <UButton
        class="absolute top-4 end-14"
        color="neutral"
        variant="ghost"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :aria-label="copied ? 'Copied' : 'Copy to Clipboard'"
        @click="copyPrompt"
      />
    </template>
    <template #body>
      <pre class="whitespace-pre-wrap break-words font-mono text-sm text-highlighted">{{ prompt }}</pre>
    </template>
  </UModal>
</template>
