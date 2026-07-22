<script setup lang="ts">
import { convertTime } from "../utils/dates";

const { board } = useBoard();
const props = defineProps<{
    eventId: string | undefined;
}>();

const event = computed(() => board.value?.events[props.eventId]);

const time = computed(() => {
    return convertTime(event.value?.time);
});
</script>
<template>
    <div class="flex flex-row items-center gap-3 pb-1 md:pb-6">
        <TimelineIcon :mode="event?.assign ? event.mode : 'info'" />
        <TimelineEventAssign v-if="event.assign" :event="event" />
        <div v-else class="font-mono text-xs text-dimmed px-3">
            <div>{{ time }}</div>
            <div>{{ event.message }}</div>
        </div>
    </div>
</template>
