import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, FileText, Image as ImageIcon, DollarSign, Edit, Trash2, Archive, Check, Upload } from 'lucide-react';
import { cn } from '@/components/ui/utils';

export default function MarketingOrderDetail({ order, isAdmin, onClose, onEdit }) {
  const queryClient = useQueryClient();
  const [commentInput, setCommentInput] = useState('');
  const [priceInput, setPriceInput] = useState(order.our_price ? (order.our_price / 100).toFixed(2) : '');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [newVariation, setNewVariation] = useState({ title: '', description: '', price: '' });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(console.error);
    
    // Lock body scroll prevents background scrolling issues on mobile
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Queries
  const { data: proofs = [] } = useQuery({
    queryKey: ['marketingProofs', order.id],
    queryFn: () => base44.entities.MarketingOrderProof.filter({ order_id: order.id }, '-version'),
    refetchInterval: 5000
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['marketingComments', order.id],
    queryFn: () => base44.entities.MarketingOrderComment.filter({ order_id: order.id }, 'created_at'),
    refetchInterval: 3000
  });

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingOrder.update(order.id, data),
    onSuccess: () => queryClient.invalidateQueries(['marketingOrders'])
  });

  const addCommentMutation = useMutation({
    mutationFn: (content) => {
        if (!currentUser?.email) throw new Error("User email not found");
        return base44.entities.MarketingOrderComment.create({
          order_id: order.id,
          author_email: currentUser.email,
          content,
          created_at: new Date().toISOString()
        });
    },
    onSuccess: () => {
      setCommentInput('');
      queryClient.invalidateQueries(['marketingComments', order.id]);
    }
  });

  const addProofMutation = useMutation({
    mutationFn: (proof) => base44.entities.MarketingOrderProof.create({ ...proof, order_id: order.id }),
    onSuccess: () => queryClient.invalidateQueries(['marketingProofs', order.id])
  });

  const updateProofMutation = useMutation({
      mutationFn: ({id, data}) => base44.entities.MarketingOrderProof.update(id, data),
      onSuccess: () => queryClient.invalidateQueries(['marketingProofs', order.id])
  });

  // Handlers
  const handleSendMessage = () => {
    if (!commentInput.trim() || !currentUser) return;
    addCommentMutation.mutate(commentInput);
  };

  const handleAddVariation = () => {
    if (!newVariation.title || !newVariation.price) return;
    const priceInCents = Math.round(parseFloat(newVariation.price) * 100);
    
    const variation = {
        id: crypto.randomUUID(),
        title: newVariation.title,
        description: newVariation.description,
        price: priceInCents
    };
    
    const updatedVariations = [...(order.quote_variations || []), variation];
    updateOrderMutation.mutate({ quote_variations: updatedVariations });
    setNewVariation({ title: '', description: '', price: '' });
  };

  const handleDeleteVariation = (id) => {
      const updated = (order.quote_variations || []).filter(v => v.id !== id);
      updateOrderMutation.mutate({ quote_variations: updated });
  };

  const handleSelectVariation = (variation) => {
      updateOrderMutation.mutate({ 
          selected_variation_id: variation.id,
          our_price: variation.price
      });
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const version = proofs.length + 1;
      addProofMutation.mutate({
        name: `Proof V${version}`,
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        file_url,
        content_type: file.type.includes('pdf') ? 'pdf' : 'image',
        version,
        status: 'pending'
      });
      if (order.status === 'pending_quote' || order.status === 'in_progress') {
          updateOrderMutation.mutate({ status: 'proofing' });
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleApproveProof = (proof) => {
    if (!window.confirm("Are you sure you want to approve this proof? This will lock the design for production.")) return;
    updateProofMutation.mutate({ id: proof.id, data: { status: 'approved' } });
    updateOrderMutation.mutate({ 
        selected_proof_id: proof.id, 
        status: 'approved' 
    });
  };

  const handlePayment = async () => {
    try {
        const { data } = await base44.functions.invoke('processMarketingPayment', { orderId: order.id });
        if (data.url) window.location.href = data.url;
    } catch (err) {
        console.error(err);
        alert('Payment initialization failed');
    }
  };

  const statusColors = {
    pending_quote: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    proofing: 'bg-purple-100 text-purple-800',
    changes_requested: 'bg-orange-100 text-orange-800',
    approved: 'bg-teal-100 text-teal-800',
    paid: 'bg-green-100 text-green-800',
    production: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-gray-100 text-gray-800',
    archived: 'bg-gray-200 text-gray-500 line-through'
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-0 md:p-4 touch-none">
      <Card className="w-full max-w-5xl h-[100dvh] md:h-[90vh] flex flex-col bg-white overflow-hidden shadow-2xl rounded-none md:rounded-xl touch-auto">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3">
              {order.title}
              <Badge className={statusColors[order.status]}>{order.status.replace('_', ' ')}</Badge>
            </h2>
            <p className="text-sm text-gray-500">Ordered by {order.client_email} • Due {order.needed_by_date || 'ASAP'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit} title="Edit Order"><Edit className="w-4 h-4" /></Button>
            {isAdmin && (
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                     if(window.confirm('Archive this order?')) updateOrderMutation.mutate({ status: 'archived' });
                }} title="Archive"><Archive className="w-4 h-4" /></Button>
            )}
            <Button variant="outline" onClick={onClose}><FileText className="w-4 h-4 mr-2" /> Close</Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Tabs */}
            <div className="md:hidden flex-none border-b bg-white">
                <div className="flex w-full">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", 
                            activeTab === 'details' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"
                        )}
                    >
                        Order Details
                    </button>
                    <button 
                        onClick={() => setActiveTab('comments')}
                        className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative", 
                            activeTab === 'comments' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"
                        )}
                    >
                        Comments {comments.length > 0 && <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">{comments.length}</span>}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left: Details & Proofs */}
                <div className={cn("flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 bg-gray-50/50 overscroll-contain", 
                    activeTab === 'comments' ? 'hidden md:block' : 'block'
                )}>
                    {/* Specs & Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold mb-4 text-gray-900 border-b pb-2">Order Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                                <p className="whitespace-pre-wrap mt-1 text-gray-700">{order.description}</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Address</p>
                                    <p className="mt-1 text-gray-700">{order.shipping_address || 'N/A'}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</p>
                                        <p className="mt-1 text-gray-700">{order.budget ? `$${order.budget}` : 'None'}</p>
                                    </div>
                                    {order.vendor_quote_url && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Attached Quotes/Specs</p>
                                            {(order.vendor_quotes && order.vendor_quotes.length > 0) ? (
                                                <div className="space-y-1 mt-1">
                                                    {order.vendor_quotes.map((q, i) => (
                                                        <a key={i} href={q.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm flex items-center gap-1">
                                                            <FileText className="w-3 h-3" /> {q.name || `File ${i+1}`}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : order.vendor_quote_url ? (
                                                <a href={order.vendor_quote_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm flex items-center gap-1 mt-1">
                                                    <FileText className="w-3 h-3" /> View File
                                                </a>
                                            ) : <span className="text-gray-400 text-sm">None</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quote Variations & Pricing */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <div>
                                <h3 className="font-semibold text-gray-900">Quote Options</h3>
                                <p className="text-sm text-gray-500">Select an option to proceed</p>
                            </div>
                            <div className="text-right">
                                {order.our_price ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-gray-500 uppercase">Selected Total</span>
                                        <span className="text-2xl font-bold text-green-600">${(order.our_price / 100).toFixed(2)}</span>
                                        {order.status === 'paid' && <Badge className="bg-green-100 text-green-800">Paid</Badge>}
                                    </div>
                                ) : (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending Selection</Badge>
                                )}
                            </div>
                        </div>

                        {/* Variations List */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(order.quote_variations || []).map((variation) => {
                                const isSelected = order.selected_variation_id === variation.id;
                                return (
                                    <div 
                                        key={variation.id} 
                                        className={cn("border rounded-xl p-4 flex flex-col transition-all cursor-pointer relative", 
                                            isSelected ? "border-green-500 bg-green-50/50 shadow-md" : "border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                                        )}
                                        onClick={() => handleSelectVariation(variation)}
                                    >
                                        {isSelected && <div className="absolute top-2 right-2 text-green-600"><CheckCircle2 className="w-5 h-5" /></div>}
                                        <h4 className="font-bold text-gray-900 mb-1">{variation.title}</h4>
                                        <p className="text-sm text-gray-600 mb-3 flex-1">{variation.description}</p>
                                        <div className="flex justify-between items-center mt-auto pt-3 border-t">
                                            <span className="font-bold text-lg">${(variation.price / 100).toFixed(2)}</span>
                                            {isAdmin && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteVariation(variation.id); }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Admin Add Variation */}
                        {isAdmin && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <h4 className="text-sm font-semibold mb-3">Add Quote Option</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                    <div className="md:col-span-1">
                                        <Input 
                                            placeholder="Title (e.g. 100 Units)" 
                                            value={newVariation.title} 
                                            onChange={e => setNewVariation({...newVariation, title: e.target.value})} 
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Input 
                                            placeholder="Description (e.g. Standard Vinyl)" 
                                            value={newVariation.description} 
                                            onChange={e => setNewVariation({...newVariation, description: e.target.value})} 
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                            <Input 
                                                type="number" 
                                                placeholder="0.00" 
                                                value={newVariation.price} 
                                                onChange={e => setNewVariation({...newVariation, price: e.target.value})} 
                                                className="pl-6 bg-white"
                                            />
                                        </div>
                                        <Button onClick={handleAddVariation} disabled={!newVariation.title || !newVariation.price}>Add</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pay Button */}
                        {!isAdmin && order.our_price && order.status !== 'paid' && order.selected_proof_id && (
                             <div className="flex justify-end pt-2">
                                <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg" onClick={handlePayment}>
                                    <DollarSign className="w-4 h-4 mr-2" /> Pay Now (${(order.our_price/100).toFixed(2)})
                                </Button>
                             </div>
                        )}
                         {!isAdmin && order.our_price && !order.selected_proof_id && (
                             <div className="flex justify-end pt-2">
                                 <Button variant="outline" disabled title="Approve a proof first">Pay Now (Awaiting Approval)</Button>
                             </div>
                         )}
                    </div>

                    {/* Proofs Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg text-gray-900">Artwork Proofs</h3>
                            {isAdmin && (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        id="proof-upload" 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleProofUpload} 
                                        disabled={uploadingProof}
                                    />
                                    <Button asChild variant="outline" size="sm">
                                        <label htmlFor="proof-upload" className="cursor-pointer">
                                            {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                            Upload New Proof
                                        </label>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {proofs.length === 0 ? (
                            <div className="text-center py-10 bg-gray-100 rounded-xl border border-dashed border-gray-300">
                                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No proofs uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {proofs.map((proof) => (
                                    <Card key={proof.id} className={cn("overflow-hidden border-2 transition-all", 
                                        order.selected_proof_id === proof.id ? "border-green-500 shadow-md bg-green-50/30" : "border-gray-200 hover:border-indigo-200"
                                    )}>
                                        <div className="flex flex-col md:flex-row">
                                            <div className="w-full md:w-64 h-48 bg-gray-200 flex items-center justify-center shrink-0">
                                                {proof.content_type === 'image' ? (
                                                    <img src={proof.file_url} alt={proof.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <FileText className="w-16 h-16 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-gray-900">{proof.name}</h4>
                                                        {proof.status === 'approved' && <Badge className="bg-green-100 text-green-800">Approved Choice</Badge>}
                                                        {proof.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">{proof.description}</p>
                                                    <a href={proof.file_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
                                                        Download / View Full
                                                    </a>
                                                </div>
                                                <div className="mt-4 flex gap-2 justify-end">
                                                    {isAdmin && (
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => {
                                                            if(window.confirm('Delete this proof?')) { /* Add delete logic if needed */ }
                                                        }}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {order.status !== 'approved' && order.status !== 'paid' && (
                                                        <>
                                                            <Button variant="outline" size="sm" onClick={() => {
                                                                setActiveTab('comments');
                                                                setCommentInput(`I have feedback on ${proof.name}: `);
                                                                setTimeout(() => document.getElementById('comment-input')?.focus(), 100);
                                                            }}>
                                                                Request Changes
                                                            </Button>
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveProof(proof)}>
                                                                <Check className="w-4 h-4 mr-2" /> Approve This Design
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Comments/Chat (Hidden on mobile if tab is details) */}
                <div className={cn("w-full md:w-80 border-t md:border-t-0 md:border-l bg-white flex flex-col h-full", 
                    activeTab === 'details' ? 'hidden md:flex' : 'flex'
                )}>
                    <div className="hidden md:block p-3 md:p-4 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Comments & Feedback</h3>
                    </div>
                    
                    {/* Input Area */}
                    <div className="p-3 border-b bg-gray-50">
                        <div className="flex gap-2">
                            <Textarea 
                                id="comment-input"
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                placeholder="Type a message..."
                                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <Button size="icon" onClick={handleSendMessage} disabled={!commentInput.trim() || addCommentMutation.isPending} className="shrink-0 bg-indigo-600">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {comments.length === 0 && (
                            <p className="text-center text-gray-400 text-sm mt-10">No comments yet. Start the conversation!</p>
                        )}
                        <div className="space-y-4 pb-20 md:pb-0">
                            {comments.map((comment) => (
                                <div key={comment.id} className={cn("text-sm p-3 rounded-lg max-w-[90%]", 
                                    comment.author_email === currentUser?.email ? "bg-indigo-50 ml-auto border border-indigo-100" : "bg-gray-100 mr-auto border border-gray-200"
                                )}>
                                    <p className="font-bold text-xs mb-1 text-gray-500">{comment.author_email?.split('@')[0]}</p>
                                    <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 text-right">{new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
}