<script setup lang="ts">
import type { BoardEvent, Shift } from "../../server/core/types";
const { config, send, getShiftsAlphabetically, getShiftName } = useBoard();
const props = defineProps<{
    event: BoardEvent;
}>();
const loading = ref(false);
const open = ref(false);

async function reassignTo(shiftId: Shift.id) {
    loading.value = true;
    await send({
        action: "reassign",
        payload: { eventId: props.eventId, newShiftId: shiftId },
    });
    loading.value = false;
}

const reassignSelected = ref("");
const reassignItems = computed(() =>
    getShiftsAlphabetically()
        .filter((id) => id !== props.event.assign)
        .map((shiftId) => ({
            label: getShiftName(shiftId),
            shiftId,
        })),
);
async function reassign() {
    loading.value = "reassign";
    await send({
        action: "reassign",
        payload: {
            eventId: props.event.id,
            newShiftId: reassignSelected.value,
        },
    });
    loading.value = "";
    open.value = false;
    clearSelected();
}

const changeRoomSelected = ref("");
const changeRoomItems = config.value?.rooms;

async function changeRoom() {
    loading.value = "changeRoom";
    await send({
        action: "changeRoom",
        payload: {
            eventId: props.event.id,
            newRoom: changeRoomSelected.value,
        },
    });
    loading.value = "";
    open.value = false;
    clearSelected();
}

async function updateNote() {
    loading.value = "updateNote";
    await send({
        action: "updateNote",
        payload: {
            eventId: props.event.id,
            note: props.event.note,
        },
    });
    loading.value = "";
    open.value = false;
}

function clearSelected() {
    reassignSelected.value = "";
    changeRoomSelected.value = "";
}
</script>

<template>
    <UPopover
        v-model:open="open"
        @update:open="(open) => !open && clearSelected()"
    >
        <div class="font-mono text-dimmed text-xs group cursor-pointer">
            {{ convertTime(event.time) }}
            <span class="invisible group-hover:visible font-sans">
                <UBadge color="neutral" variant="soft" size="sm" label="EDIT" />
            </span>
        </div>

        <template #content>
            <div class="w-48">
                <div class="border-b border-muted p-2">
                    <span class="font-bold text-sm">Timeline Menu</span>
                </div>
                <div class="p-2 flex flex-col gap-2">
                    <!-- REASSIGN -->
                    <USelect
                        color="neutral"
                        variant="none"
                        placeholder="Reassign to:"
                        icon="fa7-solid:gift"
                        :items="reassignItems"
                        v-model="reassignSelected"
                        value-key="shiftId"
                        :loading="loading === 'reassign'"
                        @change="reassign"
                        class="w-full"
                    />

                    <!-- CHANGE ROOM -->
                    <USelect
                        color="neutral"
                        variant="none"
                        placeholder="Change Room:"
                        icon="fa7-solid:map-marker-alt"
                        :items="changeRoomItems"
                        v-model="changeRoomSelected"
                        :loading="loading === 'changeRoom'"
                        @change="changeRoom"
                        class="w-full"
                    />

                    <!-- EDIT NOTE -->
                    <UCollapsible>
                        <UButton
                            color="neutral"
                            variant="none"
                            icon="fa7-solid:pencil"
                            label="Add/Edit Note"
                            class="w-full text-dimmed"
                        />
                        <template #content>
                            <USeparator class="mt-2" />
                            <UTextarea v-model="event.note" class="m-2" />
                            <UButton
                                color="neutral"
                                icon="fa7-solid:save"
                                label="Save"
                                class="ml-2"
                                :loading="loading === 'updateNote'"
                                @click="updateNote"
                            />
                        </template>
                    </UCollapsible>
                </div>
            </div>
        </template>
    </UPopover>
</template>
