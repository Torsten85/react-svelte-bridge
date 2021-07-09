import React, { cloneElement, ReactElement, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SvelteComponent } from 'svelte'
import { detach, insert, noop } from 'svelte/internal'

const eventRegExp = /^on([A-Z]{1,}.*)$/
const watchRegExp = /^watch([A-Z]{1,}.*)$/
const slotRegExp = /^slot([A-Z]{1,}.*)$/

export interface SvelteProps {
  component: typeof SvelteComponent
  container?: ReactElement
  children?: ReactNode
  createSlotContainer?: (slotName: string) => HTMLElement
}

const defaultCreateSlotContainer: SvelteProps['createSlotContainer'] = () => document.createElement('div')

export const Svelte = <Props extends {} = any>({
  component: Component,
  container: baseContainer,
  createSlotContainer = defaultCreateSlotContainer,
  ...rest
}: Props & SvelteProps) => {
  const containerRef = useRef<any>(null)
  const mountedRef = useRef(false)
  const instanceRef = useRef<SvelteComponent>()
  const watchHandlersRef = useRef(new Map<string, { prevValue: any; handler: (value: any) => void }>())
  const slotContainersRef = useRef(new Map<string, Node>())
  const createSlotContainerRef = useRef(createSlotContainer)
  const [slotsVisible, setSlotsVisible] = useState<Array<string>>([])
  useEffect(() => {
    createSlotContainerRef.current = createSlotContainer
  }, [createSlotContainer])

  const container = useMemo(() => {
    if (!baseContainer) {
      return <div ref={containerRef} />
    }

    return cloneElement(baseContainer, {
      ...baseContainer.props,
      ref: (node: Element) => {
        containerRef.current = node
        const { ref } = baseContainer as any
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
    })
  }, [baseContainer])

  const [eventHandlers, slots, props] = useMemo(() => {
    const eventHandlers: Record<string, (event: any) => void> = {}
    const watchHandlers = new Map<string, { prevValue: any; handler: (value: any) => void }>()
    const slots: Array<{ name: string; node: ReactNode; container: Node }> = []
    const props: Record<string, any> = {
      $$scope: {},
      $$slots: {},
    }

    Object.entries(rest).forEach(([name, prop]) => {
      if (typeof prop === 'function') {
        const eventHandlerMatch = name.match(eventRegExp)
        if (eventHandlerMatch) {
          eventHandlers[`${eventHandlerMatch[1][0].toLowerCase()}${eventHandlerMatch[1].slice(1)}`] = prop as any
          return
        }

        const watchHandlerMatch = name.match(watchRegExp)
        if (watchHandlerMatch) {
          const name = `${watchHandlerMatch[1][0].toLowerCase()}${watchHandlerMatch[1].slice(1)}`
          watchHandlers.set(name, {
            handler: prop as any,
            prevValue: watchHandlersRef.current.get(name)?.prevValue,
          })
          return
        }
      }

      const slotMatch = name.match(slotRegExp)

      if (slotMatch || name === 'children') {
        const slotName = slotMatch ? `${slotMatch[1][0].toLowerCase()}${slotMatch[1].slice(1)}` : 'default'

        if (!slotContainersRef.current.has(slotName)) {
          slotContainersRef.current.set(slotName, createSlotContainerRef.current(slotName))
        }

        const container = slotContainersRef.current.get(slotName)!
        slots.push({
          name: slotName,
          node: prop as any,
          container,
        })

        props.$$slots[slotName] = [
          () => ({
            c: noop,
            l: noop,
            m: (target: Node, anchor?: Node) => {
              setSlotsVisible(slots => [...slots, slotName])
              insert(target, container, anchor)
            },
            d: (destroy: any) => {
              if (destroy) {
                setSlotsVisible(slots => slots.filter(s => s !== slotName))
                detach(container)
              }
            },
          }),
        ]
        return
      }

      props[name] = prop
    })

    watchHandlersRef.current = watchHandlers
    Object.entries(props).forEach(([name, value]) => {
      if (watchHandlers.has(name)) {
        watchHandlers.get(name)!.prevValue = value
      }
    })

    return [eventHandlers, slots, props]
  }, [rest])

  useEffect(() => {
    const instance = new Component({
      target: containerRef.current!,
      props,
    })

    instanceRef.current = instance

    instance.$$.after_update.push(() => {
      const watchHandlers = watchHandlersRef.current
      watchHandlers.forEach(({ handler, prevValue }, name) => {
        const index = instance.$$.props[name]
        const value = instance.$$.ctx[index]
        if (!Object.is(value, prevValue)) {
          watchHandlers.get(name)!.prevValue = value
          handler(value)
        }
      })
    })

    return () => {
      instance.$destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Component])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    instanceRef.current!.$set(props)
  }, [props])

  useEffect(() => {
    const instance = instanceRef.current!

    const teardown = Object.entries(eventHandlers).map(([name, handler]) => instance.$on(name, handler))

    return () => {
      teardown.forEach(h => h())
    }
  }, [eventHandlers])

  return (
    <>
      {container}
      {slots.map(({ name, node, container }) => slotsVisible.includes(name) && createPortal(node, container as Element))}
    </>
  )
}
