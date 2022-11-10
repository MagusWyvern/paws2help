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
            <p class="subtitle">Paws2Help is a web application that allows you to give and adopt cats.</p>
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