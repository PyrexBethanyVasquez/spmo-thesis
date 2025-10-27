<script setup>
import { ref, computed, onMounted } from 'vue'
import { useItemStore } from '@/stores/useItemStore'
import QRCode from 'qrcode'
import { supabase } from '../../clients/supabase'
import { useToast } from 'vue-toastification'

const store = useItemStore()
const toast = useToast()

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
const departments = ref([])
const viewItem = ref(null)
const recipients = ref([])

// Table headers
const itemHeaders = [
  'Item Name',
  // 'Property No',
  'Location',
  'Department',
  'Status',
  // 'Serial No',
  // 'Model/Brand',
  // 'Date Acquired',
  'Item Condition',
  'Receiver',
  'Purchase Order',
  'Actions',
]

// Computed
const itemsToDisplay = computed(() => {
  const source = store.searchResults.length ? store.searchResults : items.value
  const start = (currentPage.value - 1) * pageSize.value
  return source.slice(start, start + pageSize.value)
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
      condition:condition_id (
        condition_name
      ),  action:status(action_id,action_name),
      department:dept_id(dept_name),
       individual_transaction:indiv_txn_id(recipient_name)
    `,
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) {
    toast.error('Error fetching items:', error.message)
    return
  }
  console.log('Item data:', data)

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
          status: item.action?.action_name || 'Issued',
          dept_id: item.department?.dept_id || item.dept_id || '',
          dept_name: item.department?.dept_name || 'N/A',
          recipient_name: item.individual_transaction?.recipient_name || 'N/A',
        }
      } catch (e) {
        console.warn('QR generation failed for item', item, e)
        return {
          ...item,
          qrCode: '',
          condition_name: item.condition?.condition_name || 'N/A',
          status: item.action?.action_name || 'Issued',
          dept_id: item.department?.dept_id || item.dept_id || '',
          dept_name: item.department?.dept_name || 'N/A',
          recipient_name: item.individual_transaction?.recipient_name || 'N/A',
        }
      }
    }),
  )
  console.log(items.value[1].individual_transaction?.recipient_name)

  totalItems.value = count
  totalPages.value = Math.ceil(count / pageSize.value)
  currentPage.value = page
}

async function fetchRecipient() {
  const { data, error } = await supabase
    .from('individual_transaction')
    .select('recipient_name')
    .order('recipient_name')

  if (error) {
    console.error('Error fetching recipients: ' + error.message)
    recipients.value = []
  } else {
    recipients.value = data || []
  }
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
    toast.error('Error fetching conditions:', error.message)
    conditionNames.value = []
  } else {
    conditionNames.value = data ? data.map((c) => c.condition_name) : []
  }
}
async function fetchDepartments() {
  const { data, error } = await supabase
    .from('department')
    .select('*')
    .order('dept_name', { ascending: true })

  if (error) {
    toast.error('Error fetching departments:', error.message)
    departments.value = []
  } else {
    departments.value = data || []
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
  editingItem.value = {
    ...item,
    dept_id: item.dept_id || '',
  }
}

// async function updateItem() {
//   if (!editingItem.value) return

//   const itemData = {
//     name: editingItem.value.name,
//     property_no: editingItem.value.property_no,
//     location: editingItem.value.location,
//     status: editingItem.value.status, // keep action_id for DB
//     serial_no: editingItem.value.serial_no,
//     model_brand: editingItem.value.model_brand,
//     date_acquired: editingItem.value.date_acquired,
//     po_no: editingItem.value.po_no,
//     condition_id: editingItem.value.condition_id,
//     dept_id: editingItem.value.dept_id,
//   }

//   const { error } = await supabase
//     .from('items')
//     .update(itemData)
//     .eq('item_no', editingItem.value.item_no)

//   if (error) {
//     console.error('Error updating item:', error.message)
//     toast.error('Error updating item: ' + error.message)
//     return
//   }

//   toast.success('Item updated successfully!')

//   // Refresh the items list
//   await fetchItems()

//   // Clear editing item
//   editingItem.value = null
// }

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

function openViewModal(item) {
  viewItem.value = item
}

function closeViewModal() {
  viewItem.value = null
}

function cancelDelete() {
  showConfirm.value = false
  itemToDelete.value = null
}

function cancelEdit() {
  editingItem.value = null
}

// async function openStickerModal(item) {
//   try {
//     const idForQr = item.item_no ?? item.id ?? ''
//     const qrCode = await QRCode.toDataURL(String(idForQr), {
//       width: 150,
//       margin: 1,
//     })
//     stickerItem.value = { ...item, qrCode }
//   } catch (e) {
//     console.error('QR generation failed:', e)
//     stickerItem.value = { ...item, qrCode: '' }
//   }
// }

function closeStickerModal() {
  stickerItem.value = null
}

function printSticker() {
  window.print()
}

// Lifecycle
onMounted(async () => {
  await fetchDepartments()
  await fetchPurchaseOrders()
  await fetchConditions()
  await fetchActions()
  await fetchDefaultStatus(newItem)
  await fetchRecipient()
  await fetchItems()
})
</script>

<template>
  <div class="items-page">
    <div class="page-header">
      <h2>Item Details</h2>
      <router-link to="/reports">
        <button class="reports-btn"><i class="fas fa-file-alt"></i>Go to Reports</button>
      </router-link>
    </div>
    <p>Individual Item Information</p>

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
            <!-- <td>{{ item.property_no }}</td> -->
            <td>{{ item.location }}</td>
            <td>{{ item.dept_name }}</td>
            <td>{{ item.status_name }}</td>
            <!-- <td>{{ item.serial_no }}</td>
            <td>{{ item.model_brand }}</td> -->
            <!-- <td>{{ item.date_acquired }}</td> -->
            <td>{{ item.condition_name || 'N/A' }}</td>
            <td>
              {{ item.recipient_name || 'N/A' }}
            </td>
            <td>
              PO Number:
              <span v-if="item.po_no" class="po-badge">
                {{ item.po_no }}
              </span>
              <span v-else class="no-po">N/A</span>
            </td>

            <td class="actions">
              <button class="icon-btn view-btn" @click="openViewModal(item)">
                <i class="fas fa-eye"></i>
              </button>
              <button class="icon-btn edit-btn" @click="editItem(item)">
                <i class="fas fa-edit"></i>
              </button>
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
    <div v-if="viewItem" class="info-drawer">
      <div class="drawer-header">
        <h3>Item Information</h3>
        <button class="close-btn" @click="closeViewModal">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>

      <div class="drawer-body">
        <div class="info-row">
          <span class="label">Item Name:</span>
          <span class="value">{{ viewItem.name }}</span>
        </div>

        <div class="info-row">
          <span class="label">Property No:</span>
          <span class="value">{{ viewItem.property_no }}</span>
        </div>

        <div class="info-row">
          <span class="label">Location:</span>
          <span class="value">{{ viewItem.location }}</span>
        </div>

        <div class="info-row">
          <span class="label">Department:</span>
          <span class="value">{{ viewItem.dept_name }}</span>
        </div>

        <div class="info-row">
          <span class="label">Status:</span>
          <span class="value status-tag">{{ viewItem.status_name }}</span>
        </div>

        <div class="info-row">
          <span class="label">Serial No:</span>
          <span class="value">{{ viewItem.serial_no }}</span>
        </div>

        <div class="info-row">
          <span class="label">Model/Brand:</span>
          <span class="value">{{ viewItem.model_brand }}</span>
        </div>

        <div class="info-row">
          <span class="label">Date Acquired:</span>
          <span class="value">{{ viewItem.date_acquired }}</span>
        </div>

        <div class="info-row">
          <span class="label">Condition:</span>
          <span class="value">{{ viewItem.condition_name || 'N/A' }}</span>
        </div>

        <div class="info-row">
          <span class="label">Receiver:</span>
          <span class="value">{{ viewItem.recipient_name || 'N/A' }}</span>
        </div>

        <div class="info-row">
          <span class="label">PO No:</span>
          <span class="value">{{ viewItem.po_no || 'N/A' }}</span>
        </div>
      </div>

      <div class="drawer-footer">
        <button class="edit-btn" @click="editItem(viewItem)">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="delete-btn" @click="askDelete(viewItem.item_no)">
          <ion-icon name="trash-outline"></ion-icon> Delete
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Info Drawer (Admin Panel Style) --- */
.info-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 420px;
  background: #ffffff;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease forwards;
  z-index: 2000;
  overflow: hidden;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.drawer-header h3 {
  margin: 0;
  color: #111827;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #111827;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.7rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.label {
  font-weight: 600;
  color: #4b5563;
}

.value {
  color: #1f2937;
  font-weight: 500;
  text-align: left;
  max-width: 60%;
  overflow-wrap: break-word;
}

.drawer-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 10px;
  background: #f9fafb;
}

.drawer-footer button {
  flex: 1;
  padding: 0.7rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s;
}

.drawer-footer .edit-btn {
  background: #2563eb;
  color: white;
}
.drawer-footer .edit-btn:hover {
  background: #1e40af;
}

.drawer-footer .delete-btn {
  background: #ef4444;
  color: white;
}
.drawer-footer .delete-btn:hover {
  background: #b91c1c;
}

/* --- Action Buttons --- */
.view-btn {
  background: #0ea5e9;
  border: none;
  color: white;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  margin-right: 6px;
}
.view-btn:hover {
  background: #0284c7;
}

/* --- Dim Overlay --- */
.info-drawer::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: calc(100% - 420px);
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: -1;
}

/* --- RESPONSIVENESS --- */
@media (max-width: 768px) {
  .info-drawer {
    width: 100%;
    height: 100%;
    top: auto;
    bottom: 0;
    animation: slideUp 0.3s ease forwards;
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
  }

  .info-drawer::before {
    width: 100%;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .drawer-header {
    padding: 1rem 1.25rem;
  }

  .drawer-body {
    padding: 1rem;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .label {
    margin-bottom: 0.3rem;
  }

  .value {
    text-align: left;
    max-width: 100%;
  }

  .drawer-footer {
    flex-direction: column;
  }

  .drawer-footer button {
    width: 100%;
  }
}
</style>
