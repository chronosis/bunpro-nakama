<script setup lang="ts">
import {
  answerMatches,
  emptyAnswers,
  FORM_ROWS,
  furiganaParts,
  verbClassLabel,
  verbForms,
  VERBS,
  type FormId,
  type Politeness,
  type Verb,
} from '../utils/verb-drill';

const bag = ref<Verb[]>([]);
const current = ref<Verb | null>(null);
const answers = ref(emptyAnswers());
const checked = ref(false);
const revealed = ref(false);
const shakeKey = ref(0);

function sameVerb(left: Verb, right: Verb) {
  return left.lemma === right.lemma && left.wordClass === right.wordClass;
}

function shuffle(verbs: readonly Verb[]): Verb[] {
  const copy = [...verbs];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const item = copy[index]!;
    copy[index] = copy[swap]!;
    copy[swap] = item;
  }
  return copy;
}

function draw(previous: Verb | null): Verb {
  if (bag.value.length === 0) {
    const next = shuffle(VERBS);
    const last = next.length - 1;
    if (previous && last > 0 && sameVerb(next[last]!, previous)) {
      const swap = Math.floor(Math.random() * last);
      const end = next[last]!;
      next[last] = next[swap]!;
      next[swap] = end;
    }
    bag.value = next;
  }
  return bag.value.pop() ?? previous ?? VERBS[0]!;
}

onMounted(() => {
  current.value = draw(null);
});

const forms = computed(() => (current.value ? verbForms(current.value) : null));
const parts = computed(() =>
  current.value ? furiganaParts(current.value.lemma, current.value.reading) : [],
);

function check() {
  if (!current.value) return;
  checked.value = true;
  if (!revealed.value) shakeKey.value += 1;
}

function giveUp() {
  if (!checked.value || !current.value) return;
  revealed.value = true;
}

function nextVerb() {
  if (!current.value) return;
  current.value = draw(current.value);
  answers.value = emptyAnswers();
  checked.value = false;
  revealed.value = false;
}

function statusFor(form: FormId, politeness: Politeness): 'idle' | 'correct' | 'incorrect' {
  if (!checked.value || !forms.value) return 'idle';
  return answerMatches(answers.value[form][politeness], forms.value[form][politeness])
    ? 'correct'
    : 'incorrect';
}

function hintFor(form: FormId, politeness: Politeness): string | undefined {
  if (!revealed.value || statusFor(form, politeness) !== 'incorrect') return undefined;
  return forms.value?.[form][politeness][0];
}

const correctCount = computed(() => {
  if (!checked.value || !forms.value) return 0;
  let count = 0;
  for (const row of FORM_ROWS) {
    for (const politeness of ['casual', 'polite'] as const) {
      if (answerMatches(answers.value[row.id][politeness], forms.value[row.id][politeness])) count += 1;
    }
  }
  return count;
});
</script>

<template>
  <form class="space-y-6" @submit.prevent="check">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-3xl font-semibold">Verb study</h1>
      <div class="flex gap-2">
        <UButton type="submit" :disabled="!current">Check answers</UButton>
        <UButton
          v-if="checked && !revealed"
          type="button"
          color="neutral"
          variant="outline"
          @click="giveUp"
        >
          Give Up
        </UButton>
        <UButton type="button" color="neutral" variant="soft" :disabled="!current" @click="nextVerb">
          Next verb
        </UButton>
      </div>
    </div>

    <p class="text-sm text-muted">
      Type romaji. It turns into hiragana as you type. A Japanese IME is left alone until the composition finishes.
    </p>

    <div v-if="current" class="space-y-6">
      <div class="text-center">
        <p class="text-4xl" lang="ja">
          <template v-for="(part, index) in parts" :key="`${part.text}-${index}`">
            <ruby v-if="part.reading">{{ part.text }}<rt>{{ part.reading }}</rt></ruby><span v-else>{{ part.text }}</span>
          </template>
        </p>
        <p class="mt-1 text-muted">{{ current.meaning }}</p>
        <p v-if="checked" class="mt-1 text-sm text-muted">Hint: {{ verbClassLabel(current) }}</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr class="text-sm text-muted">
              <th class="w-40 pb-2 font-medium" />
              <th class="pb-2 font-medium">Casual</th>
              <th class="pb-2 font-medium">Polite</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in FORM_ROWS" :key="row.id">
              <th class="py-1.5 pr-3 align-top text-sm font-medium">{{ row.label }}</th>
              <td class="px-1 py-1.5 align-top">
                <KanaField
                  v-model="answers[row.id].casual"
                  :status="statusFor(row.id, 'casual')"
                  :hint="hintFor(row.id, 'casual')"
                  :reveal="revealed"
                  :shake-key="shakeKey"
                  :aria-label="`${row.label} casual`"
                />
              </td>
              <td class="px-1 py-1.5 align-top">
                <KanaField
                  v-model="answers[row.id].polite"
                  :status="statusFor(row.id, 'polite')"
                  :hint="hintFor(row.id, 'polite')"
                  :reveal="revealed"
                  :shake-key="shakeKey"
                  :aria-label="`${row.label} polite`"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="checked" class="text-sm">{{ correctCount }} of {{ FORM_ROWS.length * 2 }} correct.</p>
    </div>
  </form>
</template>
