import { Group } from '@/entities/Group';

export const syncFriendsGroup = async (user) => {
  try {
    if (!user || !user.email) {
      console.log('No user provided for friends group sync');
      return;
    }

    // Check if user has followers to create friends group
    const followers = user.followers || [];
    const following = user.following || [];
    
    // Combine followers and following for friends list
    const friendEmails = [...new Set([...followers, ...following])];
    
    if (friendEmails.length === 0) {
      console.log('User has no friends to sync');
      return;
    }

    // Try to find existing friends group
    const existingGroups = await Group.filter({ 
      admin_emails: { '$in': [user.email] },
      name: 'Meine Freunde'
    });

    let friendsGroup;
    
    if (existingGroups.length > 0) {
      // Update existing friends group
      friendsGroup = existingGroups[0];
      await Group.update(friendsGroup.id, {
        members: [...friendEmails, user.email],
        description: `Automatisch erstellte Gruppe für ${user.full_name || 'dich'} und ${friendEmails.length} Freunde`
      });
      console.log(`Updated friends group with ${friendEmails.length} members`);
    } else {
      // Create new friends group
      friendsGroup = await Group.create({
        name: 'Meine Freunde',
        description: `Automatisch erstellte Gruppe für ${user.full_name || 'dich'} und ${friendEmails.length} Freunde`,
        privacy: 'private',
        members: [...friendEmails, user.email],
        admin_emails: [user.email]
      });
      console.log(`Created new friends group with ${friendEmails.length} members`);
    }

    return friendsGroup;
    
  } catch (error) {
    console.error("Error during friends group sync:", error);
    // Don't throw error to prevent app crashes
    return null;
  }
};

export const getFriendsGroup = async (user) => {
  try {
    if (!user || !user.email) return null;
    
    const groups = await Group.filter({ 
      admin_emails: { '$in': [user.email] },
      name: 'Meine Freunde'
    });
    
    return groups.length > 0 ? groups[0] : null;
  } catch (error) {
    console.error("Error fetching friends group:", error);
    return null;
  }
};