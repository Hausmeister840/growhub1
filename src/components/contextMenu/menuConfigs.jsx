import { 
  Bookmark, Share2, Link, EyeOff, VolumeX, Flag, 
  Ban, Download, Sparkles, Pencil, Star,
  User, Search, Copy, Trash2, MessageCircle, BarChart3, Code
} from 'lucide-react';

/**
 * Factory functions that return context menu action arrays.
 * Each returns an array of { id, label, icon, danger?, disabled?, description?, onPress }
 * The `onPress` must be supplied by the caller.
 */

export function getReelMenuActions({ onSave, onShare, onCopyLink, onNotInterested, onLessTopic, onReport, onBlock, onDownload }) {
  return [
    { id: 'save', label: 'Speichern', icon: Bookmark, onPress: onSave },
    { id: 'share', label: 'Teilen', icon: Share2, onPress: onShare },
    { id: 'copy_link', label: 'Link kopieren', icon: Link, onPress: onCopyLink },
    { id: 'download', label: 'Video herunterladen', icon: Download, onPress: onDownload },
    { id: 'not_interested', label: 'Nicht interessiert', icon: EyeOff, onPress: onNotInterested },
    { id: 'less_topic', label: 'Dieses Thema weniger', icon: VolumeX, onPress: onLessTopic },
    { id: 'report', label: 'Melden', icon: Flag, danger: true, onPress: onReport },
    { id: 'block', label: 'Blockieren', icon: Ban, danger: true, onPress: onBlock },
  ].filter(a => a.onPress);
}

export function getFeedPostMenuActions({ isOwner, onSave, onShare, onCopyLink, onEmbed, onHide, onMute, onEdit, onDelete, onReport, onStats }) {
  const actions = [
    { id: 'save', label: 'Speichern', icon: Bookmark, onPress: onSave },
    { id: 'share', label: 'Teilen', icon: Share2, onPress: onShare },
    { id: 'copy', label: 'Link kopieren', icon: Copy, onPress: onCopyLink },
  ];

  if (isOwner) {
    actions.push({ id: 'stats', label: 'Statistiken', icon: BarChart3, onPress: onStats });
    actions.push({ id: 'edit', label: 'Bearbeiten', icon: Pencil, onPress: onEdit });
    actions.push({ id: 'delete', label: 'Löschen', icon: Trash2, danger: true, onPress: onDelete });
  } else {
    actions.push({ id: 'hide', label: 'Beitrag ausblenden', icon: EyeOff, onPress: onHide });
    actions.push({ id: 'mute', label: 'Nutzer stummschalten', icon: VolumeX, onPress: onMute });
    actions.push({ id: 'report', label: 'Melden', icon: Flag, danger: true, onPress: onReport });
    actions.push({ id: 'delete', label: 'Löschen', icon: Trash2, danger: true, onPress: onDelete });
  }

  actions.push({ id: 'embed', label: 'Einbetten', icon: Code, onPress: onEmbed });

  return actions.filter(a => a.onPress);
}

export function getGrowUpdateMenuActions({ isOwner, onEdit, onHighlight, onShare, onReport }) {
  const actions = [];
  
  if (isOwner) {
    actions.push({ id: 'edit', label: 'Update bearbeiten', icon: Pencil, onPress: onEdit });
    actions.push({ id: 'highlight', label: 'Als Highlight markieren', icon: Star, onPress: onHighlight });
  }
  
  actions.push({ id: 'share', label: 'Teilen', icon: Share2, onPress: onShare });
  
  if (!isOwner) {
    actions.push({ id: 'report', label: 'Melden', icon: Flag, danger: true, onPress: onReport });
  }
  
  return actions.filter(a => a.onPress);
}

export function getMarketplaceMenuActions({ onSave, onViewSeller, onSimilar, onReport }) {
  return [
    { id: 'save', label: 'Merken', icon: Bookmark, onPress: onSave },
    { id: 'view_seller', label: 'Verkäufer ansehen', icon: User, onPress: onViewSeller },
    { id: 'similar', label: 'Ähnliche suchen', icon: Search, onPress: onSimilar },
    { id: 'report', label: 'Melden', icon: Flag, danger: true, onPress: onReport },
  ].filter(a => a.onPress);
}

export function getUserMenuActions({ onViewProfile, onFollow, onMessage, onMute, onBlock }) {
  return [
    { id: 'view_profile', label: 'Profil ansehen', icon: User, onPress: onViewProfile },
    { id: 'follow', label: 'Folgen', icon: Sparkles, onPress: onFollow },
    { id: 'message', label: 'Nachricht senden', icon: MessageCircle, onPress: onMessage },
    { id: 'mute', label: 'Stummschalten', icon: VolumeX, onPress: onMute },
    { id: 'block', label: 'Blockieren', icon: Ban, danger: true, onPress: onBlock },
  ].filter(a => a.onPress);
}

export function getCommentMenuActions({ isOwner, onCopyText, onShare, onHide, onMute, onEdit, onDelete, onReport }) {
  const actions = [];

  if (isOwner) {
    actions.push({ id: 'edit', label: 'Bearbeiten', icon: Pencil, onPress: onEdit });
    actions.push({ id: 'delete', label: 'Löschen', icon: Trash2, danger: true, onPress: onDelete });
  } else {
    actions.push({ id: 'copy', label: 'Text kopieren', icon: Copy, onPress: onCopyText });
    actions.push({ id: 'hide', label: 'Ausblenden', icon: EyeOff, onPress: onHide });
    actions.push({ id: 'mute', label: 'Nutzer stummschalten', icon: VolumeX, onPress: onMute });
    actions.push({ id: 'report', label: 'Melden', icon: Flag, danger: true, onPress: onReport });
    actions.push({ id: 'delete', label: 'Löschen', icon: Trash2, danger: true, onPress: onDelete });
  }

  actions.push({ id: 'share', label: 'Teilen', icon: Share2, onPress: onShare });

  return actions.filter(a => a.onPress);
}