# react-svelte-bridge

Yet another way to use Svelte components inside React

This project is heavily inspired by [svelte-adapter](https://github.com/pngwn/svelte-adapter).
Actually, I more or less copied the whole eventhandling / watching idea from svelte-adapter, so credit where credit's due.

## Difference to other svelte react adapters

* Typescript!
* Provide the wrapping container as react node instead of a tag name
* Slots! 

## Limitation

* Slot content (e.g. children) will be wrapped in an extra `<div />` by default (can be configured, see blow)

## Basic Example 

*SvelteComponent.svelte*
```html
<script lang="ts">
  export let name: string
</script>

<div>
  <h1>Hello {name}!</h1>
</div>
```

*ReactComponent.tsx*
```jsx
import React from 'react'
import { Svelte } from 'react-svelte-bridge'
import SvelteComponent from './SvelteComponent.svelte'

export const ReactComponent = () => {
  return (
    <Svelte
        component={SvelteComponent}
        name="Tester"
    />
  )
}
```

## Example with typescript

*ReactComponent.tsx*
```tsx
import React from 'react'
import { Svelte } from 'react-svelte-bridge'
import SvelteComponent from './SvelteComponent.svelte'

interface SvelteComponentProps {
  name: string
}

export const ReactComponent = () => {
  return (
    <Svelte<SvelteComponentProps>
        component={SvelteComponent}
        name="Tester"
    />
  )
}
```

## Example with events

*SvelteComponent.svelte*
```html
<script lang="ts">
  export let name: string
</script>

<div>
  <h1 on:click>Hello {name}!</h1>
</div>
```

*ReactComponent.tsx*
```jsx
import React from 'react'
import { Svelte } from 'react-svelte-bridge'
import SvelteComponent from './SvelteComponent.svelte'

export const ReactComponent = () => {
  return (
    <Svelte
        component={SvelteComponent}
        name="Tester"
        onClick={event => console.log('clicked!', event)}
    />
  )
}
```

## Example with slot

*SvelteComponent.svelte*
```jtml
<script lang="ts">
  export let name: string
</script>

<div>
  <h1 on:click>Hello {name}!</h1>
  <slot>This is the default slot content</slot>
</div>
```

*ReactComponent.tsx*
```jsx
import React from 'react'
import { Svelte } from 'react-svelte-bridge'
import SvelteComponent from './SvelteComponent.svelte'

export const ReactComponent = () => {
  return (
    <Svelte
        component={SvelteComponent}
        name="Tester"
        onClick={event => console.log('clicked!', event)}
    >
      This is the new slot content
    </Svelte>
  )
}
```

## Example with custom container, custom slot and custom slot container

*SvelteComponent.svelte*
```html
<script lang="ts">
  export let name: string
</script>

<div>
  <h1 on:click>Hello {name}!</h1>
  <slot>This is the default slot content</slot>
  <p>Some content</p>
  <slot name="footer">This is the default footer slot content</slot>
</div>
```

*ReactComponent.tsx*
```jsx
import React from 'react'
import { Svelte } from 'react-svelte-bridge'
import SvelteComponent from './SvelteComponent.svelte'

export const ReactComponent = () => {
  return (
    <Svelte
        component={SvelteComponent}
        name="Tester"
        onClick={event => console.log('clicked!', event)}
        container={<div style={{border: '1px solid red'}} />}
        slotFooter={<div>This is the new footer slot content</div>}
        createSlotContainer={name => {
          if (name === 'footer') {
            return document.createElement('span')
          }

          return document.createElement('div')
        }}
    >
      This is the new slot content
    </Svelte>
  )
}
```
