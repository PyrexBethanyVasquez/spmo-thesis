<script setup>
import { ref, onMounted } from 'vue'
import { useItems } from '../../composables/useItem'

const loading = ref(true)
const {
  filteredItems,
  actions,
  showConfirm,
  showConfirmPO,
  editingItem,
  stickerItem,
  currentPage,
  totalPages,
  itemHeaders,
  poHeaders,
  linkedPurchaseOrders,
  searchQuery,
  departments,
  selectedDepartment,
  selectedStatus,
  editingPO,
  statusName,

  getPurchaseOrderNumber,
  fetchItems,
  askDelete,
  confirmDelete,
  cancelDelete,
  confirmDeletePO,
  cancelDeletePO,
  askDeletePO,
  editItem,
  cancelEdit,
  openStickerModal,
  closeStickerModal,
  printSticker,
  goToPage,
  startResize,
  updateItem,
  editPO,
  cancelEditPO,
  saveEditPO,
} = useItems()

onMounted(async () => {
  try {
    loading.value = true
    await fetchItems()
  } finally {
    loading.value = false
  }
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

    <div class="filters">
      <div class="search-box">
        <ion-icon name="search-outline" class="search-icon" />
        <input
          v-model.number="searchQuery"
          placeholder="Search by name, property no, or model..."
          @input="fetchItems(1)"
        />
      </div>

      <select v-model.number="selectedDepartment">
        <option value="">All Departments</option>
        <option v-for="dept in departments" :key="dept.dept_id" :value="dept.dept_name">
          {{ dept.dept_name }}
        </option>
      </select>

      <select v-model="selectedStatus">
        <option value="">All Status</option>
        <option v-for="action in actions" :key="action.action_id" :value="action.action_id">
          {{ action.action_name }}
        </option>
      </select>
    </div>

    <hr />
    <h3>Items</h3>

    <!-- Items Table -->
    <transition name="fade" mode="out-in">
      <!-- 🔹 Skeleton loader when loading -->
      <div v-if="loading" key="loading" class="table-skeleton">
        <div class="skeleton-row" v-for="n in 6" :key="'row-' + n">
          <div class="skeleton-cell" v-for="c in 10" :key="'cell-' + c"></div>
        </div>
      </div>

      <!-- 🔹 Actual data table when done -->
      <div v-else key="data" class="table-wrapper">
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
            <tr v-for="item in filteredItems" :key="item.item_no">
              <td>{{ item.name }}</td>
              <td>{{ item.property_no }}</td>
              <td>{{ item.location }}</td>
              <td>{{ item.dept_name }}</td>
              <td>
                <span :class="['status-label', item.status.toLowerCase().replace(/\s+/g, '-')]">
                  {{ item.status }}
                </span>
              </td>
              <td>{{ item.serial_no }}</td>
              <td>{{ item.model_brand }}</td>
              <td>{{ item.date_acquired }}</td>
              <td>{{ item.condition_name || 'N/A' }}</td>
              <td>{{ item.recipient_name || 'N/A' }}</td>
              <td>
                <span v-if="item.po_no" class="po-badge">
                  {{ getPurchaseOrderNumber(item.po_no) || 'N/A' }}
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
    </transition>

    <div class="pagination">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Previous</button>

      <span>Page {{ currentPage }} of {{ totalPages }}</span>

      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>
    <br />

    <h3>Purchase Orders (with items only)</h3>

    <transition name="fade" mode="out-in">
      <!-- 🔹 Skeleton loader when loading -->
      <div v-if="loading" key="loading" class="table-skeleton">
        <div class="skeleton-row" v-for="n in 5" :key="'row-' + n">
          <div class="skeleton-cell" v-for="c in 10" :key="'cell-' + c"></div>
        </div>
      </div>
      <!-- Purchase Orders Table -->
      <div v-else key="data" class="table-wrapper">
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
              <td>{{ po.purchase_order_number }}</td>
              <td>{{ po.supplier }}</td>
              <td>₱{{ po.total_amount }}</td>
              <td>{{ po.order_date }}</td>
              <td>
                <button @click="editPO(po)">Edit</button>
                <button @click="askDeletePO(po.po_no)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </transition>

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

    <!-- Purchase Order Delete Confirmation -->
    <div v-if="showConfirmPO" class="modal-overlay">
      <div class="modal-card">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete this Purchase Order?</p>

        <div class="modal-actions">
          <button class="delete-btn" @click="confirmDeletePO">Yes, Delete</button>
          <button class="cancel-btn" @click="cancelDeletePO">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit Item Modal -->
    <div v-if="editingItem" class="modal">
      <div class="modal-content">
        <h3>Edit Item</h3>
        <hr />
        <br />
        <label>Item Name</label>
        <input v-model="editingItem.name" placeholder="Item Name" required />
        <label>Property No</label>
        <input v-model="editingItem.property_no" placeholder="Property No" />
        <label>Location</label>
        <input v-model="editingItem.location" placeholder="Location" />
        <div>
          <label>Status</label>
          <input type="text" v-model="statusName" disabled class="status-input" />
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

    <!-- Edit Purchase Order Modal -->
    <div v-if="editingPO" class="modal">
      <div class="modal-content">
        <h3>Edit Purchase Order</h3>
        <hr />
        <br />

        <label>Purchase Order Number</label>
        <input v-model="editingPO.purchase_order_number" disabled />

        <label>Supplier</label>
        <input v-model="editingPO.supplier" placeholder="Supplier" />

        <label>Total Amount</label>
        <input v-model.number="editingPO.total_amount" type="number" placeholder="Total Amount" />

        <label>Order Date</label>
        <input v-model="editingPO.order_date" type="date" />

        <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px">
          <button @click="saveEditPO">Save</button>
          <button @click="cancelEditPO">Cancel</button>
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
