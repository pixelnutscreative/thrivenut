import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { Loader2, ArrowRight, Play } from 'lucide-react';

export default function GroupWelcome() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const groupId = searchParams.get('groupId');
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const fetchGroup = async () => {
            if (!groupId) return;
            try {
                // 1. Get Group Details
                const groupData = await base44.entities.CreatorGroup.get(groupId);
                setGroup(groupData);

                // 2. Check current status - if already member, redirect
                const user = await base44.auth.me().catch(() => null);
                if (user) {
                    const members = await base44.entities.CreatorGroupMember.filter({
                        group_id: groupId,
                        user_email: user.email
                    });
                    
                    if (members.length > 0) {
                        const member = members[0];
                        if (member.status === 'active' || member.status === 'trial') {
                             navigate(createPageUrl('CreatorGroups') + `?id=${groupId}`);
                        } else if (member.status === 'interested' || member.pending_approval) {
                             navigate(createPageUrl('GroupInterested') + `?groupId=${groupId}`);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching group:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroup();
    }, [groupId, navigate]);

    const handleBecomeInterested = async () => {
        setJoining(true);
        try {
            // Ensure user is logged in first
            const user = await base44.auth.me().catch(() => null);
            if (!user) {
                // Redirect to login then back here
                await base44.auth.redirectToLogin(window.location.href);
                return;
            }

            const res = await base44.functions.invoke('updateMemberStatus', {
                action: 'become_interested',
                group_id: groupId,
                user_email: user.email
            });

            if (res.data.status === 'success') {
                navigate(createPageUrl('GroupInterested') + `?groupId=${groupId}`);
            }
        } catch (error) {
            console.error("Error joining:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
    }

    if (!group) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Group not found</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl shadow-xl overflow-hidden border-0">
                <div className="grid md:grid-cols-2">
                    <div className="bg-gray-900 text-white p-8 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50 z-10" />
                        {group.cover_image_url ? (
                             <img src={group.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                        ) : (
                            <div className="absolute inset-0 bg-gray-800" />
                        )}
                        
                        <div className="relative z-20">
                            {group.logo_url && <img src={group.logo_url} alt="Logo" className="w-16 h-16 rounded-xl mb-6 shadow-lg" />}
                            <h1 className="text-4xl font-bold mb-4">{group.name}</h1>
                            <p className="text-lg text-gray-200 mb-8">{group.description}</p>
                            
                            <Button 
                                size="lg" 
                                onClick={handleBecomeInterested}
                                disabled={joining}
                                className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg h-14 rounded-full w-full md:w-auto"
                            >
                                {joining ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                I'm Interested
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col">
                        {group.welcome_video_url ? (
                            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-inner mb-6 relative group cursor-pointer">
                                {group.welcome_video_url.includes('youtube') || group.welcome_video_url.includes('youtu.be') ? (
                                    <iframe 
                                        src={group.welcome_video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                        className="w-full h-full" 
                                        allowFullScreen 
                                        title="Welcome Video"
                                    />
                                ) : (
                                    <video src={group.welcome_video_url} controls className="w-full h-full object-cover" />
                                )}
                            </div>
                        ) : (
                            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mb-6">
                                <Play className="w-12 h-12 opacity-20" />
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Why Join?</h3>
                                <p className="text-gray-600">
                                    Join our community to access exclusive resources, training, and connect with like-minded creators.
                                </p>
                            </div>
                            
                            <div className="border-t pt-6">
                                <p className="text-sm text-gray-500 text-center">
                                    Already a member? <button onClick={() => navigate(createPageUrl('CreatorGroups') + `?id=${groupId}`)} className="text-blue-600 hover:underline font-medium">Log in here</button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}