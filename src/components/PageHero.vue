<script setup>
import AppIcon from './icons/IconApp.vue'

defineProps({
    msg: {
        type: String,
        required: true
    }
})

</script>

<template>
    <section class="hero is-primary">
        <div class="hero-body">
            <div class="wrapper">
                <AppIcon />
                <p class="title">
                    {{ msg }}
                </p>
            </div>
            <p class="subtitle">Helping the community to care for cats around the country &#60;3 </p>
        </div>
    </section>


</template>

<style scoped>
.wrapper {
    display: flex;
    align-items: center;
}

.hero {
    border-radius: 10px;
    width: 100%;
}
</style>