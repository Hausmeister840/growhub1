import { useState } from 'react';
import { User } from '@/entities/all';
import { Group } from '@/entities/Group';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadFile } from '@/integrations/Core';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, Plus, Image } from 'lucide-react';

export default function CreateGroupPage() {
    const [groupData, setGroupData] = useState({
        name: '',
        description: '',
        cover_image_url: '',
        privacy: 'public'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGroupData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        setGroupData(prev => ({ ...prev, privacy: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            setGroupData(prev => ({ ...prev, cover_image_url: file_url }));
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const currentUser = await User.me();
            const newGroup = await Group.create({
                ...groupData,
                admin_emails: [currentUser.email],
                members: [currentUser.email]
            });
            navigate(createPageUrl(`GroupDetail?id=${newGroup.id}`));
        } catch (error) {
            console.error("Failed to create group:", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-2xl mx-auto">
                <Card className="glass-effect">
                    <CardHeader>
                        <CardTitle className="text-white">Gründe eine neue Gruppe</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">Gruppenname</Label>
                            <Input id="name" name="name" value={groupData.name} onChange={handleInputChange} className="bg-gray-800/50 border-green-800/20 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">Beschreibung</Label>
                            <Textarea id="description" name="description" value={groupData.description} onChange={handleInputChange} className="bg-gray-800/50 border-green-800/20 text-white" rows={4} />
                        </div>
                        <div className="space-y-2">
                             <Label className="text-white">Titelbild</Label>
                             <div className="p-4 bg-gray-800/50 border-2 border-dashed border-green-800/20 rounded-lg text-center">
                                {groupData.cover_image_url ? (
                                    <img src={groupData.cover_image_url} alt="Titelbild Vorschau" className="w-full h-48 object-cover rounded-md mx-auto mb-4" />
                                ) : (
                                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                                )}
                                <Button asChild variant="outline" className="mt-2 border-green-800/20 text-green-400">
                                    <label htmlFor="cover-upload">
                                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                        {isUploading ? 'Lade hoch...' : 'Bild hochladen'}
                                    </label>
                                </Button>
                                <input id="cover-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                             </div>
                        </div>
                         <div className="space-y-2">
                            <Label className="text-white">Privatsphäre</Label>
                            <Select value={groupData.privacy} onValueChange={handleSelectChange}>
                                <SelectTrigger className="w-full bg-gray-800/50 border-green-800/20 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-green-800/20">
                                    <SelectItem value="public">Öffentlich - Jeder kann beitreten</SelectItem>
                                    <SelectItem value="private">Privat - Beitritt nur auf Einladung</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSubmit} disabled={isLoading || !groupData.name} className="w-full grow-gradient">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Gruppe gründen
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}