import { defineStore } from 'pinia'
import { supabase } from '../clients/supabase'

export const useItemStore = defineStore('items', {
  state: () => ({
    items: [],
    searchResults: [],
  }),
  actions: {
    async fetchItems() {
      const { data, error } = await supabase
        .from('items')
        .select(
          `
      *,
      condition:condition_id(condition_name),
      action:status(action_name)
    `,
        )
        .order('item_no', { ascending: true })

      if (!error) {
        this.items = data.map((item) => ({
          ...item,
          qrCode: item.qr_code,
          condition_name: item.condition?.condition_name || 'N/A',
          status_id: item.status, // keep raw id for editing
          status_name: item.action?.action_name || 'Issued', // keep readable string
        }))
      }
    },

    async searchItems(query) {
      const { data, error } = await supabase
        .from('items')
        .select(
          `
      *,
      condition:condition_id(condition_name),
      action:status(action_name)
    `,
        )
        .or(
          `name.ilike.%${query}%,property_no.ilike.%${query}%,location.ilike.%${query}%,model_brand.ilike.%${query}%`,
        )
        .order('item_no', { ascending: true })

      if (!error) {
        this.searchResults = data.map((item) => ({
          ...item,
          condition_name: item.condition?.condition_name || 'N/A',
          status_id: item.status,
          status_name: item.action?.action_name || 'Issued',
        }))
      }
    },
    clearSearch() {
      this.searchResults = []
    },
  },
})
