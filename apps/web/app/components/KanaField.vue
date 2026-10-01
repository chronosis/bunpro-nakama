<script setup lang="ts">
import { applyRomaji } from '../utils/romaji-kana';

defineOptions({ inheritAttrs: false });

const model = defineModel<string>({ required: true });

const props = defineProps<{
  status: 'idle' | 'correct' | 'incorrect';
  hint?: string;
  reveal?: boolean;
  shakeKey?: number;
}>();

const shaking = ref(false);

watch(
  () => props.shakeKey,
  async () => {
    if (props.status !== 'incorrect' || props.reveal) {
      shaking.value = false;
      return;
    }
    shaking.value = false;
    await nextTick();
    shaking.value = true;
  },
);

const input = ref<HTMLInputElement | null>(null);
let composing = false;

function placeCaretAtEnd() {
  void nextTick(() => {
    const element = input.value;
    if (!element) return;
    const end = element.value.length;
    element.setSelectionRange(end, end);
  });
}

function onCompositionStart() {
  composing = true;
}

function onCompositionEnd(event: CompositionEvent) {
  const target = event.target;
  setTimeout(() => {
    composing = false;
    if (!(target instanceof HTMLInputElement)) return;
    const raw = target.value;
    const atEnd = target.selectionStart === raw.length && target.selectionEnd === raw.length;
    model.value = applyRomaji(raw);
    if (atEnd) placeCaretAtEnd();
  }, 0);
}

function onInput(event: Event) {
  if (composing) return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const raw = target.value;
  const atEnd = target.selectionStart === raw.length && target.selectionEnd === raw.length;
  model.value = applyRomaji(raw);
  if (atEnd) placeCaretAtEnd();
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.isComposing || composing || event.keyCode === 229)) {
    event.preventDefault();
  }
}
</script>

<template>
  <div>
    <input
      ref="input"
      :value="model"
      v-bind="$attrs"
      lang="ja"
      autocomplete="off"
      autocapitalize="none"
      :spellcheck="false"
      class="w-full rounded-md border px-2 py-1.5 text-sm"
      :class="{
        'border-green-600 bg-green-50': status === 'correct',
        'border-red-600 outline outline-2 outline-offset-1 outline-red-600': status === 'incorrect',
        shake: shaking && status === 'incorrect' && !reveal,
        'border-neutral-300': status === 'idle',
      }"
      @compositionstart="onCompositionStart"
      @compositionend="onCompositionEnd"
      @input="onInput"
      @keydown="onKeyDown"
    >
    <p v-if="reveal && status === 'incorrect' && hint" class="mt-1 text-xs text-red-700" lang="ja">{{ hint }}</p>
  </div>
</template>

<style scoped>
@keyframes verb-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

.shake {
  animation: verb-shake 0.4s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .shake {
    animation: none;
  }
}
</style>
