import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/clients/supabase'
import { useToast } from 'vue-toastification'
import QRCode from 'qrcode'

export function useItems() {
  const toast = useToast()

  // Reactive states
  const items = ref([])
  const recipient = ref([])
  const actions = ref([])
  const purchaseOrders = ref([])
  const condition_names = ref([])
  const departments = ref([])
  const showConfirm = ref(false)
  const itemToDelete = ref(null)
  const editingItem = ref(null)
  const stickerItem = ref(null)
  const currentPage = ref(1)
  const pageSize = ref(5)
  const totalItems = ref(0)
  const totalPages = ref(0)
  const searchQuery = ref('')
  const selectedDepartment = ref('')
  const selectedStatus = ref('')
  const poToDelete = ref(null)
  const showConfirmPO = ref(false)
  const editingPO = ref(null)

  const itemHeaders = [
    'Item Name',
    'Property No',
    'Location',
    'Department',
    'Status',
    'Serial No',
    'Model/Brand',
    'Date Acquired',
    'Item Condition',
    'Receiver',
    'Purchase Order Linked',
    'Item Sticker',
    'Actions',
  ]

  const poHeaders = ['Purchase Order Number', 'Supplier', 'Total Amount', 'Order Date', 'Actions']

  const linkedPurchaseOrders = computed(() => {
    const linkedPoNos = new Set(items.value.map((i) => i.po_no).filter(Boolean))
    return purchaseOrders.value.filter((po) => linkedPoNos.has(po.po_no))
  })

  // ✅ Fetch all items
  const fetchItems = async (page = 1) => {
    const from = (page - 1) * pageSize.value
    const to = from + pageSize.value - 1

    let query = supabase
      .from('active_items')
      .select(
        `
        *,
        condition:condition_id(condition_name),
        action:status(action_id, action_name),
        department:dept_id(dept_name),
        individual_transaction:indiv_txn_id(recipient_name)
      `,
        { count: 'exact' },
      )
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (searchQuery.value.trim()) {
      query = query.or(
        `item_no.ilike.%${searchQuery.value}%,name.ilike.%${searchQuery.value}%,property_no.ilike.%${searchQuery.value}%,model_brand.ilike.%${searchQuery.value}%`,
      )
    }

    const { data, error, count } = await query

    if (error) {
      toast.error('Error fetching items: ' + error.message)
      return
    }

    items.value = await Promise.all(
      data.map(async (item) => {
        try {
          const idForQr = item.item_no ?? item.id ?? ''
          const qrCode = await QRCode.toDataURL(String(idForQr), { width: 150, margin: 1 })
          return {
            ...item,
            qrCode,
            condition_name: item.condition?.condition_name || 'N/A',
            status: item.action?.action_name || 'Issued',
            dept_name: item.department?.dept_name || 'N/A',
            recipient_name: item.individual_transaction?.recipient_name || 'N/A',
          }
        } catch (e) {
          console.warn('QR generation failed:', e)
          return {
            ...item,
            qrCode: '',
            condition_name: item.condition?.condition_name || 'N/A',
            status: item.action?.action_name || 'Issued',
            dept_name: item.department?.dept_name || 'N/A',
            recipient_name: item.individual_transaction?.recipient_name || 'N/A',
          }
        }
      }),
    )

    totalItems.value = count
    totalPages.value = Math.ceil(count / pageSize.value)
    currentPage.value = page
  }

  const fetchRecipient = async () => {
    const { data, error } = await supabase
      .from('individual_transaction')
      .select('*')
      .order('recipient_name')
    if (error) toast.error(error.message)
    else recipient.value = data
  }

  // fetch department functions
  const fetchDepartments = async () => {
    const { data, error } = await supabase.from('department').select('*').order('dept_name')
    if (error) toast.error(error.message)
    else departments.value = data
  }

  const fetchActions = async () => {
    const { data, error } = await supabase.from('action').select('*')
    if (error) console.error(error.message)
    else actions.value = data
  }

  const fetchPurchaseOrders = async () => {
    const { data, error } = await supabase.from('purchase_order').select('*').order('po_no')
    if (error) toast.error(error.message)
    else purchaseOrders.value = data
  }

  async function updateItem() {
    try {
      const itemData = {
        name: editingItem.value.name,
        property_no: editingItem.value.property_no,
        location: editingItem.value.location,
        status: editingItem.value.status,
        serial_no: editingItem.value.serial_no,
        model_brand: editingItem.value.model_brand,
        date_acquired: editingItem.value.date_acquired,
        po_no: editingItem.value.po_no,
        condition_id: editingItem.value.condition_id,
        dept_id: editingItem.value.dept_id,
        indiv_txn_id: editingItem.value.indiv_txn_id,
      }

      // Update item
      const { error: updateError } = await supabase
        .from('items')
        .update(itemData)
        .eq('item_no', editingItem.value.item_no)

      if (updateError) {
        toast.error('Error updating item: ' + updateError.message)
        return
      }

      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const userId = user?.id || null

      // Record transaction
      const transactionPayload = {
        item_no: editingItem.value.item_no,
        action_id: editingItem.value.status,
        dept_id: editingItem.value.dept_id,
        indiv_txn_id: editingItem.value.indiv_txn_id,
        user_id: userId,
        date: new Date().toISOString(),
        po_no: itemData.po_no,
      }

      const { error: txnError } = await supabase.from('transaction').insert(transactionPayload)

      if (txnError) {
        toast.error('Item updated but failed to record transaction')
      } else {
        toast.success('Item updated and transaction recorded!')
      }

      await fetchItems()
      editingItem.value = null
    } catch (err) {
      console.error('Something went wrong while updating the item')
      console.error(err)
    }
  }

  function editItem(item) {
    editingItem.value = { ...item, status: item.action?.action_id || '' }
  }

  // Open modal for editing PO
  const editPO = (po) => {
    // Clone the object so original table data is not mutated until saved
    editingPO.value = { ...po }
  }

  // Cancel editing
  const cancelEditPO = () => {
    editingPO.value = null
  }

  // Save edited PO
  const saveEditPO = async () => {
    if (!editingPO.value) return

    const { error } = await supabase
      .from('purchase_order')
      .update({
        supplier: editingPO.value.supplier,
        total_amount: editingPO.value.total_amount,
        order_date: editingPO.value.order_date,
      })
      .eq('po_no', editingPO.value.po_no)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Purchase order updated successfully')
      await fetchPurchaseOrders() // refresh table
      editingPO.value = null // close modal
    }
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages.value) return
    fetchItems(page)
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

  // ✅ Delete functions
  const askDelete = (id) => {
    itemToDelete.value = id
    showConfirm.value = true
  }

  async function confirmDelete() {
    if (!itemToDelete.value) return

    try {
      // 1️⃣ Get the current user session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      const userId = sessionData?.session?.user?.id
      if (!userId) {
        toast.error('User not logged in. Cannot delete item.')
        return
      }

      // 2️⃣ Fetch the item to delete
      const { data: itemData, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('item_no', itemToDelete.value)
        .single()
      if (fetchError) throw fetchError
      if (!itemData) throw new Error('Item not found')

      // 3️⃣ Prepare transaction log payload
      const logPayload = {
        item_no: itemData.item_no,
        dept_id: itemData.dept_id,
        po_no: itemData.po_no || null,
        activity: 'delete',
        user_id: userId, // Required for RLS policy
        date: new Date().toISOString(),
        action_id: itemData.status || null,
        indiv_txn_id: itemData.indiv_txn_id || null,
      }

      // 4️⃣ Insert the transaction log BEFORE soft deleting
      const { data: logData, error: logError } = await supabase
        .from('transaction')
        .insert([logPayload])
        .select()
      if (logError) throw logError
      console.log('Transaction logged:', logData)

      // 5️⃣ Soft delete the item by setting deleted_at
      const { data: updatedItem, error: softDeleteError } = await supabase
        .from('items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('item_no', itemToDelete.value)
        .select()
      if (softDeleteError) throw softDeleteError
      console.log('Item soft deleted:', updatedItem)

      toast.success('Item soft deleted and logged successfully!')
      await fetchItems()
    } catch (err) {
      console.error('Error deleting item:', err)
      toast.error('Failed to delete item.')
    } finally {
      // Reset modal / state
      showConfirm.value = false
      itemToDelete.value = null
    }
  }

  const cancelDelete = () => {
    showConfirm.value = false
    itemToDelete.value = null
  }

  const cancelEdit = () => (editingItem.value = null)

  const askDeletePO = (po_no) => {
    poToDelete.value = po_no
    showConfirmPO.value = true
  }

  const confirmDeletePO = async () => {
    if (!poToDelete.value) return

    const { error } = await supabase.from('purchase_order').delete().eq('po_no', poToDelete.value)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Purchase order deleted successfully')
      await fetchPurchaseOrders()
    }

    showConfirmPO.value = false
    poToDelete.value = null
  }

  const cancelDeletePO = () => {
    showConfirmPO.value = false
    poToDelete.value = null
  }

  const openStickerModal = (item) => (stickerItem.value = item)
  const closeStickerModal = () => (stickerItem.value = null)
  const printSticker = () => window.print()

  // Load data initially
  onMounted(async () => {
    await fetchItems()
    await fetchPurchaseOrders()
    await fetchActions()
    await fetchDepartments()
    await fetchRecipient()
  })

  // Computed Filter (client-side)
  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      const matchesSearch =
        !searchQuery.value ||
        item.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        item.property_no?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        item.model_brand?.toLowerCase().includes(searchQuery.value.toLowerCase())

      const matchesDepartment =
        !selectedDepartment.value || item.department?.dept_name === selectedDepartment.value

      const matchesStatus = !selectedStatus.value || item.action?.action_id === selectedStatus.value

      return matchesSearch && matchesDepartment && matchesStatus
    })
  })

  return {
    items,
    recipient,
    actions,
    purchaseOrders,
    condition_names,
    departments,
    showConfirm,
    showConfirmPO,
    itemToDelete,
    editingItem,
    stickerItem,
    currentPage,
    totalPages,
    itemHeaders,
    poHeaders,
    linkedPurchaseOrders,
    filteredItems,
    searchQuery,
    selectedDepartment,
    selectedStatus,
    editingPO,
    editPO,
    cancelEditPO,
    saveEditPO,
    fetchItems,
    askDelete,
    confirmDelete,
    cancelDelete,
    editItem,
    cancelEdit,
    openStickerModal,
    closeStickerModal,
    printSticker,
    goToPage,
    updateItem,
    startResize,
    askDeletePO,
    confirmDeletePO,
    cancelDeletePO,
  }
}
