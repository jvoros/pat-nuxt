<script setup lang="ts">
import type { Shift } from "../../server/core/types";

const { board } = useBoard();
const props = defineProps<{
    shift: Shift;
}>();
</script>
<template>
    <span class="border-r-1 pr-3">{{ shift.name }}</span>
    <span class="ml-2">
        {{ shift.assigned + shift.supervised + shift.triaged }} Total
        <span v-if="shift.supervised > 0">• {{ shift.supervised }} Super</span>
        <span v-if="shift.triaged > 0">• {{ shift.triaged }} Triage</span>
    </span>
</template>
