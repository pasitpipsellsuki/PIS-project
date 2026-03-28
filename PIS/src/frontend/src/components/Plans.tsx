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
      return <span className="badge badge-digital">Subscription</span>
    }
    return <span className="badge badge-physical">One-Time</span>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>
      case 'expired':
        return <span className="badge badge-danger">Expired</span>
      case 'cancelled':
        return <span className="badge badge-gray">Cancelled</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  // Get products not already in the plan
  const availableProducts = digitalProducts.filter(
    p => !selectedPlan?.items.some(item => item.product_id === p.id)
  )

  return (
    <div>
      {/* Plans List */}
      <div className="table-container">
        <div className="table-toolbar">
          <span className="table-title">QMS Plans ({plans.length})</span>
          {isManagerOrAbove && (
            <button className="btn btn-primary btn-sm" onClick={handleCreatePlan}>+ New Plan</button>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💎</div>
            <h3>No plans yet</h3>
            <p>Create a plan to group digital products and manage customer quotas.</p>
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
                    background: selectedPlan?.plan.id === plan.id ? 'var(--primary-light)' : undefined,
                  }}
                  onClick={() => openPlanDetail(plan)}
                >
                  <td>
                    <strong style={{ color: 'var(--primary)' }}>{plan.name}</strong>
                    {plan.description && (
                      <div className="td-muted" style={{ marginTop: '2px' }}>{plan.description}</div>
                    )}
                  </td>
                  <td>{getPurchaseTypeBadge(plan.purchase_type)}</td>
                  <td>
                    <strong>{plan.item_count}</strong>
                    <span className="td-muted" style={{ marginLeft: '4px' }}>SKUs</span>
                  </td>
                  <td>
                    <strong>{plan.customer_count}</strong>
                    <span className="td-muted" style={{ marginLeft: '4px' }}>customers</span>
                  </td>
                  <td>
                    {plan.is_active
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-gray">Inactive</span>
                    }
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {isManagerOrAbove && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => handleEditPlan(plan, e)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => handleToggleActive(plan, e)}
                        >
                          {plan.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => handleDeletePlan(plan, e)}
                        >
                          Delete
                        </button>
                      </div>
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
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ marginBottom: '4px', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.3px' }}>
                {selectedPlan.plan.name}
                <span style={{ marginLeft: '10px' }}>
                  {getPurchaseTypeBadge(selectedPlan.plan.purchase_type)}
                </span>
              </h3>
              {selectedPlan.plan.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>{selectedPlan.plan.description}</p>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPlan(null)}>
              Close
            </button>
          </div>

          {/* Stats row */}
          {planStats && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Customers', value: planStats.total_customers },
                { label: 'Active', value: planStats.active_customers },
                { label: 'Expired', value: planStats.expired_customers },
                { label: 'Avg Quota Used', value: planStats.avg_quota_used !== null ? Math.round(planStats.avg_quota_used) : '—' },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '10px 18px',
                    textAlign: 'center',
                    minWidth: '110px',
                  }}
                >
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '500' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '20px' }}>
            {(['products', 'quota', 'customers'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? '700' : '500',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  fontSize: '13.5px',
                  fontFamily: 'inherit',
                  transition: 'color 0.15s',
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
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      color: 'var(--text-primary)',
                      background: 'var(--surface)',
                      outline: 'none',
                    }}
                  >
                    <option value="">— Select a digital product to add —</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddItem}
                    disabled={!selectedProductId}
                  >
                    Add Product
                  </button>
                </div>
              )}
              {availableProducts.length === 0 && selectedPlan.items.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px', padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  No digital products available. Create digital products first in the Products section.
                </div>
              )}
              {selectedPlan.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
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
                            <span className="badge badge-gray">{item.category}</span>
                          )}
                        </td>
                        <td>${item.price?.toFixed(2) || '0.00'}</td>
                        {isManagerOrAbove && (
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
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
                <div style={{ marginBottom: '20px', background: 'var(--info-bg)', borderRadius: 'var(--radius)', padding: '16px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ marginBottom: '10px', color: 'var(--info-text)', fontSize: '13.5px', fontWeight: '700' }}>Current Quota Rule</h4>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedPlan.quota_rule.rule_type === 'download_limit' ? 'Download Limit' : 'Access Duration'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value</div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {selectedPlan.quota_rule.value}
                        {selectedPlan.quota_rule.unit ? ` ${selectedPlan.quota_rule.unit}` : ' downloads'}
                      </div>
                    </div>
                  </div>
                  {isManagerOrAbove && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginTop: '12px' }}
                      onClick={handleRemoveQuotaRule}
                    >
                      Remove Rule
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', marginBottom: '16px', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '13.5px' }}>
                  No quota rule set for this plan.
                </div>
              )}

              {isManagerOrAbove && (
                <form onSubmit={handleSetQuotaRule} style={{ maxWidth: '400px' }}>
                  <h4 style={{ marginBottom: '14px', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
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
                    <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
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
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Rule'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="td-muted">
                  {customers.length} customer{customers.length !== 1 ? 's' : ''} on this plan
                </span>
                {isManagerOrAbove && (
                  <button className="btn btn-primary btn-sm" onClick={handleAddCustomer}>+ Add Customer</button>
                )}
              </div>

              {customersLoading ? (
                <div className="loading">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
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
                        <td className="td-muted">{customer.customer_email || '—'}</td>
                        <td>{getStatusBadge(customer.status)}</td>
                        <td>{customer.quota_used}</td>
                        <td className="td-muted">{customer.start_date || '—'}</td>
                        <td className="td-muted">{customer.end_date || '—'}</td>
                        {isManagerOrAbove && (
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEditCustomer(customer)}
                              >
                                Edit
                              </button>
                              {customer.status === 'active' && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleUpdateCustomerStatus(customer, 'expired')}
                                >
                                  Expire
                                </button>
                              )}
                              {customer.status !== 'cancelled' && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleUpdateCustomerStatus(customer, 'cancelled')}
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
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
            <div className="modal-body">
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
                  <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                    One-Time = customer buys once. Subscription = recurring access.
                  </small>
                </div>
                <div className="modal-footer" style={{ padding: '0', marginTop: '8px' }}>
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
            <div className="modal-body">
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
                <div className="modal-footer" style={{ padding: '0', marginTop: '8px' }}>
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
        </div>
      )}
    </div>
  )
}
