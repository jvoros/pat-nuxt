<script setup lang="ts">
import type { Shift } from "../../server/core/types";

const { send } = useBoard();
const props = defineProps<{
    shiftId: Shift.id;
}>();

const loading = ref(false);

async function triage() {
    loading.value = true;
    await send({
        action: "addTriage",
        payload: { shiftId: props.shiftId },
    });
    loading.value = false;
}
</script>
<template>
    <UButton
        color="neutral"
        icon="fa7-solid:notes-medical"
        class="md:self-end self-center"
        title="Triage Patient"
        :loading="loading"
        @click="triage"
    />
</template>
