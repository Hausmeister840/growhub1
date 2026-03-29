
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';
import { UploadFile } from '@/integrations/Core';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Require authentication
    let currentUser;
    try {
      currentUser = await base44.auth.me();
    } catch (authError) {
      return Response.json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Handle different request types
    let file, type;
    
    try {
      // Try to parse as FormData first
      const formData = await req.formData();
      file = formData.get('file');
      type = formData.get('type') || 'avatar';
    } catch (formError) {
      // If FormData fails, try JSON
      try {
        const jsonData = await req.json();
        return Response.json({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: 'File upload must use FormData, not JSON'
        }, { status: 400 });
      } catch (jsonError) {
        return Response.json({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request format'
        }, { status: 400 });
      }
    }

    if (!file) {
      return Response.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'No file provided'
      }, { status: 400 });
    }

    console.log('📷 Upload request:', { 
      type, 
      fileName: file.name,
      size: file.size, 
      contentType: file.type 
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return Response.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'File must be an image'
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return Response.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'File size must be less than 5MB'
      }, { status: 400 });
    }

    try {
      // Upload file using the Core integration
      console.log('⬆️ Uploading file to storage...');
      
      const uploadResult = await UploadFile({ file });
      
      if (!uploadResult || !uploadResult.file_url) {
        throw new Error('Upload failed - no file URL returned');
      }
      
      const fileUrl = uploadResult.file_url;
      console.log('✅ File uploaded successfully:', fileUrl);

      // Update user profile with new image URL
      const updateField = type === 'banner' ? 'banner_url' : 'avatar_url';
      
      console.log(`📝 Updating user ${currentUser.id} field ${updateField} with URL: ${fileUrl}`);
      
      const updatedUser = await base44.entities.User.update(currentUser.id, {
        [updateField]: fileUrl
      });

      console.log('✅ User profile updated successfully');

      // Log upload event for analytics
      try {
        await base44.entities.AppEvent.create({
          user_email: currentUser.email,
          type: `${type}_upload`,
          data: {
            file_url: fileUrl,
            file_size: file.size,
            file_type: file.type,
            file_name: file.name
          },
          timestamp: new Date().toISOString()
        });
      } catch (eventError) {
        console.warn('Failed to log upload event:', eventError);
        // Don't fail the request for logging errors
      }

      return Response.json({
        ok: true,
        message: `${type === 'banner' ? 'Banner' : 'Avatar'} uploaded successfully`,
        data: {
          file_url: fileUrl,
          [updateField]: fileUrl,
          user: updatedUser
        }
      });

    } catch (uploadError) {
      console.error('File upload process failed:', uploadError);
      return Response.json({
        ok: false,
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload file',
        details: uploadError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Upload avatar function error:', error);
    return Response.json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Server error',
      details: error.message
    }, { status: 500 });
  }
});
