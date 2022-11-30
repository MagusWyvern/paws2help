import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import PageHero from '../PageHero.vue'

describe('PageHero', () => {
  it('renders properly', () => {
    const wrapper = mount(PageHero, { props: { msg: 'Hello Vitest' } })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
