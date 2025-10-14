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

      <!-- Status Section -->
      <div class="status-section">
        <label for="status">Status</label>
        <select id="status" v-model="newItem.status" required>
          <option disabled value="">-- Select Status --</option>
          <option v-for="action in actions" :key="action.action_id" :value="action.action_id">
            {{ action.action_name }}
          </option>
        </select>
      </div>

      <hr class="section-divider" />

      <!-- Bottom Dropdowns (Condition, PO, Department) -->
      <div class="extra-fields-row">
        <!-- Condition -->
        <div class="condition-section">
          <label for="condition">Condition</label>
          <div class="condition-inputs">
            <select
              id="condition"
              v-model="newItem.condition_id"
              @change="handleConditionChange"
              required
            >
              <option disabled value="">-- Select Condition --</option>
              <option
                v-for="cond in conditions"
                :key="cond.condition_id"
                :value="cond.condition_id"
              >
                {{ cond.condition_name }}
              </option>

              <!-- Add new option -->
              <option disabled>──────────</option>
              <option value="add-new">+ Add New Condition</option>
            </select>
          </div>
        </div>

        <!-- Department -->
        <div class="dept-section">
          <label for="department">Department</label>
          <div class="dept-inputs">
            <select id="department" v-model="newItem.dept_id" @change="handleDeptChange" required>
              <option disabled value="">-- Select Department --</option>
              <option v-for="dept in departments" :key="dept.dept_id" :value="dept.dept_id">
                {{ dept.dept_name }}
              </option>
              <option disabled>──────────</option>
              <option value="add-new">+ Add New Department</option>
            </select>
          </div>
        </div>

        <!-- Purchase Order -->
        <div class="po-section">
          <label for="po_no">Purchase Order</label>
          <div class="po-inputs">
            <select id="po_no" v-model="newItem.po_no" @change="handlePOChange" required>
              <option disabled value="">-- Select Purchase Order --</option>
              <option v-for="po in purchaseOrders" :key="po.po_no" :value="po.po_no">
                {{ po.supplier }}
                (₱{{ po.total_amount }})
              </option>
              <option disabled>──────────</option>
              <option value="add-new">+ Add New Purchase Order</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="submit" class="save-btn">Save Item</button>
        <button type="button" class="cancel-btn" @click="cancelAdd">Cancel</button>
      </div>
    </form>

    <hr />
    <br />

    <!-- Search Section -->
    <div class="search-wrapper">
      <div class="search-bar">
        <ion-icon name="search-outline"></ion-icon>
        <input type="text" v-model="searchQuery" placeholder="Search items" />
      </div>
    </div>
    <br />

    <!-- Items Table -->
    <div class="table-wrapper">
      <table class="items-table-inventory">
        <thead>
          <tr>
            <th>QR Code</th>
            <th>Name</th>
            <th>Property No</th>
            <th>Location</th>
            <th>Department</th>
            <th>Status</th>
            <th>Serial No</th>
            <th>Model/Brand</th>
            <th>Date Acquired</th>
            <th>Item Sticker</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.id || item.item_no">
            <td>
              <div class="qr-row">
                <img v-if="item.qrCode" :src="item.qrCode" alt="QR Code" class="qr-img" />
                <span class="item-no">{{ item.item_no }}</span>
              </div>
            </td>

            <td class="item-cell">
              <span v-if="item.item_no === recentlyAddedItemId" class="badge-overlay">
                Recently Added
              </span>
              <span class="item-name">{{ item.name }}</span>
            </td>

            <td>{{ item.property_no }}</td>
            <td>{{ item.location }}</td>
            <td>{{ item.dept_name }}</td>
            <td>{{ item.status_name }}</td>
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
    <div class="pagination">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Previous</button>

      <span>Page {{ currentPage }} of {{ totalPages }}</span>

      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        Next
      </button>
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

    <div v-if="showDeptForm" class="modal">
      <div class="modal-content">
        <h3>Add New Department</h3>
        <input v-model="newDepartment.dept_name" placeholder="Enter department name" required />
        <div class="modal-actions">
          <button @click="addDepartment">Save Department</button>
          <button @click="showDeptForm = false">Cancel</button>
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
            <select v-model="editingItem.status">
              <option disabled value="">-- Select Status --</option>
              <option v-for="act in actions" :key="act.action_id" :value="act.action_id">
                {{ act.action_name }}
              </option>
            </select>
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

          <div>
            <label>Department</label>
            <select v-model="editingItem.dept_id">
              <option disabled value="">-- Select Department --</option>
              <option v-for="dept in departments" :key="dept.dept_id" :value="dept.dept_id">
                {{ dept.dept_name }}
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
import { useToast } from 'vue-toastification'
import { useItemStore } from '@/stores/useItemStore'

import QRCode from 'qrcode'

const toast = useToast()

export default {
  name: 'ItemInventory',
  data() {
    return {
      items: [],
      searchQuery: '',
      purchaseOrders: [],
      conditions: [],
      actions: [],
      departments: [],
      showDeptForm: false,
      showPoForm: false,
      showConditionForm: false,
      showConfirm: false,
      itemToDelete: null,
      recentlyAddedItemId: null,
      currentPage: 1,
      pageSize: 5, // items per page
      totalItems: 0,
      totalPages: 0,
      newItem: {
        name: '',
        property_no: '',
        location: '',
        status: null,
        serial_no: '',
        model_brand: '',
        date_acquired: '',
        po_no: '',
        condition_id: '',
        dept_id: '',
      },
      newPurchaseOrder: {
        supplier: '',
        total_amount: '',
        order_date: '',
      },
      newCondition: {
        condition_name: '',
      },
      newDepartment: {
        dept_name: '',
      },

      editingItem: null,
      stickerItem: null,
      showAddForm: false, // <<-- controls visibility
    }
  },

  computed: {
    filteredItems() {
      if (!this.searchQuery || this.searchQuery.trim() === '') {
        return this.items
      }

      const query = this.searchQuery.toLowerCase()

      return this.items.filter((item) => {
        return (
          item.item_no?.toLowerCase().includes(query) ||
          item.name?.toLowerCase().includes(query) ||
          item.property_no?.toLowerCase().includes(query) ||
          item.location?.toLowerCase().includes(query) ||
          item.status_name?.toLowerCase().includes(query) ||
          item.serial_no?.toLowerCase().includes(query) ||
          item.model_brand?.toLowerCase().includes(query)
        )
      })
    },
  },

  watch: {
    async searchQuery(newVal) {
      if (!newVal || !newVal.trim()) {
        // if search cleared, reload paginated items
        await this.fetchItems(this.currentPage)
        return
      }
      await this.doSearch(newVal)
    },
  },

  async mounted() {
    await this.fetchItems()
    await this.fetchPurchaseOrders()
    await this.fetchConditions()
    await this.fetchActions()
    await this.fetchDepartments()
    const savedId = localStorage.getItem('recentlyAddedItemId')
    if (savedId) {
      this.recentlyAddedItemId = savedId
    }
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
      action:status(action_id,action_name),
      department:dept_id(dept_id,dept_name)
    `,
          { count: 'exact' },
        )
        .order('date_acquired', { ascending: false })
        .range(from, to)

      if (error) {
        toast.error('Error fetching items:', error.message)
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
              status: item.action?.action_id || null,
              status_name: item.action?.action_name || 'Issued',
              dept_id: item.department?.dept_id || '',
              dept_name: item.department?.dept_name || 'N/A',
              condition_name: item.condition?.condition_name || 'N/A',
            }
          } catch (e) {
            console.warn('QR generation failed for item', item, e)
            return { ...item, qrCode: '' }
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
        toast.error('Error fetching default status:', error.message)
      } else {
        this.defaultStatusId = data.action_id
        this.newItem.status = this.defaultStatusId // set default for new items
      }
    },

    async fetchActions() {
      const { data, error } = await supabase.from('action').select('*')
      if (error) {
        toast.error('Error fetching actions:', error.message)
        this.actions = []
      } else {
        this.actions = data || []

        // set default status to "Issued"
        const goodAction = this.actions.find((a) => a.action_name === 'Issued')
        if (goodAction) this.newItem.status = goodAction.action_id
      }
    },

    async fetchPurchaseOrders() {
      const { data, error } = await supabase.from('purchase_order').select('*')

      if (error) {
        toast.error('Error fetching purchase orders:', error.message)
        this.purchaseOrders = [] // fallback
      } else {
        this.purchaseOrders = data || [] // never null
      }
    },

    async fetchConditions() {
      const { data, error } = await supabase.from('condition').select('*')
      if (error) {
        toast.error('Error fetching conditions:', error.message)
        this.conditions = []
      } else {
        this.conditions = data || []
      }
    },

    async fetchDepartments() {
      const { data, error } = await supabase
        .from('department')
        .select('*')
        .order('dept_name', { ascending: true })

      if (error) {
        toast.error('Error fetching departments:', error.message)
        this.departments = []
      } else {
        this.departments = data || []
      }
    },

    async addPurchaseOrder() {
      const { data, error } = await supabase
        .from('purchase_order')
        .insert([this.newPurchaseOrder])
        .select()

      if (error) {
        toast.error('Error adding purchase order: ' + error.message)
        return
      }

      toast.success('New Purchase Order added successfully!')
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
        toast.error('Error adding condition: ' + error.message)
        return
      }

      toast.success('New Condition added successfully!')
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
      const store = useItemStore()
      const cleanItem = {
        item_no: await store.generateItemNo(),
        name: this.newItem.name,
        property_no: this.newItem.property_no,
        location: this.newItem.location,
        status: this.newItem.status || this.defaultStatusId,
        serial_no: this.newItem.serial_no,
        model_brand: this.newItem.model_brand,
        date_acquired: this.newItem.date_acquired || null,
        po_no: this.newItem.po_no || null,
        condition_id: this.newItem.condition_id || null,
        dept_id: this.newItem.dept_id || null,
      }

      // 1️⃣ Insert the new item
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .insert([cleanItem])
        .select('*')

      if (itemError) {
        console.error('Error adding item: ' + itemError.message)
        toast.error('Failed to add item: ' + itemError.message)
        return
      }

      toast.success('New Item added successfully!')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) {
        console.error('Failed to get admin user:', userError)
      }
      const newItemId = itemData[0].id || itemData[0].item_no
      this.recentlyAddedItemId = newItemId
      localStorage.setItem('recentlyAddedItemId', newItemId)

      // 2️⃣ Automatically create a transaction for this item
      const transaction = {
        item_no: newItemId,
        dept_id: cleanItem.dept_id,
        action_id: cleanItem.status, // current status of the item
        user_id: user?.id || null,

        date: new Date().toISOString(),
      }

      const { error: txnError } = await supabase.from('transaction').insert([transaction])

      if (txnError) {
        console.error('Failed to create transaction:', txnError.message)
        toast.error('Item added but failed to record transaction')
      } else {
        toast.success('Item and transaction added successfully!')
      }

      // 3️⃣ Refresh items
      await this.fetchItems()

      // 4️⃣ Reset form
      this.newItem = {
        name: '',
        property_no: '',
        location: '',
        status: this.defaultStatusId,
        serial_no: '',
        model_brand: '',
        date_acquired: '',
        po_no: '',
        condition_id: '',
        dept_id: '',
      }
      this.showAddForm = false
    },
    async addDepartment() {
      if (!this.newDepartment.dept_name.trim()) return

      const { error } = await supabase
        .from('department')
        .insert([{ dept_name: this.newDepartment.dept_name.trim() }])

      if (error) {
        console.error('Error adding department:', error.message)
        toast.error('Failed to add department.')
      } else {
        toast.success('Department added successfully!')
        this.newDepartment.dept_name = ''
        this.showDeptForm = false
        await this.fetchDepartments() // refresh dropdown
      }
    },

    async handleConditionChange() {
      if (this.newItem.condition_id === 'add-new') {
        this.showConditionForm = true // open modal or inline form
        this.newItem.condition_id = '' // reset selection to avoid accidental saving
      }
    },
    async handlePOChange() {
      if (this.newItem.po_no === 'add-new') {
        this.showPoForm = true // open modal or inline form
        this.newItem.po_no = '' // reset selection to avoid accidental saving
      }
    },
    async handleDeptChange() {
      if (this.newItem.dept_id === 'add-new') {
        this.showDeptForm = true // open modal or inline form
        this.newItem.dept_id = '' // reset selection to avoid accidental saving
      }
    },

    async updateItem() {
      try {
        // Prepare the updated item data
        const itemData = {
          name: this.editingItem.name,
          property_no: this.editingItem.property_no,
          location: this.editingItem.location,
          status: this.editingItem.status,
          serial_no: this.editingItem.serial_no,
          model_brand: this.editingItem.model_brand,
          date_acquired: this.editingItem.date_acquired,
          po_no: this.editingItem.po_no,
          condition_id: this.editingItem.condition_id,
          dept_id: this.editingItem.dept_id,
        }

        // 1️⃣ Update the item
        const { error: updateError } = await supabase
          .from('items')
          .update(itemData)
          .eq('item_no', this.editingItem.item_no)

        if (updateError) {
          console.error('Error updating item:', updateError.message)
          toast.error('Error updating item: ' + updateError.message)
          return
        }

        // 2️⃣ Get the logged-in user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const userId = user?.id || null // fallback to null if not found

        // 3️⃣ Record the transaction
        const transactionPayload = {
          item_no: this.editingItem.item_no, // change to item_id if your table expects it
          action_id: this.editingItem.status, // should match your action_id column
          user_id: userId,
          date: new Date().toISOString(),
        }

        console.log('Transaction payload:', transactionPayload)

        const { error: txnError } = await supabase.from('transaction').insert(transactionPayload)

        if (txnError) {
          console.error('Transaction insert failed:', txnError.message)
          toast.error('Item updated but failed to record transaction')
        } else {
          toast.success('Item updated and transaction recorded!')
        }

        // 4️⃣ Refresh item list
        await this.fetchItems()
        this.editingItem = null
      } catch (err) {
        console.error('Unexpected error:', err)
        toast.error('Something went wrong while updating the item')
      }
    },
    async doSearch(query) {
      const { data, error } = await supabase
        .from('items')
        .select(
          `
        *,
        condition:condition_id (condition_name),
        action:status(action_name),
        department:dept_id(dept_name)
      `,
        )
        .or(
          `item_no.ilike."%${query}%",name.ilike."%${query}%",property_no.ilike."%${query}%",location.ilike."%${query}%",model_brand.ilike."%${query}%"`,
        )

      if (error) {
        console.error('Error searching items:', error.message)
        return
      }

      this.items = await Promise.all(
        data.map(async (item) => {
          const idForQr = item.item_no ?? item.id ?? ''
          const qrCode = await QRCode.toDataURL(String(idForQr), { width: 150, margin: 1 })
          return {
            ...item,
            qrCode,
            condition_name: item.condition?.condition_name || 'N/A',
            status: item.action?.action_name || 'Issued',
            dept_id: item.department?.dept_id || '',
            dept_name: item.department?.dept_name || 'N/A',
          }
        }),
      )

      this.totalPages = 1
      this.currentPage = 1
    },
    editItem(item) {
      this.editingItem = {
        ...item,
        dept_id: item.dept_id || '',
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

    goToPage(page) {
      if (page < 1 || page > this.totalPages) return
      this.fetchItems(page)
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
