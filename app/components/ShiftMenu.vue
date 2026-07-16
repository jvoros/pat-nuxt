<script setup lang="ts">
import type { Shift } from "../../server/core/types";
import type { ActionMessage } from "../../server/utils/dispatch";

const { board, send } = useBoard();
const props = defineProps<{
    shift: Shift;
    zoneSlug: string;
}>();

const loading = ref(false);

async function dispatch(params: ActionMessage) {
    loading.value = true;
    await send(params);
    loading.value = false;
}

const otherZones = computed(() => {
    return Object.keys(board?.value.zones).filter(
        (z) => z !== props.zoneSlug && z !== "off",
    );
});

const inManyZones = computed(() => {
    const inZones = Object.keys(board?.value.zones).filter((slug) => {
        return board?.value.zones[slug].shifts.includes(props.shift.id);
    });
    return inZones.length > 1;
});

// use 'class' property to hide menu items based on various criteria
const items = computed<DropdownMenuItem[][]>(() => [
    [{ label: "Shift Menu", type: "label" }],
    [
        {
            label: "Add Triage Patient",
            icon: "fa7-solid:notes-medical",
            onSelect: () =>
                dispatch({
                    action: "addTriage",
                    payload: { shiftId: props.shift.id },
                }),
        },
    ],
    [
        {
            label: "Pause Shift",
            icon: "fa7-solid:circle-pause",
            class: props.shift.status === "paused" && "hidden",
            onSelect: () =>
                dispatch({
                    action: "togglePause",
                    payload: { shiftId: props.shift.id },
                }),
        },
        {
            label: "Unpause Shift",
            icon: "fa7-solid:circle-play",
            class: props.shift.status !== "paused" && "hidden",
            onSelect: () =>
                dispatch({
                    action: "togglePause",
                    payload: { shiftId: props.shift.id },
                }),
        },
    ],
    [
        {
            label: "Switch to Zone",
            icon: "fa7-solid:arrows-alt-h",
            children: otherZones.value.map((slug) => ({
                label: board.value.zones[slug].name,
                onSelect: () =>
                    dispatch({
                        action: "switchZone",
                        payload: {
                            shiftId: props.shift.id,
                            leaveZoneSlug: props.zoneSlug,
                            joinZoneSlug: slug,
                        },
                    }),
            })),
        },
        {
            label: "Also Join Zone",
            icon: "fa7-solid:add",
            class: props.zoneSlug === "off" && "hidden",
            children: otherZones.value.map((slug) => ({
                label: board.value.zones[slug].name,
                onSelect: () =>
                    dispatch({
                        action: "joinZone",
                        payload: {
                            shiftId: props.shift.id,
                            zoneSlug: slug,
                        },
                    }),
            })),
        },
        {
            label: "Leave This Zone",
            icon: "fa7-solid:arrow-up-right-from-square",
            class: !inManyZones.value && "hidden",
            onSelect: () => {
                dispatch({
                    action: "leaveZone",
                    payload: {
                        shiftId: props.shift.id,
                        zoneSlug: props.zoneSlug,
                    },
                });
            },
        },
    ],
    [
        {
            label: "Sign Out",
            icon: "fa7-solid:hand-peace",
            class: props.zoneSlug === "off" && "hidden",
            onSelect: () =>
                dispatch({
                    action: "signOut",
                    payload: { shiftId: props.shift.id },
                }),
        },
        {
            label: "Delete Shift",
            icon: "fa7-solid:trash",
            color: "error",
            class:
                props.shift.assigned +
                    props.shift.supervised +
                    props.shift.triaged >
                    0 && "hidden",
            onSelect: () => {
                dispatch({
                    action: "deleteShift",
                    payload: { shiftId: props.shift.id },
                });
            },
        },
    ],
]);
</script>
<template>
    <UDropdownMenu :items="items">
        <UIcon
            v-if="!loading"
            class="cursor-pointer size-4 md:size-5"
            name="material-symbols:menu-rounded"
            title="Menu"
        />
        <LoadingIcon v-if="loading" />
    </UDropdownMenu>
</template>
