<template>
    <UPopover>
        <UTooltip text="Add clinician">
            <UButton
                color="neutral"
                size="lg"
                leading-icon="lucide:stethoscope"
                trailing-icon="octicon:triangle-down-16"
                title="Add Clinician"
            >
                Add
            </UButton>
        </UTooltip>
        <template #content>
            <div class="size-48 m-4 inline-flex">Add clinician</div>
        </template>
    </UPopover>
</template>
