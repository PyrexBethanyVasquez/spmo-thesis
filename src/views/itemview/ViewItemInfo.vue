<script setup>
import { ref, computed, onMounted } from 'vue'
import { useItemStore } from '@/stores/useItemStore'
import QRCode from 'qrcode'
import { supabase } from '../../clients/supabase'

const store = useItemStore()

// Pagination
const currentPage = ref(1)
const pageSize = ref(5)
const totalItems = ref(0)
const totalPages = ref(0)

// State
const items = ref([])
const actions = ref([])
const purchaseOrders = ref([])
const conditionNames = ref([])
const showConfirm = ref(false)
const itemToDelete = ref(null)
const editingItem = ref(null)
const stickerItem = ref(null)

// Table headers
const itemHeaders = [
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
]
const poHeaders = ['Purchase Order Number', 'Supplier', 'Total Amount', 'Order Date']

// Computed
const itemsToDisplay = computed(() => {
  const source = store.searchResults.length ? store.searchResults : items.value
  const start = (currentPage.value - 1) * pageSize.value
  return source.slice(start, start + pageSize.value)
})

const linkedPurchaseOrders = computed(() => {
  const linkedPoNos = new Set(items.value.map((i) => i.po_no).filter(Boolean))
  return purchaseOrders.value.filter((po) => linkedPoNos.has(po.po_no))
})

const newItem = { status: null }

// Fetch items
async function fetchItems(page = 1) {
  const from = (page - 1) * pageSize.value
  const to = from + pageSize.value - 1

  const { data, error, count } = await supabase
    .from('items')
    .select(
      `
      *,
      condition:condition_id(condition_name),
      action:status(action_name)
    `,
      { count: 'exact' },
    )
    .order('date_acquired', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching items:', error.message)
    return
  }

  items.value = await Promise.all(
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
          status_name: item.action?.action_name || 'Issued',
        }
      } catch (e) {
        console.warn('QR generation failed for item', item, e)
        return {
          ...item,
          qrCode: '',
          condition_name: item.condition?.condition_name || 'N/A',
          status_name: item.action?.action_name || 'Issued',
        }
      }
    }),
  )
  totalItems.value = count
  totalPages.value = Math.ceil(count / pageSize.value)
  currentPage.value = page
}

async function fetchDefaultStatus(newItem) {
  const { data, error } = await supabase
    .from('action')
    .select('action_id')
    .eq('action_name', 'Issued')
    .single()

  if (error) {
    console.error('Error fetching default status:', error.message)
  } else {
    newItem.status = data.action_id
  }
}

async function fetchActions() {
  const { data, error } = await supabase.from('action').select('*')
  if (error) {
    console.error('Error fetching actions:', error.message)
    actions.value = []
  } else {
    actions.value = data || []
  }
}

async function fetchPurchaseOrders() {
  const { data, error } = await supabase
    .from('purchase_order')
    .select('*')
    .order('po_no', { ascending: true })
  if (error) {
    console.error('Error fetching purchase orders:', error.message)
    purchaseOrders.value = []
  } else {
    purchaseOrders.value = data || []
  }
}

async function fetchConditions() {
  const { data, error } = await supabase
    .from('condition')
    .select('condition_name')
    .order('condition_name', { ascending: true })
  if (error) {
    console.error('Error fetching conditions:', error.message)
    conditionNames.value = []
  } else {
    conditionNames.value = data ? data.map((c) => c.condition_name) : []
  }
}

function startResize(e) {
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
}

// Pagination
function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  fetchItems(page)
}

// Actions
function editItem(item) {
  editingItem.value = { ...item }
}

async function updateItem() {
  const itemData = { ...editingItem.value }
  delete itemData.qrCode
  delete itemData.action
  delete itemData.condition
  delete itemData.condition_name

  const { error } = await supabase
    .from('items')
    .update(itemData)
    .eq('item_no', editingItem.value.item_no)
  if (error) {
    alert('Error updating item: ' + error.message)
  } else {
    await fetchItems()
    editingItem.value = null
  }
}

function askDelete(itemId) {
  itemToDelete.value = itemId
  showConfirm.value = true
}

async function confirmDelete() {
  if (!itemToDelete.value) return
  const { error } = await supabase.from('items').delete().eq('item_no', itemToDelete.value)
  if (error) {
    alert('Error deleting item: ' + error.message)
  } else {
    await fetchItems()
  }
  showConfirm.value = false
  itemToDelete.value = null
}

function cancelDelete() {
  showConfirm.value = false
  itemToDelete.value = null
}

function cancelEdit() {
  editingItem.value = null
}

async function openStickerModal(item) {
  try {
    const idForQr = item.item_no ?? item.id ?? ''
    const qrCode = await QRCode.toDataURL(String(idForQr), {
      width: 150,
      margin: 1,
    })
    stickerItem.value = { ...item, qrCode }
  } catch (e) {
    console.error('QR generation failed:', e)
    stickerItem.value = { ...item, qrCode: '' }
  }
}

function closeStickerModal() {
  stickerItem.value = null
}

function printSticker() {
  window.print()
}

// Lifecycle
onMounted(async () => {
  await fetchItems()
  await fetchPurchaseOrders()
  await fetchConditions()
  await fetchActions()
  await fetchDefaultStatus(newItem)
})
</script>

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
          <tr v-for="item in itemsToDisplay" :key="item.item_no">
            <td>{{ item.name }}</td>
            <td>{{ item.property_no }}</td>
            <td>{{ item.location }}</td>
            <td>{{ item.status_name }}</td>
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
