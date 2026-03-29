
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, Send, 
  Image as ImageIcon, Loader2, X, Sparkles, Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

/**
 * 🤖 AGENT CHAT INTERFACE - VOLLSTÄNDIG FUNKTIONSFÄHIG
 * Kompletter Chat mit dem Grow Master inkl. Bild-Upload
 */

// Added agentName and initialMessage to props, preserving user and onClose for existing UI functionality.
export default function AgentChatInterface({ user, onClose, agentName, initialMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  // Renamed 'isLoading' to 'isTyping' to specifically indicate assistant's response generation
  const [isTyping, setIsTyping] = useState(false); // Indicates assistant is generating a response
  const [isSending, setIsSending] = useState(false); // Indicates user's message is being processed (uploading files, sending to AI)
  // Removed 'isInitializing' and 'error' states related to initial conversation loading,
  // as the conversation management model has changed to direct AI invocation.
  // Removed 'conversation' state as direct AI calls are used.
  const [uploadingFiles, setUploadingFiles] = useState([]); // Stores names of files currently being uploaded
  const [attachedFiles, setAttachedFiles] = useState([]); // Stores actual File objects selected for the next message
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  // 'unsubscribeRef' is no longer needed as there's no subscription logic to manage.

  // Callback to send messages to the AI, handling file uploads and state updates.
  const sendMessage = useCallback(async (content, files = []) => {
    // Prevent sending if no content or files are provided
    if (!content.trim() && files.length === 0) return;

    // Create a temporary user message for immediate display in the chat UI.
    // For files, 'URL.createObjectURL' is used to generate temporary blob URLs for local preview.
    // These blob URLs are ephemeral and valid only within the current session.
    const userMessage = {
      role: 'user',
      content: content.trim(),
      created_date: new Date().toISOString(),
      file_urls: files.length > 0 ? files.map(f => URL.createObjectURL(f)) : undefined
    };

    setMessages(prev => [...prev, userMessage]); // Immediately display the user's message
    setInput(''); // Clear the input field
    setAttachedFiles([]); // Clear attached files from the input area
    setIsSending(true); // Indicate that the user's message is being processed (upload, AI call)

    try {
      let uploadedFileUrls = [];

      // If files are attached, proceed with uploading them
      if (files.length > 0) {
        setUploadingFiles(files.map(f => f.name)); // Show names of files being uploaded in the UI
        for (const file of files) {
          try {
            // Utilize the 'UploadFile' integration to get persistent file URLs
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            uploadedFileUrls.push(file_url); // Collect the actual URLs of uploaded files
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            toast.error(`Fehler beim Hochladen von ${file.name}`);
            // Continue with other files even if one upload fails
          }
        }
        setUploadingFiles([]); // Clear the uploading files indicator once all attempts are made
      }
      
      setIsTyping(true); // Now indicate that the AI is processing the request (after uploads)
      
      // Invoke the 'ai/routeCannabisAI' function with the user's prompt and uploaded file URLs.
      // This is the core AI interaction for fetching a response.
      const response = await base44.functions.invoke('ai/routeCannabisAI', {
        prompt: content.trim(),
        file_urls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined, // Pass actual uploaded URLs to the AI
        agent_name: agentName || 'GrowMaster', // Use the provided agentName prop or default to 'GrowMaster'
        context_options: {
          include_diaries: true,
          use_web_search: false
        }
      });

      // Process the AI's response
      if (response.data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.response,
          created_date: new Date().toISOString(),
          metadata: response.data.metadata // Include any metadata from the AI response
        };

        setMessages(prev => [...prev, assistantMessage]); // Add the AI's response to the chat
      } else {
        // If the AI invocation was not successful, throw an error
        throw new Error(response.data.error || 'AI-Anfrage fehlgeschlagen');
      }

    } catch (error) {
      console.error('Send message error:', error);
      
      // Create and display an error message from the assistant if something goes wrong
      const errorMessage = {
        role: 'assistant',
        content: 'Entschuldigung, ich konnte deine Anfrage nicht verarbeiten. Bitte versuche es erneut.',
        created_date: new Date().toISOString(),
        error: true // A flag to potentially style this message as an error
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Nachricht konnte nicht gesendet werden');
    } finally {
      setIsSending(false); // Reset the sending state
      setIsTyping(false); // Reset the AI typing state
    }
  }, [agentName]); // 'agentName' is a dependency for 'sendMessage'

  // Effect to handle an initial message if provided, sending it to the AI on component mount.
  useEffect(() => {
    if (initialMessage && messages.length === 0 && !isTyping && !isSending) {
      sendMessage(initialMessage);
    }
  }, [initialMessage, messages.length, isTyping, isSending, sendMessage]); // Added sendMessage to dependencies

  // Effect to auto-scroll to the bottom of the messages container whenever messages change.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 'initConversation' and 'subscribeToUpdates' functions from the original code are removed
  // as the new AI interaction model uses direct invocation instead of a persistent conversation object.

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Store the actual File objects in 'attachedFiles' state for the next message
    setAttachedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} Datei(en) ausgewählt`);

    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input field for subsequent selections
    }
  };

  const removeAttachment = (fileToRemove) => {
    // Remove a specific File object from the 'attachedFiles' state
    setAttachedFiles(prev => prev.filter(f => f !== fileToRemove));
  };

  const handleSend = () => {
    // Trigger the 'sendMessage' callback with the current input and attached files
    sendMessage(input, attachedFiles);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // The 'handleRetry' function and associated initial loading/error UI blocks are removed,
  // as the conversation initialization model has been replaced.

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col">
      {/* Header section */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 bg-black/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose} // 'onClose' prop is preserved for the component's closing functionality
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Grow Master</h2>
              <p className="text-xs text-zinc-500">Dein KI-Grow-Coach</p>
            </div>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-green-400" />
      </div>

      {/* Messages display area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          // Display initial greeting and suggestions if no messages yet
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Hey! 🌱 Ich bin dein Grow Master
            </h3>
            <p className="text-zinc-400 text-sm max-w-md mb-6">
              Stell mir Fragen zum Cannabis-Anbau, zeig mir Fotos deiner Pflanzen 
              oder erzähl mir von deinem Grow-Projekt!
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {[
                '🌿 Wie starte ich einen Grow?',
                '💧 Wieviel soll ich gießen?',
                '🔬 pH-Wert richtig einstellen',
                '🐛 Schädlinge erkennen'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className="text-left px-4 py-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/50 text-sm text-zinc-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Render individual messages
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-green-500 text-black' : 'glass-card border border-zinc-800/50'} rounded-2xl px-4 py-3`}>
                {msg.file_urls && msg.file_urls.length > 0 && (
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    {msg.file_urls.map((url, i) => (
                      // Display images using their URLs (blob: for pending user messages, actual for older or AI-generated)
                      <img
                        key={i}
                        src={url}
                        alt="Uploaded"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
                
                {msg.content && (
                  <ReactMarkdown className={`text-sm prose prose-sm ${msg.role === 'user' ? 'prose-invert' : 'prose-zinc'} max-w-none`}>
                    {msg.content}
                  </ReactMarkdown>
                )}
                
                {msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.tool_calls.map((tool, i) => (
                      <div key={i} className="text-xs bg-zinc-900/50 rounded px-2 py-1 text-zinc-500">
                        🔧 {tool.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Assistant typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass-card border border-zinc-800/50 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview - displays files selected by the user before they are sent */}
      {attachedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-800/50 bg-black/30">
          <div className="flex gap-2 overflow-x-auto">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                <img 
                  src={URL.createObjectURL(file)} // Use URL.createObjectURL for local file preview
                  alt={`Attached file ${idx}`} 
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeAttachment(file)} // Allow removing specific attached files
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploading State - displays progress when files are actively being uploaded as part of sending */}
      {uploadingFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-800/50 bg-black/30">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Wird hochgeladen... ({uploadingFiles.join(', ')})</span>
          </div>
        </div>
      )}

      {/* Input area for new messages and file attachments */}
      <div className="p-4 border-t border-zinc-800/50 bg-black/50">
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isTyping} // Disable attachment button if busy
            className="flex-shrink-0 text-zinc-400 hover:text-white"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Frag mich etwas über deinen Grow..."
            disabled={isSending || isTyping} // Disable input field if busy
            className="flex-1 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />

          <Button
            onClick={handleSend}
            disabled={(!input.trim() && attachedFiles.length === 0) || isSending || isTyping} // Disable send button if no content/attachments or busy
            className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-black font-bold"
            size="icon"
          >
            {(isSending || isTyping) ? ( // Show a loader in the send button if busy
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
