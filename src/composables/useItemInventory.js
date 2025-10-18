import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/clients/supabase'
import { useToast } from 'vue-toastification'
import { useItemStore } from '@/stores/useItemStore'
import QRCode from 'qrcode'

export function useItemInventory() {
  const toast = useToast()
  const store = useItemStore()

  // --- Reactive State ---
  const items = ref([])
  const receipient = ref([])
  const searchQuery = ref('ITM-25-')
  const purchaseOrders = ref([])
  const conditions = ref([])
  const actions = ref([])
  const departments = ref([])

  const showDeptForm = ref(false)
  const showPoForm = ref(false)
  const showConditionForm = ref(false)
  const showConfirm = ref(false)
  const showReceipientForm = ref(false)
  const itemToDelete = ref(null)
  const recentlyAddedItemId = ref(null)

  const currentPage = ref(1)
  const pageSize = ref(5)
  const totalItems = ref(0)
  const totalPages = ref(0)

  const showAddForm = ref(false)
  const editingItem = ref(null)
  const stickerItem = ref(null)
  const defaultStatusId = ref(null)
  const selectedDepartment = ref('')
  const selectedStatus = ref('')

  const newItem = ref({
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
    indiv_txn_id: '',
  })

  const newReceipient = ref({
    recipient_name: '',
    dept_position: '',
    remarks: '',
  })

  const newPurchaseOrder = ref({
    supplier: '',
    total_amount: '',
    order_date: '',
  })

  const newCondition = ref({ condition_name: '' })
  const newDepartment = ref({ dept_name: '' })

  // --- Computed ---
  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      const matchesSearch =
        !searchQuery.value ||
        item.name?.toLowerCase().includes(searchQuery.value.trim().toLowerCase()) ||
        item.item_no?.toLowerCase().includes(searchQuery.value.trim().toLowerCase())

      const matchesDepartment =
        !selectedDepartment.value || item.dept_id === selectedDepartment.value

      const matchesStatus = !selectedStatus.value || item.status === selectedStatus.value

      return matchesSearch && matchesDepartment && matchesStatus
    })
  })

  // --- Fetch Methods ---
  async function fetchItems(page = 1) {
    const from = (page - 1) * pageSize.value
    const to = from + pageSize.value - 1

    const { data, error, count } = await supabase
      .from('items')
      .select(
        `
        *,
        action:status(action_id,action_name),
        department:dept_id(dept_id,dept_name),
        individual_transaction:indiv_txn_id(recipient_name,dept_position,remarks)
      `,
        { count: 'exact' },
      )
      .order('date_acquired', { ascending: false })
      .range(from, to)

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
            status: item.action?.action_id || null,
            status_name: item.action?.action_name || 'Issued',
            dept_id: item.department?.dept_id || '',
            dept_name: item.department?.dept_name || 'N/A',
            condition_name: item.condition?.condition_name || 'N/A',
            recipient_name: item.receipient?.recipient_name || 'N/A',
          }
        } catch {
          return { ...item, qrCode: '' }
        }
      }),
    )

    totalItems.value = count
    totalPages.value = Math.ceil(count / pageSize.value)
    currentPage.value = page
  }

  async function fetchRecipient() {
    const { data, error } = await supabase.from('individual_transaction').select('*')
    if (error) {
      toast.error('Error fetching recipient: ' + error.message)
      receipient.value = []
    } else receipient.value = data || []
  }

  async function fetchActions() {
    const { data, error } = await supabase.from('action').select('*')
    if (error) {
      toast.error('Error fetching actions: ' + error.message)
      actions.value = []
    } else {
      actions.value = data || []
      const goodAction = actions.value.find((a) => a.action_name === 'Issued')
      if (goodAction) newItem.value.status = goodAction.action_id
    }
  }

  async function fetchPurchaseOrders() {
    const { data, error } = await supabase.from('purchase_order').select('*')
    if (error) {
      toast.error('Error fetching purchase orders: ' + error.message)
      purchaseOrders.value = []
    } else purchaseOrders.value = data || []
  }

  async function fetchConditions() {
    const { data, error } = await supabase.from('condition').select('*')
    if (error) {
      toast.error('Error fetching conditions: ' + error.message)
      conditions.value = []
    } else conditions.value = data || []
  }

  async function fetchDepartments() {
    const { data, error } = await supabase.from('department').select('*').order('dept_name')
    if (error) {
      toast.error('Error fetching departments: ' + error.message)
      departments.value = []
    } else departments.value = data || []
  }

  // --- CRUD Operations ---
  async function addItem() {
    const cleanItem = {
      item_no: await store.generateItemNo(),
      name: newItem.value.name,
      property_no: newItem.value.property_no,
      location: newItem.value.location,
      status: newItem.value.status || defaultStatusId.value,
      serial_no: newItem.value.serial_no,
      model_brand: newItem.value.model_brand,
      date_acquired: newItem.value.date_acquired || null,
      po_no: newItem.value.po_no || null,
      condition_id: newItem.value.condition_id || null,
      dept_id: newItem.value.dept_id || null,
      indiv_txn_id: newItem.value.indiv_txn_id || null,
    }

    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .insert([cleanItem])
      .select('*')
    if (itemError) {
      toast.error('Failed to add item: ' + itemError.message)
      return
    }

    toast.success('New Item added successfully!')
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const newItemId = itemData[0].id || itemData[0].item_no
    recentlyAddedItemId.value = newItemId
    localStorage.setItem('recentlyAddedItemId', newItemId)

    const transaction = {
      item_no: newItemId,
      dept_id: cleanItem.dept_id,
      action_id: cleanItem.status,
      indiv_txn_id: cleanItem.indiv_txn_id,
      user_id: user?.id || null,
      date: new Date().toISOString(),
    }

    const { error: txnError } = await supabase.from('transaction').insert([transaction])
    if (txnError) toast.error('Item added but failed to record transaction')

    await fetchItems()
    resetNewItem()
  }
  // --- Additional CRUD: Purchase Orders, Conditions, Departments ---
  async function addReceipient() {
    const { data, error } = await supabase
      .from('individual_transaction')
      .insert([newReceipient.value])
      .select()

    if (error) {
      toast.error('Error adding receipient: ' + error.message)
      return
    }

    toast.success('New Reciever name added successfully!')
    await fetchRecipient()

    if (data && data.length > 0) {
      newItem.value.indiv_txn_id = data[0].indiv_txn_id
    }

    newReceipient.value = { recipient_name: '', dept_position: '', remarks: '' }
    showReceipientForm.value = false
  }

  async function addPurchaseOrder() {
    const { data, error } = await supabase
      .from('purchase_order')
      .insert([newPurchaseOrder.value])
      .select()

    if (error) {
      toast.error('Error adding purchase order: ' + error.message)
      return
    }

    toast.success('New Purchase Order added successfully!')
    await fetchPurchaseOrders()

    if (data && data.length > 0) {
      newItem.value.po_no = data[0].po_no
    }

    newPurchaseOrder.value = { supplier: '', total_amount: '', order_date: '' }
    showPoForm.value = false
  }

  async function addCondition() {
    const { data, error } = await supabase.from('condition').insert([newCondition.value]).select()

    if (error) {
      toast.error('Error adding condition: ' + error.message)
      return
    }

    toast.success('New Condition added successfully!')
    await fetchConditions()

    if (data && data.length > 0) {
      newItem.value.condition_id = data[0].id
    }

    newCondition.value = { condition_name: '' }
    showConditionForm.value = false
  }

  async function addDepartment() {
    if (!newDepartment.value.dept_name.trim()) return

    const { error } = await supabase
      .from('department')
      .insert([{ dept_name: newDepartment.value.dept_name.trim() }])

    if (error) {
      console.error('Error adding department:', error.message)
      toast.error('Failed to add department.')
    } else {
      toast.success('New Department added successfully!')
      newDepartment.value.dept_name = ''
      showDeptForm.value = false
      await fetchDepartments()
    }
  }

  // --- Dropdown / Modal Handlers ---
  function handleConditionChange() {
    console.log('PO changed:', newItem.value.po_no)
    if (newItem.value.condition_id === 'add-new') {
      showConditionForm.value = true
      newItem.value.condition_id = ''
    }
  }

  function handleDeptChange() {
    if (newItem.value.dept_id === 'add-new') {
      showDeptForm.value = true
      newItem.value.dept_id = ''
    }
  }

  function handlePOChange(event) {
    if (event.target.value === 'add-new') {
      showPoForm.value = true
      newItem.value.po_no = ''
    }
  }

  function handleRecipientChange(event) {
    if (event.target.value === 'add-new') {
      showReceipientForm.value = true
      newItem.value.indiv_txn_id = ''
    }
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
      }

      const { error: updateError } = await supabase
        .from('items')
        .update(itemData)
        .eq('item_no', editingItem.value.item_no)

      if (updateError) {
        toast.error('Error updating item: ' + updateError.message)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const transactionPayload = {
        item_no: editingItem.value.item_no,
        action_id: editingItem.value.status,
        user_id: user?.id || null,
        date: new Date().toISOString(),
      }

      const { error: txnError } = await supabase.from('transaction').insert(transactionPayload)
      if (txnError) toast.error('Item updated but failed to record transaction')

      await fetchItems()
      editingItem.value = null
      toast.success('Item updated successfully!')
    } catch (err) {
      toast.error('Unexpected error updating item.')
      console.error(err)
    }
  }

  function editItem(item) {
    editingItem.value = { ...item }
    if (!editingItem.value.dept_id) editingItem.value.dept_id = ''
    if (!editingItem.value.condition_id) editingItem.value.condition_id = ''
    if (!editingItem.value.po_no) editingItem.value.po_no = ''
  }

  function cancelEdit() {
    editingItem.value = null
  }

  function askDelete(itemId) {
    itemToDelete.value = itemId
    showConfirm.value = true
  }

  async function confirmDelete() {
    if (!itemToDelete.value) return

    const { error } = await supabase.from('items').delete().eq('item_no', itemToDelete.value)

    if (error) {
      toast.error('Error deleting item: ' + error.message)
    } else {
      await fetchItems()
      toast.success('Item deleted.')
    }

    showConfirm.value = false
    itemToDelete.value = null
  }

  // --- Utilities ---
  function resetNewItem() {
    newItem.value = {
      name: '',
      property_no: '',
      location: '',
      status: defaultStatusId.value,
      serial_no: '',
      model_brand: '',
      date_acquired: '',
      po_no: '',
      condition_id: '',
      dept_id: '',
    }
  }

  function cancelAdd() {
    newItem.value = {
      name: '',
      property_no: '',
      location: '',
      status: '',
      serial_no: '',
      model_brand: '',
      date_acquired: '',
      condition_id: '',
      po_no: '',
      dept_id: '',
    }

    // Hide the add item form
    showAddForm.value = false
  }

  function goToPage(page) {
    if (page < 1 || page > this.totalPages) return
    this.fetchItems(page)
  }

  function openStickerModal(item) {
    stickerItem.value = item
  }

  function closeStickerModal() {
    stickerItem.value = null
  }

  function printSticker() {
    window.print()
  }

  // --- Lifecycle ---
  onMounted(async () => {
    await fetchItems()
    await fetchPurchaseOrders()
    await fetchConditions()
    await fetchActions()
    await fetchDepartments()
    await fetchRecipient()

    const savedId = localStorage.getItem('recentlyAddedItemId')
    if (savedId) recentlyAddedItemId.value = savedId
  })

  return {
    // state
    newItem,
    items,
    searchQuery,
    filteredItems,
    receipient,
    purchaseOrders,
    conditions,
    actions,
    departments,
    showDeptForm,
    showPoForm,
    showReceipientForm,
    showConditionForm,
    showConfirm,
    showAddForm,
    editingItem,
    stickerItem,
    recentlyAddedItemId,
    totalItems,
    totalPages,
    currentPage,
    itemToDelete,
    newReceipient,
    newPurchaseOrder,
    newCondition,
    newDepartment,
    selectedDepartment,
    selectedStatus,

    // methods
    fetchItems,
    fetchRecipient,
    fetchPurchaseOrders,
    fetchConditions,
    fetchActions,
    fetchDepartments,
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
    cancelAdd,
    cancelEdit,
    editItem,
    askDelete,
    confirmDelete,
    goToPage,
    openStickerModal,
    closeStickerModal,
    printSticker,
    resetNewItem,
  }
}
