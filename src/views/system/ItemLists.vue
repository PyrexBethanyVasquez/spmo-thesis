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

    <!-- Items Table -->
    <div class="table-wrapper">
      <h3>Items</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Property No</th>
            <th>Location</th>
            <th>Status</th>
            <th>Serial No</th>
            <th>Model/Brand</th>
            <th>Date Acquired</th>
            <th>Item Condition</th>
            <th>Purchase Order Linked</th>
            <th>Item Sticker</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.item_no">
            <!-- <td>
              <img v-if="item.qrCode" :src="item.qrCode" alt="QR Code" class="qr-img" />
            </td> -->
            <td>{{ item.name }}</td>
            <td>{{ item.property_no }}</td>
            <td>{{ item.location }}</td>
            <td>{{ item.status }}</td>
            <td>{{ item.serial_no }}</td>
            <td>{{ item.model_brand }}</td>
            <td>{{ item.date_acquired }}</td>
            <td>{{ item.condition_name || 'N/A' }}</td>
            <td>
              <span v-if="item.po_no" class="po-badge"
                >Purchase Order Number: {{ item.po_no }}</span
              >
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

    <!-- Purchase Orders Table -->
    <div class="table-wrapper" style="margin-top: 2rem">
      <h3>Purchase Orders (with items only)</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Purchase Order Number</th>
            <th>Supplier</th>
            <th>Total Amount</th>
            <th>Order Date</th>
          </tr>
        </thead>
        <tbody>
          <!-- 🔹 Use linkedPurchaseOrders instead of all purchaseOrders -->
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
        <label>Status</label>
        <input v-model="editingItem.status" placeholder="Status" />
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
      <div class="modal-content sticker-modal">
        <h3>Print Sticker</h3>

        <div class="sticker">
          <img :src="stickerItem.qrCode" alt="QR Code" />
          <div class="sticker-details">
            <p><strong>Name:</strong> {{ stickerItem.name }}</p>
            <p><strong>Property No:</strong> {{ stickerItem.property_no }}</p>
            <p><strong>Serial No:</strong> {{ stickerItem.serial_no }}</p>
            <p><strong>Location:</strong> {{ stickerItem.location }}</p>
            <p><strong>Status:</strong> {{ stickerItem.status }}</p>
            <p><strong>Model/Brand:</strong> {{ stickerItem.model_brand }}</p>
            <p><strong>Date Acquired:</strong> {{ stickerItem.date_acquired }}</p>
          </div>
        </div>

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
      purchaseOrders: [],
      condition_names: [],
      showConfirm: false,
      itemToDelete: null,
      editingItem: null,
      stickerItem: null,
    }
  },
  computed: {
    // 🔹 Only include purchase orders that have at least one item
    linkedPurchaseOrders() {
      const linkedPoNos = new Set(this.items.map((item) => item.po_no).filter(Boolean))
      return this.purchaseOrders.filter((po) => linkedPoNos.has(po.po_no))
    },
  },
  async mounted() {
    await this.fetchItems()
    await this.fetchPurchaseOrders()
    await this.fetchConditions()
  },
  methods: {
    async fetchItems() {
      const { data, error } = await supabase
        .from('items')
        .select(
          `
      *,
      condition:condition_id (
        condition_name
      )
    `,
        )
        .order('item_no', { ascending: true })

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
            return { ...item, qrCode, condition_name: item.condition?.condition_name || 'N/A' }
          } catch (e) {
            console.warn('QR generation failed for item', item, e)
            return { ...item, qrCode: '', condition_name: item.condition?.condition_name || 'N/A' }
          }
        }),
      )
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

    editItem(item) {
      this.editingItem = { ...item }
    },

    async updateItem() {
      const itemData = { ...this.editingItem }
      delete itemData.qrCode
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

<style scoped>
.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.items-table th {
  background: #a7b982;
}

.has-po-row {
  background-color: #f9fff4; /* light green highlight */
}

.po-badge {
  background: #4caf50;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85em;
}

.no-po {
  background: #e0e0e0;
  color: #555;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85em;
}
</style>
