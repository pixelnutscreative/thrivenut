import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { Loader2, CheckCircle2, Upload, ExternalLink, Lock, AlertCircle } from 'lucide-react';
import GroupFeedTab from '@/components/groups/GroupFeedTab';
import GroupEventsTab from '@/components/groups/GroupEventsTab';
import GroupQnATab from '@/components/groups/GroupQnATab';
import GroupResourcesTab from '@/components/groups/GroupResourcesTab';

export default function GroupInterested() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const groupId = searchParams.get('groupId');
    
    const [group, setGroup] = useState(null);
    const [member, setMember] = useState(null);
    const [membersList, setMembersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed');
    
    // Form State
    const [referredBy, setReferredBy] = useState('');
    const [referralType, setReferralType] = useState('member'); // member or other
    const [proofFile, setProofFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!groupId) return;
            try {
                const groupData = await base44.entities.CreatorGroup.get(groupId);
                setGroup(groupData);

                const user = await base44.auth.me();
                if (!user) {
                    await base44.auth.redirectToLogin(window.location.href);
                    return;
                }

                const memberData = await base44.entities.CreatorGroupMember.filter({
                    group_id: groupId,
                    user_email: user.email
                });
                
                if (memberData[0]) {
                    setMember(memberData[0]);
                    // If active, redirect to main dashboard
                    if (memberData[0].status === 'active' || memberData[0].status === 'trial') {
                         navigate(createPageUrl('CreatorGroups') + `?id=${groupId}`);
                    }
                } else {
                    // Not even interested yet? Go to welcome.
                    navigate(createPageUrl('GroupWelcome') + `?groupId=${groupId}`);
                }

                // Fetch members for attribution dropdown (limit to 100 for now or filter)
                // Only if owner allows? Let's just fetch generic list for now.
                const members = await base44.entities.CreatorGroupMember.filter({ group_id: groupId, status: 'active' }, '-joined_date', 100);
                // Need user details for names? We only have emails in Member entity.
                // We'll list emails for now, or use a known name field if available.
                // Since CreatorGroupMember doesn't store name (it's in User), we might need to fetch profiles or just use email.
                // Or user types it. Let's let user type it for "Other" but select email for Member.
                setMembersList(members);

            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [groupId, navigate]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Use UploadFile integration
        try {
            const res = await base44.integrations.Core.UploadFile({ file: file });
            setProofFile(res.file_url);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed");
        }
    };

    const handleSubmitApplication = async () => {
        setSubmitting(true);
        try {
            const attribution = referralType === 'member' ? referredBy : referredBy; // same logic, just different source
            
            await base44.functions.invoke('updateMemberStatus', {
                action: 'submit_application',
                group_id: groupId,
                user_email: member.user_email,
                proof_url: proofFile,
                referred_by: attribution
            });
            
            // Refresh member
            const memberData = await base44.entities.CreatorGroupMember.get(member.id);
            setMember(memberData);
            
            alert("Application submitted! An admin will review it shortly.");
        } catch (error) {
            console.error("Error:", error);
            alert("Error submitting application");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!group) return <div>Group not found</div>;

    const isPending = member?.pending_approval;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    {group.logo_url && <img src={group.logo_url} alt="" className="w-10 h-10 rounded-lg" />}
                    <div>
                        <h1 className="font-bold text-xl">{group.name}</h1>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {isPending ? 'Application Pending' : 'Interested / Preview Mode'}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {group.signup_url && (
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                            onClick={() => window.open(group.signup_url, '_blank')}
                        >
                            Sign Up Now <ExternalLink className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Limited Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex gap-4 border-b pb-1">
                        {['feed', 'events', 'qna', 'resources'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 px-1 capitalize font-medium ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="opacity-80 pointer-events-none select-none relative">
                        <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-[1px] flex items-center justify-center">
                            {/* Optional: Add lock icon overlay for more dramatic effect, or keep subtle */}
                        </div>
                        
                        {activeTab === 'feed' && <GroupFeedTab group={group} isAdmin={false} userEmail={member.user_email} />}
                        {activeTab === 'events' && <GroupEventsTab group={group} isAdmin={false} userEmail={member.user_email} />}
                        {activeTab === 'qna' && <GroupQnATab group={group} isAdmin={false} userEmail={member.user_email} />}
                        {activeTab === 'resources' && <GroupResourcesTab group={group} isAdmin={false} userEmail={member.user_email} />}
                    </div>
                </div>

                {/* Right Col: Application / Status */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Unlock Full Access</CardTitle>
                            <CardDescription>Complete the steps below to become a full member.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* Step 1: Sign Up */}
                            <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${proofFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>1</div>
                                <div>
                                    <h3 className="font-semibold">Sign Up & Pay</h3>
                                    <p className="text-sm text-gray-500 mb-2">Use the sign up link to purchase your membership.</p>
                                    {group.signup_url && (
                                        <Button variant="outline" size="sm" onClick={() => window.open(group.signup_url, '_blank')} className="w-full">
                                            Go to Payment Page <ExternalLink className="w-3 h-3 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Proof */}
                            <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${proofFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>2</div>
                                <div>
                                    <h3 className="font-semibold">Upload Proof</h3>
                                    <p className="text-sm text-gray-500 mb-2">Upload a screenshot of your receipt.</p>
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm flex items-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            {proofFile ? 'Change File' : 'Select File'}
                                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                                        </label>
                                        {proofFile && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                    </div>
                                    {proofFile && <a href={proofFile} target="_blank" className="text-xs text-blue-500 block mt-1 truncate max-w-[200px]">View uploaded file</a>}
                                </div>
                            </div>

                            {/* Step 3: Attribution */}
                            <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${referredBy ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>3</div>
                                <div className="w-full">
                                    <h3 className="font-semibold">Who invited you?</h3>
                                    <div className="mt-2 space-y-2">
                                        <Select value={referralType} onValueChange={setReferralType}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="member">A Group Member</SelectItem>
                                                <SelectItem value="other">Other / Search / Social</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {referralType === 'member' ? (
                                             <Input 
                                                placeholder="Enter member email or name" 
                                                value={referredBy} 
                                                onChange={(e) => setReferredBy(e.target.value)} 
                                            />
                                        ) : (
                                            <Input 
                                                placeholder="Where did you find us?" 
                                                value={referredBy} 
                                                onChange={(e) => setReferredBy(e.target.value)} 
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={handleSubmitApplication}
                                disabled={submitting || !proofFile || isPending}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isPending ? 'Application Submitted' : 'Submit Application'}
                            </Button>

                            {isPending && (
                                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    Your application is pending admin approval. You will receive an email once approved.
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}