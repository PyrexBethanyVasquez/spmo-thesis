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
      action:status(action_name),department:dept_id(dept_name)
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
          dept_id: item.dept_id,
          dept_name:
            item.department?.dept_name ||
            this.departments?.find((d) => d.dept_id === item.dept_id)?.dept_name ||
            'N/A',
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
      action:status(action_name),department:dept_id(dept_name)
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
          dept_id: item.dept_id,
          dept_name:
            item.department?.dept_name ||
            this.departments?.find((d) => d.dept_id === item.dept_id)?.dept_name ||
            'N/A',
        }))
      }
    },
    clearSearch() {
      this.searchResults = []
    },
    async generateItemNo() {
      const year = new Date().getFullYear().toString().slice(-2) // e.g. '25'

      // fetch count of existing items for this year
      const { count } = await supabase
        .from('items')
        .select('item_no', { count: 'exact', head: true })
        .ilike('item_no', `ITM-${year}-%`)

      const next = (count + 1).toString().padStart(5, '0')
      return `ITM-${year}-${next}`
    },
  },
})
