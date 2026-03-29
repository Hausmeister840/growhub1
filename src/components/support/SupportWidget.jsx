import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupportTicket } from '@/entities/SupportTicket';
import { User } from '@/entities/User';
import { useToast } from '@/components/ui/toast';
import { HelpCircle, Send, X, MessageCircle, Bug, Lightbulb, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supportCategories = [
    { value: 'bug_report', label: 'Bug melden', icon: Bug, color: 'text-red-400' },
    { value: 'feature_request', label: 'Feature-Wunsch', icon: Lightbulb, color: 'text-yellow-400' },
    { value: 'account_issue', label: 'Account-Problem', icon: AlertTriangle, color: 'text-orange-400' },
    { value: 'content_report', label: 'Inhalt melden', icon: AlertTriangle, color: 'text-red-400' },
    { value: 'general_inquiry', label: 'Allgemeine Frage', icon: MessageCircle, color: 'text-blue-400' }
];

export default function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [ticket, setTicket] = useState({
        subject: '',
        description: '',
        category: 'general_inquiry'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        User.me().then(setCurrentUser).catch(() => setCurrentUser(null));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            await User.login();
            return;
        }

        setIsSubmitting(true);
        try {
            await SupportTicket.create({
                ...ticket,
                reporter_email: currentUser.email
            });
            
            toast.success('Support-Ticket wurde erfolgreich erstellt!', {
                description: 'Wir werden uns so schnell wie möglich bei dir melden.'
            });
            
            setTicket({ subject: '', description: '', category: 'general_inquiry' });
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating support ticket:', error);
            toast.error('Fehler beim Erstellen des Tickets');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field, value) => {
        setTicket(prev => ({ ...prev, [field]: value }));
    };

    const selectedCategory = supportCategories.find(cat => cat.value === ticket.category);

    return (
        <>
            {/* Support Button */}
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg grow-gradient"
                size="icon"
            >
                <HelpCircle className="w-6 h-6" />
            </Button>

            {/* Support Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md"
                        >
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <HelpCircle className="w-6 h-6 text-green-400" />
                                            <CardTitle className="text-white">Support kontaktieren</CardTitle>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => setIsOpen(false)}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-white text-sm font-medium mb-2 block">
                                                Kategorie
                                            </label>
                                            <Select 
                                                value={ticket.category} 
                                                onValueChange={(value) => handleInputChange('category', value)}
                                            >
                                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                    <div className="flex items-center gap-2">
                                                        <selectedCategory.icon className={`w-4 h-4 ${selectedCategory.color}`} />
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                                    {supportCategories.map(category => (
                                                        <SelectItem key={category.value} value={category.value} className="text-white">
                                                            <div className="flex items-center gap-2">
                                                                <category.icon className={`w-4 h-4 ${category.color}`} />
                                                                {category.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="text-white text-sm font-medium mb-2 block">
                                                Betreff
                                            </label>
                                            <Input
                                                value={ticket.subject}
                                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                                placeholder="Kurze Beschreibung des Problems"
                                                className="bg-zinc-800 border-zinc-700 text-white"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="text-white text-sm font-medium mb-2 block">
                                                Beschreibung
                                            </label>
                                            <Textarea
                                                value={ticket.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                placeholder="Beschreibe dein Problem oder deinen Vorschlag detailliert..."
                                                className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                                                required
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsOpen(false)}
                                                className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                                            >
                                                Abbrechen
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || !ticket.subject.trim() || !ticket.description.trim()}
                                                className="flex-1 grow-gradient"
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                ) : (
                                                    <Send className="w-4 h-4 mr-2" />
                                                )}
                                                Senden
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}