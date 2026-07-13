<script setup lang="ts">
import type { BoardEvent } from "../../server/core/types";

const { board, send, getShiftsAlphabetically } = useBoard();

const props = defineProps<{
    timeline: BoardEvent.id[];
}>();

const loading = ref(false);
const filteredShiftId = ref("");

function setFilter(id: string) {
    filteredShiftId.value = id;
}

const filteredTimeline = computed(() => {
    if (filteredShiftId.value === "") return props.timeline;
    return props.timeline.filter((eventId) => {
        if (board.value?.events[eventId].assign === filteredShiftId.value)
            return true;
        if (board.value?.events[eventId].super === filteredShiftId.value)
            return true;
        return false;
    });
});

async function undo() {
    loading.value = true;
    await send({
        action: "undo",
    });
    loading.value = false;
}
</script>
<template>
    <SectionHeader title="Timeline">
        <template #right>
            <TimelineFilter
                :setFilter="setFilter"
                :filteredId="filteredShiftId"
            />
        </template>
    </SectionHeader>
    <div class="my-2 md:my-4 border-l border-muted ml-4">
        <template v-for="(event, index) in filteredTimeline">
            <TimelineEvent :eventId="event" :index="index" />
            <template v-if="index === 0">
                <div class="flex justify-end md:-mt-2 pb-1 md:pb-4">
                    <UButton
                        color="neutral"
                        variant="outline"
                        icon="fa7-solid:undo"
                        label="Undo"
                        @click="undo"
                        :loading="loading"
                    />
                </div>
            </template>
        </template>
    </div>
</template>
