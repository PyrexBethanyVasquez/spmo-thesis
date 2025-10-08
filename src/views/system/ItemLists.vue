<template>
  <div class="items-page">
    <div class="page-header">
      <h2>Item Lists</h2>
      <router-link to="/reports">
        <button class="reports-btn"><i class="fas fa-file-alt"></i>Go to Reports</button>
      </router-link>
    </div>
    <p>View Items and Purchase Orders</p>

    <hr />
    <h3>Items</h3>

    <!-- Items Table -->
    <div class="table-wrapper">
      <table class="items-table">
        <thead>
          <tr>
            <th v-for="header in itemHeaders" :key="header" class="resizable">
              {{ header }}
              <div class="resizer" @mousedown="startResize($event)"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.item_no">
            <td>{{ item.name }}</td>
            <td>{{ item.property_no }}</td>
            <td>{{ item.location }}</td>
            <td>{{ item.status }}</td>
            <td>{{ item.serial_no }}</td>
            <td>{{ item.model_brand }}</td>
            <td>{{ item.date_acquired }}</td>
            <td>{{ item.condition_name || 'N/A' }}</td>
            <td>
              <span v-if="item.po_no" class="po-badge">
                Purchase Order Number: {{ item.po_no }}
              </span>
              <span v-else class="no-po">N/A</span>
            </td>
            <td>
              <button class="print-btn" @click="openStickerModal(item)">View Sticker</button>
            </td>
            <td>
              <button @click="editItem(item)">Edit</button>
              <button @click="askDelete(item.item_no)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Previous</button>

      <span>Page {{ currentPage }} of {{ totalPages }}</span>

      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>
    <br />

    <h3>Purchase Orders (with items only)</h3>

    <!-- Purchase Orders Table -->
    <div class="table-wrapper">
      <table class="items-table">
        <thead>
          <tr>
            <th v-for="header in poHeaders" :key="header" class="resizable">
              {{ header }}
              <div class="resizer" @mousedown="startResize($event)"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="po in linkedPurchaseOrders" :key="po.po_no">
            <td>{{ po.po_no }}</td>
            <td>{{ po.supplier }}</td>
            <td>₱{{ po.total_amount }}</td>
            <td>{{ po.order_date }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showConfirm" class="modal-overlay">
      <div class="modal-card">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete this item?</p>
        <div class="modal-actions">
          <button class="delete-btn" @click="confirmDelete">Yes, Delete</button>
          <button class="cancel-btn" @click="cancelDelete">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit Item Modal -->
    <div v-if="editingItem" class="modal">
      <div class="modal-content">
        <h3>Edit Item</h3>
        <label>Item Name</label>
        <input v-model="editingItem.name" placeholder="Item Name" required />
        <label>Property No</label>
        <input v-model="editingItem.property_no" placeholder="Property No" />
        <label>Location</label>
        <input v-model="editingItem.location" placeholder="Location" />
        <div>
          <label>Status</label>
          <select v-model="editingItem.status">
            <option disabled value="">-- Select Status --</option>
            <option v-for="act in actions" :key="act.action_id" :value="act.action_id">
              {{ act.action_name }}
            </option>
          </select>
        </div>
        <label>Serial No</label>
        <input v-model="editingItem.serial_no" placeholder="Serial No" />
        <label>Model/Brand</label>
        <input v-model="editingItem.model_brand" placeholder="Model/Brand" />
        <label>Date Acquired</label>
        <input v-model="editingItem.date_acquired" type="date" placeholder="Date Acquired" />

        <div style="margin-top: 12px; display: flex; justify-content: flex-end">
          <button @click="updateItem">Save</button>
          <button @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Sticker Print Modal -->
    <div v-if="stickerItem" class="modal">
      <div class="modal-content sticker-modal" id="stickerContent">
        <!-- Header -->
        <div class="sticker-header">
          <img src="/public/csulogo.jpg" alt="Logo" class="logo" />
          <h3>
            STICKER FOR ITEM SUPPORTED WITH <br />
            INVENTORY CUSTODIAN SLIP (I.C.S) | HIGH VALUE
          </h3>
          <img :src="stickerItem.qrCode" alt="QR Code" class="qr-code" />
        </div>

        <!-- Body -->
        <div class="sticker-body">
          <div class="sticker-row">
            <span class="label">ITEM DESCRIPTION:</span>
            <span class="value">{{ stickerItem.name }}</span>
          </div>

          <div class="sticker-row">
            <span class="label">PROPERTY NO.:</span>
            <span class="value">{{ stickerItem.property_no }}</span>
          </div>

          <div class="sticker-row">
            <span class="label">P.O. NO.:</span>
            <span class="value">{{ stickerItem.po_no }}</span>
          </div>

          <div class="sticker-row">
            <span class="label">LOCATION:</span>
            <span class="value">{{ stickerItem.location }}</span>
          </div>

          <div class="sticker-row">
            <span class="label">DATE ACQUIRED:</span>
            <span class="value">{{ stickerItem.date_acquired }}</span>
          </div>

          <div class="sticker-row">
            <span class="label">SERIAL NO.:</span>
            <span class="value">{{ stickerItem.serial_no }}</span>
          </div>

          <div class="sticker-row">
            <span class="label">MODEL/BRAND:</span>
            <span class="value">{{ stickerItem.model_brand }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="sticker-footer">GOVERNMENT PROPERTY DO NOT REMOVE</div>

        <!-- Modal Actions -->
        <div class="modal-actions">
          <button @click="printSticker">Print</button>
          <button @click="closeStickerModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../clients/supabase'
import QRCode from 'qrcode'

export default {
  name: 'ItemInventory',
  data() {
    return {
      items: [],
      actions: [],
      purchaseOrders: [],
      condition_names: [],
      showConfirm: false,
      itemToDelete: null,
      editingItem: null,
      stickerItem: null,
      currentPage: 1,
      pageSize: 5, // items per page
      totalItems: 0,
      totalPages: 0,
      itemHeaders: [
        'Item Name',
        'Property No',
        'Location',
        'Status',
        'Serial No',
        'Model/Brand',
        'Date Acquired',
        'Item Condition',
        'Purchase Order Linked',
        'Item Sticker',
        'Actions',
      ],
      poHeaders: ['Purchase Order Number', 'Supplier', 'Total Amount', 'Order Date'],
    }
  },
  computed: {
    // show linked PO items only
    linkedPurchaseOrders() {
      const linkedPoNos = new Set(this.items.map((item) => item.po_no).filter(Boolean))
      return this.purchaseOrders.filter((po) => linkedPoNos.has(po.po_no))
    },
  },
  async mounted() {
    await this.fetchItems()
    await this.fetchPurchaseOrders()
    await this.fetchConditions()
    await this.fetchActions()
    await this.fetchDefaultStatus()
  },
  methods: {
    async fetchItems(page = 1) {
      const from = (page - 1) * this.pageSize
      const to = from + this.pageSize - 1

      const { data, error, count } = await supabase
        .from('items')
        .select(
          `
      *,
      condition:condition_id (
        condition_name
      ),  action:status(action_name)
    `,
          { count: 'exact' },
        )
        .order('date_acquired', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Error fetching items:', error.message)
        return
      }

      this.items = await Promise.all(
        data.map(async (item) => {
          try {
            const idForQr = item.item_no ?? item.id ?? ''
            const qrCode = await QRCode.toDataURL(String(idForQr), {
              width: 150,
              margin: 1,
            })
            return {
              ...item,
              qrCode,
              condition_name: item.condition?.condition_name || 'N/A',
              status: item.action?.action_name || 'Issued',
            }
          } catch (e) {
            console.warn('QR generation failed for item', item, e)
            return {
              ...item,
              qrCode: '',
              condition_name: item.condition?.condition_name || 'N/A',
              status: item.action?.action_name || 'Issued',
            }
          }
        }),
      )
      this.totalItems = count
      this.totalPages = Math.ceil(count / this.pageSize)
      this.currentPage = page
    },

    async fetchDefaultStatus() {
      const { data, error } = await supabase
        .from('action')
        .select('action_id')
        .eq('action_name', 'Issued')
        .single()

      if (error) {
        console.error('Error fetching default status:', error.message)
      } else {
        this.defaultStatusId = data.action_id
        this.newItem.status = this.defaultStatusId // set default for new items
      }
    },

    async fetchActions() {
      const { data, error } = await supabase.from('action').select('*')
      if (error) {
        console.error('Error fetching actions:', error.message)
        this.actions = []
      } else {
        console.log('Fetched actions:', data)
        this.actions = data || []

        // Optionally set default status to "Issued"
        const goodAction = this.actions.find((a) => a.action_name === 'Issued')
        if (goodAction) this.newItem.status = goodAction.action_id
      }
    },

    async fetchPurchaseOrders() {
      const { data, error } = await supabase
        .from('purchase_order')
        .select('*')
        .order('po_no', { ascending: true })

      if (error) {
        console.error('Error fetching purchase orders:', error.message)
        this.purchaseOrders = []
      } else {
        this.purchaseOrders = data || []
      }
    },

    async fetchConditions() {
      const { data, error } = await supabase
        .from('condition')
        .select('condition_name')
        .order('condition_name', { ascending: true })

      if (error) {
        console.error('Error fetching conditions:', error.message)
        this.condition_names = []
      } else {
        this.condition_names = data ? data.map((c) => c.condition_name) : []
      }
    },

    goToPage(page) {
      if (page < 1 || page > this.totalPages) return
      this.fetchItems(page)
    },

    startResize(e) {
      const th = e.target.parentElement
      const startX = e.pageX
      const startWidth = th.offsetWidth

      const minWidth = 80
      const maxWidth = 400

      const doDrag = (ev) => {
        let newWidth = startWidth + (ev.pageX - startX)
        if (newWidth < minWidth) newWidth = minWidth
        if (newWidth > maxWidth) newWidth = maxWidth
        th.style.width = newWidth + 'px'
      }

      const stopDrag = () => {
        document.removeEventListener('mousemove', doDrag)
        document.removeEventListener('mouseup', stopDrag)
      }

      document.addEventListener('mousemove', doDrag)
      document.addEventListener('mouseup', stopDrag)
    },

    editItem(item) {
      this.editingItem = { ...item }
    },

    async updateItem() {
      const itemData = { ...this.editingItem }
      delete itemData.qrCode
      delete itemData.action
      delete itemData.condition
      delete itemData.condition_name
      const { error } = await supabase
        .from('items')
        .update(itemData)
        .eq('item_no', this.editingItem.item_no)
      if (error) {
        alert('Error updating item: ' + error.message)
      } else {
        await this.fetchItems()
        this.editingItem = null
      }
    },

    askDelete(itemId) {
      this.itemToDelete = itemId
      this.showConfirm = true
    },

    async confirmDelete() {
      if (!this.itemToDelete) return

      const { error } = await supabase.from('items').delete().eq('item_no', this.itemToDelete)

      if (error) {
        alert('Error deleting item: ' + error.message)
      } else {
        await this.fetchItems()
      }

      this.showConfirm = false
      this.itemToDelete = null
    },

    cancelDelete() {
      this.showConfirm = false
      this.itemToDelete = null
    },

    cancelEdit() {
      this.editingItem = null
    },

    openStickerModal(item) {
      this.stickerItem = item
    },

    closeStickerModal() {
      this.stickerItem = null
    },

    printSticker() {
      window.print()
    },
  },
}
</script>
