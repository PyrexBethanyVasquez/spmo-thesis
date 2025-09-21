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
      <input v-model="newItem.name" placeholder="Item Name" required />
      <input v-model="newItem.property_no" placeholder="Property No" />
      <input v-model="newItem.location" placeholder="Location" />
      <input v-model="newItem.status" placeholder="Status" />
      <input v-model="newItem.serial_no" placeholder="Serial No" />
      <input v-model="newItem.model_brand" placeholder="Model/Brand" />
      <input v-model="newItem.date_acquired" type="date" placeholder="Date Acquired" />
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
        <!-- same fields as before -->
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
      stickerItem: null,
      showAddForm: false, // <<-- controls visibility
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

    async deleteItem(id) {
      const { error } = await supabase.from('items').delete().eq('item_no', id)
      if (error) alert('Error deleting item: ' + error.message)
      else await this.fetchItems()
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
