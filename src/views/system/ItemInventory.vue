<template>
  <div class="items-page">
    <div class="page-header">
      <h2>Item Inventory</h2>
      <button class="add-item-btn" @click="showAddForm = !showAddForm">
        <ion-icon name="add-circle-outline"></ion-icon>
        Add Item
      </button>
    </div>
    <p>Add and Manage Items</p>

    <!-- Add Item Form (toggle) -->
    <form v-if="showAddForm" class="item-form" @submit.prevent="addItem">
      <div>
        <label for="name">Item Name</label>
        <input id="name" v-model="newItem.name" placeholder="Enter item name" required />
      </div>

      <div>
        <label for="property_no">Property No</label>
        <input id="property_no" v-model="newItem.property_no" placeholder="Enter property no" />
      </div>

      <div>
        <label for="location">Location</label>
        <input id="location" v-model="newItem.location" placeholder="Enter location" />
      </div>

      <div>
        <label for="status">Status</label>
        <input id="status" v-model="newItem.status" placeholder="Enter status" />
      </div>

      <div>
        <label for="serial_no">Serial No</label>
        <input id="serial_no" v-model="newItem.serial_no" placeholder="Enter serial no" />
      </div>

      <div>
        <label for="model_brand">Model/Brand</label>
        <input id="model_brand" v-model="newItem.model_brand" placeholder="Enter model/brand" />
      </div>

      <div>
        <label for="date_acquired">Date Acquired</label>
        <input id="date_acquired" v-model="newItem.date_acquired" type="date" />
      </div>

      <div class="condition-section">
        <label for="condition">Condition</label>
        <div class="condition-inputs">
          <select id="condition" v-model="newItem.condition_id" required>
            <option disabled value="">-- Select Condition --</option>
            <option v-for="cond in conditions" :key="cond.condition_id" :value="cond.condition_id">
              {{ cond.condition_name }}
            </option>
          </select>
          <button type="button" @click="showConditionForm = true">Add New Condition</button>
        </div>
      </div>

      <div class="po-section">
        <label for="po_no">Purchase Order</label>
        <div class="po-inputs">
          <select id="po_no" v-model="newItem.po_no" required>
            <option disabled value="">-- Select Purchase Order --</option>
            <option v-for="po in purchaseOrders" :key="po.po_no" :value="po.po_no">
              <!-- {{ po.po_no }} -->
              <span v-if="po.supplier"> {{ po.supplier }}</span>
              <span v-if="po.total_amount"> (₱{{ po.total_amount }})</span>
            </option>
          </select>
          <button type="button" @click="showPoForm = true">Add New PO</button>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="save-btn">Save Item</button>
        <button type="button" class="cancel-btn" @click="cancelAdd">Cancel</button>
      </div>
    </form>

    <hr />

    <!-- Items Table -->
    <div class="table-wrapper">
      <table class="items-table">
        <thead>
          <tr>
            <th>QR Code</th>
            <th>Name</th>
            <th>Property No</th>
            <th>Location</th>
            <th>Status</th>
            <th>Serial No</th>
            <th>Model/Brand</th>
            <th>Date Acquired</th>
            <th>Item Sticker</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.item_no">
            <td>
              <img v-if="item.qrCode" :src="item.qrCode" alt="QR Code" class="qr-img" />
            </td>
            <td>{{ item.name }}</td>
            <td>{{ item.property_no }}</td>
            <td>{{ item.location }}</td>
            <td>{{ item.status }}</td>
            <td>{{ item.serial_no }}</td>
            <td>{{ item.model_brand }}</td>
            <td>{{ item.date_acquired }}</td>
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

    <!-- Purchase Order Modal -->
    <div v-if="showPoForm" class="modal">
      <div class="modal-content">
        <h3>Add Purchase Order</h3>
        <label>Supplier</label>
        <input v-model="newPurchaseOrder.supplier" placeholder="Supplier Name" required />

        <label>Total Amount</label>
        <input
          type="number"
          step="0.01"
          v-model="newPurchaseOrder.total_amount"
          placeholder="Amount in Peso"
          required
        />

        <label>Order Date</label>
        <input type="date" v-model="newPurchaseOrder.order_date" required />

        <div class="modal-actions">
          <button @click="addPurchaseOrder">Save</button>
          <button @click="showPoForm = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- New Condition Modal -->
    <div v-if="showConditionForm" class="modal">
      <div class="modal-content">
        <h3>Add Condition</h3>
        <input v-model="newCondition.condition_name" placeholder="Condition Name" required />
        <div class="modal-actions">
          <button @click="addCondition">Save</button>
          <button @click="showConditionForm = false">Cancel</button>
        </div>
      </div>
    </div>

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

    <div v-if="editingItem" class="modal">
      <div class="modal-content">
        <h3>Edit Item</h3>

        <div class="modal-grid">
          <div>
            <label>Item Name</label>
            <input v-model="editingItem.name" placeholder="Item Name" required />
          </div>

          <div>
            <label>Property No</label>
            <input v-model="editingItem.property_no" placeholder="Property No" />
          </div>

          <div>
            <label>Location</label>
            <input v-model="editingItem.location" placeholder="Location" />
          </div>

          <div>
            <label>Status</label>
            <input v-model="editingItem.status" placeholder="Status" />
          </div>

          <div>
            <label>Serial No</label>
            <input v-model="editingItem.serial_no" placeholder="Serial No" />
          </div>

          <div>
            <label>Model/Brand</label>
            <input v-model="editingItem.model_brand" placeholder="Model/Brand" />
          </div>

          <div>
            <label>Date Acquired</label>
            <input v-model="editingItem.date_acquired" type="date" />
          </div>

          <div>
            <label>Condition</label>
            <select v-model="editingItem.condition_id">
              <option disabled value="">-- Select Condition --</option>
              <option
                v-for="cond in conditions"
                :key="cond.condition_id"
                :value="cond.condition_id"
              >
                {{ cond.condition_name }}
              </option>
            </select>
          </div>

          <div>
            <label>Purchase Order</label>
            <select v-model="editingItem.po_no">
              <option disabled value="">-- Select Purchase Order --</option>
              <option v-for="po in purchaseOrders" :key="po.po_no" :value="po.po_no">
                {{ po.po_no }} - {{ po.supplier }} (₱{{ po.total_amount }})
              </option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
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
      conditions: [],
      showPoForm: false,
      showConditionForm: false,
      showConfirm: false,
      itemToDelete: null,
      newItem: {
        name: '',
        property_no: '',
        location: '',
        status: '',
        serial_no: '',
        model_brand: '',
        date_acquired: '',
        po_no: '',
        condition_id: '',
      },
      newPurchaseOrder: {
        supplier: '',
        total_amount: '',
        order_date: '',
      },
      newCondition: {
        condition_name: '',
      },

      editingItem: null,
      stickerItem: null,
      showAddForm: false, // <<-- controls visibility
    }
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
        .select('*')
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
            return { ...item, qrCode }
          } catch (e) {
            console.warn('QR generation failed for item', item, e)
            return { ...item, qrCode: '' }
          }
        }),
      )
    },

    async fetchPurchaseOrders() {
      const { data, error } = await supabase.from('purchase_order').select('*')

      if (error) {
        console.error('Error fetching purchase orders:', error.message)
        this.purchaseOrders = [] // fallback
      } else {
        this.purchaseOrders = data || [] // never null
      }
    },

    async fetchConditions() {
      const { data, error } = await supabase.from('condition').select('*')
      if (error) {
        console.error('Error fetching conditions:', error.message)
        this.conditions = []
      } else {
        this.conditions = data || []
      }
    },

    async addPurchaseOrder() {
      const { data, error } = await supabase
        .from('purchase_order')
        .insert([this.newPurchaseOrder])
        .select()

      if (error) {
        alert('Error adding purchase order: ' + error.message)
        return
      }

      // Refresh PO list
      await this.fetchPurchaseOrders()

      // Auto-select the newly created PO for the item form
      if (data && data.length > 0) {
        this.newItem.po_no = data[0].po_no
      }

      // Reset form + close modal
      this.newPurchaseOrder = { supplier: '', total_amount: '', order_date: '' }
      this.showPoForm = false
    },

    async addCondition() {
      const { data, error } = await supabase.from('condition').insert([this.newCondition]).select()

      if (error) {
        alert('Error adding condition: ' + error.message)
        return
      }

      // Refresh conditions list
      await this.fetchConditions()

      // Auto-select the newly created condition for the item form
      if (data && data.length > 0) {
        this.newItem.condition_id = data[0].id
      }

      // Reset form + close modal
      this.newCondition = { condition_name: '' }
      this.showConditionForm = false
    },

    async addItem() {
      const { error } = await supabase.from('items').insert([this.newItem])
      if (error) {
        alert('Error adding item: ' + error.message)
      } else {
        await this.fetchItems()
        this.newItem = {
          name: '',
          property_no: '',
          location: '',
          status: '',
          serial_no: '',
          model_brand: '',
          date_acquired: '',
        }
        this.showForm = false // hide form after add
      }
    },

    cancelAdd() {
      this.showAddForm = false
      this.newItem = {
        name: '',
        property_no: '',
        location: '',
        status: '',
        serial_no: '',
        model_brand: '',
        date_acquired: '',
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
