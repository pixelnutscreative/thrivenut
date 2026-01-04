import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Printer, Search, RefreshCw, Archive, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import MarketingOrderForm from './MarketingOrderForm';
import MarketingOrderDetail from './MarketingOrderDetail';
import { cn } from '@/components/ui/utils';
import { MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function MarketingOrdersTab({ group, isAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active'); // active, archived, all

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['marketingOrders', group.id],
    queryFn: async () => {
        // Fetch orders for this group
        // If not admin, maybe filter by user email? 
        // Requirement implies "Client Portal" where usually the whole group is the client, or specific members. 
        // If client-portal group type, presumably everyone (or just the client owner) sees the orders.
        // Let's allow group members to see all group orders for now, or filter if requested.
        const all = await base44.entities.MarketingOrder.filter({ group_id: group.id }, '-created_date');
        return all;
    }
  });

  const filteredOrders = orders.filter(o => {
      if (filterStatus === 'active') return o.status !== 'archived' && o.status !== 'completed';
      if (filterStatus === 'archived') return o.status === 'archived' || o.status === 'completed';
      return true;
  });

  const statusColors = {
    need_specs: 'bg-red-100 text-red-800',
    quoting: 'bg-yellow-100 text-yellow-800',
    pending_quote: 'bg-yellow-100 text-yellow-800',
    awaiting_selection: 'bg-amber-100 text-amber-800',
    designing: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-blue-100 text-blue-800',
    proofing: 'bg-purple-100 text-purple-800',
    changes_requested: 'bg-orange-100 text-orange-800',
    approved: 'bg-teal-100 text-teal-800',
    artwork_approved: 'bg-teal-100 text-teal-800',
    awaiting_payment: 'bg-emerald-100 text-emerald-800',
    paid: 'bg-green-100 text-green-800',
    printing: 'bg-indigo-100 text-indigo-800',
    production: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-gray-100 text-gray-800',
    archived: 'bg-gray-200 text-gray-500'
  };

  const getStatusLabel = (order) => {
    if (order.custom_status_label) return order.custom_status_label;
    
    switch(order.status) {
        case 'need_specs': return 'Need Specs';
        case 'quoting': 
        case 'pending_quote': return 'Quoting...';
        case 'awaiting_selection': return 'Select Option';
        case 'designing': 
        case 'in_progress': return 'Designing';
        case 'proofing': return 'Proofing';
        case 'changes_requested': return 'Changes Requested';
        case 'approved': 
        case 'artwork_approved': return 'Artwork Approved';
        case 'awaiting_payment': return 'Awaiting Payment';
        case 'paid': return 'Paid';
        case 'printing':
        case 'production': return 'Printing';
        case 'shipped': return 'Shipped';
        case 'completed': return 'Completed';
        case 'archived': return 'Archived';
        default: return order.status.replace('_', ' ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
             <Printer className="w-5 h-5 text-indigo-600" />
             Marketing & Print Shop
          </h2>
          <p className="text-sm text-gray-500">Order materials, approve proofs, and track production.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setFilterStatus('active')}
                    className={cn("px-3 py-1 text-sm rounded-md transition-all", filterStatus === 'active' ? "bg-white shadow-sm font-medium" : "text-gray-500 hover:text-gray-700")}
                >
                    Active
                </button>
                <button 
                    onClick={() => setFilterStatus('archived')}
                    className={cn("px-3 py-1 text-sm rounded-md transition-all", filterStatus === 'archived' ? "bg-white shadow-sm font-medium" : "text-gray-500 hover:text-gray-700")}
                >
                    Completed
                </button>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
          <div className="py-20 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-300" /></div>
      ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Printer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No active orders</h3>
              <p className="text-gray-500 mb-6">Need marketing materials? Start a new order today.</p>
              <Button onClick={() => setShowForm(true)}>Start New Order</Button>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                  <MarketingOrderCard 
                      key={order.id} 
                      order={order} 
                      onClick={() => setSelectedOrder(order)} 
                      statusColors={statusColors}
                      getStatusLabel={getStatusLabel}
                  />
              ))}
          </div>
      )}

      {/* Modals */}
      {showForm && (
        <MarketingOrderForm 
            group={group} 
            onClose={() => setShowForm(false)} 
        />
      )}

      {selectedOrder && (
          <MarketingOrderDetail 
            order={orders.find(o => o.id === selectedOrder.id) || selectedOrder} 
            isAdmin={isAdmin}
            onClose={() => setSelectedOrder(null)}
            onEdit={() => {
                setEditingOrder(orders.find(o => o.id === selectedOrder.id) || selectedOrder);
                // The form will handle the update, and we might keep detail open or close it. 
                // Let's keep detail open but overlay the form.
            }}
          />
      )}

      {editingOrder && (
          <MarketingOrderForm 
            group={group}
            existingOrder={editingOrder}
            onClose={() => {
                setEditingOrder(null);
                // Optionally refresh selectedOrder data if we can, but React Query should handle list invalidation.
                // To refresh the detail view seamlessly, we rely on the detail component to re-render if it gets new props, 
                // but since selectedOrder is state, we might need to close detail or refetch inside detail.
                // Simplest is closing detail, or user re-opens. Let's close detail to be safe or just let react query do its magic if we passed ID.
                // We passed object, so it might be stale. Let's close selected too for simplicity.
                setSelectedOrder(null); 
            }}
          />
      )}

    </div>
  );
}

function MarketingOrderCard({ order, onClick, statusColors, getStatusLabel }) {
  const { data: comments = [] } = useQuery({
    queryKey: ['marketingComments', order.id],
    queryFn: () => base44.entities.MarketingOrderComment.filter({ order_id: order.id }),
    staleTime: 60000 // Cache for 1 min
  });

  return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-indigo-500" onClick={onClick}>
          <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                     {comments.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 gap-1 hover:bg-blue-100 px-1.5 h-5 text-[10px]">
                           <MessageCircle className="w-3 h-3" /> {comments.length}
                        </Badge>
                     )}
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{format(new Date(order.created_date || new Date()), 'MMM d')}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 truncate">{order.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{order.description}</p>
              
              <div className="flex justify-between items-center text-sm border-t pt-3">
                  <div className="text-gray-500">
                      {order.needed_by_date ? `Due: ${format(new Date(order.needed_by_date), 'MMM d')}` : 'No deadline'}
                  </div>
                  <div className="font-medium text-indigo-600 flex flex-col items-end">
                      {order.our_price && <span>${(order.our_price/100).toFixed(2)}</span>}
                      <Badge className={cn("mt-1", statusColors[order.status])}>{getStatusLabel(order)}</Badge>
                  </div>
              </div>
          </CardContent>
      </Card>
  );
}