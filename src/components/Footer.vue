<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
    <section class="cruelty-reminder" aria-label="Animal welfare reminder">
        <div class="cruelty-reminder-content">
            <p class="cruelty-reminder-title">Animal Welfare Reminder</p>
            <p class="cruelty-reminder-text">
                If you witness suspected animal cruelty, prioritize your safety and submit a report to
                the Department of Veterinary Services (DVS) Malaysia.
            </p>
            <a
                href="https://awa.dvs.gov.my/support"
                target="_blank"
                rel="noopener noreferrer"
                class="button is-danger is-light is-small"
            >
                Report via DVS AWA
            </a>
        </div>
    </section>

    <footer class="footer">
        <div class="content has-text-centered">
            <p>
                <strong>Paws2Help</strong> by <a href="https://github.com/MagusWyvern">Adi Ahmad Danish</a>.
                The source
                code is
                licensed
                <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache 2.0</a>. The website content
                is licensed <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY NC SA 4.0</a>.
            </p>
            <RouterLink to="/privacy">Privacy Policy</RouterLink>
            |
            <RouterLink to="/terms">Terms of Use</RouterLink>
        </div>
    </footer>
</template>

<style scoped>
.cruelty-reminder {
    margin: 0 1rem;
    border: 1px solid #f5c2c7;
    background: #fff3f4;
    border-radius: 0.75rem;
}

.cruelty-reminder-content {
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.cruelty-reminder-title {
    margin: 0;
    font-weight: 700;
    color: #b42318;
}

.cruelty-reminder-text {
    margin: 0;
    color: #7a271a;
    flex: 1 1 420px;
}

@media (max-width: 768px) {
    .cruelty-reminder-content .button {
        width: 100%;
    }
}
</style>
