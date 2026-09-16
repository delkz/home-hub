import { useCallback, useEffect, useMemo, useState } from 'react'
import { InventoryService } from '../application/InventoryService'
import type { CreateInventoryItemInput, InventoryItem } from '../domain/inventory'
import { HttpInventoryRepository } from '../infrastructure/HttpInventoryRepository'

const inventoryService = new InventoryService(new HttpInventoryRepository())

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await inventoryService.listItems())
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar o inventário.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void inventoryService.listItems()
      .then((data) => {
        if (cancelled) return
        setItems(data)
        setError(null)
      })
      .catch((caught: unknown) => {
        if (cancelled) return
        setError(caught instanceof Error ? caught.message : 'Não foi possível carregar o inventário.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const save = async (input: CreateInventoryItemInput, itemId?: string) => {
    setSaving(true)
    setMutationError(null)
    try {
      const saved = itemId
        ? await inventoryService.updateItem(itemId, input)
        : await inventoryService.createItem(input)

      setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      setMutationError(null)
      return saved
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Não foi possível salvar o item.'
      setMutationError(message)
      throw caught
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: InventoryItem) => {
    setBusyItemId(item.id)
    try {
      await inventoryService.deleteItem(item.id)
      setItems((current) => current.filter((candidate) => candidate.id !== item.id))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível excluir o item.')
    } finally {
      setBusyItemId(null)
    }
  }

  const adjust = async (item: InventoryItem, change: number) => {
    setBusyItemId(item.id)
    try {
      const updated = await inventoryService.adjustQuantity(item, change)
      setItems((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível ajustar a quantidade.')
    } finally {
      setBusyItemId(null)
    }
  }

  const summary = useMemo(() => ({
    total: items.length,
    low: items.filter((item) => item.status === 'LOW').length,
    empty: items.filter((item) => item.status === 'EMPTY').length,
    ok: items.filter((item) => item.status === 'OK').length,
  }), [items])

  return { items, summary, loading, saving, busyItemId, error, mutationError, load, save, remove, adjust }
}

export type InventoryController = ReturnType<typeof useInventory>
