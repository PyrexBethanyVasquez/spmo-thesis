<template>
  <div class="items-page">
    <h2>Item Inventory</h2>
    <p>Manage and track items</p>

    <!-- Add Item Form -->
    <form class="item-form" @submit.prevent="addItem">
      <input v-model="newItem.name" placeholder="Item Name" required />
      <input v-model="newItem.property_no" placeholder="Property No" />
      <input v-model="newItem.location" placeholder="Location" />
      <input v-model="newItem.status" placeholder="Status" />
      <input v-model="newItem.serial_no" placeholder="Serial No" />
      <input v-model="newItem.model_brand" placeholder="Model/Brand" />
      <input v-model="newItem.date_acquired" type="date" placeholder="Date Acquired" />
      <button type="submit">Add Item</button>
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
              <button @click="editItem(item)">Edit</button>
              <button @click="deleteItem(item.item_no)">Delete</button>
              <button @click="openStickerModal(item)">Print Sticker</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Item Modal -->
    <div v-if="editingItem" class="modal">
      <div class="modal-content">
        <h3>Edit Item</h3>
        <input v-model="editingItem.name" placeholder="Item Name" required />
        <input v-model="editingItem.property_no" placeholder="Property No" />
        <input v-model="editingItem.location" placeholder="Location" />
        <input v-model="editingItem.status" placeholder="Status" />
        <input v-model="editingItem.serial_no" placeholder="Serial No" />
        <input v-model="editingItem.model_brand" placeholder="Model/Brand" />
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
      newItem: {
        name: '',
        property_no: '',
        location: '',
        status: '',
        serial_no: '',
        model_brand: '',
        date_acquired: '',
      },
      editingItem: null,
      stickerItem: null, // <<-- make sure this exists
    }
  },
  async mounted() {
    await this.fetchItems()
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

      // generate QR for each item safely
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

    async deleteItem(id) {
      const { error } = await supabase.from('items').delete().eq('item_no', id)
      if (error) alert('Error deleting item: ' + error.message)
      else await this.fetchItems()
    },

    cancelEdit() {
      this.editingItem = null
    },

    // === Sticker modal methods ===
    openStickerModal(item) {
      // make sure we pass the item with qrCode (from this.items)
      this.stickerItem = item
    },

    closeStickerModal() {
      this.stickerItem = null
    },

    printSticker() {
      // print only sticker via @media print rules in CSS
      window.print()
    },
  },
}
</script>
<style scoped>
.items-page {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-family: 'Segoe UI', Roboto, sans-serif;
}

.items-page h2 {
  font-size: 1.8rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.items-page p {
  color: #475569;
  margin-bottom: 1rem;
}

/* Form */
.item-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.item-form input {
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
}

.item-form button {
  grid-column: 1 / -1;
  padding: 10px 15px;
  background: #2563eb;
  border: none;
  color: white;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s ease;
  justify-self: center;
  width: 200px;
}

.item-form button:hover {
  background: #1d4ed8;
}

/* Table */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.items-table th,
.items-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.items-table th {
  background: #f1f5f9;
  font-weight: bold;
  color: #334155;
}

.items-table tr {
  background: #000000;
}

.items-table tr:hover {
  background: #202020;
}

/* Action buttons */
.items-table button {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 5px;
}

.items-table button:first-child {
  background: #10b981;
  color: white;
}

.items-table button:first-child:hover {
  background: #059669;
}

.items-table button:last-child {
  background: #ef4444;
  color: white;
}

.items-table button:last-child:hover {
  background: #dc2626;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

.modal-content h3 {
  margin-bottom: 1rem;
  color: #1e293b;
}

.modal-content input {
  width: 100%;
  margin-bottom: 0.8rem;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.modal-content button {
  margin-right: 8px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.modal-content button:first-of-type {
  background: #3b82f6;
  color: white;
}

.modal-content button:first-of-type:hover {
  background: #2563eb;
}

.modal-content button:last-of-type {
  background: #e5e7eb;
  color: #374151;
}

/* Sticker Modal */
.sticker-modal {
  width: 300px;
  text-align: center;
}

.sticker {
  border: 1px solid #000;
  padding: 10px;
  margin: 1rem 0;
  text-align: center;
}

.sticker img {
  width: 100px;
  height: 100px;
  margin-bottom: 8px;
}

.sticker-details {
  font-size: 12px;
  text-align: left;
}

.sticker-details p {
  margin: 2px 0;
}

.modal-actions {
  margin-top: 1rem;
  text-align: right;
}

.modal-actions button:first-of-type {
  background: #10b981;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  margin-right: 8px;
  cursor: pointer;
}

.modal-actions button:first-of-type:hover {
  background: #059669;
}

.modal-actions button:last-of-type {
  background: #e5e7eb;
  color: #374151;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.modal-actions button:last-of-type:hover {
  background: #d1d5db;
}

/* Make print only show sticker */
@media print {
  body * {
    visibility: hidden;
  }
  .sticker,
  .sticker * {
    visibility: visible;
  }
  .sticker {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
