import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Shield, Download, Trash2, AlertTriangle, Loader2, FileDown, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import GlobalErrorHandler from '../components/utils/GlobalErrorHandler';

export default function AccountSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        GlobalErrorHandler.handleError(error, 'Load User');
        base44.auth.redirectToLogin();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleExportData = async () => {
    if (!currentUser) return;

    setIsExporting(true);
    toast.info('Exportiere deine Daten...');

    try {
      const [posts, comments, diaries, products, messages] = await Promise.all([
        base44.entities.Post.filter({ created_by: currentUser.email }).catch(() => []),
        base44.entities.Comment.filter({ author_email: currentUser.email }).catch(() => []),
        base44.entities.GrowDiary.filter({ created_by: currentUser.email }).catch(() => []),
        base44.entities.Product.filter({ seller_email: currentUser.email }).catch(() => []),
        base44.entities.Message.filter({ sender_email: currentUser.email }).catch(() => [])
      ]);

      const exportData = {
        user: currentUser,
        posts: posts || [],
        comments: comments || [],
        grow_diaries: diaries || [],
        products: products || [],
        messages: messages || [],
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growhub-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('✅ Daten erfolgreich exportiert!');
    } catch (error) {
      GlobalErrorHandler.handleError(error, 'Data Export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'LÖSCHEN') {
      toast.error('Bitte gib "LÖSCHEN" ein um fortzufahren');
      return;
    }

    setIsDeleting(true);

    try {
      // Delete user's content
      const [posts, comments, diaries, products] = await Promise.all([
        base44.entities.Post.filter({ created_by: currentUser.email }),
        base44.entities.Comment.filter({ author_email: currentUser.email }),
        base44.entities.GrowDiary.filter({ created_by: currentUser.email }),
        base44.entities.Product.filter({ seller_email: currentUser.email })
      ]);

      await Promise.all([
        ...(posts || []).map(p => base44.entities.Post.delete(p.id)),
        ...(comments || []).map(c => base44.entities.Comment.delete(c.id)),
        ...(diaries || []).map(d => base44.entities.GrowDiary.delete(d.id)),
        ...(products || []).map(p => base44.entities.Product.delete(p.id))
      ]);

      // Delete user profile
      await base44.entities.User.delete(currentUser.id);

      toast.success('Account gelöscht. Auf Wiedersehen!');
      
      setTimeout(() => {
        base44.auth.logout();
      }, 2000);

    } catch (error) {
      GlobalErrorHandler.handleError(error, 'Account Deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-400" />
            Account & Datenschutz
          </h1>
          <p className="text-zinc-400">Verwalte deine Daten und Privatsphäre</p>
        </div>

        <div className="space-y-6">
          {/* Data Export */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Daten exportieren</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Lade alle deine Daten herunter (Posts, Kommentare, Tagebücher, etc.) als JSON-Datei. 
                  Gemäß DSGVO Art. 20 hast du das Recht auf Datenportabilität.
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exportiere...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 mr-2" />
                      Daten exportieren
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Account Deletion */}
          <Card className="bg-zinc-900/50 border-red-900/50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Account löschen</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Lösche deinen Account permanent. Alle deine Daten werden unwiderruflich gelöscht.
                  Diese Aktion kann nicht rückgängig gemacht werden!
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Account löschen
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-sm text-red-400 font-semibold mb-3">
                        ⚠️ Bist du dir absolut sicher?
                      </p>
                      <p className="text-xs text-zinc-400 mb-3">
                        Gib <code className="px-2 py-1 bg-black/50 rounded text-red-400">LÖSCHEN</code> ein um fortzufahren:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="LÖSCHEN"
                        className="w-full px-4 py-2 bg-black border border-red-500/30 rounded-lg text-white"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        variant="outline"
                        className="flex-1 border-zinc-700"
                      >
                        Abbrechen
                      </Button>
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmText !== 'LÖSCHEN'}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Lösche...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Unwiderruflich löschen
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </Card>

          {/* Privacy Info */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Deine Rechte</h3>
                <div className="space-y-2 text-sm text-zinc-400">
                  <p>✅ Recht auf Auskunft (Art. 15 DSGVO)</p>
                  <p>✅ Recht auf Berichtigung (Art. 16 DSGVO)</p>
                  <p>✅ Recht auf Löschung (Art. 17 DSGVO)</p>
                  <p>✅ Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}