import { useState, useEffect } from 'react'
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPlan,
  addPlanItem,
  removePlanItem,
  setPlanQuotaRule,
  removePlanQuotaRule,
  getPlanCustomers,
  addPlanCustomer,
  updatePlanCustomer,
  deletePlanCustomer,
  getPlanStats,
  getProducts,
} from '../api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

interface Plan {
  id: number
  name: string
  description: string | null
  purchase_type: 'one_time' | 'subscription'
  is_active: boolean
  created_at: string
  updated_at: string
  item_count: number
  customer_count: number
}

interface PlanItem {
  id: number
  plan_id: number
  product_id: string
  sku: string
  product_name: string
  category: string | null
  price: number | null
  product_type: string
}

interface QuotaRule {
  id: number
  plan_id: number
  rule_type: 'download_limit' | 'access_duration'
  value: number
  unit: 'days' | 'months' | null
}

interface PlanCustomer {
  id: number
  plan_id: number
  customer_name: string
  customer_email: string | null
  quota_used: number
  start_date: string | null
  end_date: string | null
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
}

interface PlanDetail {
  plan: Plan
  items: PlanItem[]
  quota_rule: QuotaRule | null
  customer_count: number
}

interface Product {
  id: string
  sku: string
  name: string
  product_type: string
  is_active: boolean
}

interface PlanStats {
  total_customers: number
  active_customers: number
  expired_customers: number
  cancelled_customers: number
  avg_quota_used: number | null
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null)
  const [activeTab, setActiveTab] = useState<'products' | 'quota' | 'customers'>('products')
  const [planStats, setPlanStats] = useState<PlanStats | null>(null)

  // Plan customers state
  const [customers, setCustomers] = useState<PlanCustomer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<PlanCustomer | null>(null)

  // Form states
  const [planForm, setPlanForm] = useState({ name: '', description: '', purchase_type: 'one_time' })
  const [quotaForm, setQuotaForm] = useState({ rule_type: 'download_limit', value: '', unit: 'days' })
  const [customerForm, setCustomerForm] = useState({
    customer_name: '', customer_email: '', start_date: '', end_date: '',
  })

  // Products for adding to plan
  const [digitalProducts, setDigitalProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const { showSuccess, showError } = useToast()
  const { isManagerOrAbove } = useAuth()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await getPlans()
      setPlans(response.data.plans)
    } catch (err: any) {
      showError(err.message || 'Failed to fetch plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchDigitalProducts = async () => {
    try {
      const response = await getProducts()
      const digital = response.data.products.filter(
        (p: Product) => p.product_type === 'digital' && p.is_active
      )
      setDigitalProducts(digital)
    } catch {
      // non-critical
    }
  }

  const openPlanDetail = async (plan: Plan) => {
    try {
      const [detailRes, statsRes, customersRes] = await Promise.all([
        getPlan(plan.id),
        getPlanStats(plan.id),
        getPlanCustomers(plan.id),
      ])
      setSelectedPlan(detailRes.data)
      setPlanStats(statsRes.data.stats)
      setCustomers(customersRes.data.customers)
      setActiveTab('products')
      fetchDigitalProducts()
    } catch (err: any) {
      showError(err.message || 'Failed to load plan details')
    }
  }

  const handleCreatePlan = () => {
    setEditingPlan(null)
    setPlanForm({ name: '', description: '', purchase_type: 'one_time' })
    setShowPlanModal(true)
  }

  const handleEditPlan = (plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      purchase_type: plan.purchase_type,
    })
    setShowPlanModal(true)
  }

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, planForm)
        showSuccess(`Plan "${planForm.name}" updated.`)
      } else {
        await createPlan(planForm)
        showSuccess(`Plan "${planForm.name}" created.`)
      }
      setShowPlanModal(false)
      fetchPlans()
      if (selectedPlan && editingPlan && selectedPlan.plan.id === editingPlan.id) {
        openPlanDetail({ ...selectedPlan.plan, ...planForm } as Plan)
      }
    } catch (err: any) {
      showError(err.message || 'Failed to save plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePlan = async (plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete plan "${plan.name}"? This will remove all items, quota rules, and customer records.`)) return
    try {
      await deletePlan(plan.id)
      showSuccess(`Plan "${plan.name}" deleted.`)
      if (selectedPlan?.plan.id === plan.id) {
        setSelectedPlan(null)
      }
      fetchPlans()
    } catch (err: any) {
      showError(err.message || 'Failed to delete plan')
    }
  }

  const handleToggleActive = async (plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updatePlan(plan.id, { is_active: !plan.is_active })
      showSuccess(`Plan "${plan.name}" ${plan.is_active ? 'deactivated' : 'activated'}.`)
      fetchPlans()
      if (selectedPlan?.plan.id === plan.id) {
        openPlanDetail({ ...plan, is_active: !plan.is_active })
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update plan status')
    }
  }

  const handleAddItem = async () => {
    if (!selectedPlan || !selectedProductId) return
    try {
      await addPlanItem(selectedPlan.plan.id, selectedProductId)
      showSuccess('Product added to plan.')
      setSelectedProductId('')
      const detailRes = await getPlan(selectedPlan.plan.id)
      setSelectedPlan(detailRes.data)
      fetchPlans()
    } catch (err: any) {
      showError(err.message || 'Failed to add product')
    }
  }

  const handleRemoveItem = async (item: PlanItem) => {
    if (!selectedPlan) return
    if (!confirm(`Remove "${item.product_name}" from this plan?`)) return
    try {
      await removePlanItem(selectedPlan.plan.id, item.id)
      showSuccess(`"${item.product_name}" removed from plan.`)
      const detailRes = await getPlan(selectedPlan.plan.id)
      setSelectedPlan(detailRes.data)
      fetchPlans()
    } catch (err: any) {
      showError(err.message || 'Failed to remove product')
    }
  }

  const handleSetQuotaRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return
    setSubmitting(true)
    try {
      const data: { rule_type: string; value: number; unit?: string } = {
        rule_type: quotaForm.rule_type,
        value: parseInt(quotaForm.value),
      }
      if (quotaForm.rule_type === 'access_duration') {
        data.unit = quotaForm.unit
      }
      await setPlanQuotaRule(selectedPlan.plan.id, data)
      showSuccess('Quota rule saved.')
      const detailRes = await getPlan(selectedPlan.plan.id)
      setSelectedPlan(detailRes.data)
      if (detailRes.data.quota_rule) {
        setQuotaForm({
          rule_type: detailRes.data.quota_rule.rule_type,
          value: String(detailRes.data.quota_rule.value),
          unit: detailRes.data.quota_rule.unit || 'days',
        })
      }
    } catch (err: any) {
      showError(err.message || 'Failed to save quota rule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveQuotaRule = async () => {
    if (!selectedPlan || !selectedPlan.quota_rule) return
    if (!confirm('Remove quota rule from this plan?')) return
    try {
      await removePlanQuotaRule(selectedPlan.plan.id)
      showSuccess('Quota rule removed.')
      const detailRes = await getPlan(selectedPlan.plan.id)
      setSelectedPlan(detailRes.data)
      setQuotaForm({ rule_type: 'download_limit', value: '', unit: 'days' })
    } catch (err: any) {
      showError(err.message || 'Failed to remove quota rule')
    }
  }

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setCustomerForm({ customer_name: '', customer_email: '', start_date: '', end_date: '' })
    setShowCustomerModal(true)
  }

  const handleEditCustomer = (customer: PlanCustomer) => {
    setEditingCustomer(customer)
    setCustomerForm({
      customer_name: customer.customer_name,
      customer_email: customer.customer_email || '',
      start_date: customer.start_date || '',
      end_date: customer.end_date || '',
    })
    setShowCustomerModal(true)
  }

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return
    setSubmitting(true)
    try {
      const data = {
        customer_name: customerForm.customer_name,
        customer_email: customerForm.customer_email || undefined,
        start_date: customerForm.start_date || undefined,
        end_date: customerForm.end_date || undefined,
      }
      if (editingCustomer) {
        await updatePlanCustomer(editingCustomer.id, data)
        showSuccess(`Customer "${customerForm.customer_name}" updated.`)
      } else {
        await addPlanCustomer(selectedPlan.plan.id, data)
        showSuccess(`Customer "${customerForm.customer_name}" added to plan.`)
      }
      setShowCustomerModal(false)
      refreshCustomers()
      fetchPlans()
    } catch (err: any) {
      showError(err.message || 'Failed to save customer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCustomer = async (customer: PlanCustomer) => {
    if (!confirm(`Remove customer "${customer.customer_name}" from this plan?`)) return
    try {
      await deletePlanCustomer(customer.id)
      showSuccess(`Customer "${customer.customer_name}" removed.`)
      refreshCustomers()
      fetchPlans()
    } catch (err: any) {
      showError(err.message || 'Failed to remove customer')
    }
  }

  const handleUpdateCustomerStatus = async (customer: PlanCustomer, status: string) => {
    try {
      await updatePlanCustomer(customer.id, { status })
      showSuccess(`Customer status updated to ${status}.`)
      refreshCustomers()
    } catch (err: any) {
      showError(err.message || 'Failed to update status')
    }
  }

  const refreshCustomers = async () => {
    if (!selectedPlan) return
    setCustomersLoading(true)
    try {
      const [customersRes, statsRes] = await Promise.all([
        getPlanCustomers(selectedPlan.plan.id),
        getPlanStats(selectedPlan.plan.id),
      ])
      setCustomers(customersRes.data.customers)
      setPlanStats(statsRes.data.stats)
    } catch {
      // non-critical
    } finally {
      setCustomersLoading(false)
    }
  }

  const getPurchaseTypeBadge = (type: string) => {
    if (type === 'subscription') {
      return (
        <span className="badge" style={{ background: '#7c3aed', color: '#fff' }}>
          Subscription
        </span>
      )
    }
    return (
      <span className="badge" style={{ background: '#2563eb', color: '#fff' }}>
        One-Time
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge" style={{ background: '#16a34a', color: '#fff' }}>Active</span>
      case 'expired':
        return <span className="badge" style={{ background: '#dc2626', color: '#fff' }}>Expired</span>
      case 'cancelled':
        return <span className="badge" style={{ background: '#6b7280', color: '#fff' }}>Cancelled</span>
      default:
        return <span className="badge">{status}</span>
    }
  }

  // Get products not already in the plan
  const availableProducts = digitalProducts.filter(
    p => !selectedPlan?.items.some(item => item.product_id === p.id)
  )

  return (
    <div>
      {/* Plans List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ marginBottom: '4px' }}>Plans — Quota Management</h2>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: 0 }}>
              Group digital products into plans, set quota rules, and track customer usage.
            </p>
          </div>
          {isManagerOrAbove && (
            <button className="btn btn-primary" onClick={handleCreatePlan}>+ New Plan</button>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6c757d' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ marginBottom: '8px', color: '#343a40' }}>No plans yet</h3>
            <p style={{ marginBottom: '20px' }}>
              Create a plan to group digital products and manage customer quotas.
            </p>
            {isManagerOrAbove && (
              <button className="btn btn-primary" onClick={handleCreatePlan}>
                + Create First Plan
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Purchase Type</th>
                <th>Products</th>
                <th>Customers</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr
                  key={plan.id}
                  style={{
                    cursor: 'pointer',
                    background: selectedPlan?.plan.id === plan.id ? '#f0f7ff' : undefined,
                  }}
                  onClick={() => openPlanDetail(plan)}
                >
                  <td>
                    <strong style={{ color: '#2563eb' }}>{plan.name}</strong>
                    {plan.description && (
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                        {plan.description}
                      </div>
                    )}
                  </td>
                  <td>{getPurchaseTypeBadge(plan.purchase_type)}</td>
                  <td>
                    <span style={{ fontWeight: 'bold' }}>{plan.item_count}</span>
                    <span style={{ color: '#6c757d', marginLeft: '4px', fontSize: '12px' }}>digital SKUs</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 'bold' }}>{plan.customer_count}</span>
                    <span style={{ color: '#6c757d', marginLeft: '4px', fontSize: '12px' }}>customers</span>
                  </td>
                  <td>
                    {plan.is_active
                      ? <span className="badge" style={{ background: '#16a34a', color: '#fff' }}>Active</span>
                      : <span className="badge" style={{ background: '#6b7280', color: '#fff' }}>Inactive</span>
                    }
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {isManagerOrAbove && (
                      <>
                        <button
                          className="btn btn-secondary"
                          style={{ marginRight: '6px', fontSize: '12px', padding: '3px 10px' }}
                          onClick={(e) => handleEditPlan(plan, e)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ marginRight: '6px', fontSize: '12px', padding: '3px 10px' }}
                          onClick={(e) => handleToggleActive(plan, e)}
                        >
                          {plan.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '12px', padding: '3px 10px' }}
                          onClick={(e) => handleDeletePlan(plan, e)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Plan Detail */}
      {selectedPlan && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ marginBottom: '4px' }}>
                {selectedPlan.plan.name}
                <span style={{ marginLeft: '10px' }}>
                  {getPurchaseTypeBadge(selectedPlan.plan.purchase_type)}
                </span>
              </h3>
              {selectedPlan.plan.description && (
                <p style={{ color: '#6c757d', fontSize: '13px', margin: 0 }}>{selectedPlan.plan.description}</p>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPlan(null)}>
              Close
            </button>
          </div>

          {/* Stats row */}
          {planStats && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Customers', value: planStats.total_customers, color: '#2563eb' },
                { label: 'Active', value: planStats.active_customers, color: '#16a34a' },
                { label: 'Expired', value: planStats.expired_customers, color: '#dc2626' },
                { label: 'Avg Quota Used', value: planStats.avg_quota_used !== null ? Math.round(planStats.avg_quota_used) : '-', color: '#7c3aed' },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    textAlign: 'center',
                    minWidth: '110px',
                  }}
                >
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e9ecef', marginBottom: '20px' }}>
            {(['products', 'quota', 'customers'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  color: activeTab === tab ? '#2563eb' : '#6c757d',
                  borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                  marginBottom: '-2px',
                  fontSize: '14px',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'products' ? `Products (${selectedPlan.items.length})` :
                 tab === 'quota' ? 'Quota Rule' :
                 `Customers (${customers.length})`}
              </button>
            ))}
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              {isManagerOrAbove && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da' }}
                  >
                    <option value="">— Select a digital product to add —</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddItem}
                    disabled={!selectedProductId}
                  >
                    Add Product
                  </button>
                </div>
              )}
              {availableProducts.length === 0 && selectedPlan.items.length === 0 && (
                <div style={{ color: '#6c757d', fontSize: '13px', marginBottom: '12px' }}>
                  No digital products available. Create digital products first in the Products section.
                </div>
              )}
              {selectedPlan.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                  No products in this plan yet. Add digital products above.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      {isManagerOrAbove && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.items.map(item => (
                      <tr key={item.id}>
                        <td><span className="badge badge-info">{item.sku}</span></td>
                        <td><strong>{item.product_name}</strong></td>
                        <td>
                          {item.category && (
                            <span className="badge badge-success">{item.category}</span>
                          )}
                        </td>
                        <td>${item.price?.toFixed(2) || '0.00'}</td>
                        {isManagerOrAbove && (
                          <td>
                            <button
                              className="btn btn-danger"
                              style={{ fontSize: '12px', padding: '3px 10px' }}
                              onClick={() => handleRemoveItem(item)}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Quota Rule Tab */}
          {activeTab === 'quota' && (
            <div>
              {selectedPlan.quota_rule ? (
                <div style={{ marginBottom: '20px', background: '#f0f7ff', borderRadius: '8px', padding: '16px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ marginBottom: '8px', color: '#1d4ed8' }}>Current Quota Rule</h4>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>Type</span>
                      <div style={{ fontWeight: 'bold' }}>
                        {selectedPlan.quota_rule.rule_type === 'download_limit' ? 'Download Limit' : 'Access Duration'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>Value</span>
                      <div style={{ fontWeight: 'bold' }}>
                        {selectedPlan.quota_rule.value}
                        {selectedPlan.quota_rule.unit ? ` ${selectedPlan.quota_rule.unit}` : ' downloads'}
                      </div>
                    </div>
                  </div>
                  {isManagerOrAbove && (
                    <button
                      className="btn btn-danger"
                      style={{ marginTop: '12px', fontSize: '12px' }}
                      onClick={handleRemoveQuotaRule}
                    >
                      Remove Rule
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ color: '#6c757d', marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                  No quota rule set for this plan.
                </div>
              )}

              {isManagerOrAbove && (
                <form onSubmit={handleSetQuotaRule} style={{ maxWidth: '400px' }}>
                  <h4 style={{ marginBottom: '12px' }}>
                    {selectedPlan.quota_rule ? 'Update Quota Rule' : 'Set Quota Rule'}
                  </h4>
                  <div className="form-group">
                    <label>Rule Type *</label>
                    <select
                      value={quotaForm.rule_type}
                      onChange={e => setQuotaForm({ ...quotaForm, rule_type: e.target.value })}
                    >
                      <option value="download_limit">Download Limit</option>
                      <option value="access_duration">Access Duration</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Value *</label>
                    <input
                      type="number"
                      min="1"
                      value={quotaForm.value}
                      onChange={e => setQuotaForm({ ...quotaForm, value: e.target.value })}
                      required
                      placeholder={quotaForm.rule_type === 'download_limit' ? 'e.g. 5' : 'e.g. 30'}
                    />
                    <small style={{ color: '#666' }}>
                      {quotaForm.rule_type === 'download_limit'
                        ? 'Number of downloads allowed'
                        : 'Duration of access'}
                    </small>
                  </div>
                  {quotaForm.rule_type === 'access_duration' && (
                    <div className="form-group">
                      <label>Unit *</label>
                      <select
                        value={quotaForm.unit}
                        onChange={e => setQuotaForm({ ...quotaForm, unit: e.target.value })}
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Rule'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: '#6c757d', fontSize: '13px' }}>
                  {customers.length} customer{customers.length !== 1 ? 's' : ''} on this plan
                </span>
                {isManagerOrAbove && (
                  <button className="btn btn-primary" onClick={handleAddCustomer}>+ Add Customer</button>
                )}
              </div>

              {customersLoading ? (
                <div className="loading">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                  No customers on this plan yet.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Quota Used</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      {isManagerOrAbove && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(customer => (
                      <tr key={customer.id}>
                        <td><strong>{customer.customer_name}</strong></td>
                        <td style={{ color: '#6c757d' }}>{customer.customer_email || '—'}</td>
                        <td>{getStatusBadge(customer.status)}</td>
                        <td>{customer.quota_used}</td>
                        <td style={{ color: '#6c757d', fontSize: '13px' }}>{customer.start_date || '—'}</td>
                        <td style={{ color: '#6c757d', fontSize: '13px' }}>{customer.end_date || '—'}</td>
                        {isManagerOrAbove && (
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                                onClick={() => handleEditCustomer(customer)}
                              >
                                Edit
                              </button>
                              {customer.status === 'active' && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ fontSize: '11px', padding: '2px 8px' }}
                                  onClick={() => handleUpdateCustomerStatus(customer, 'expired')}
                                >
                                  Expire
                                </button>
                              )}
                              {customer.status !== 'cancelled' && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ fontSize: '11px', padding: '2px 8px' }}
                                  onClick={() => handleUpdateCustomerStatus(customer, 'cancelled')}
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                className="btn btn-danger"
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                                onClick={() => handleDeleteCustomer(customer)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPlan ? 'Edit Plan' : 'New Plan'}</h2>
              <button className="close-btn" onClick={() => setShowPlanModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePlanSubmit}>
              <div className="form-group">
                <label>Plan Name *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  required
                  placeholder="e.g. Netflix Basic, Gift Pack A"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={planForm.description}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div className="form-group">
                <label>Purchase Type *</label>
                <select
                  value={planForm.purchase_type}
                  onChange={e => setPlanForm({ ...planForm, purchase_type: e.target.value })}
                >
                  <option value="one_time">One-Time Purchase</option>
                  <option value="subscription">Subscription</option>
                </select>
                <small style={{ color: '#666' }}>
                  One-Time = customer buys once. Subscription = recurring access.
                </small>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="close-btn" onClick={() => setShowCustomerModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCustomerSubmit}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={customerForm.customer_name}
                  onChange={e => setCustomerForm({ ...customerForm, customer_name: e.target.value })}
                  required
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={customerForm.customer_email}
                  onChange={e => setCustomerForm({ ...customerForm, customer_email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={customerForm.start_date}
                  onChange={e => setCustomerForm({ ...customerForm, start_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={customerForm.end_date}
                  onChange={e => setCustomerForm({ ...customerForm, end_date: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustomerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
