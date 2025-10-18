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

        <!-- Recipient Form -->
        <div class="recipient-section">
          <label for="recipient">Recipient</label>
          <div class="recipient-inputs">
            <select
              id="recipient"
              v-model="newItem.indiv_txn_id"
              @change="handleRecipientChange"
              required
            >
              <option disabled value="">-- Select Recipient --</option>
              <option v-for="rec in receipient" :key="rec.indiv_txn_id" :value="rec.indiv_txn_id">
                {{ rec.recipient_name }} ({{ rec.dept_position }})
              </option>
              <option disabled>──────────</option>
              <option value="add-new">+ Add New Recipient</option>
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
    <div class="filters-search">
      <ion-icon name="search-outline" />
      <input
        v-model.number="searchQuery"
        placeholder="Search by item number, name, property no, or model..."
      />
    </div>

    <transition name="fade" mode="out-in">
      <div v-if="loading" key="loading" class="table-skeleton">
        <div class="skeleton-row" v-for="n in 3" :key="n"></div>
      </div>
      <!-- Items Table -->
      <div v-else key="data" class="table-wrapper">
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
    </transition>

    <div class="pagination">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Previous</button>

      <span>Page {{ currentPage }} of {{ totalPages }}</span>

      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>

    <!-- Recipient Modal -->
    <div v-if="showReceipientForm" class="modal">
      <div class="modal-content">
        <h3>Add Recipient</h3>
        <label>Recipient Name</label>
        <input v-model="newReceipient.recipient_name" placeholder="Recipient Name" required />
        <label>Recipient Position</label>
        <input
          v-model="newReceipient.dept_position"
          placeholder="Recipient Position Name"
          required
        />
        <label>Remarks</label>
        <input v-model="newReceipient.remarks" placeholder="Remarks" required />
        <div class="modal-actions">
          <button @click="addReceipient">Save</button>
          <button @click="showReceipientForm = false">Cancel</button>
        </div>
      </div>
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
          <button class="cancel-btn" @click="showConfirm = false">Cancel</button>
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

<script setup>
import { ref, onMounted } from 'vue'
import { useItemInventory } from '../../composables/useItemInventory'

const loading = ref(true)
const {
  //items,

  addItem,
  addReceipient,
  addPurchaseOrder,
  addCondition,
  addDepartment,
  handleConditionChange,
  handlePOChange,
  handleDeptChange,
  handleRecipientChange,
  updateItem,
  askDelete,
  cancelAdd,
  cancelEdit,
  editItem,
  confirmDelete,
  goToPage,
  openStickerModal,
  closeStickerModal,
  fetchItems,

  newItem,
  newReceipient,
  newPurchaseOrder,
  newCondition,
  newDepartment,
  searchQuery,
  filteredItems,
  showAddForm,
  editingItem,
  purchaseOrders,
  conditions,
  actions,
  receipient,
  departments,
  showDeptForm,
  showPoForm,
  showReceipientForm,
  showConditionForm,
  showConfirm,
  stickerItem,
  recentlyAddedItemId,
  totalPages,
  currentPage,
} = useItemInventory()

onMounted(async () => {
  try {
    loading.value = true
    await fetchItems()
  } finally {
    loading.value = false
  }
})
</script>
